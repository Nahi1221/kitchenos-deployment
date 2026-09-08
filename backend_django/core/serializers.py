from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SiteSetting, AuditLog, Payment
from orders.models import Invoice

User = get_user_model()

class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'model_name', 'object_id',
            'details', 'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    tenant = serializers.CharField(source='user.business_name', read_only=True)
    plan_name = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    screenshot = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'tenant', 'amount', 'method', 'reference_number', 'notes',
            'status', 'screenshot', 'created_at', 'updated_at', 'plan_name', 'subscription_status'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_plan_name(self, obj):
        sub = obj.user.subscriptions.order_by('-created_at').first()
        return sub.plan.name if sub else None

    def get_subscription_status(self, obj):
        sub = obj.user.subscriptions.order_by('-created_at').first()
        return sub.status if sub else None

    def get_screenshot(self, obj):
        request = self.context.get('request')
        if obj.screenshot and request:
            return request.build_absolute_uri(obj.screenshot)
        return obj.screenshot

class DashboardStatsSerializer(serializers.Serializer):
    branches = serializers.IntegerField()
    menuItems = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    customers = serializers.IntegerField()
    activities = serializers.ListField()

class AdminStatsSerializer(serializers.Serializer):
    totalTenants = serializers.IntegerField()
    activeSubscriptions = serializers.IntegerField()
    pendingApprovals = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)

class AdminTenantSerializer(serializers.ModelSerializer):
    branches = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='date_joined', read_only=True)
    temp_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'business_name', 'email', 'branches', 'status', 'createdAt', 'temp_password']

    def get_branches(self, obj):
        return obj.branches.count()

class AdminApprovalSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    business_name = serializers.CharField(source='user.business_name', read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)
    screenshot = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'business_name', 'name', 'email', 'date', 'amount', 'screenshot', 'method', 'reference_number', 'notes']

    def get_id(self, obj):
        return getattr(obj, 'user_id', None) or getattr(obj, 'id', None)

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    def get_screenshot(self, obj):
        request = self.context.get('request')
        if obj.screenshot and request:
            return request.build_absolute_uri(obj.screenshot)
        return obj.screenshot


class AdminApprovalUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    screenshot = serializers.SerializerMethodField()
    method = serializers.SerializerMethodField()
    reference_number = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'business_name', 'name', 'email', 'date', 'amount', 'screenshot', 'method', 'reference_number', 'notes']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_amount(self, obj):
        payment = Payment.objects.filter(user=obj, status='PENDING').first()
        return str(payment.amount) if payment else '0'

    def get_screenshot(self, obj):
        payment = Payment.objects.filter(user=obj, status='PENDING').first()
        if payment and payment.screenshot:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(payment.screenshot)
            return payment.screenshot
        return None

    def get_method(self, obj):
        payment = Payment.objects.filter(user=obj, status='PENDING').first()
        return payment.method if payment else None

    def get_reference_number(self, obj):
        payment = Payment.objects.filter(user=obj, status='PENDING').first()
        return payment.reference_number if payment else None

    def get_notes(self, obj):
        payment = Payment.objects.filter(user=obj, status='PENDING').first()
        return payment.notes if payment else None

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'order', 'invoice_number', 'payment_method', 'payment_status',
            'amount_paid', 'change', 'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']
