from django.core.management.base import BaseCommand
from tenants.models import Plan


class Command(BaseCommand):
    help = "Create default subscription plans"

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'Free',
                'price_monthly': 0,
                'max_branches': 1,
                'max_items': 20,
                'features': {'qr': 'basic', 'support': 'email'},
                'is_active': True,
            },
            {
                'name': 'Basic',
                'price_monthly': 500,
                'max_branches': 1,
                'max_items': 50,
                'features': {'qr': 'custom', 'support': 'email'},
                'is_active': True,
            },
            {
                'name': 'Popular',
                'price_monthly': 1500,
                'max_branches': 3,
                'max_items': 999999,
                'features': {'qr': 'custom', 'analytics': True, 'support': 'email'},
                'is_active': True,
            },
            {
                'name': 'Premium',
                'price_monthly': 3000,
                'max_branches': 999999,
                'max_items': 999999,
                'features': {'qr': 'custom', 'analytics': True, 'support': 'priority'},
                'is_active': True,
            },
        ]

        created = 0
        for plan_data in plans:
            plan, was_created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data,
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created plan: {plan.name} - {plan.price_monthly} ETB"))
            else:
                self.stdout.write(f"Plan already exists: {plan.name}")

        self.stdout.write(self.style.SUCCESS(f"\nDone. {created} new plan(s) created."))
