from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, OrderItem, Invoice
from .serializers import OrderSerializer, OrderCreateSerializer, InvoiceSerializer

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.filter(user=self.request.user).prefetch_related('items')
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        order = serializer.save()
        items = order.items.all()
        subtotal = sum(item.subtotal for item in items)
        tax = subtotal * 0.1
        total = subtotal + tax - order.discount
        order.subtotal = subtotal
        order.tax = tax
        order.total = total
        order.save()

    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status.'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(order__user=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        order_id = request.data.get('order_id')
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=404)
        if hasattr(order, 'invoice'):
            return Response({'error': 'Invoice already exists.'}, status=400)
        invoice = Invoice.objects.create(
            order=order,
            amount_paid=order.total,
            change=0,
        )
        return Response(InvoiceSerializer(invoice).data, status=201)
