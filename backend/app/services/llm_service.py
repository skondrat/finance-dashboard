"""
LLM service — Anthropic SDK wrapper for category suggestion and column mapping (T007).
"""

from __future__ import annotations

import json
import logging

import anthropic
import pydantic

from app.config import settings

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None
_async_client: anthropic.AsyncAnthropic | None = None
_model_override: str | None = None


def get_model() -> str:
    """Return the active LLM model (override if set, otherwise config default)."""
    return _model_override or settings.LLM_MODEL


def set_model(model: str) -> None:
    """Set the LLM model override."""
    global _model_override
    _model_override = model


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _get_async_client() -> anthropic.AsyncAnthropic:
    global _async_client
    if _async_client is None:
        _async_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _async_client


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
            model=get_model(),
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
                model=get_model(),
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


async def suggest_category_async(
    description: str,
    existing_mappings: dict[str, str],
    known_categories: list[str],
) -> str | None:
    """Async version of suggest_category using AsyncAnthropic client."""
    if not is_available():
        return None

    if not known_categories:
        return None

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
        client = _get_async_client()
        message = await client.messages.create(
            model=get_model(),
            max_tokens=100,
            timeout=30.0,
            messages=[{"role": "user", "content": prompt}],
        )
        result = message.content[0].text.strip()

        if result == "UNKNOWN" or result not in known_categories:
            return None

        return result

    except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
        logger.warning("Async LLM request failed, retrying: %s", e)
        try:
            client = _get_async_client()
            message = await client.messages.create(
                model=get_model(),
                max_tokens=100,
                timeout=30.0,
                messages=[{"role": "user", "content": prompt}],
            )
            result = message.content[0].text.strip()
            if result == "UNKNOWN" or result not in known_categories:
                return None
            return result
        except Exception:
            logger.error("Async LLM retry also failed")
            return None
    except Exception:
        logger.exception("Async suggest_category failed")
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
            model=get_model(),
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
                model=get_model(),
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


# ---------------------------------------------------------------------------
# ATM cash split parsing
# ---------------------------------------------------------------------------


class _CashExpense(pydantic.BaseModel):
    """A single cash expense parsed from user notes."""
    description: str = pydantic.Field(description="Short description of the expense as written in the notes (e.g., 'cosmetics', 'taxi')")
    amount: float = pydantic.Field(description="Numeric amount spent on this item, must be positive")
    category_name: str = pydantic.Field(description="Best-matching category name from the provided list, or 'Other' if no match")


class _CashSplitResult(pydantic.BaseModel):
    """Structured result of parsing cash spending notes."""
    expenses: list[_CashExpense]


def parse_cash_notes(
    notes: str,
    atm_amount: float,
    known_categories: list[str],
) -> list[dict] | None:
    """Parse free-text cash spending notes into structured expense items.

    Uses a single LLM call with structured output to extract amounts,
    descriptions, and match to existing categories.

    Args:
        notes: User's free-text spending notes (e.g., "200 cosmetics, 50 taxi").
        atm_amount: The total ATM withdrawal amount (for context).
        known_categories: List of existing category names to match against.

    Returns:
        List of dicts with keys: description, amount, category_name.
        Returns None on failure.
    """
    if not is_available():
        return None

    categories_text = ", ".join(known_categories) if known_categories else "Other"

    prompt = (
        "You are a financial expense categorizer. A user withdrew cash from an ATM "
        f"(total: {atm_amount}) and provided notes about how they spent it.\n\n"
        f"User's notes: \"{notes}\"\n\n"
        f"Available budget categories: {categories_text}\n\n"
        "Parse the notes into individual expenses. For each expense:\n"
        "1. Extract the description (the short text the user wrote, e.g., 'cosmetics', 'taxi')\n"
        "2. Extract the numeric amount\n"
        "3. Match it to the best-fitting category from the list above. "
        "If no category fits, use 'Other'.\n\n"
        "Only include items that have an explicit numeric amount in the notes."
    )

    def _call_llm() -> list[dict] | None:
        client = _get_client()
        response = client.messages.parse(
            model=get_model(),
            max_tokens=1000,
            timeout=30.0,
            messages=[{"role": "user", "content": prompt}],
            output_format=_CashSplitResult,
        )

        logger.info(
            "LLM parse_cash_notes: input_tokens=%d, output_tokens=%d",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

        parsed = response.parsed_output
        if not parsed or not parsed.expenses:
            return None

        return [exp.model_dump() for exp in parsed.expenses]

    try:
        return _call_llm()
    except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
        logger.warning("LLM parse_cash_notes failed, retrying: %s", e)
        try:
            return _call_llm()
        except Exception:
            logger.error("LLM parse_cash_notes retry also failed")
            return None
    except Exception:
        logger.exception("LLM parse_cash_notes failed")
        return None


# ---------------------------------------------------------------------------
# PDF transaction extraction
# ---------------------------------------------------------------------------


class _Transaction(pydantic.BaseModel):
    """A single transaction extracted from a bank statement."""
    date: str = pydantic.Field(description="Transaction date in YYYY-MM-DD format")
    description: str = pydantic.Field(description="Full transaction description as it appears in the statement")
    amount: float = pydantic.Field(description="Transaction amount: negative for debits/charges, positive for credits")
    currency: str = pydantic.Field(description="3-letter ISO currency code (e.g., EUR, USD)")


class _TransactionList(pydantic.BaseModel):
    """List of transactions extracted from a bank statement."""
    transactions: list[_Transaction]


def extract_transactions_from_text(
    page_texts: list[str],
    source_hint: str | None = None,
) -> list[dict] | None:
    """Extract structured transactions from PDF text using the LLM.

    Uses Anthropic's structured output (messages.parse + Pydantic model)
    to get validated transaction data directly.

    Args:
        page_texts: List of text strings, one per PDF page.
        source_hint: Optional bank name for context (e.g., "payoneer").

    Returns:
        List of transaction dicts with keys: date, description, amount, currency.
        Returns None on failure.
    """
    if not is_available():
        return None

    combined_text = "\n\n--- Page Break ---\n\n".join(page_texts)

    source_context = ""
    if source_hint and source_hint.lower() != "other":
        source_context = f"This is a {source_hint} bank statement. "

    prompt = (
        f"You are a financial statement parser. {source_context}"
        "Extract ALL transactions from the following bank statement text.\n\n"
        "Important rules:\n"
        "- Include every transaction row, do not skip any\n"
        "- Preserve the full original description text (including prefixes like 'Card charge', 'ATM withdrawal', etc.)\n"
        "- Convert dates to YYYY-MM-DD regardless of the source format\n"
        "- Use negative amounts for debits/charges/withdrawals, positive for credits/deposits/transfers in\n"
        "- Do NOT include header rows, footer text, running balances, or summary rows\n"
        "- If a row is clearly not a transaction (e.g., page header, copyright notice), skip it\n\n"
        f"Statement text:\n{combined_text}"
    )

    def _call_llm() -> list[dict] | None:
        client = _get_client()
        response = client.messages.parse(
            model=get_model(),
            max_tokens=16000,
            timeout=120.0,
            messages=[{"role": "user", "content": prompt}],
            output_format=_TransactionList,
        )

        # Log token usage
        logger.info(
            "LLM extract_transactions: input_tokens=%d, output_tokens=%d",
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

        parsed = response.parsed_output
        if not parsed or not parsed.transactions:
            return None

        return [tx.model_dump() for tx in parsed.transactions]

    try:
        return _call_llm()
    except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
        logger.warning("LLM extract_transactions failed, retrying: %s", e)
        try:
            return _call_llm()
        except Exception:
            logger.error("LLM extract_transactions retry also failed")
            return None
    except Exception:
        logger.exception("LLM extract_transactions failed")
        return None
