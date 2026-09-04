"""Production settings overlay for managed hosting (Render, etc.)."""

from .settings import *  # noqa: F401,F403

import os

DEBUG = os.environ.get("DEBUG", "False") == "True"

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get(
        "ALLOWED_HOSTS",
        os.environ.get("ALLOWED_HOST", "localhost,127.0.0.1")
    ).split(",") if h.strip()
]

def _sanitize_allowed_origins(raw_values):
    sanitized = []
    for origin in raw_values:
        cleaned = str(origin).strip()
        if not cleaned:
            continue
        lower = cleaned.lower()
        if 'friespowered.net' in lower or 'cuisine.' in lower:
            continue
        if cleaned not in sanitized:
            sanitized.append(cleaned)
    return sanitized

raw_cors = [o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS_ALLOWED_ORIGINS = _sanitize_allowed_origins(raw_cors)
if not CORS_ALLOWED_ORIGINS and os.environ.get("FRONTEND_URL"):
    CORS_ALLOWED_ORIGINS = [os.environ["FRONTEND_URL"]]
if os.environ.get("FRONTEND_URL") and os.environ["FRONTEND_URL"] not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(os.environ["FRONTEND_URL"])
if "https://*.vercel.app" not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append("https://*.vercel.app")

CORS_ALLOWED_ORIGIN_REGEXES = [
    r.strip() for r in os.environ.get("CORS_ALLOWED_ORIGIN_REGEXES", "").split(",") if r.strip()
]
if not CORS_ALLOWED_ORIGIN_REGEXES:
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.vercel\.app$"]

raw_csrf = [o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]
CSRF_TRUSTED_ORIGINS = _sanitize_allowed_origins(raw_csrf)
if not CSRF_TRUSTED_ORIGINS and os.environ.get("FRONTEND_URL"):
    CSRF_TRUSTED_ORIGINS = [os.environ["FRONTEND_URL"]]
if os.environ.get("FRONTEND_URL") and os.environ["FRONTEND_URL"] not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(os.environ["FRONTEND_URL"])
if "https://*.vercel.app" not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append("https://*.vercel.app")

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")  # noqa: F405
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True