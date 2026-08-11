from django.urls import path
from .views import BuyStockView, SellStockView, PortfolioSummaryView

urlpatterns = [
    path("buy/", BuyStockView.as_view(), name="buy-stock"),
    path("sell/", SellStockView.as_view(), name="sell-stock"),
    path("summary/", PortfolioSummaryView.as_view(), name="portfolio-summary"),
]
