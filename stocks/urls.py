from django.urls import path
from .views import StockPredictionView

urlpatterns = [
    path(
        "predict/",
        StockPredictionView.as_view()
    ),
]