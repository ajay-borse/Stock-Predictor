import pandas as pd
from download_data import download_stock


def preprocess_stock(symbol):
    data = download_stock(symbol)

    if data is None:
        print("No data found.")
        return None

  
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    data = data.reset_index()

    print("\nFirst 5 Rows:")
    print(data.head())

    print("\nDataset Info:")
    data.info()

    print("\nMissing Values:")
    print(data.isnull().sum())

    print("\nShape:")
    print(data.shape)

    return data


if __name__ == "__main__":
    preprocess_stock("RELIANCE.NS")