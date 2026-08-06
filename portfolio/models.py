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