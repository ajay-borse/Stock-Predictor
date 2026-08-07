from rest_framework.views import APIView
from rest_framework.response import Response


class StockPriceView(APIView):

    def get(self, request, symbol):

        return Response({
            "symbol": symbol.upper(),
            "message": "Stock API is working!"
        })