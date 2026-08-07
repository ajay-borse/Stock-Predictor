import os
import joblib

from .train_model import train_model
from .feature_engineering import create_prediction_features


def predict_stock(symbol):

    model_path = f"models/{symbol}_model.pkl"

    # Train model if it doesn't exist
    if not os.path.exists(model_path):
        print("Model not found.")
        print("Training new model...")
        train_model(symbol)

        # If training failed, stop here
        if not os.path.exists(model_path):
            return {
                "error": "Model could not be created. Check the stock symbol."
            }

    # Load trained model
    model = joblib.load(model_path)

    # Get latest processed data
    data = create_prediction_features(symbol)

    if data is None:
        return {
            "error": "Unable to fetch stock data."
        }

    # Latest row
    latest = data.iloc[-1]

    # 🔍 Debug: Print latest row
    print("\n==============================")
    print("LATEST ROW USED FOR PREDICTION")
    print("==============================")
    print(latest)
    print("==============================\n")

    # Features for prediction
    X = latest[["Close", "MA5", "MA10"]].values.reshape(1, -1)

    # Predict tomorrow's price
    prediction = model.predict(X)[0]

    # Return JSON data
    return {
        "symbol": symbol,
        "current_price": float(latest["Close"]),
        "predicted_price": float(prediction)
    }


if __name__ == "__main__":

    symbol = input("Enter Stock Symbol : ").upper()

    result = predict_stock(symbol)

    if "error" in result:
        print(result["error"])
    else:
        print("\nPrediction Result")
        print("----------------------")
        print(f"Symbol : {result['symbol']}")
        print(f"Current Price : {result['current_price']}")
        print(f"Tomorrow Prediction : {result['predicted_price']}")