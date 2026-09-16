import requests
from bs4 import BeautifulSoup

def get_price_from_tgju(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')

        price_element = soup.find('span', {'data-col': 'info.last_trade.PDrCotVal'})

        if price_element:
            return price_element.text.strip()

    except Exception as e:
        print(f"Error: {e}")
        return None
    return None


# Direct map: Persian name → TGJU API symbol (uppercase of the profile URL slug)
_CHART_API_SYMBOL = {
    'دلار آمریکا':      'PRICE_DOLLAR_RL',
    'یورو':             'PRICE_EUR',
    'پوند':             'PRICE_GBP',
    'دلار کانادا':      'PRICE_CAD',
    'لیر ترکیه':        'PRICE_TRY',
    'درهم امارات':      'PRICE_AED',
    'یوان چین':         'PRICE_CNY',
    'فرانک سوئیس':      'PRICE_CHF',
    'روپیه هند':        'PRICE_INR',
    'دینار عراق':       'PRICE_IQD',
    'ریال عربستان':     'PRICE_SAR',
    'انس طلا':          'ONS',
    'طلای ۱۸ عیار':     'GERAM18',
    'طلای ۲۴ عیار':     'GERAM24',
    'سکه امامی':        'SEKEE',
    'سکه بهار آزادی':   'SEKEB',
    'نیم سکه':          'NIM',
    'ربع سکه':          'ROB',
    'بیت کوین':         'CRYPTO-BITCOIN',
    'اتریوم':           'CRYPTO-ETHEREUM',
    'تتر':              'CRYPTO-TETHER',
    'ترون':             'CRYPTO-TRON',
    'ریپل':             'CRYPTO-RIPPLE',
    'نفت اپک':          'OIL_OPEC',
    'نفت برنت':         'ENERGY-BRENT-OIL',
    'نفت خام':          'ENERGY-CRUDE-OIL',
    'نفت سبک عربستان':  'ARAB-LIGHT',
}


# TGJU's tvdata endpoint always returns the full daily series and ignores
# resolution/from/to, so period windows are applied here instead.
_CHART_PERIOD_DAYS = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    'all': None,
}


def _slice_by_period(prices, dates, period):
    """Trim a daily series to the requested window, measured from its last point."""
    days = _CHART_PERIOD_DAYS.get(period)
    if days is None or not dates:
        return prices, dates

    try:
        cutoff = int(float(dates[-1])) - days * 86400
        start = next(i for i, t in enumerate(dates) if int(float(t)) >= cutoff)
    except (ValueError, TypeError, StopIteration):
        return prices, dates

    # Source data is daily, so a 24h window can land on a single point
    # (weekends/holidays); keep two so the line and % badge still render.
    if len(prices) - start < 2:
        start = max(0, len(prices) - 2)

    return prices[start:], dates[start:]


def get_chart_data(symbol_name, period='all'):
    api_symbol = _CHART_API_SYMBOL.get(symbol_name)
    if not api_symbol:
        print(f"⚠️ no API symbol for: {symbol_name}")
        return None

    try:
        print(f"📊 fetching chart: {symbol_name} → {api_symbol}")
        r = requests.get(
            f'https://platform.tgju.org/fa/tvdata/history?symbol={api_symbol}',
            headers={'User-Agent': 'Mozilla/5.0'},
            timeout=10,
        )
        r.raise_for_status()
        raw = r.json()

        if not raw or 't' not in raw or not raw['t']:
            print(f"⚠️ empty chart data for {symbol_name}")
            return None

        prices = [float(c) for c in raw['c']]
        dates  = [str(t)   for t in raw['t']]

        prices, dates = _slice_by_period(prices, dates, period)

        print(f"✅ {symbol_name} [{period}]: {len(prices)} points")
        return {'prices': prices, 'dates': dates, 'symbol': api_symbol, 'period': period}

    except Exception as e:
        print(f"❌ chart error for {symbol_name}: {e}")
        return None