from rest_framework import serializers
from .models import Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    is_unlimited_branches = serializers.BooleanField(read_only=True)
    is_unlimited_items = serializers.BooleanField(read_only=True)

    class Meta:
        model = Plan
        fields = ['id', 'name', 'price_monthly', 'max_branches', 'max_items', 'features', 'is_active', 'is_unlimited_branches', 'is_unlimited_items']
        read_only_fields = ['id']

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price_monthly', max_digits=10, decimal_places=2, read_only=True)
    branches_used = serializers.SerializerMethodField()
    items_used = serializers.SerializerMethodField()
    branches_limit = serializers.SerializerMethodField()
    items_limit = serializers.SerializerMethodField()
    is_unlimited_branches = serializers.BooleanField(source='plan.is_unlimited_branches', read_only=True)
    is_unlimited_items = serializers.BooleanField(source='plan.is_unlimited_items', read_only=True)
    tenant_name = serializers.CharField(source='user.business_name', read_only=True)
    tenant_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_name', 'plan_price', 'start_date', 'end_date',
            'status', 'branches_used', 'items_used', 'branches_limit', 'items_limit',
            'is_unlimited_branches', 'is_unlimited_items', 'tenant_name', 'tenant_email', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_branches_used(self, obj):
        return obj.get_usage_counts()['branches_used']

    def get_items_used(self, obj):
        return obj.get_usage_counts()['items_used']

    def get_branches_limit(self, obj):
        return obj.plan.max_branches

    def get_items_limit(self, obj):
        return obj.plan.max_items
