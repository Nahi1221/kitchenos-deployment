import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kitchenos.settings')
django.setup()

from users.models import User

email = 'tenant@kitchenos.com'
password = 'Tenant@123'

if User.objects.filter(email=email).exists():
    print(f'User {email} already exists')
else:
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        user_type='tenant',
        first_name='Tenant',
        last_name='User',
        business_name='Demo Restaurant',
        business_location='Addis Ababa',
        phone='+251911234567',
        status='ACTIVE',
    )
    print(f'Tenant created: {user.email}')
    print(f'Password: {password}')
