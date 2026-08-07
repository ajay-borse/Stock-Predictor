import os
import joblib
import pandas as pd

from train_model import train_model
from feature_engineering import create_features


def predict_stock(symbol):

    model_path = f"models/{symbol}_model.pkl"

    # Train model if it doesn't exist
    if not os.path.exists(model_path):
        print("Model not found.")
        print("Training new model...")
        train_model(symbol)

    # Load model
    model = joblib.load(model_path)

    # Get latest processed data
    data = create_features(symbol)
    # Last row
    latest = data.iloc[-1]

    X = latest[["Close", "MA5", "MA10"]].values.reshape(1, -1)

    prediction = model.predict(X)[0]

    print("\nPrediction Result")
    print("----------------------")
    print("Symbol :", symbol)
    print("Current Price :", latest["Target"])
    print("Tomorrow Prediction :", prediction)


if __name__ == "__main__":

    symbol = input("Enter Stock Symbol : ").upper()

    predict_stock(symbol)