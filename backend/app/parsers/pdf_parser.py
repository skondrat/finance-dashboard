"""
PDF statement parser using pdfplumber (T009).

Extracts transactions from PDF bank statements using source-specific
column mappings or AI-suggested mappings for unknown sources.
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
    """Parse PDF bank statements using column mapping configuration."""

    def parse(self, file_content: bytes, bank_profile=None, *, source_config: dict | None = None) -> list[dict]:
        """Parse a PDF statement and return transaction rows.

        Args:
            file_content: Raw PDF bytes.
            bank_profile: Ignored for PDF (exists for interface compatibility).
            source_config: Column mapping configuration dict with keys:
                date_column, description_column, amount_column,
                currency_column, type_column, date_format,
                debit_value, credit_value, table_index (optional).

        Returns:
            List of dicts with keys: date, description, amount, currency, type, reference.
        """
        # Validate file size (FR-002)
        if len(file_content) > MAX_FILE_SIZE:
            raise ValueError("PDF file exceeds 10 MB size limit")

        # Check for password protection (FR-017)
        if file_content[:5] == b"%PDF-":
            pass  # valid PDF header
        elif len(file_content) < 5:
            raise ValueError("Invalid PDF file")

        if source_config is None:
            raise ValueError("Source configuration is required for PDF parsing")

        tables = self._extract_tables(file_content, source_config)
        if not tables:
            raise ValueError("No extractable tables found in PDF")

        return self._map_rows(tables, source_config)

    def _extract_tables(self, file_content: bytes, source_config: dict) -> list[list[str]]:
        """Extract table rows from PDF using pdfplumber."""
        import io

        all_rows: list[list[str]] = []
        table_index = source_config.get("table_index", 0)

        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    if not tables:
                        continue

                    # Use the configured table index, defaulting to first table
                    if table_index < len(tables):
                        table = tables[table_index]
                    else:
                        table = tables[0]

                    for row in table:
                        if row and any(cell for cell in row):
                            all_rows.append([str(cell or "").strip() for cell in row])
        except Exception as e:
            if "password" in str(e).lower() or "encrypted" in str(e).lower():
                raise ValueError("Password-protected PDFs are not supported") from e
            raise ValueError(f"Failed to parse PDF: {e}") from e

        return all_rows

    def _map_rows(self, raw_rows: list[list[str]], config: dict) -> list[dict]:
        """Map raw table rows to transaction dicts using column config."""
        date_col = config["date_column"]
        desc_col = config["description_column"]
        amount_col = config["amount_column"]
        currency_col = config["currency_column"]
        type_col = config["type_column"]
        date_format = config.get("date_format", "%Y-%m-%d")
        debit_value = config.get("debit_value", "Debit")
        credit_value = config.get("credit_value", "Credit")

        max_col = max(date_col, desc_col, amount_col, currency_col, type_col)
        transactions: list[dict] = []

        # Skip first row if it looks like a header
        start_idx = 0
        if raw_rows and len(raw_rows) > 1:
            first_row = raw_rows[0]
            if any(
                h.lower() in ("date", "description", "amount", "currency", "type", "debit", "credit")
                for h in first_row
                if h
            ):
                start_idx = 1

        for row in raw_rows[start_idx:]:
            if len(row) <= max_col:
                continue

            description = row[desc_col].strip()
            amount_str = row[amount_col].strip()

            # Skip rows with missing description or amount (FR-018)
            if not description or not amount_str:
                continue

            # Parse date
            date_str = row[date_col].strip()
            if not date_str:
                continue
            try:
                parsed_date = datetime.strptime(date_str, date_format)
                iso_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue

            # Parse amount - normalize
            amount_str = amount_str.replace(",", "").replace(" ", "")
            try:
                amount = Decimal(amount_str)
            except (InvalidOperation, ValueError):
                continue

            # Apply debit/credit sign
            tx_type = row[type_col].strip() if type_col < len(row) else ""
            if tx_type.lower() == debit_value.lower():
                amount = -abs(amount)
                tx_type_normalized = "debit"
            elif tx_type.lower() == credit_value.lower():
                amount = abs(amount)
                tx_type_normalized = "credit"
            else:
                # If type isn't recognized, keep amount sign as-is
                tx_type_normalized = "debit" if amount < 0 else "credit"

            currency = row[currency_col].strip() if currency_col < len(row) else "USD"

            transactions.append({
                "date": iso_date,
                "description": description,
                "amount": str(amount),
                "currency": currency,
                "type": tx_type_normalized,
                "reference": None,
            })

        return transactions
