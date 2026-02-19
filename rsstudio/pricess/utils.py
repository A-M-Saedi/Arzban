import requests
from bs4 import BeautifulSoup

def get_dollar_price():
    url = "https://www.tgju.org/profile/price_dollar_rl"
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        span = soup.find("span", {"data-col": "info.last_trade.PDrCotVal"})

        if span:
            return span.text.strip()

    return None