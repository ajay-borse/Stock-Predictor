from django.urls import path
from .views import TransactionHistoryView

urlpatterns = [
    path("", TransactionHistoryView.as_view(), name="transaction-history"),
]