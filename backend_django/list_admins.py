import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kitchenos.settings')
django.setup()

from users.models import User

admins = User.objects.filter(user_type='admin')
for a in admins:
    print(f'Email: {a.email}')
    print(f'Username: {a.username}')
    print(f'Status: {a.status}')
    print(f'Name: {a.first_name} {a.last_name}')
    print('---')

if not admins.exists():
    print('No admin users found. Create one with:')
    print("python manage.py createsuperuser --username=admin --email=admin@kitchenos.com")
