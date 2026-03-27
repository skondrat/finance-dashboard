"""
MT940 statement parser using the mt940 library (T056).
"""

from __future__ import annotations

from app.parsers.registry import StatementParser


class Mt940Parser(StatementParser):
    """Parse MT940 (SWIFT) bank statement files."""

    def parse(self, file_content: bytes, bank_profile=None) -> list[dict]:
        import mt940

        transactions_data = mt940.parse(file_content)

        rows: list[dict] = []

        for transaction in transactions_data:
            for detail in transaction.data.get("transactions", []):
                data = detail.data

                # Extract date – prefer 'date' then 'entry_date'
                tx_date = data.get("date") or data.get("entry_date")
                iso_date = tx_date.strftime("%Y-%m-%d") if tx_date else ""

                # Build description from available fields
                description_parts = []
                if data.get("customer_reference"):
                    description_parts.append(str(data["customer_reference"]))
                if data.get("extra_details"):
                    description_parts.append(str(data["extra_details"]))
                if data.get("transaction_reference"):
                    description_parts.append(str(data["transaction_reference"]))
                if data.get("purpose"):
                    description_parts.append(str(data["purpose"]))
                description = " ".join(description_parts).strip() or "Unknown"

                # Amount
                amount = data.get("amount")
                amount_str = str(amount.amount) if amount else "0"

                # Reference
                reference = data.get("customer_reference") or data.get("bank_reference") or None
                if reference is not None:
                    reference = str(reference)

                rows.append(
                    {
                        "date": iso_date,
                        "description": description,
                        "amount": amount_str,
                        "reference": reference,
                    }
                )

        return rows
