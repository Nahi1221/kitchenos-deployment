from rest_framework import viewsets, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count
from django.conf import settings
import os
import csv
import io
import qrcode
from branches.models import Branch
from menu.models import MenuCategory, MenuItem, Modifier
from .serializers import CategorySerializer, ItemSerializer, ModifierSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        qs = MenuCategory.objects.filter(branch__user=user)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if not branch_id:
            raise serializers.ValidationError({'branch_id': 'This field is required.'})
        branch = Branch.objects.filter(id=branch_id, user=self.request.user).first()
        if not branch:
            raise serializers.ValidationError({'branch_id': 'Invalid branch.'})
        serializer.save(branch=branch)

class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        category_id = self.request.query_params.get('category_id')
        branch_id = self.request.query_params.get('branch_id')
        search = self.request.query_params.get('search', '')
        qs = MenuItem.objects.filter(category__branch__user=user)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if branch_id:
            qs = qs.filter(category__branch_id=branch_id)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        category_id = self.request.data.get('category_id')
        branch_id = self.request.data.get('branch_id')
        if not category_id:
            raise serializers.ValidationError({'category_id': 'This field is required.'})
        category = MenuCategory.objects.filter(id=category_id, branch__user=self.request.user).first()
        if not category:
            raise serializers.ValidationError({'category_id': 'Invalid category.'})
        if branch_id and not Branch.objects.filter(id=branch_id, user=self.request.user).exists():
            raise serializers.ValidationError({'branch_id': 'Invalid branch.'})
        user = self.request.user
        subscription = user.subscriptions.filter(status='ACTIVE').first()
        if subscription:
            current_items = MenuItem.objects.filter(category__branch__user=user).count()
            if current_items >= subscription.plan.max_items:
                raise serializers.ValidationError(f"You have reached your plan limit of {subscription.plan.max_items} items. Please upgrade your plan.")
        serializer.save(category=category)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_import(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'CSV file is required.'}, status=400)
        if not file.name.endswith('.csv'):
            return Response({'error': 'Only CSV files are supported.'}, status=400)
        user = request.user
        subscription = user.subscriptions.filter(status='ACTIVE').first()
        max_items = subscription.plan.max_items if subscription else 999999
        current_items = MenuItem.objects.filter(category__branch__user=user).count()
        created = []
        errors = []
        try:
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            for row in reader:
                category_name = row.get('category_name') or row.get('Category')
                item_name = row.get('name') or row.get('Item Name')
                price = row.get('price') or row.get('Price')
                currency = row.get('currency') or row.get('Currency', 'USD')
                description = row.get('description') or row.get('Description', '')
                if not category_name or not item_name or not price:
                    errors.append({'row': row, 'error': 'Missing required fields: category_name, name, price'})
                    continue
                branch_id = row.get('branch_id') or row.get('Branch ID')
                if not branch_id:
                    errors.append({'row': row, 'error': 'Missing branch_id'})
                    continue
                branch = Branch.objects.filter(id=branch_id, user=user).first()
                if not branch:
                    errors.append({'row': row, 'error': 'Invalid branch_id'})
                    continue
                category, _ = MenuCategory.objects.get_or_create(
                    branch=branch,
                    name=category_name,
                    defaults={'is_active': True, 'order': 0}
                )
                if current_items >= max_items:
                    errors.append({'row': row, 'error': f'Plan limit reached ({max_items} items)'})
                    continue
                item, created_flag = MenuItem.objects.get_or_create(
                    category=category,
                    name=item_name,
                    defaults={
                        'price': price,
                        'currency': currency,
                        'description': description,
                        'is_available': True,
                    }
                )
                if created_flag:
                    created.append(item.name)
                    current_items += 1
        except Exception as e:
            return Response({'error': f'Failed to parse CSV: {str(e)}'}, status=400)
        return Response({'created': created, 'errors': errors, 'total_created': len(created)})

class ModifierViewSet(viewsets.ModelViewSet):
    serializer_class = ModifierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        item_id = self.request.query_params.get('item')
        qs = Modifier.objects.filter(item__category__branch__user=user)
        if item_id:
            qs = qs.filter(item_id=item_id)
        return qs

    def perform_create(self, serializer):
        item_id = self.request.data.get('item')
        if not item_id:
            raise serializers.ValidationError({'item': 'This field is required.'})
        if not MenuItem.objects.filter(id=item_id, category__branch__user=self.request.user).exists():
            raise serializers.ValidationError({'item': 'Invalid item.'})
        serializer.save()

class UploadImageView(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        file_obj = request.FILES.get('menu_image')
        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=400)
        save_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, file_obj.name)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        url = f"{settings.MEDIA_URL}uploads/{file_obj.name}"
        return Response({'url': url})

class PublicMenuView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request, tenant_slug=None, branch_slug=None):
        from users.models import User
        from branches.models import Branch
        from menu.models import MenuCategory, MenuItem

        tenant = User.objects.filter(slug=tenant_slug, status='ACTIVE').first()
        if not tenant:
            return Response({'error': 'Tenant not found.'}, status=404)

        branch = None
        if branch_slug:
            branch = Branch.objects.filter(user=tenant, name__iexact=branch_slug.replace('-', ' '), is_active=True).first()
            if not branch:
                return Response({'error': 'Branch not found.'}, status=404)

        subscription = tenant.subscriptions.filter(status__in=['ACTIVE', 'TRIAL', 'GRACE_PERIOD', 'EXPIRED']).order_by('-created_at').first()
        subscription_status = subscription.status.lower() if subscription else 'active'

        categories_qs = MenuCategory.objects.filter(branch__user=tenant)
        if branch:
            categories_qs = categories_qs.filter(branch=branch)

        categories = []
        for cat in categories_qs.prefetch_related('items'):
            items = []
            for item in cat.items.filter(is_available=True, is_active=True):
                items.append({
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'price': item.price,
                    'currency': item.currency,
                    'image_url': item.image_url,
                    'featured': item.featured,
                    'is_out_of_stock': item.is_out_of_stock,
                })
            categories.append({
                'id': cat.id,
                'name': cat.name,
                'items': items,
            })

        data = {
            'tenant': {'business_name': tenant.business_name},
            'branch': {'name': branch.name if branch else None, 'location': branch.location if branch else None, 'phone': branch.phone if branch else None},
            'categories': categories,
            'subscription_status': subscription_status,
        }
        return Response(data)
