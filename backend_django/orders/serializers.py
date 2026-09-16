from rest_framework import serializers
from .models import Order, OrderItem, Invoice
from branches.models import Branch
from menu.models import MenuItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'menu_item', 'quantity', 'unit_price', 'modifiers', 'subtotal']
        read_only_fields = ['id', 'order']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'branch', 'order_number', 'status', 'order_type',
            'table_number', 'customer_name', 'customer_phone', 'subtotal',
            'tax', 'discount', 'total', 'notes', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'user', 'order_number', 'created_at', 'updated_at']

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'branch', 'order_type', 'table_number', 'customer_name',
            'customer_phone', 'notes', 'items'
        ]

    def validate_branch(self, value):
        user = self.context['request'].user
        if not Branch.objects.filter(id=value.id, user=self.context['request'].user).exists():
            raise serializers.ValidationError("Invalid branch.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        user = self.context['request'].user
        branch_id = self.initial_data.get('branch')
        for item in value:
            menu_item = item.get('menu_item')
            if not MenuItem.objects.filter(id=menu_item.id, category__branch__user=self.context['request'].user).exists():
                raise serializers.ValidationError(f"Menu item {menu_item.id} does not belong to your branches.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(user=self.context['request'].user, **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'order', 'invoice_number', 'payment_method', 'payment_status',
            'amount_paid', 'change', 'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']
