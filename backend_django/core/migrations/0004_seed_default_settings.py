from django.db import migrations

DEFAULT_SETTINGS = {
    'site_name': 'KitchenOS',
    'support_email': 'support@kitchenos.com',
    'default_currency': 'ETB',
    'trial_days': '14',
    'grace_period_days': '3',
    'near_expiry_days': '7',
    'allow_registration': 'true',
    'maintenance_mode': 'false',
}

def seed_settings(apps, schema_editor):
    SiteSetting = apps.get_model('core', 'SiteSetting')
    for key, value in DEFAULT_SETTINGS.items():
        SiteSetting.objects.update_or_create(
            key=key,
            defaults={'value': value, 'description': f'Default setting for {key}'}
        )

def reverse_seed(apps, schema_editor):
    SiteSetting = apps.get_model('core', 'SiteSetting')
    SiteSetting.objects.filter(key__in=DEFAULT_SETTINGS.keys()).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_payment_notes_payment_reference_number_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_settings, reverse_seed),
    ]
