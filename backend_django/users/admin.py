from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'business_name', 'phone', 'status', 'user_type', 'date_joined']
    list_filter = ['status', 'user_type', 'date_joined']
    search_fields = ['email', 'business_name', 'phone']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'business_name', 'business_location', 'business_description', 'logo_url', 'slug')}),
        ('Permissions', {'fields': ('status', 'user_type', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'phone', 'business_name', 'business_location'),
        }),
    )
