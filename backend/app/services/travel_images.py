"""Unsplash image lookup with graceful degradation.

Without UNSPLASH_ACCESS_KEY the function returns None and the frontend renders
a gradient placeholder, so the app works fully offline.
"""

import logging

import httpx

from ..config import get_settings

logger = logging.getLogger("travel.images")


def fetch_destination_image(query: str) -> str | None:
    access_key = get_settings().UNSPLASH_ACCESS_KEY
    if not access_key:
        return None
    try:
        response = httpx.get(
            "https://api.unsplash.com/search/photos",
            params={"query": f"{query} travel landmark", "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {access_key}"},
            timeout=6.0,
        )
        response.raise_for_status()
        results = response.json().get("results", [])
        if results:
            return results[0]["urls"]["regular"]
    except Exception as error:  # noqa: BLE001 - images must never break a trip
        logger.warning("Unsplash lookup failed for '%s': %s", query, error)
    return None
