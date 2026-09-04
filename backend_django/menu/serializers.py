from rest_framework import serializers
from .models import MenuCategory, MenuItem, Modifier

class ItemSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(source='category.id', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_id', 'name', 'description', 'price', 'currency',
            'image_url', 'is_available', 'is_active', 'is_out_of_stock',
            'featured', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_category(self, obj):
        return {'id': obj.category_id, 'name': obj.category.name}

class CategorySerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True, read_only=True)

    class Meta:
        model = MenuCategory
        fields = [
            'id', 'name', 'description', 'is_active', 'order', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = [
            'id', 'item', 'name', 'price_adjustment', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
