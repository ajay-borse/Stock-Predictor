from django.urls import path

from .views import StockPredictionView, StockHistoryView


urlpatterns = [

    path(
        "predict/",
        StockPredictionView.as_view()
    ),

    path(
        "history/",
        StockHistoryView.as_view()
    ),

]