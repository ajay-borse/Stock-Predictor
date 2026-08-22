from django.urls import path

from .views import (
    StockPredictionView,
    StockHistoryView,
    WatchlistView,
    BuyStockView,
    SellStockView,
    PortfolioView,
    TransactionListView,
    PortfolioAnalyticsView
)


urlpatterns = [

    # Stock prediction
    path(
        "predict/",
        StockPredictionView.as_view()
    ),

    # Historical stock data
    path(
        "history/",
        StockHistoryView.as_view()
    ),

    # Watchlist
    path(
        "watchlist/",
        WatchlistView.as_view()
    ),

    # Buy stock
    path(
        "buy/",
        BuyStockView.as_view()
    ),

    # Sell stock
    path(
        "sell/",
        SellStockView.as_view()
    ),

    # Portfolio
    path(
        "portfolio/",
        PortfolioView.as_view()
    ),

    # Portfolio analytics
    path(
        "portfolio/analytics/",
        PortfolioAnalyticsView.as_view()
    ),

    # Transaction history
    path(
        "transactions/",
        TransactionListView.as_view()
    ),

]