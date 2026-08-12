import yfinance as yf


def download_stock(symbol):
    try:
        symbol = symbol.strip().upper()

        print(f"\nDownloading stock data for: {symbol}")

        data = yf.download(
            symbol,
            period="1y",
            interval="1d",
            auto_adjust=True,
            progress=False
        )

        if data.empty:
            print(f"No data found for {symbol}")
            return None

        print(f"Successfully downloaded data for {symbol}")
        print(f"Rows: {len(data)}")

        return data

    except Exception as e:
        print(f"Error downloading {symbol}: {e}")
        return None


if __name__ == "__main__":
    data = download_stock("RELIANCE.NS")

    if data is not None:
        print(data.head())
    else:
        print("No data found.")