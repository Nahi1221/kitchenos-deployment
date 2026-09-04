from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('tenant/login/', views.tenant_login_view, name='tenant-login'),
    path('admin/login/', views.admin_login_view, name='admin-login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', views.forgot_password_view, name='forgot-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
