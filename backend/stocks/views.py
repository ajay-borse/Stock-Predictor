import math

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .predictor import predict_stock
from .download_data import download_stock


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

                # Ignore rows containing NaN or Infinity
                values = [
                    open_price,
                    high,
                    low,
                    close,
                    volume
                ]

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

        return Response({
            "symbol": symbol,
            "period": "1y",
            "interval": "1d",
            "data": historical_data
        })