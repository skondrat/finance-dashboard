"""
CSV statement parser (T054).

Supports optional BankProfile for column mapping or auto-detection
with sensible defaults.
"""

from __future__ import annotations

import csv
import io
from datetime import datetime

from app.parsers.registry import StatementParser

# Common column name mappings used during auto-detection
_DATE_NAMES = {"date", "transaction date", "trans date", "booking date", "value date", "datum"}
_AMOUNT_NAMES = {"amount", "sum", "value", "betrag", "debit/credit", "card currency amount"}
_DESC_NAMES = {"description", "memo", "details", "narrative", "payee", "beschreibung", "text"}
_REF_NAMES = {"reference", "ref", "transaction id", "id", "referenz"}


def _normalize_header(name: str) -> str:
    return name.strip().lower()


def _detect_column(headers: list[str], candidates: set[str]) -> str | None:
    """Return the first header that matches one of the candidate names.

    First tries exact match, then falls back to prefix matching
    (e.g. 'date and time' matches candidate 'date').
    """
    # Exact match first
    for h in headers:
        if _normalize_header(h) in candidates:
            return h
    # Prefix match: header starts with a candidate word
    for h in headers:
        normalized = _normalize_header(h)
        for c in candidates:
            if normalized.startswith(c):
                return h
    return None


class CsvParser(StatementParser):
    """Parse CSV bank statements with optional BankProfile configuration."""

    def parse(self, file_content: bytes, bank_profile=None) -> list[dict]:
        encoding = "utf-8"
        delimiter = ","
        skip_rows = 0
        date_column: str | None = None
        amount_column: str | None = None
        description_column: str | None = None
        reference_column: str | None = None
        date_format = "%Y-%m-%d"

        if bank_profile is not None:
            encoding = bank_profile.encoding or "utf-8"
            delimiter = bank_profile.delimiter or ","
            skip_rows = bank_profile.skip_rows or 0
            date_column = bank_profile.date_column
            amount_column = bank_profile.amount_column
            description_column = bank_profile.description_column
            reference_column = bank_profile.reference_column
            date_format = bank_profile.date_format or "%Y-%m-%d"

        text = file_content.decode(encoding, errors="replace")
        reader_input = io.StringIO(text)

        # Skip leading rows if configured
        for _ in range(skip_rows):
            next(reader_input, None)

        reader = csv.DictReader(reader_input, delimiter=delimiter)
        if reader.fieldnames is None:
            return []

        headers = list(reader.fieldnames)

        # Auto-detect columns when no bank_profile is provided
        if date_column is None:
            date_column = _detect_column(headers, _DATE_NAMES)
        if amount_column is None:
            amount_column = _detect_column(headers, _AMOUNT_NAMES)
        if description_column is None:
            description_column = _detect_column(headers, _DESC_NAMES)
        if reference_column is None:
            reference_column = _detect_column(headers, _REF_NAMES)

        if date_column is None or amount_column is None or description_column is None:
            raise ValueError(
                f"Could not auto-detect required columns (date, amount, description) "
                f"from headers: {headers}"
            )

        rows: list[dict] = []
        for record in reader:
            raw_date = (record.get(date_column) or "").strip()
            raw_amount = (record.get(amount_column) or "").strip()
            raw_desc = (record.get(description_column) or "").strip()
            raw_ref = (record.get(reference_column) or "").strip() if reference_column else None

            if not raw_date or not raw_amount:
                continue

            # Normalize the date to ISO format
            iso_date = raw_date
            for fmt in [date_format, "%d.%m.%Y %H:%M:%S", "%d.%m.%Y", "%m/%d/%Y", "%d/%m/%Y"]:
                try:
                    parsed_date = datetime.strptime(raw_date, fmt)
                    iso_date = parsed_date.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue

            # Normalize the amount: remove thousands separators, handle comma decimals
            cleaned_amount = raw_amount.replace(" ", "")
            # If there's a comma and no dot, treat comma as decimal separator
            if "," in cleaned_amount and "." not in cleaned_amount:
                cleaned_amount = cleaned_amount.replace(",", ".")
            # If both exist, comma is thousands separator
            elif "," in cleaned_amount and "." in cleaned_amount:
                cleaned_amount = cleaned_amount.replace(",", "")

            rows.append(
                {
                    "date": iso_date,
                    "description": raw_desc,
                    "amount": cleaned_amount,
                    "reference": raw_ref or None,
                }
            )

        return rows
