from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer
from core.models import Payment

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type == 'admin'

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Plan.objects.all()
        return Plan.objects.filter(is_active=True)

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        subscription = Subscription.objects.filter(user=request.user).order_by('-created_at').first()
        if not subscription:
            return Response({'error': 'No subscription found.'}, status=404)
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        subscriptions = Subscription.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(subscriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        subscription = self.get_object()
        duration_months = request.data.get('duration_months', 1)
        try:
            duration_months = int(duration_months)
        except (TypeError, ValueError):
            duration_months = 1
        if subscription.status in ['EXPIRED', 'CANCELLED']:
            subscription.status = 'ACTIVE'
            subscription.start_date = timezone.now()
            subscription.end_date = timezone.now() + timedelta(days=30 * duration_months)
        else:
            subscription.end_date = subscription.end_date + timedelta(days=30 * duration_months)
        subscription.save()
        payment = Payment.objects.create(
            user=request.user,
            amount=subscription.plan.price_monthly,
            method='bank_transfer',
            status='PENDING',
        )
        serializer = self.get_serializer(subscription)
        return Response({
            'subscription': serializer.data,
            'payment': {
                'id': payment.id,
                'amount': str(payment.amount),
                'status': payment.status,
            }
        })

    @action(detail=True, methods=['post'])
    def change_plan(self, request, pk=None):
        subscription = self.get_object()
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'error': 'plan_id is required.'}, status=400)
        try:
            new_plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({'error': 'Invalid plan.'}, status=404)
        if subscription.plan_id == new_plan.id:
            return Response({'error': 'You are already on this plan.'}, status=400)
        subscription.plan = new_plan
        subscription.status = 'PENDING'
        subscription.save()
        payment = Payment.objects.create(
            user=request.user,
            amount=new_plan.price_monthly,
            method='bank_transfer',
            status='PENDING',
        )
        serializer = self.get_serializer(subscription)
        return Response({
            'subscription': serializer.data,
            'payment': {
                'id': payment.id,
                'amount': str(payment.amount),
                'status': payment.status,
            }
        })

class TenantSubscriptionView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def list(self, request):
        subscription = Subscription.objects.filter(user=request.user).order_by('-created_at').first()
        if not subscription:
            return Response({'error': 'No subscription found.'}, status=404)
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
