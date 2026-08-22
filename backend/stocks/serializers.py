from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'symbol', 'transaction_type', 'quantity', 'price', 'total_amount', 'created_at']
