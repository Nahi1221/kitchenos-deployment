from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'modifiers', views.ModifierViewSet, basename='modifier')
router.register(r'upload', views.UploadImageView, basename='upload')

urlpatterns = [
    path('', include(router.urls)),
    path('public/<slug:tenant_slug>/', views.PublicMenuView.as_view({'get': 'list'}), name='public-menu'),
    path('public/<slug:tenant_slug>/<slug:branch_slug>/', views.PublicMenuView.as_view({'get': 'list'}), name='public-menu-branch'),
]
