"""
Parser registry – maps statement formats to parser implementations (T053).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum


class StatementFormat(str, Enum):
    CSV = "csv"
    OFX = "ofx"
    MT940 = "mt940"


class ParsedRow:
    """Typed container for a single parsed statement row."""

    date: str
    description: str
    amount: str
    reference: str | None


class StatementParser(ABC):
    """Base class that every format-specific parser must implement."""

    @abstractmethod
    def parse(self, file_content: bytes, bank_profile=None) -> list[dict]:
        """Parse raw file bytes and return a list of dicts.

        Each dict has keys: date, description, amount, reference.
        """
        ...


def get_parser(fmt: StatementFormat) -> StatementParser:
    """Return the concrete parser for the given format."""
    from app.parsers.csv_parser import CsvParser
    from app.parsers.mt940_parser import Mt940Parser
    from app.parsers.ofx_parser import OfxParser

    parsers: dict[StatementFormat, StatementParser] = {
        StatementFormat.CSV: CsvParser(),
        StatementFormat.OFX: OfxParser(),
        StatementFormat.MT940: Mt940Parser(),
    }

    parser = parsers.get(fmt)
    if parser is None:
        raise ValueError(f"Unsupported statement format: {fmt}")
    return parser
