"""Creates a Django superuser from environment variables if none exists."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create a superuser if one does not already exist."

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.SUCCESS("Superuser already exists — skipping.")
            )
            return

        email = os.environ.get("ADMIN_EMAIL")
        password = os.environ.get("ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "ADMIN_EMAIL or ADMIN_PASSWORD not set — no superuser created."
                )
            )
            return

        user = User.objects.create_user(
            email=email.lower().strip(),
            password=password,
            username=email.lower().strip(),
            first_name="Admin",
            last_name="User",
            phone="0000000000",
            business_name="KitchenOS Admin",
            business_location="Headquarters",
            user_type="admin",
        )
        user.is_staff = True
        user.is_superuser = True
        user.status = "ACTIVE"
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f"Superuser created for {email}.")
        )
