from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import BranchStatsView
from . import views

router = DefaultRouter()
router.register(r'', views.BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', BranchStatsView.as_view(), name='branch-stats'),
]
