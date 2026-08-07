from django.urls import path
from .views import StockPriceView

urlpatterns = [
    path("<str:symbol>/", StockPriceView.as_view()),
]