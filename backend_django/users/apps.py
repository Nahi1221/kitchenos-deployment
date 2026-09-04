from django.apps import AppConfig
from django.db.models.signals import post_migrate
import os


def create_superuser(sender, **kwargs):
    if sender.name != 'users':
        return
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if User.objects.filter(is_superuser=True).exists():
        return
    email = os.environ.get('ADMIN_EMAIL', 'admin@kitchenos.app')
    password = os.environ.get('ADMIN_PASSWORD', 'Admin123')
    if not email or not password:
        return
    User.objects.create_superuser(
        username=email,
        email=email,
        password=password,
        first_name="Admin",
        last_name="User",
        phone="0000000000",
        business_name="KitchenOS Admin",
        business_location="Headquarters",
        user_type="admin",
    )


class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        post_migrate.connect(create_superuser, sender=self)
