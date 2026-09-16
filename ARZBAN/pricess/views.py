import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.shortcuts import render
from django.http import JsonResponse
from .models import Price
from .utils import get_price_from_tgju , get_chart_data

_fetch_lock = threading.Lock()
_last_fetch_time = 0
_CACHE_TTL = 300  # seconds — only re-scrape if data is older than 5 minutes

_fetch_status = {
    "running": False,
    "progress": 0,
    "total": 0,
    "current_item": "",
    "done": True,
}

# name → numeric value from the previous fetch cycle, used to compute % change
_previous_values = {}

#saedi-amir-root
PRICES_TO_FETCH = [
    {"name": "دلار آمریکا", "url": "https://www.tgju.org/profile/price_dollar_rl", "category": "currency"},
    {"name": "یورو", "url": "https://www.tgju.org/profile/price_eur", "category": "currency"},
    {"name": "پوند", "url": "https://www.tgju.org/profile/price_gbp", "category": "currency"},
    {"name": "دلار کانادا", "url": "https://www.tgju.org/profile/price_cad", "category": "currency"},
    {"name": "لیر ترکیه", "url": "https://www.tgju.org/profile/price_try", "category": "currency"},
    {"name": "درهم امارات", "url": "https://www.tgju.org/profile/price_aed", "category": "currency"},
    {"name": "یوان چین", "url": "https://www.tgju.org/profile/price_cny", "category": "currency"},
    {"name": "فرانک سوئیس", "url": "https://www.tgju.org/profile/price_chf", "category": "currency"},
    {"name": "روپیه هند", "url": "https://www.tgju.org/profile/price_inr", "category": "currency"},
    {"name": "دینار عراق", "url": "https://www.tgju.org/profile/price_iqd", "category": "currency"},
    {"name": "ریال عربستان", "url": "https://www.tgju.org/profile/price_sar", "category": "currency"},


    {"name": "انس طلا", "url": "https://www.tgju.org/profile/ons", "category": "gold"},
    {"name": "طلای ۱۸ عیار", "url": "https://www.tgju.org/profile/geram18", "category": "gold"},
    {"name": "طلای ۲۴ عیار", "url": "https://www.tgju.org/profile/geram24", "category": "gold"},
    {"name": "سکه امامی", "url": "https://www.tgju.org/profile/sekee", "category": "gold"},
    {"name": "سکه بهار آزادی", "url": "https://www.tgju.org/profile/sekeb", "category": "gold"},
    {"name": "نیم سکه", "url": "https://www.tgju.org/profile/nim", "category": "gold"},
    {"name": "ربع سکه", "url": "https://www.tgju.org/profile/rob", "category": "gold"},


    {"name": "بیت کوین", "url": "https://www.tgju.org/profile/crypto-bitcoin", "category": "crypto"},
    {"name": "اتریوم", "url": "https://www.tgju.org/profile/crypto-ethereum", "category": "crypto"},
    {"name": "تتر", "url": "https://www.tgju.org/profile/crypto-tether", "category": "crypto"},
    {"name": "ترون", "url": "https://www.tgju.org/profile/crypto-tron", "category": "crypto"},
    {"name": "ریپل", "url": "https://www.tgju.org/profile/crypto-ripple", "category": "crypto"},
    

    {"name": "نفت اپک", "url": "https://www.tgju.org/profile/oil_opec", "category": "oil"},
    {"name": "نفت برنت", "url": "https://www.tgju.org/profile/energy-brent-oil", "category": "oil"},
    {"name": "نفت خام", "url": "https://www.tgju.org/profile/energy-crude-oil", "category": "oil"},
    {"name": "نفت سبک عربستان", "url": "https://www.tgju.org/profile/arab-light", "category": "oil"},
]


HOME_IMPORTANT_ITEMS = [
    {"name": "دلار آمریکا", "icon": "fas fa-dollar-sign", "color": "positive"},
    {"name": "یورو", "icon": "fas fa-euro-sign", "color": "positive"},
    {"name": "طلای ۱۸ عیار", "icon": "fas fa-gem", "color": "positive"},
    {"name": "یوان چین", "icon": "fas fa-dollar-sign", "color": "positive"},
    {"name": "طلای ۲۴ عیار", "icon": "fas fa-gem", "color": "positive"},
    {"name": "سکه امامی", "icon": "fas fa-coins", "color": "positive"},
]

def _parse_numeric(value_str):
    """Convert a price string like '900,000' or '۹۰۰٬۰۰۰' to float."""
    return float(value_str.replace(',', '').replace('٬', ''))


def _compute_change(name, new_numeric):
    """Return % change since last fetch cycle, or None if no previous data."""
    prev = _previous_values.get(name)
    if prev and prev != 0:
        return round((new_numeric - prev) / prev * 100, 2)
    return None


def _fetch_single(item):
    value = get_price_from_tgju(item["url"])
    return (item, value)

def _schedule_fetch():
    """Non-blocking: kick off fetch_prices() in background if data is stale."""
    if time.time() - _last_fetch_time < _CACHE_TTL:
        return
    if _fetch_status.get("running"):
        return
    threading.Thread(target=fetch_prices, daemon=True).start()


def fetch_prices():
    global _last_fetch_time, _fetch_status

    now = time.time()
    if now - _last_fetch_time < _CACHE_TTL:
        return

    with _fetch_lock:
        if time.time() - _last_fetch_time < _CACHE_TTL:
            return

        _fetch_status.update({
            "running": True,
            "done": False,
            "progress": 0,
            "total": len(PRICES_TO_FETCH),
            "current_item": "",
        })

        allowed_names = [item["name"] for item in PRICES_TO_FETCH]
        Price.objects.exclude(name__in=allowed_names).delete()

        # Snapshot current DB values as "previous" before overwriting them
        for price_obj in Price.objects.all():
            try:
                _previous_values[price_obj.name] = _parse_numeric(price_obj.value)
            except (ValueError, AttributeError):
                pass

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_fetch_single, item) for item in PRICES_TO_FETCH]
            for future in as_completed(futures):
                item, value = future.result()
                _fetch_status["progress"] += 1
                _fetch_status["current_item"] = item["name"]
                if value:
                    Price.objects.update_or_create(
                        name=item["name"],
                        defaults={"value": value, "category": item["category"]}
                    )

        _last_fetch_time = time.time()
        _fetch_status.update({
            "running": False,
            "done": True,
            "current_item": "",
        })

def home(request):
    _schedule_fetch()
    

    home_items = []
    for item in HOME_IMPORTANT_ITEMS:
        try:
            price_obj = Price.objects.get(name=item["name"])
            numeric_value = _parse_numeric(price_obj.value)
            change = _compute_change(item["name"], numeric_value)
            home_items.append({
                "name": item["name"],
                "value": price_obj.value,
                "numeric_value": numeric_value,
                "icon": item["icon"],
                "color": item["color"],
                "change": change,
            })
        except Price.DoesNotExist:
            continue
    
    return render(request, "pricess/index.html", {
        "home_items": home_items
    })



def api_prices_by_category(request, category):
    _schedule_fetch()
    items = Price.objects.filter(category=category)

    data = []
    for item in items:
        numeric_value = _parse_numeric(item.value)
        data.append({
            "name": item.name,
            "value": item.value,
            "numeric_value": numeric_value,
            "category": item.category,
            "change": _compute_change(item.name, numeric_value),
        })

    response = JsonResponse({"status": "success", "data": data})
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


def api_currency(request):
    return api_prices_by_category(request, "currency")


def api_gold(request):
    return api_prices_by_category(request, "gold")


def api_crypto(request):
    return api_prices_by_category(request, "crypto")


def api_oil(request):
    return api_prices_by_category(request, "oil")


def api_home_items(request):
    _schedule_fetch()

    data = []
    for item in HOME_IMPORTANT_ITEMS:
        try:
            price_obj = Price.objects.get(name=item["name"])
            numeric_value = _parse_numeric(price_obj.value)
            data.append({
                "name": item["name"],
                "value": price_obj.value,
                "numeric_value": numeric_value,
                "icon": item["icon"],
                "color": item["color"],
                "change": _compute_change(item["name"], numeric_value),
            })
        except Price.DoesNotExist:
            continue

    response = JsonResponse({"status": "success", "data": data})
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


def api_fetch_status(request):
    return JsonResponse({"status": "success", "data": dict(_fetch_status)})


def api_all_prices(request):
    _schedule_fetch()
    data = []
    for item in Price.objects.all():
        numeric_value = _parse_numeric(item.value)
        data.append({
            "name": item.name,
            "value": item.value,
            "numeric_value": numeric_value,
            "category": item.category,
            "change": _compute_change(item.name, numeric_value),
        })
    response = JsonResponse({"status": "success", "data": data})
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


def api_convert(request):
    from_name = request.GET.get('from', '').strip()
    to_name = request.GET.get('to', '').strip()

    try:
        amount = float(request.GET.get('amount', 1))
    except (ValueError, TypeError):
        return JsonResponse({"status": "error", "message": "مقدار نامعتبر است"}, status=400)

    if not from_name or not to_name:
        return JsonResponse({"status": "error", "message": "ارز مبدا و مقصد الزامی است"}, status=400)

    if amount <= 0:
        return JsonResponse({"status": "error", "message": "مقدار باید بزرگتر از صفر باشد"}, status=400)

    def parse_price(val):
        return float(val.replace(',', '').replace('٬', ''))

    try:
        from_obj = Price.objects.get(name=from_name)
        to_obj = Price.objects.get(name=to_name)
    except Price.DoesNotExist:
        return JsonResponse({"status": "error", "message": "قیمت مورد نظر یافت نشد"}, status=404)

    from_price = parse_price(from_obj.value)
    to_price = parse_price(to_obj.value)

    # Normalize to IRR: currency/gold are already in Rial; crypto/oil are in USD
    usd_rate = [None]

    def to_rial(price, category):
        if category in ('crypto', 'oil'):
            if usd_rate[0] is None:
                try:
                    usd_rate[0] = parse_price(Price.objects.get(name='دلار آمریکا').value)
                except Price.DoesNotExist:
                    usd_rate[0] = 1
            return price * usd_rate[0]
        return price

    from_rial = to_rial(from_price, from_obj.category)
    to_rial_val = to_rial(to_price, to_obj.category)

    if to_rial_val == 0:
        return JsonResponse({"status": "error", "message": "قیمت مقصد صفر است"}, status=400)

    result = amount * (from_rial / to_rial_val)

    return JsonResponse({
        "status": "success",
        "data": {
            "from_name": from_name,
            "to_name": to_name,
            "amount": amount,
            "result": result,
        }
    })


def api_chart(request, symbol_name):
    period = request.GET.get('period', 'all')
    chart_data = get_chart_data(symbol_name, period)
    
    if chart_data:
        return JsonResponse({
            "status": "success",
            "data": chart_data,
            "symbol": symbol_name
        })
    else:
        return JsonResponse({
            "status": "error",
            "message": f"نموداری برای '{symbol_name}' یافت نشد"
        }, status=404)