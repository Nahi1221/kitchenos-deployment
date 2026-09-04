from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta, date
import random
import string
import csv
from django.http import HttpResponse
from branches.models import Branch
from menu.models import MenuCategory, MenuItem, Modifier
from tenants.models import Subscription
from core.models import Payment, AuditLog, SiteSetting
from core.serializers import (
    DashboardStatsSerializer, AdminStatsSerializer, AdminTenantSerializer,
    AdminApprovalSerializer, PaymentSerializer
)
from core.utils.mailer import send_tenant_approval_email, send_tenant_rejection_email, send_registration_confirmation_email, send_tenant_suspended_email, send_tenant_activated_email
from orders.models import Order, OrderItem, Invoice
from orders.serializers import OrderSerializer, InvoiceSerializer
from users.serializers import UserSerializer
from users.models import User

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'kitchenos-api'}, status=200)

class BranchStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch_id')
        branches_qs = Branch.objects.filter(user=user)
        if branch_id:
            branches_qs = branches_qs.filter(id=branch_id)

        categories_qs = MenuCategory.objects.filter(branch__user=user)
        if branch_id:
            categories_qs = categories_qs.filter(branch_id=branch_id)

        items_qs = MenuItem.objects.filter(category__branch__user=user)
        if branch_id:
            items_qs = items_qs.filter(category__branch_id=branch_id)

        modifiers_qs = Modifier.objects.filter(item__category__branch__user=user)
        if branch_id:
            modifiers_qs = modifiers_qs.filter(item__category__branch_id=branch_id)

        orders_qs = Order.objects.filter(user=user)
        if branch_id:
            orders_qs = orders_qs.filter(branch_id=branch_id)

        paid_invoices = Invoice.objects.filter(order__user=user, payment_status='paid')
        if branch_id:
            paid_invoices = paid_invoices.filter(order__branch_id=branch_id)
        revenue = sum(inv.amount_paid for inv in paid_invoices)

        customers = orders_qs.values_list('customer_phone', flat=True).exclude(customer_phone__isnull=True).distinct().count()

        recent_orders = orders_qs.order_by('-created_at')[:5]
        activities = []
        for o in recent_orders:
            activities.append({
                'id': o.id,
                'action': f'Order #{o.order_number}',
                'details': f'Status: {o.status.replace("_", " ").title()}',
                'time': o.created_at.isoformat(),
            })

        data = {
            'branches': branches_qs.count(),
            'menuItems': items_qs.count(),
            'revenue': revenue,
            'customers': customers,
            'activities': activities,
        }
        serializer = DashboardStatsSerializer(instance=data)
        return Response(serializer.data)

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_tenants = User.objects.filter(user_type='tenant').count()
        active_subscriptions = Subscription.objects.filter(status='ACTIVE').count()
        pending_approvals = User.objects.filter(status='PENDING_APPROVAL').count()
        payment_revenue = Payment.objects.filter(status='APPROVED').aggregate(total=Sum('amount'))['total'] or 0
        invoice_revenue = Invoice.objects.filter(payment_status='paid').aggregate(total=Sum('amount_paid'))['total'] or 0
        revenue = (payment_revenue or 0) + (invoice_revenue or 0)

        data = {
            'totalTenants': total_tenants,
            'activeSubscriptions': active_subscriptions,
            'pendingApprovals': pending_approvals,
            'revenue': revenue,
        }
        serializer = AdminStatsSerializer(data)
        return Response(serializer.data)

class AdminTenantListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', 'all')
        qs = User.objects.filter(user_type='tenant')
        if status_filter != 'all':
            qs = qs.filter(status=status_filter)
        serializer = AdminTenantSerializer(qs, many=True)
        return Response(serializer.data)

class AdminApprovalListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        payment_qs = Payment.objects.filter(status='PENDING').select_related('user')
        payment_user_ids = set(payment_qs.values_list('user_id', flat=True))

        pending_users = User.objects.filter(
            user_type='tenant',
            status='PENDING_APPROVAL'
        ).exclude(id__in=payment_user_ids)

        combined = list(payment_qs) + [
            self._build_pending_payment_from_user(user)
            for user in pending_users
        ]

        serializer = AdminApprovalSerializer(combined, many=True, context={'request': request})
        return Response(serializer.data)

    def _build_pending_payment_from_user(self, user):
        payment = Payment(user=user, amount=0, method='bank_transfer', reference_number='', notes='', status='PENDING')
        payment._is_virtual_pending = True
        return payment

class AdminApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            try:
                user = User.objects.get(pk=pk, user_type='tenant', status='PENDING_APPROVAL')
            except User.DoesNotExist:
                return Response({'error': 'Payment or pending tenant not found.'}, status=404)
            payment = Payment.objects.create(
                user=user,
                amount=0,
                method='bank_transfer',
                reference_number='',
                notes='Auto-created for pending approval flow',
                status='APPROVED',
            )
        else:
            user = payment.user

        payment.status = 'APPROVED'
        payment.save()
        user = payment.user
        user.status = 'ACTIVE'
        user.save()
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        user.set_password(password)
        user.temp_password = password
        user.save()
        subscription = user.subscriptions.filter(status='PENDING').first()
        if subscription:
            subscription.status = 'ACTIVE'
            subscription.start_date = timezone.now()
            subscription.end_date = timezone.now() + timedelta(days=30)
            subscription.save()
        try:
            send_tenant_approval_email(
                tenant_email=user.email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                password=password,
                business_name=user.business_name,
                user=user,
            )
        except Exception as e:
            print(f'Failed to send approval email: {e}')
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=user.email,
                details={'subject': 'Your KitchenOS Account Has Been Approved', 'error': str(e)},
            )
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            model_name='User',
            object_id=str(user.id),
            details={'action': 'approve', 'user_email': user.email},
        )
        serializer = UserSerializer(user)
        return Response({'tenant': serializer.data})

class AdminRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)
        payment.status = 'REJECTED'
        payment.save()
        user = payment.user
        user.status = 'REJECTED'
        user.save()
        try:
            send_tenant_rejection_email(
                tenant_email=user.email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                business_name=user.business_name,
                reason=request.data.get('reason'),
                user=user,
            )
        except Exception as e:
            print(f'Failed to send rejection email: {e}')
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=user.email,
                details={'subject': 'Your KitchenOS Registration', 'error': str(e)},
            )
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            model_name='User',
            object_id=str(user.id),
            details={'action': 'reject', 'user_email': user.email},
        )
        return Response({'message': 'Rejected successfully.'})

class AdminPaymentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', 'all')
        qs = Payment.objects.all().select_related('user')
        if status_filter != 'all':
            qs = qs.filter(status=status_filter)
        serializer = PaymentSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

class AdminPaymentApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)
        payment.status = 'APPROVED'
        payment.save()
        user = payment.user
        if user.status == 'PENDING_APPROVAL':
            user.status = 'ACTIVE'
            user.save()
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            user.set_password(password)
            user.temp_password = password
            user.save()
            subscription = user.subscriptions.filter(status='PENDING').first()
            if subscription:
                subscription.status = 'ACTIVE'
                subscription.start_date = timezone.now()
                subscription.end_date = timezone.now() + timedelta(days=30)
                subscription.save()
            try:
                send_tenant_approval_email(
                    tenant_email=user.email,
                    tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                    password=password,
                    business_name=user.business_name,
                )
            except Exception as e:
                print(f'Failed to send approval email: {e}')
        return Response({'message': 'Payment approved.'})

class AdminPaymentRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)
        payment.status = 'REJECTED'
        payment.save()
        return Response({'message': 'Payment rejected.'})

class AdminAuditLogView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = AuditLog.objects.all().select_related('user')[:100]
        data = []
        for log in qs:
            data.append({
                'user_email': log.user.email if log.user else None,
                'action': log.action,
                'model_name': log.model_name,
                'details': log.details,
                'created_at': log.created_at.isoformat(),
            })
        return Response(data)

class AdminSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings = SiteSetting.objects.all()
        data = {s.key: s.value for s in settings}
        return Response(data)

    def put(self, request):
        for key, value in request.data.items():
            SiteSetting.objects.update_or_create(key=key, defaults={'value': value})
        return Response({'message': 'Settings updated.'})

class TenantPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Payment.objects.filter(user=request.user).order_by('-created_at')
        serializer = PaymentSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

class AdminSubscriptionListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Subscription.objects.all().select_related('user', 'plan')
        status_filter = request.query_params.get('status', 'all')
        if status_filter != 'all':
            qs = qs.filter(status=status_filter)
        data = []
        for sub in qs:
            data.append({
                'id': sub.id,
                'tenant_name': sub.user.business_name,
                'plan_name': sub.plan.name,
                'status': sub.status,
                'start_date': sub.start_date.isoformat(),
                'end_date': sub.end_date.isoformat(),
                'branches_used': sub.branches_used,
                'items_used': sub.items_used,
                'created_at': sub.created_at.isoformat(),
            })
        return Response(data)

class AdminSubscriptionExtendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found.'}, status=404)

        end_date = request.data.get('end_date')
        if end_date:
            try:
                subscription.end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
            except ValueError:
                return Response({'error': 'Invalid end_date format. Use YYYY-MM-DD.'}, status=400)
        else:
            months = request.data.get('months', 1)
            try:
                months = int(months)
            except (TypeError, ValueError):
                months = 1
            if subscription.status in ['EXPIRED', 'CANCELLED']:
                subscription.status = 'ACTIVE'
                subscription.start_date = timezone.now()
                subscription.end_date = timezone.now() + timedelta(days=30 * months)
            else:
                subscription.end_date = subscription.end_date + timedelta(days=30 * months)

        subscription.save()
        return Response({'message': 'Subscription extended.', 'end_date': subscription.end_date.isoformat()})

class AdminSubscriptionSuspendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found.'}, status=404)
        subscription.status = 'SUSPENDED'
        subscription.save()
        return Response({'message': 'Subscription suspended.'})

class AdminSubscriptionCancelView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found.'}, status=404)
        subscription.status = 'CANCELLED'
        subscription.save()
        return Response({'message': 'Subscription cancelled.'})

class AdminPaymentExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Payment.objects.all().select_related('user')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Tenant', 'Email', 'Amount', 'Method', 'Reference', 'Notes', 'Status', 'Created At'])
        for payment in qs:
            writer.writerow([
                payment.id,
                payment.user.business_name,
                payment.user.email,
                payment.amount,
                payment.method,
                payment.reference_number or '',
                payment.notes or '',
                payment.status,
                payment.created_at.isoformat(),
            ])
        return response

class AdminBulkApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        payment_ids = request.data.get('payment_ids', [])
        if not isinstance(payment_ids, list):
            payment_ids = [payment_ids]
        payments = Payment.objects.filter(id__in=payment_ids, status='PENDING')
        count = payments.update(status='APPROVED')
        return Response({'message': f'{count} payments approved.'})

class AdminBulkRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        payment_ids = request.data.get('payment_ids', [])
        if not isinstance(payment_ids, list):
            payment_ids = [payment_ids]
        payments = Payment.objects.filter(id__in=payment_ids, status='PENDING')
        count = payments.update(status='REJECTED')
        return Response({'message': f'{count} payments rejected.'})

class AdminTenantSuspendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, user_type='tenant')
        except User.DoesNotExist:
            return Response({'error': 'Tenant not found.'}, status=404)
        user.status = 'SUSPENDED'
        user.save()
        subscription = user.subscriptions.filter(status='ACTIVE').first()
        if subscription:
            subscription.status = 'SUSPENDED'
            subscription.save()
        try:
            send_tenant_suspended_email(
                tenant_email=user.email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                business_name=user.business_name,
                reason=request.data.get('reason'),
                user=user,
            )
        except Exception as e:
            print(f'Failed to send suspension email: {e}')
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=user.email,
                details={'subject': 'Your KitchenOS Account Has Been Suspended', 'error': str(e)},
             )
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            model_name='User',
            object_id=str(user.id),
            details={'action': 'suspend', 'user_email': user.email},
        )
        return Response({'message': 'Tenant suspended.'})

class AdminTenantActivateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, user_type='tenant')
        except User.DoesNotExist:
            return Response({'error': 'Tenant not found.'}, status=404)
        user.status = 'ACTIVE'
        user.save()
        subscription = user.subscriptions.filter(status='SUSPENDED').first()
        if subscription:
            subscription.status = 'ACTIVE'
            subscription.save()
        try:
            send_tenant_activated_email(
                tenant_email=user.email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                business_name=user.business_name,
                user=user,
            )
        except Exception as e:
            print(f'Failed to send activation email: {e}')
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=user.email,
                details={'subject': 'Your KitchenOS Account Has Been Reactivated', 'error': str(e)},
            )
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            model_name='User',
            object_id=str(user.id),
            details={'action': 'activate', 'user_email': user.email},
        )
        return Response({'message': 'Tenant activated.'})

class AdminTenantDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, user_type='tenant')
        except User.DoesNotExist:
            return Response({'error': 'Tenant not found.'}, status=404)
        user.delete()
        return Response({'message': 'Tenant deleted.'})


class AdminBulkTenantSuspendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            ids = [ids]
        tenants = User.objects.filter(pk__in=ids, user_type='tenant')
        count = 0
        for tenant in tenants:
            tenant.status = 'SUSPENDED'
            tenant.save()
            subscription = tenant.subscriptions.filter(status='ACTIVE').first()
            if subscription:
                subscription.status = 'SUSPENDED'
                subscription.save()
            count += 1
        return Response({'message': f'{count} tenant(s) suspended.'})


class AdminBulkTenantActivateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            ids = [ids]
        tenants = User.objects.filter(pk__in=ids, user_type='tenant')
        count = 0
        for tenant in tenants:
            tenant.status = 'ACTIVE'
            tenant.save()
            subscription = tenant.subscriptions.filter(status='SUSPENDED').first()
            if subscription:
                subscription.status = 'ACTIVE'
                subscription.save()
            count += 1
        return Response({'message': f'{count} tenant(s) activated.'})


class AdminBulkTenantDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            ids = [ids]
        tenants = User.objects.filter(pk__in=ids, user_type='tenant')
        count = tenants.count()
        tenants.delete()
        return Response({'message': f'{count} tenant(s) deleted.'})


class AdminBulkSubscriptionExtendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        months = request.data.get('months', 1)
        try:
            months = int(months)
        except (TypeError, ValueError):
            months = 1
        if not isinstance(ids, list):
            ids = [ids]
        subscriptions = Subscription.objects.filter(pk__in=ids)
        count = 0
        for sub in subscriptions:
            if sub.status in ['EXPIRED', 'CANCELLED']:
                sub.status = 'ACTIVE'
                sub.start_date = timezone.now()
                sub.end_date = timezone.now() + timedelta(days=30 * months)
            else:
                sub.end_date = sub.end_date + timedelta(days=30 * months)
            sub.save()
            count += 1
        return Response({'message': f'{count} subscription(s) extended by {months} month(s).'})


class AdminBulkSubscriptionSuspendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            ids = [ids]
        subscriptions = Subscription.objects.filter(pk__in=ids)
        count = subscriptions.update(status='SUSPENDED')
        return Response({'message': f'{count} subscription(s) suspended.'})


class AdminBulkSubscriptionCancelView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            ids = [ids]
        subscriptions = Subscription.objects.filter(pk__in=ids)
        count = subscriptions.update(status='CANCELLED')
        return Response({'message': f'{count} subscription(s) cancelled.'})


class AdminAnalyticsRevenueView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        invoices = Invoice.objects.filter(created_at__gte=start_date, payment_status='paid')
        daily = {}
        for inv in invoices:
            day = inv.created_at.date().isoformat()
            daily[day] = daily.get(day, 0) + float(inv.amount_paid)
        data = [{'date': day, 'amount': amount} for day, amount in sorted(daily.items())]
        return Response(data)


class AdminAnalyticsTopItemsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        items = OrderItem.objects.values('menu_item__name').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_quantity')[:limit]
        return Response(list(items))


class AdminAnalyticsTopBranchesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        branches = Order.objects.values('branch__name').annotate(
            order_count=Count('id'),
            total_revenue=Sum('total')
        ).order_by('-order_count')[:limit]
        return Response(list(branches))


class AdminAnalyticsOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = Order.objects.values('status').annotate(count=Count('id'))
        return Response(list(data))


class AdminAnalyticsSubscriptionView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = Subscription.objects.values('status').annotate(count=Count('id'))
        return Response(list(data))
