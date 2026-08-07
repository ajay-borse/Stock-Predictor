from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path("api/portfolio/", include("portfolio.urls")),
    path("api/transactions/", include("transactions.urls")),
]