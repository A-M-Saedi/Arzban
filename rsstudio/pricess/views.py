from django.shortcuts import render
from .models import Price
from .utils import get_price_from_tgju

def home(request):
    prices_to_fetch = [
        {"name": "دلار آمریکا", "url": "https://www.tgju.org/profile/price_dollar_rl", "category": "currency"},
        {"name": "یورو", "url": "https://www.tgju.org/profile/price_eur", "category": "currency"},
        {"name": "پوند", "url": "https://www.tgju.org/profile/price_gbp", "category": "currency"},
        {"name": "دلار کانادا", "url": "https://www.tgju.org/profile/price_cad", "category": "currency"},
        {"name": "لیر ترکیه", "url": "https://www.tgju.org/profile/price_try", "category": "currency"},
        {"name": "درهم امارات", "url": "https://www.tgju.org/profile/price_aed", "category": "currency"},
        {"name": "یوان چین", "url": "hhttps://www.tgju.org/profile/price_cny", "category": "currency"},

        {"name": "انس طلا", "url": "https://www.tgju.org/profile/ons", "category": "gold"},
        {"name": "انس نقره", "url": "https://www.tgju.org/profile/silver", "category": "gold"},
        {"name": "طلای ۱۸ عیار", "url": "https://www.tgju.org/profile/geram18", "category": "gold"},
        {"name": "طلای ۲۴ عیار", "url": "https://www.tgju.org/profile/geram24", "category": "gold"},
        {"name": "سکه امامی", "url": "https://www.tgju.org/coin", "category": "gold"},
        {"name": "سکه بهار آزادی", "url": "https://www.tgju.org/profile/sekee-bahar", "category": "gold"},
        {"name": "نیم سکه", "url": "https://www.tgju.org/profile/nim-sekee", "category": "gold"},
        {"name": "ربع سکه", "url": "https://www.tgju.org/profile/rob-sekee", "category": "gold"},

        {"name": "بیت کوین", "url": "https://www.tgju.org/profile/bitcoin", "category": "crypto"},
        {"name": "تتر", "url": "https://www.tgju.org/profile/tether", "category": "crypto"},
        {"name": "ریپل", "url": "https://www.tgju.org/profile/ripple", "category": "crypto"},
        {"name": "کاردانو", "url": "https://www.tgju.org/profile/cardano", "category": "crypto"},
        {"name": "اتریوم", "url": "https://www.tgju.org/profile/ethereum", "category": "crypto"},
    ]

    for item in prices_to_fetch:
        value = get_price_from_tgju(item["url"])
        if value:
            Price.objects.update_or_create(
                name=item["name"],
                defaults={"value": value, "category": item["category"]}
            )

    currencies = Price.objects.filter(category="currency")
    metals = Price.objects.filter(category="gold")
    crypto = Price.objects.filter(category="crypto")

    return render(request, "home.html", {
        "currencies": currencies,
        "metals": metals,
        "crypto": crypto,
    })