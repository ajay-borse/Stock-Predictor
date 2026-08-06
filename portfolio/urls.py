from django.urls import path
from .views import BuyStockView

urlpatterns = [
    path("buy/", BuyStockView.as_view(), name="buy-stock"),
]