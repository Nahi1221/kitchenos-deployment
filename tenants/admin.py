from django.contrib import admin
from .models import Plan, Subscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_monthly', 'max_branches', 'max_items', 'is_active']
    list_filter = ['name', 'is_active']
    search_fields = ['name']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'branches_used', 'items_used']
    list_filter = ['status', 'plan', 'start_date']
    search_fields = ['user__email', 'user__business_name', 'plan__name']
