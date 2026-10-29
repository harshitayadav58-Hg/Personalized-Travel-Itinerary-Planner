"""Vercel serverless entrypoint for the FastAPI backend.

Vercel's Python runtime imports this module and serves `app` (ASGI) for every
request routed here by vercel.json's rewrite rule.
"""
import os
import sys

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app.main import app  # noqa: E402

handler = app
