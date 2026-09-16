from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    
    path('api/currency/', views.api_currency, name='api_currency'),
    path('api/gold/', views.api_gold, name='api_gold'),
    path('api/crypto/', views.api_crypto, name='api_crypto'),
    path('api/oil/', views.api_oil, name='api_oil'),
    path('api/home-items/', views.api_home_items, name='api_home_items'),
    path('api/fetch-status/', views.api_fetch_status, name='api_fetch_status'),
    path('api/all-prices/', views.api_all_prices, name='api_all_prices'),
    path('api/convert/', views.api_convert, name='api_convert'),

    path('api/chart/<str:symbol_name>/', views.api_chart, name='api_chart'),
]