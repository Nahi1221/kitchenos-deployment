# Deployment Guide: Vercel (Frontend) + Render (Backend)

This project is deployed as:
- Frontend: Vercel (React/Vite)
- Backend: Render (Django/Gunicorn)

## 1) Deploy Backend to Render

1. Push your repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Configure:
   - Root Directory: `backend_django`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `gunicorn kitchenos.wsgi --preload --log-file - --log-level info`
4. Add environment variables in Render:
   - `DJANGO_SETTINGS_MODULE=kitchenos.settings_prod`
   - `SECRET_KEY=<your-strong-secret>`
   - `DEBUG=False`
   - `ALLOWED_HOSTS=<your-render-domain>`
   - `FRONTEND_URL=<your-vercel-domain>`
   - `CORS_ALLOWED_ORIGINS=<your-vercel-domain>`
   - `CSRF_TRUSTED_ORIGINS=<your-vercel-domain>`
   - `DATABASE_URL=<render-postgres-url>`
   - Optional email vars:
     - `BREVO_SMTP_HOST`
     - `BREVO_SMTP_PORT`
     - `BREVO_SMTP_USER`
     - `BREVO_SMTP_PASSWORD`
     - `BREVO_FROM_EMAIL`
5. Deploy and copy the backend URL (example: `https://your-api.onrender.com`).

## 2) Prepare Database/Admin on Render

Use Render Shell and run:

```bash
python manage.py createsuperuser
```

If you use custom admin login in app UI, make sure this user is ACTIVE/admin:

```bash
python manage.py shell
```

```python
from users.models import User
u = User.objects.get(email="admin@kitchenos.com")
u.user_type = "admin"
u.status = "ACTIVE"
u.is_staff = True
u.is_superuser = True
u.save()
```

## 3) Deploy Frontend to Vercel

1. In Vercel, import the same GitHub repo.
2. Configure project:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable:
   - `VITE_API_URL=https://your-api.onrender.com/api`
4. Deploy.

## 4) SPA Routing on Vercel

`frontend/vercel.json` handles SPA fallback to `index.html`.
No extra setup needed.

## 5) Verify End-to-End

1. Open Vercel frontend URL.
2. Open browser dev tools and confirm API requests go to:
   - `https://your-api.onrender.com/api/...`
3. Test:
   - Tenant login
   - Admin login
   - Protected routes

## 6) Redeploy After Changes

- Backend changes:
  - Push to GitHub, Render auto-deploys.
- Frontend changes:
  - Push to GitHub, Vercel auto-deploys.

## Common Issues

- 404 on `/login` on frontend refresh:
  - Ensure `frontend/vercel.json` exists and Vercel redeployed.
- 400 on login:
  - Wrong credentials, non-ACTIVE user, or wrong user type.
- CORS error:
  - Check backend env vars:
    - `FRONTEND_URL`
    - `CORS_ALLOWED_ORIGINS`
    - `CSRF_TRUSTED_ORIGINS`
  - All should include exact `https://...vercel.app` URL.
- DisallowedHost:
  - Add your exact Render domain to `ALLOWED_HOSTS`.
