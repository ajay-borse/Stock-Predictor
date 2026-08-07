from rest_framework.views import APIView
from rest_framework.response import Response
import yfinance as yf


class StockPriceView(APIView):

    def get(self, request, symbol):

        stock = yf.Ticker(symbol)

        info = stock.fast_info

        return Response({
            "symbol": symbol,
            "price": info.get("lastPrice")
        })