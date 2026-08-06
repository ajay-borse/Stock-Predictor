from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

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