"""
Source mapping config loader (T011).

Loads and validates source_mappings.json for known PDF sources.
"""

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "source_mappings.json")
_CONFIG_PATH = os.path.normpath(_CONFIG_PATH)

_REQUIRED_FIELDS = {"date_column", "description_column", "amount_column", "currency_column", "type_column"}

_cached_config: dict | None = None


def _load_config() -> dict:
    """Load and cache the source mappings JSON file."""
    global _cached_config
    if _cached_config is not None:
        return _cached_config

    if not os.path.exists(_CONFIG_PATH):
        raise FileNotFoundError(f"Source mappings file not found: {_CONFIG_PATH}")

    try:
        with open(_CONFIG_PATH) as f:
            config = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        raise ValueError(f"Source mappings file is malformed: {e}") from e

    if not isinstance(config, dict):
        raise ValueError("Source mappings file must contain a JSON object")

    _cached_config = config
    return config


def get_source_config(source_name: str) -> dict:
    """Return the column mapping config for a given source name.

    Raises ValueError if source is not found or config is invalid (FR-020).
    """
    config = _load_config()

    source_config = config.get(source_name.lower())
    if source_config is None:
        raise ValueError(f"Unknown source: '{source_name}'. Available sources: {', '.join(config.keys())}")

    # Validate required fields
    missing = _REQUIRED_FIELDS - set(source_config.keys())
    if missing:
        raise ValueError(f"Source '{source_name}' config missing required fields: {', '.join(missing)}")

    return source_config


def get_available_sources() -> list[str]:
    """Return list of known source names."""
    try:
        config = _load_config()
        return list(config.keys())
    except (FileNotFoundError, ValueError):
        return []


def validate_config() -> tuple[bool, str]:
    """Validate the source mappings config file.

    Returns (is_valid, message).
    """
    try:
        config = _load_config()
    except FileNotFoundError:
        return False, "Source mappings file not found"
    except ValueError as e:
        return False, str(e)

    for source_name, source_config in config.items():
        missing = _REQUIRED_FIELDS - set(source_config.keys())
        if missing:
            return False, f"Source '{source_name}' missing fields: {', '.join(missing)}"

    return True, f"Valid config with {len(config)} sources"
