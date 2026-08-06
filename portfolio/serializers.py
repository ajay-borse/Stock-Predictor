from rest_framework import serializers
from .models import Holding


class HoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Holding
        fields = "__all__"
        read_only_fields = ["portfolio"]