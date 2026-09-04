from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.db.models import Count
import qrcode
import base64
import io
import os
from .models import Branch
from .serializers import BranchSerializer

class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        user = self.request.user
        subscription = user.subscriptions.filter(status='ACTIVE').first()
        if subscription:
            current_branches = Branch.objects.filter(user=user, is_deleted=False).count()
            if current_branches >= subscription.plan.max_branches:
                raise ValidationError(f"You have reached your plan limit of {subscription.plan.max_branches} branches. Please upgrade your plan.")
        serializer.save(user=user)

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        branch = self.get_object()
        tenant_slug = branch.user.slug
        branch_slug = branch.name.lower().replace(' ', '-')
        qr_data = f"{settings.FRONTEND_URL}/r/{tenant_slug}/{branch_slug}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return Response({'qr_code': f'data:image/png;base64,{img_str}', 'url': qr_data})

    @action(detail=True, methods=['get'], url_path='qr-code')
    def qr_code(self, request, pk=None):
        branch = self.get_object()
        tenant_slug = branch.user.slug
        branch_slug = branch.name.lower().replace(' ', '-')
        qr_data = f"{settings.FRONTEND_URL}/r/{tenant_slug}/{branch_slug}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return HttpResponse(buffer.getvalue(), content_type='image/png')
