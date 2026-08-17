import math
from decimal import Decimal, InvalidOperation

from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .predictor import predict_stock
from .download_data import download_stock
from .models import Watchlist, Holding, Transaction


# Historical data cache: 15 minutes
HISTORY_CACHE_TIMEOUT = 15 * 60


# ============================================================
# STOCK PREDICTION
# ============================================================

class StockPredictionView(APIView):

    def post(self, request):

        symbol = request.data.get("symbol")

        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        result = predict_stock(symbol)

        return Response(result)


# ============================================================
# STOCK HISTORY
# ============================================================

class StockHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        symbol = request.query_params.get("symbol")

        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        # Cache key for each stock
        cache_key = f"stock_history_{symbol}"

        # Check cache first
        cached_data = cache.get(cache_key)

        if cached_data is not None:

            print(
                f"Returning cached historical data for: {symbol}"
            )

            return Response(cached_data)

        # Cache miss - download fresh data
        print(
            f"Cache miss. Downloading historical data for: {symbol}"
        )

        data = download_stock(symbol)

        if data is None or data.empty:
            return Response(
                {
                    "error": f"No historical data found for {symbol}"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Handle yfinance MultiIndex columns
        if (
            hasattr(data.columns, "nlevels")
            and data.columns.nlevels > 1
        ):
            data.columns = data.columns.get_level_values(0)

        historical_data = []

        for date, row in data.iterrows():

            try:

                open_price = float(row["Open"])
                high = float(row["High"])
                low = float(row["Low"])
                close = float(row["Close"])
                volume = float(row["Volume"])

                values = [
                    open_price,
                    high,
                    low,
                    close,
                    volume
                ]

                # Skip NaN and Infinity values
                if not all(
                    math.isfinite(value)
                    for value in values
                ):
                    continue

                historical_data.append(
                    {
                        "date": date.strftime("%Y-%m-%d"),
                        "open": open_price,
                        "high": high,
                        "low": low,
                        "close": close,
                        "volume": int(volume)
                    }
                )

            except (
                TypeError,
                ValueError,
                KeyError
            ):
                continue

        if not historical_data:
            return Response(
                {
                    "error":
                    f"No valid historical data found for {symbol}"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        response_data = {
            "symbol": symbol,
            "period": "1y",
            "interval": "1d",
            "data": historical_data
        }

        # Store successful result in cache
        cache.set(
            cache_key,
            response_data,
            HISTORY_CACHE_TIMEOUT
        )

        print(
            f"Historical data cached for: {symbol}"
        )

        return Response(response_data)


# ============================================================
# WATCHLIST
# ============================================================

class WatchlistView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        watchlist = Watchlist.objects.filter(
            user=request.user
        )

        data = []

        for item in watchlist:

            data.append(
                {
                    "id": item.id,
                    "symbol": item.symbol,
                    "created_at": item.created_at
                }
            )

        return Response(data)

    def post(self, request):

        symbol = request.data.get("symbol")

        if not symbol:
            return Response(
                {
                    "error": "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        watchlist_item, created = Watchlist.objects.get_or_create(
            user=request.user,
            symbol=symbol
        )

        if not created:

            return Response(
                {
                    "message":
                    f"{symbol} is already in your watchlist.",
                    "symbol": symbol
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message":
                f"{symbol} added to your watchlist.",
                "id": watchlist_item.id,
                "symbol": watchlist_item.symbol
            },
            status=status.HTTP_201_CREATED
        )

    def delete(self, request):

        symbol = request.query_params.get("symbol")

        if not symbol:
            return Response(
                {
                    "error": "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        deleted_count, _ = Watchlist.objects.filter(
            user=request.user,
            symbol=symbol
        ).delete()

        if deleted_count == 0:

            return Response(
                {
                    "error":
                    f"{symbol} is not in your watchlist."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "message":
                f"{symbol} removed from your watchlist."
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# BUY STOCK
# ============================================================

class BuyStockView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        symbol = request.data.get("symbol")
        quantity = request.data.get("quantity")
        price = request.data.get("price")

        # Validate symbol
        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate quantity
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {"error": "Quantity must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate price
        try:
            price = Decimal(str(price))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Price must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if price <= 0:
            return Response(
                {"error": "Price must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        # Calculate total amount
        total_amount = price * quantity

        # Find or create holding
        holding, created = Holding.objects.get_or_create(
            user=request.user,
            symbol=symbol,
            defaults={
                "quantity": quantity,
                "average_buy_price": price
            }
        )

        if not created:

            old_quantity = holding.quantity
            old_average_price = holding.average_buy_price

            new_quantity = old_quantity + quantity

            # Weighted average buy price
            new_average_price = (
                (
                    Decimal(old_quantity) * old_average_price
                )
                +
                (
                    Decimal(quantity) * price
                )
            ) / Decimal(new_quantity)

            holding.quantity = new_quantity
            holding.average_buy_price = new_average_price
            holding.save()

        # Record transaction
        transaction = Transaction.objects.create(
            user=request.user,
            symbol=symbol,
            transaction_type=Transaction.BUY,
            quantity=quantity,
            price=price,
            total_amount=total_amount
        )

        return Response(
            {
                "message": f"{symbol} purchased successfully.",
                "transaction": {
                    "id": transaction.id,
                    "symbol": transaction.symbol,
                    "type": transaction.transaction_type,
                    "quantity": transaction.quantity,
                    "price": float(transaction.price),
                    "total_amount": float(
                        transaction.total_amount
                    ),
                    "created_at": transaction.created_at
                },
                "holding": {
                    "symbol": holding.symbol,
                    "quantity": holding.quantity,
                    "average_buy_price": float(
                        holding.average_buy_price
                    )
                }
            },
            status=status.HTTP_201_CREATED
        )


# ============================================================
# SELL STOCK
# ============================================================

class SellStockView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        symbol = request.data.get("symbol")
        quantity = request.data.get("quantity")
        price = request.data.get("price")

        # Validate symbol
        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        # Validate quantity
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {"error": "Quantity must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate price
        try:
            price = Decimal(str(price))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Price must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if price <= 0:
            return Response(
                {"error": "Price must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find holding
        try:
            holding = Holding.objects.get(
                user=request.user,
                symbol=symbol
            )
        except Holding.DoesNotExist:
            return Response(
                {
                    "error":
                    f"You do not own any shares of {symbol}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent selling more than owned
        if quantity > holding.quantity:
            return Response(
                {
                    "error":
                    f"You only own {holding.quantity} shares "
                    f"of {symbol}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate total sale amount
        total_amount = price * quantity

        # Update holding
        holding.quantity -= quantity

        remaining_quantity = holding.quantity

        if remaining_quantity == 0:

            holding.delete()

            holding_response = None

        else:

            holding.save()

            holding_response = {
                "symbol": holding.symbol,
                "quantity": holding.quantity,
                "average_buy_price": float(
                    holding.average_buy_price
                )
            }

        # Record transaction
        transaction = Transaction.objects.create(
            user=request.user,
            symbol=symbol,
            transaction_type=Transaction.SELL,
            quantity=quantity,
            price=price,
            total_amount=total_amount
        )

        return Response(
            {
                "message": f"{symbol} sold successfully.",
                "transaction": {
                    "id": transaction.id,
                    "symbol": transaction.symbol,
                    "type": transaction.transaction_type,
                    "quantity": transaction.quantity,
                    "price": float(transaction.price),
                    "total_amount": float(
                        transaction.total_amount
                    ),
                    "created_at": transaction.created_at
                },
                "holding": holding_response
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# PORTFOLIO / HOLDINGS
# ============================================================

class PortfolioView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        holdings = Holding.objects.filter(
            user=request.user
        )

        data = []

        total_invested = Decimal("0")

        for holding in holdings:

            invested_amount = (
                Decimal(holding.quantity)
                * holding.average_buy_price
            )

            total_invested += invested_amount

            data.append(
                {
                    "id": holding.id,
                    "symbol": holding.symbol,
                    "quantity": holding.quantity,
                    "average_buy_price": float(
                        holding.average_buy_price
                    ),
                    "invested_amount": float(
                        invested_amount
                    ),
                    "created_at": holding.created_at,
                    "updated_at": holding.updated_at
                }
            )

        return Response(
            {
                "holdings": data,
                "total_invested": float(total_invested),
                "number_of_holdings": len(data)
            }
        )


# ============================================================
# TRANSACTION HISTORY
# ============================================================

class TransactionHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        transactions = Transaction.objects.filter(
            user=request.user
        )

        data = []

        for transaction in transactions:

            data.append(
                {
                    "id": transaction.id,
                    "symbol": transaction.symbol,
                    "type": transaction.transaction_type,
                    "quantity": transaction.quantity,
                    "price": float(transaction.price),
                    "total_amount": float(
                        transaction.total_amount
                    ),
                    "created_at": transaction.created_at
                }
            )

        return Response(data)