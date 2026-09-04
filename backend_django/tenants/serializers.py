from rest_framework import serializers
from .models import Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'name', 'price_monthly', 'max_branches', 'max_items', 'features', 'is_active']
        read_only_fields = ['id']

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price_monthly', max_digits=10, decimal_places=2, read_only=True)
    branches_limit = serializers.SerializerMethodField()
    items_limit = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='user.business_name', read_only=True)
    tenant_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_name', 'plan_price', 'start_date', 'end_date',
            'status', 'branches_used', 'items_used', 'branches_limit', 'items_limit',
            'tenant_name', 'tenant_email', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_branches_limit(self, obj):
        return obj.plan.max_branches

    def get_items_limit(self, obj):
        return obj.plan.max_items
