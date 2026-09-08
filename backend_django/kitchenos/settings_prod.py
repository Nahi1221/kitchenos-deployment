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
        cleaned = str(origin).strip().rstrip('/')
        if not cleaned:
            continue
        lower = cleaned.lower()
        if 'friespowered.net' in lower or 'cuisine.' in lower:
            continue
        if cleaned not in sanitized:
            sanitized.append(cleaned)
    return sanitized

CORS_ALLOWED_ORIGINS = list(CORS_ALLOWED_ORIGINS)
raw_cors = [o.strip().rstrip('/') for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
for origin in _sanitize_allowed_origins(raw_cors):
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)
frontend_url = os.environ.get("FRONTEND_URL", "").rstrip('/')
if frontend_url and frontend_url not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(frontend_url)

CORS_ALLOWED_ORIGIN_REGEXES = list(CORS_ALLOWED_ORIGIN_REGEXES)
raw_regexes = [r.strip() for r in os.environ.get("CORS_ALLOWED_ORIGIN_REGEXES", "").split(",") if r.strip()]
for regex in raw_regexes:
    if regex not in CORS_ALLOWED_ORIGIN_REGEXES:
        CORS_ALLOWED_ORIGIN_REGEXES.append(regex)
if not any(r == r"^https://.*\.vercel\.app$" for r in CORS_ALLOWED_ORIGIN_REGEXES):
    CORS_ALLOWED_ORIGIN_REGEXES.append(r"^https://.*\.vercel\.app$")

CSRF_TRUSTED_ORIGINS = list(CSRF_TRUSTED_ORIGINS)
raw_csrf = [o.strip().rstrip('/') for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]
for origin in _sanitize_allowed_origins(raw_csrf):
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)
if frontend_url and frontend_url not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(frontend_url)

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")  # noqa: F405
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True