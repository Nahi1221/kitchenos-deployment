from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import register_view
from . import views

router = DefaultRouter()
router.register(r'plans', views.PlanViewSet, basename='plan')
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_view, name='register'),
    path('subscription/detail/', views.TenantSubscriptionView.as_view({'get': 'list'}), name='tenant-subscription-detail'),
]
