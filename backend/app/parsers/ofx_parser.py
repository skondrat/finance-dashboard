"""
OFX / QFX statement parser using ofxparse (T055).
"""

from __future__ import annotations

import io

from app.parsers.registry import StatementParser


class OfxParser(StatementParser):
    """Parse OFX/QFX file content and extract transactions."""

    def parse(self, file_content: bytes, bank_profile=None) -> list[dict]:
        from ofxparse import OfxParser as _OfxParser

        ofx = _OfxParser.parse(io.BytesIO(file_content))

        rows: list[dict] = []

        for account in ofx.accounts:
            for tx in account.statement.transactions:
                # Build description from payee and memo
                parts = []
                if tx.payee:
                    parts.append(str(tx.payee))
                if tx.memo and str(tx.memo) not in parts:
                    parts.append(str(tx.memo))
                description = " - ".join(parts) if parts else "Unknown"

                iso_date = tx.date.strftime("%Y-%m-%d") if tx.date else ""

                rows.append(
                    {
                        "date": iso_date,
                        "description": description,
                        "amount": str(tx.amount),
                        "reference": tx.id if tx.id else None,
                    }
                )

        return rows
