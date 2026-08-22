from django.urls import path

from .views import (
    StockSearchView,
    MarketOverviewView,
    StockPredictionView,
    StockHistoryView,
    WatchlistView,
    BuyStockView,
    SellStockView,
    PortfolioView,
    TransactionListView,
    PortfolioAnalyticsView,
    NotificationListView,
    MarkAllNotificationsReadView
)


urlpatterns = [
    # Notifications
    path(
        "notifications/",
        NotificationListView.as_view()
    ),
    path(
        "notifications/read-all/",
        MarkAllNotificationsReadView.as_view()
    ),

    # Stock Search
    path(
        "search/",
        StockSearchView.as_view()
    ),

    # Market Overview
    path(
        "market-overview/",
        MarketOverviewView.as_view()
    ),


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