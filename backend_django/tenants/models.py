from django.db import models
from django.conf import settings
import uuid
import random
import string

class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=[
        ('Free', 'Free'),
        ('Basic', 'Basic'),
        ('Popular', 'Popular'),
        ('Premium', 'Premium')
    ])
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    max_branches = models.IntegerField()
    max_items = models.IntegerField()
    features = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def is_unlimited_branches(self):
        return self.max_branches <= 0 or self.max_branches >= 999999

    @property
    def is_unlimited_items(self):
        return self.max_items <= 0 or self.max_items >= 999999

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('TRIAL', 'Trial'),
        ('ACTIVE', 'Active'),
        ('GRACE_PERIOD', 'Grace Period'),
        ('EXPIRED', 'Expired'),
        ('SUSPENDED', 'Suspended'),
        ('CANCELLED', 'Cancelled'),
        ('PENDING', 'Pending'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    branches_used = models.IntegerField(default=0)
    items_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_usage_counts(self):
        from branches.models import Branch
        from menu.models import MenuItem

        branches = Branch.objects.filter(user_id=self.user_id, is_deleted=False)
        return {
            'branches_used': branches.count(),
            'items_used': MenuItem.objects.filter(
                category__branch__in=branches,
                category__branch__is_deleted=False,
            ).count(),
        }

    def refresh_usage(self):
        usage = self.get_usage_counts()
        self.branches_used = usage['branches_used']
        self.items_used = usage['items_used']
        self.save(update_fields=['branches_used', 'items_used', 'updated_at'])
        return self

    @classmethod
    def refresh_latest_usage(cls, user):
        subscription = cls.objects.filter(user=user).order_by('-created_at').first()
        return subscription.refresh_usage() if subscription else None

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'plan', 'start_date']

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"
