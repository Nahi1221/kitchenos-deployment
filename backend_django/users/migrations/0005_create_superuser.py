from django.db import migrations


def create_superuser(apps, schema_editor):
    User = apps.get_model("users", "User")
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser(
            username="admin@kitchenos.app",
            email="admin@kitchenos.app",
            password="Admin123",
            name="Admin User",
            phone="0000000000",
            business_name="KitchenOS Admin",
            business_location="Headquarters",
            user_type="admin",
        )


class Migration(migrations.Migration):
    dependencies = [("users", "0003_user_temp_password")]
    operations = [migrations.RunPython(create_superuser)]
