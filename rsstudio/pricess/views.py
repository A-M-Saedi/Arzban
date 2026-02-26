from django.shortcuts import render
from .models import Price
from .utils import get_price_from_tgju

#saedi-amir-root
def fetch_prices():
    prices_to_fetch = [
        {"name": "دلار آمریکا", "url": "https://www.tgju.org/profile/price_dollar_rl", "category": "currency"},
        {"name": "یورو", "url": "https://www.tgju.org/profile/price_eur", "category": "currency"},
        {"name": "پوند", "url": "https://www.tgju.org/profile/price_gbp", "category": "currency"},
        {"name": "دلار کانادا", "url": "https://www.tgju.org/profile/price_cad", "category": "currency"},
        {"name": "لیر ترکیه", "url": "https://www.tgju.org/profile/price_try", "category": "currency"},
        {"name": "درهم امارات", "url": "https://www.tgju.org/profile/price_aed", "category": "currency"},
        {"name": "یوان چین", "url": "https://www.tgju.org/profile/price_cny", "category": "currency"},

        {"name": "انس طلا", "url": "https://www.tgju.org/profile/ons", "category": "gold"},
        {"name": "طلای ۱۸ عیار", "url": "https://www.tgju.org/profile/geram18", "category": "gold"},
        {"name": "طلای ۲۴ عیار", "url": "https://www.tgju.org/profile/geram24", "category": "gold"},
        {"name": "سکه امامی", "url": "https://www.tgju.org/profile/sekee", "category": "gold"},
        {"name": "سکه بهار آزادی", "url": "https://www.tgju.org/profile/sekeb", "category": "gold"},
    ]

    for item in prices_to_fetch:
        value = get_price_from_tgju(item["url"])
        if value:
            Price.objects.update_or_create(
                name=item["name"],
                defaults={"value": value, "category": item["category"]}
            )



def home(request):
    fetch_prices()
    return render(request, "home.html")



def currency_list(request):
    fetch_prices()
    currencies = Price.objects.filter(category="currency")
    return render(request, "category.html", {"title": "ارزها", "items": currencies})



def gold_list(request):
    fetch_prices()
    golds = Price.objects.filter(category="gold")
    return render(request, "category.html", {"title": "طلا", "items": golds})



def crypto_list(request):
    cryptos = Price.objects.filter(category="crypto")
    return render(request, "category.html", {"title": "کریپتو", "items": cryptos})



def converter(request):
    currencies = {price.name.strip(): float(price.value.replace(",", "")) for price in Price.objects.filter(category="currency")}

    result = None
    from_currency = ""
    to_currency = ""
    amount = ""

    if request.method == "POST":
        from_currency = request.POST.get("from_currency", "").strip()
        to_currency = request.POST.get("to_currency", "").strip()
        amount = request.POST.get("amount", "").strip()

        try:
            amount_float = float(amount)
            from_price = currencies.get(from_currency)
            to_price = currencies.get(to_currency)

            if from_price and to_price:
                result = round((amount_float * from_price) / to_price, 2)
        except:
            result = None

    return render(request, "converter.html", {
        "currencies": currencies,
        "result": result,
        "from_currency": from_currency,
        "to_currency": to_currency,
        "amount": amount,
    })