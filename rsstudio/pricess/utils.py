import requests
from bs4 import BeautifulSoup

def get_price_from_tgju(url, data_col="info.last_trade.PDrCotVal"):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
    except requests.RequestException:
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    span = soup.find("span", {"data-col": data_col})
    if span:
        return span.text.strip()
    return None