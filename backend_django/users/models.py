from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.utils.text import slugify


class CustomUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('user_type', 'tenant')
        extra_fields.setdefault('status', 'ACTIVE')
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('user_type', 'admin')
        extra_fields.setdefault('status', 'ACTIVE')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    business_name = models.CharField(max_length=255)
    business_location = models.TextField()
    business_description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    slug = models.SlugField(unique=True, blank=True, null=True)

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
