"""
PDF statement parser using pdfplumber + LLM (T009, 003-llm-pdf-parsing).

Extracts transactions from PDF bank statements using LLM-based text parsing.
Raw text is extracted via pdfplumber and sent to the Anthropic API for
structured transaction extraction.
"""

from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation

import pdfplumber

from app.parsers.registry import StatementParser

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB (FR-002)


class PdfParser(StatementParser):
    """Parse PDF bank statements using LLM-based text extraction."""

    def parse(self, file_content: bytes, bank_profile=None, *, source_config: dict | None = None) -> list[dict]:
        """Parse a PDF statement and return transaction rows using LLM extraction.

        Args:
            file_content: Raw PDF bytes.
            bank_profile: Ignored for PDF (exists for interface compatibility).
            source_config: Optional dict. If present, may contain 'source_hint'
                for context (e.g., "payoneer"). Column mapping keys are ignored
                since the LLM handles format detection.

        Returns:
            List of dicts with keys: date, description, amount, currency, type, reference.
        """
        from app.services import llm_service

        # Validate file size (FR-002)
        if len(file_content) > MAX_FILE_SIZE:
            raise ValueError("PDF file exceeds 10 MB size limit")

        if len(file_content) < 5:
            raise ValueError("Invalid PDF file")

        # Extract raw text from PDF pages
        page_texts = self._extract_text_from_pdf(file_content)
        if not page_texts:
            raise ValueError("No extractable text found in PDF")

        # Use LLM to extract structured transactions
        source_hint = None
        if source_config and "source_hint" in source_config:
            source_hint = source_config["source_hint"]

        raw_transactions = llm_service.extract_transactions_from_text(
            page_texts, source_hint=source_hint
        )
        if not raw_transactions:
            raise ValueError("Failed to extract transactions from PDF")

        # Validate and normalize each transaction
        transactions: list[dict] = []
        for tx in raw_transactions:
            description = str(tx.get("description", "")).strip()
            if not description:
                continue

            # Normalize date to ISO format
            date_str = str(tx.get("date", "")).strip()
            if not date_str:
                continue
            try:
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
                iso_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                logger.warning("Skipping transaction with invalid date: %s", date_str)
                continue

            # Normalize amount
            try:
                amount = Decimal(str(tx["amount"]))
            except (InvalidOperation, ValueError, KeyError):
                logger.warning("Skipping transaction with invalid amount: %s", tx.get("amount"))
                continue

            currency = str(tx.get("currency", "EUR")).strip().upper()
            tx_type = "debit" if amount < 0 else "credit"

            transactions.append({
                "date": iso_date,
                "description": description,
                "amount": str(amount),
                "currency": currency,
                "type": tx_type,
                "reference": None,
            })

        if not transactions:
            raise ValueError("No valid transactions extracted from PDF")

        return transactions

    def _extract_text_from_pdf(self, file_content: bytes) -> list[str]:
        """Extract raw text from each PDF page using pdfplumber."""
        import io

        page_texts: list[str] = []

        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text and text.strip():
                        page_texts.append(text)
                    else:
                        logger.warning("Page %d: no extractable text, skipping", i + 1)
        except Exception as e:
            if "password" in str(e).lower() or "encrypted" in str(e).lower():
                raise ValueError("Password-protected PDFs are not supported") from e
            raise ValueError(f"Failed to read PDF: {e}") from e

        return page_texts
