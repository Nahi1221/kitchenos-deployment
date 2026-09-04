from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Payment

User = get_user_model()


class AdminApprovalFlowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='AdminPass123',
            first_name='Admin',
            last_name='User',
            phone='0911111111',
            business_name='Admin Business',
            business_location='Addis Ababa',
            user_type='admin',
            status='ACTIVE',
            is_staff=True,
        )
        self.tenant = User.objects.create_user(
            username='tenant@example.com',
            email='tenant@example.com',
            password='TenantPass123',
            first_name='Tenant',
            last_name='User',
            phone='0922222222',
            business_name='Tenant Business',
            business_location='Addis Ababa',
            user_type='tenant',
            status='PENDING_APPROVAL',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_pending_approval_list_includes_pending_users_without_payment(self):
        response = self.client.get('/api/admin/approvals/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(item['email'] == 'tenant@example.com' for item in data))

    def test_approve_pending_user_without_payment_creates_payment_and_activates_user(self):
        response = self.client.post(f'/api/admin/approve/{self.tenant.id}/')
        self.assertEqual(response.status_code, 200)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.status, 'ACTIVE')
        self.assertTrue(Payment.objects.filter(user=self.tenant).exists())
