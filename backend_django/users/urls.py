from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('tenant/login/', csrf_exempt(views.tenant_login_view), name='tenant-login'),
    path('admin/login/', csrf_exempt(views.admin_login_view), name='admin-login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', csrf_exempt(views.forgot_password_view), name='forgot-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
