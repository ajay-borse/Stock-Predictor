import yfinance as yf


def download_stock(symbol):
    data = yf.download(symbol, period="1y", interval="1d")

    if data.empty:
        return None

    return data


if __name__ == "__main__":
    data = download_stock("RELIANCE.NS")

    if data is not None:
        print(data.head())
    else:
        print("No data found.")