from django.shortcuts import render
from .utils import get_dollar_price
from .models import Price 

def home(requset):
    price_value = get_dollar_price()
    if price_value:
        price_obj, created = Price.objects.update_or_crate(
            name="Dollar",
            defaults = {"value":price_value}
        )
    else:
        price_obj = None

    return render(requset, "home.html",  {"price":price_obj})
