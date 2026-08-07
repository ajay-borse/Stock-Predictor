from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Holding
from .serializers import HoldingSerializer


class BuyStockView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        portfolio = request.user.portfolio

        serializer = HoldingSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(portfolio=portfolio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellStockView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        portfolio = request.user.portfolio

        holding = get_object_or_404(
            Holding,
            portfolio=portfolio,
            stock_symbol=request.data["stock_symbol"]
        )

        quantity = int(request.data["quantity"])

        if quantity > holding.quantity:
            return Response(
                {"error": "Not enough shares to sell"},
                status=status.HTTP_400_BAD_REQUEST
            )

        holding.quantity -= quantity

        if holding.quantity == 0:
            holding.delete()
        else:
            holding.save()

        return Response(
            {"message": "Stock sold successfully"},
            status=status.HTTP_200_OK
        )
class PortfolioSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio = request.user.portfolio

        serializer = HoldingSerializer(
            portfolio.holdings.all(),
            many=True
        )

        return Response({
            "balance": portfolio.balance,
            "total_investment": portfolio.total_investment,
            "total_profit_loss": portfolio.total_profit_loss,
            "holdings": serializer.data
        })   