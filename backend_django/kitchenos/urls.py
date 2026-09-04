import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from core.views import HealthCheckView, BranchStatsView


def spa_index(request):
    index_path = os.path.join(settings.STATIC_ROOT, 'frontend', 'index.html')
    if not os.path.exists(index_path):
        raise Http404("Frontend build not found in STATIC_ROOT/frontend/")
    return FileResponse(open(index_path, 'rb'), content_type='text/html')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/branches/stats/', BranchStatsView.as_view(), name='branch-stats'),
    path('api/branches/', include('branches.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/', include('core.urls')),
    re_path(r'^(?!api|admin|static|media).*$', spa_index),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
