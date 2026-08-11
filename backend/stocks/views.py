from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .predictor import predict_stock


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