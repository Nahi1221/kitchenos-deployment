from django.contrib import admin
from .models import MenuCategory, MenuItem, Modifier

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch', 'is_active', 'order']
    list_filter = ['is_active', 'branch']
    search_fields = ['name', 'branch__name']

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_available', 'is_active']
    list_filter = ['is_available', 'is_active', 'category__branch']
    search_fields = ['name', 'category__name']

@admin.register(Modifier)
class ModifierAdmin(admin.ModelAdmin):
    list_display = ['name', 'item', 'price_adjustment', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'item__name']
