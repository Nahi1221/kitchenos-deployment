from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify

class User(AbstractUser):
    # Extra fields for KitchenOS
    phone = models.CharField(max_length=20)
    business_name = models.CharField(max_length=255)
    business_location = models.TextField()
    business_description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    slug = models.SlugField(unique=True, blank=True, null=True)

    # Status field (for approval workflow)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING_APPROVAL', 'Pending Approval'),
            ('ACTIVE', 'Active'),
            ('SUSPENDED', 'Suspended'),
            ('REJECTED', 'Rejected')
        ],
        default='ACTIVE'
    )

    # User type (tenant or admin)
    user_type = models.CharField(
        max_length=10,
        choices=[
            ('tenant', 'Tenant'),
            ('admin', 'Admin')
        ],
        default='tenant'
    )

    notifications_enabled = models.BooleanField(default=True)
    temp_password = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug and self.business_name:
            base_slug = slugify(self.business_name)
            slug = base_slug
            counter = 1
            while User.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email