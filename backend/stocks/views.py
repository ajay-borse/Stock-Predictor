import math

from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .predictor import predict_stock
from .download_data import download_stock


# Historical data will stay cached for 15 minutes
HISTORY_CACHE_TIMEOUT = 15 * 60


class StockPredictionView(APIView):

    def post(self, request):

        symbol = request.data.get("symbol")

        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = predict_stock(symbol.upper())

        return Response(result)


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

        # Create a separate cache entry for each stock
        cache_key = f"stock_history_{symbol}"

        # Check cache first
        cached_data = cache.get(cache_key)

        if cached_data is not None:

            print(f"Returning cached historical data for: {symbol}")

            return Response(cached_data)

        # Cache miss - download fresh data
        print(f"Cache miss. Downloading historical data for: {symbol}")

        data = download_stock(symbol)

        if data is None or data.empty:
            return Response(
                {"error": f"No historical data found for {symbol}"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Handle yfinance MultiIndex columns
        if hasattr(data.columns, "nlevels") and data.columns.nlevels > 1:
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

                # Skip NaN or Infinity values
                if not all(math.isfinite(value) for value in values):
                    continue

                historical_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "close": close,
                    "volume": int(volume)
                })

            except (TypeError, ValueError, KeyError):
                continue

        if not historical_data:
            return Response(
                {"error": f"No valid historical data found for {symbol}"},
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

        print(f"Historical data cached for: {symbol}")

        return Response(response_data)