from django.db import models
from accounts.models import User


class Transaction(models.Model):
    BUY = "BUY"
    SELL = "SELL"

    TRANSACTION_TYPES = [
        (BUY, "Buy"),
        (SELL, "Sell"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    stock_symbol = models.CharField(max_length=10)

    transaction_type = models.CharField(
        max_length=4,
        choices=TRANSACTION_TYPES
    )

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.stock_symbol}"