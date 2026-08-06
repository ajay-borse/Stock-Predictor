from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from .models import Portfolio


@receiver(post_save, sender=User)
def create_portfolio(sender, instance, created, **kwargs):
    if created:
        Portfolio.objects.create(user=instance)