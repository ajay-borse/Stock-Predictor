import yfinance as yf

def download_stock(symbol):
    data = yf.download(symbol, period="1y", interval="1d")
    data.to_csv(f"{symbol}.csv")
    return data