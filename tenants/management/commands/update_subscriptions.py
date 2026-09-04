from django.core.management.base import BaseCommand
from django.utils import timezone
from tenants.models import Subscription


class Command(BaseCommand):
    help = "Update subscription statuses: expire past-due active/trial/grace-period subscriptions"

    def handle(self, *args, **options):
        now = timezone.now()
        expired_statuses = ['ACTIVE', 'TRIAL', 'GRACE_PERIOD']
        subscriptions = Subscription.objects.filter(
            status__in=expired_statuses,
            end_date__lt=now,
        )
        count = subscriptions.update(status='EXPIRED')
        self.stdout.write(
            self.style.SUCCESS(f"{count} subscription(s) marked as EXPIRED.")
        )
