from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),

    path('currency/', views.currency_list, name='currency'),
    path('gold/', views.gold_list, name='gold'),
    path('crypto/', views.crypto_list, name='crypto'),
    path('convert/', views.converter, name='converter'),
]