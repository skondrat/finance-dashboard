"""
LLM service — Anthropic SDK wrapper for category suggestion and column mapping (T007).
"""

from __future__ import annotations

import json
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def is_available() -> bool:
    """Check if the AI service is configured (API key is set)."""
    return bool(settings.ANTHROPIC_API_KEY)


def suggest_category(
    description: str,
    existing_mappings: dict[str, str],
    known_categories: list[str],
) -> str | None:
    """Suggest a category for a transaction description using the LLM.

    Returns a category name from known_categories, or None if unable.
    """
    if not is_available():
        return None

    if not known_categories:
        return None

    # Build few-shot examples from existing mappings (up to 50, most recent last)
    examples = list(existing_mappings.items())[-50:]
    examples_text = "\n".join(f'- "{desc}" -> {cat}' for desc, cat in examples)

    categories_text = ", ".join(known_categories)

    examples_section = ""
    if examples_text:
        examples_section = "Here are examples of previous categorizations:\n" + examples_text + "\n\n"

    prompt = (
        "You are a financial transaction categorizer. Given a transaction description, "
        "assign it to exactly one of the following categories:\n\n"
        f"Categories: {categories_text}\n\n"
        f"{examples_section}"
        f'Transaction description: "{description}"\n\n'
        'Respond with only the category name, nothing else. If you cannot determine a category, respond with "UNKNOWN".'
    )

    try:
        client = _get_client()
        message = client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=100,
            timeout=30.0,
            messages=[{"role": "user", "content": prompt}],
        )
        result = message.content[0].text.strip()

        if result == "UNKNOWN" or result not in known_categories:
            return None

        return result

    except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
        # Retry once per FR-019
        logger.warning("LLM request failed, retrying: %s", e)
        try:
            client = _get_client()
            message = client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=100,
                timeout=30.0,
                messages=[{"role": "user", "content": prompt}],
            )
            result = message.content[0].text.strip()
            if result == "UNKNOWN" or result not in known_categories:
                return None
            return result
        except Exception:
            logger.error("LLM retry also failed")
            return None
    except Exception:
        logger.exception("LLM suggest_category failed")
        return None


def suggest_column_mapping(table_data: list[list[str]]) -> dict | None:
    """Suggest column mapping for an unknown PDF source using the LLM.

    table_data should include headers + first 5 data rows.
    Returns a dict with date_column, description_column, amount_column,
    currency_column, type_column, date_format, or None if unable.
    """
    if not is_available():
        return None

    # Format table for the prompt
    table_text = "\n".join(
        " | ".join(str(cell) for cell in row) for row in table_data
    )

    prompt = f"""You are a financial statement parser. Below is a table extracted from a PDF bank statement. Identify which columns correspond to these fields:
- Date (transaction date)
- Description (transaction description/memo)
- Amount (monetary value)
- Currency (currency code)
- Type (Debit or Credit)

Table header and first rows:
{table_text}

Respond in JSON format only, nothing else:
{{"date_column": N, "description_column": N, "amount_column": N, "currency_column": N, "type_column": N, "date_format": "format_string"}}

Column indices are 0-based. For date_format, use Python strftime format (e.g., "%Y-%m-%d", "%m/%d/%Y", "%d.%m.%Y")."""

    try:
        client = _get_client()
        message = client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=200,
            timeout=30.0,
            messages=[{"role": "user", "content": prompt}],
        )
        result = message.content[0].text.strip()
        mapping = json.loads(result)

        # Validate required fields
        required_fields = ["date_column", "description_column", "amount_column", "currency_column", "type_column"]
        if not all(f in mapping for f in required_fields):
            logger.warning("AI column mapping missing required fields: %s", mapping)
            return None

        # Ensure date_format is present
        if "date_format" not in mapping:
            mapping["date_format"] = "%Y-%m-%d"

        return mapping

    except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
        # Retry once per FR-019
        logger.warning("LLM column mapping failed, retrying: %s", e)
        try:
            client = _get_client()
            message = client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=200,
                timeout=30.0,
                messages=[{"role": "user", "content": prompt}],
            )
            result = message.content[0].text.strip()
            mapping = json.loads(result)
            required_fields = ["date_column", "description_column", "amount_column", "currency_column", "type_column"]
            if not all(f in mapping for f in required_fields):
                return None
            if "date_format" not in mapping:
                mapping["date_format"] = "%Y-%m-%d"
            return mapping
        except Exception:
            logger.error("LLM column mapping retry also failed")
            return None
    except (json.JSONDecodeError, Exception):
        logger.exception("LLM suggest_column_mapping failed")
        return None
