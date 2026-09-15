from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.db.models import Count
from django.utils.text import slugify
import qrcode
import base64
import io
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        user = self.request.user
        subscription = user.subscriptions.filter(status__in=['ACTIVE', 'TRIAL', 'GRACE_PERIOD', 'PENDING']).order_by('-created_at').first()
        if subscription:
            current_branches = Branch.objects.filter(user=user, is_deleted=False).count()
            if not subscription.plan.is_unlimited_branches and current_branches >= subscription.plan.max_branches:
                raise ValidationError(f"You have reached your plan limit of {subscription.plan.max_branches} branches. Please upgrade your plan.")
        serializer.save(user=user)

    def perform_destroy(self, instance):
        # Prevent deleting the last branch
        active_branches = Branch.objects.filter(user=self.request.user, is_deleted=False).count()
        if active_branches <= 1:
            raise ValidationError("Cannot delete the last branch.")
        
        # Soft delete
        instance.is_deleted = True
        instance.save()

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        branch = self.get_object()
        tenant_slug = branch.user.slug or slugify(branch.user.business_name)
        branch_slug = slugify(branch.name)
        qr_data = f"{settings.FRONTEND_URL}/r/{tenant_slug}/{branch_slug}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return Response({'qr_code': f'data:image/png;base64,{img_str}', 'url': qr_data})

    def perform_destroy(self, instance):
        # Prevent deleting the last branch
        active_branches = Branch.objects.filter(user=self.request.user, is_deleted=False).count()
        if active_branches <= 1:
            raise ValidationError("Cannot delete the last branch.")
        
        # Soft delete
        instance.is_deleted = True
        instance.save()
