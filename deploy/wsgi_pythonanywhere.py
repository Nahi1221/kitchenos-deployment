#!/usr/bin/env python
"""WSGI config for PythonAnywhere deployment."""
import os
import sys

path = os.path.expanduser("~/kitchenos")
if path not in sys.path:
    sys.path.insert(0, path)

os.environ["DJANGO_SETTINGS_MODULE"] = "kitchenos.settings"

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()