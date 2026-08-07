from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response


class StockPriceView(APIView):

    def get(self, request, symbol):

        api_key = config("TWELVE_DATA_API_KEY", default="NOT_FOUND")

        return Response({
            "symbol": symbol.upper(),
            "api_key": api_key
        })