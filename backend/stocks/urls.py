from django.urls import path

from .views import (
    StockPredictionView,
    StockHistoryView,
    WatchlistView
)


urlpatterns = [

    path(
        "predict/",
        StockPredictionView.as_view()
    ),

    path(
        "history/",
        StockHistoryView.as_view()
    ),

    path(
        "watchlist/",
        WatchlistView.as_view()
    ),

]