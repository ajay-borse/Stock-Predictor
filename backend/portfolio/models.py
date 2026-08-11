from django.db import models
from accounts.models import User


class Portfolio(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio"
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00)
    total_investment = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_profit_loss = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username}'s Portfolio"


class Holding(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="holdings"
    )
    stock_symbol = models.CharField(max_length=10)
    quantity = models.PositiveIntegerField(default=0)
    average_buy_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.stock_symbol} ({self.quantity})"