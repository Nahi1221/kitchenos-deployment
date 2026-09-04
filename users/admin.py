from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'business_name', 'phone', 'status', 'user_type', 'date_joined']
    list_filter = ['status', 'user_type', 'date_joined']
    search_fields = ['email', 'business_name', 'phone']
    ordering = ['-date_joined']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {
            'fields': ('phone', 'business_name', 'business_location', 'business_description', 'logo_url', 'slug', 'status', 'user_type')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Business Info', {
            'fields': ('phone', 'business_name', 'business_location')
        }),
    )
