import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kitchenos.settings')
django.setup()

from users.models import User

users = User.objects.filter(user_type='tenant')
for u in users:
    print(f'Email: {u.email}')
    print(f'Username: {u.username}')
    print(f'Status: {u.status}')
    print(f'Business: {u.business_name}')
    print('---')
