"""Creates a Django superuser from environment variables if none exists."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create a superuser if one does not already exist."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL")
        password = os.environ.get("ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "ADMIN_EMAIL or ADMIN_PASSWORD not set — no superuser created."
                )
            )
            return

        if User.objects.filter(email=email.lower().strip()).exists():
            self.stdout.write(
                self.style.SUCCESS("Admin user already exists — skipping.")
            )
            return

        user = User.objects.create_superuser(
            email=email.lower().strip(),
            password=password,
            first_name="Admin",
            last_name="User",
            phone="0000000000",
            business_name="KitchenOS Admin",
            business_location="Headquarters",
        )

        self.stdout.write(
            self.style.SUCCESS(f"Superuser created for {email}.")
        )
