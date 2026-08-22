from django.conf import settings
from django.db import models


class Watchlist(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watchlist"
    )

    symbol = models.CharField(max_length=30)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "symbol"],
                name="unique_user_watchlist_symbol"
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.symbol}"


class Holding(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="holdings"
    )

    symbol = models.CharField(max_length=30)

    quantity = models.PositiveIntegerField(default=0)

    average_buy_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "symbol"],
                name="unique_user_holding_symbol"
            )
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username} - {self.symbol}"


class Transaction(models.Model):

    BUY = "BUY"
    SELL = "SELL"

    TRANSACTION_TYPES = [
        (BUY, "Buy"),
        (SELL, "Sell"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stock_transactions"
    )

    symbol = models.CharField(max_length=30)

    transaction_type = models.CharField(
        max_length=4,
        choices=TRANSACTION_TYPES
    )

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    total_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.transaction_type} - "
            f"{self.symbol}"
        )

class Notification(models.Model):
    WATCHLIST = "WATCHLIST"
    BUY = "BUY"
    SELL = "SELL"
    PREDICTION = "PREDICTION"
    SYSTEM = "SYSTEM"

    NOTIFICATION_TYPES = [
        (WATCHLIST, "Watchlist"),
        (BUY, "Buy"),
        (SELL, "Sell"),
        (PREDICTION, "Prediction"),
        (SYSTEM, "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    message = models.CharField(max_length=255)

    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default=SYSTEM
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.is_read}"
