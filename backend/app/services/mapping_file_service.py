"""
Mapping file service — read/write category_mappings.md (T008).

Persistent description-to-category mapping stored as a Markdown table.
"""

from __future__ import annotations

import logging
import os
import re

logger = logging.getLogger(__name__)

_MAPPINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "category_mappings.md")
_MAPPINGS_PATH = os.path.normpath(_MAPPINGS_PATH)

_HEADER = """# Category Mappings

| Description | Category |
|-------------|----------|
"""


def _ensure_file_exists() -> None:
    """Create the mappings file with header if it doesn't exist."""
    os.makedirs(os.path.dirname(_MAPPINGS_PATH), exist_ok=True)
    if not os.path.exists(_MAPPINGS_PATH):
        with open(_MAPPINGS_PATH, "w") as f:
            f.write(_HEADER)


def load_mappings() -> dict[str, str]:
    """Load description-to-category mappings from the MD file.

    Returns a dict of lowercase description -> category name.
    If the file is missing, it will be auto-created (FR-006).
    If the file is corrupted, returns empty dict (FR-021).
    """
    _ensure_file_exists()

    try:
        with open(_MAPPINGS_PATH) as f:
            content = f.read()
    except OSError:
        logger.warning("Cannot read category mappings file, returning empty")
        return {}

    mappings: dict[str, str] = {}
    # Parse markdown table rows: | description | category |
    row_pattern = re.compile(r"^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$")

    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("|---"):
            continue
        # Skip the header row
        if "Description" in line and "Category" in line:
            continue

        match = row_pattern.match(line)
        if match:
            desc = match.group(1).strip().lower()
            cat = match.group(2).strip()
            if desc and cat:
                mappings[desc] = cat

    return mappings


def save_mapping(description: str, category: str) -> None:
    """Append or overwrite a single mapping entry."""
    save_bulk_mappings({description: category})


def save_bulk_mappings(mappings: dict[str, str]) -> int:
    """Save multiple description->category mappings.

    Overwrites existing entries with the same description (FR-011).
    Returns the number of mappings written.
    """
    if not mappings:
        return 0

    _ensure_file_exists()

    # Load existing content
    existing = load_mappings()

    # Merge — new mappings overwrite existing ones
    for desc, cat in mappings.items():
        existing[desc.lower().strip()] = cat

    # Rewrite the file
    try:
        with open(_MAPPINGS_PATH, "w") as f:
            f.write("# Category Mappings\n\n")
            f.write("| Description | Category |\n")
            f.write("|-------------|----------|\n")
            for desc, cat in sorted(existing.items()):
                f.write(f"| {desc} | {cat} |\n")
    except OSError:
        logger.exception("Failed to write category mappings file")
        return 0

    return len(mappings)
