from preprocess import preprocess_stock


def create_features(symbol):
    data = preprocess_stock(symbol)

    if data is None:
        return None

    # Moving Average of last 5 days
    data["MA5"] = data["Close"].rolling(window=5).mean()

    # Moving Average of last 10 days
    data["MA10"] = data["Close"].rolling(window=10).mean()

    # Tomorrow's Closing Price (Target)
    data["Target"] = data["Close"].shift(-1)

    # Remove rows with missing values
    data = data.dropna()

    print("\nFeature Engineered Data:")
    print(data.head())

    return data


if __name__ == "__main__":
    create_features("RELIANCE.NS")