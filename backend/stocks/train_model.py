import joblib

from sklearn.linear_model import LinearRegression

from .feature_engineering import create_features


def train_model(symbol):

    data = create_features(symbol)

    if data is None:
        return

    # Features (Input)
    X = data[["Close", "MA5", "MA10"]]

    # Target (Output)
    y = data["Target"]

    # Create Model
    model = LinearRegression()

    # Train Model
    model.fit(X, y)

    # Save Model
    joblib.dump(model, f"models/{symbol}_model.pkl")

    print("\n✅ Model Trained Successfully!")

    print("Model saved as stock_model.pkl")


if __name__ == "__main__":
    train_model("RELIANCE.NS")