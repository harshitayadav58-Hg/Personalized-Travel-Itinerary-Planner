from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..services.travel_images import fetch_destination_image

router = APIRouter(prefix="/api", tags=["images"])


@router.get("/images")
def search_image(query: str, _user=Depends(get_current_user)):
    """Proxy an Unsplash image lookup; returns {url: null} when no key is configured."""
    return {"url": fetch_destination_image(query)}
