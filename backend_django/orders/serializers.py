from rest_framework import serializers
from .models import Order, OrderItem, Invoice

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
