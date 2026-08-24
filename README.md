# StockMind AI

## Overview
StockMind AI is an AI-powered stock analysis and portfolio management platform focused on Indian equities. It helps users manage virtual portfolios, track market overviews, and receive machine learning-based stock predictions for NSE/BSE listed companies.

## Features
- **Dashboard**: Real-time market overview, NIFTY/SENSEX indices, and top gainers/losers.
- **Stock Analysis & Prediction**: View historical charts and receive next-day price predictions powered by Scikit-Learn.
- **Portfolio Management**: Manage a virtual portfolio, track investments, and monitor real-time profit and loss (P/L).
- **Watchlist**: Track favorite stocks and monitor their daily performance.
- **Virtual Trading**: Buy and sell stocks securely at real-time market prices.
- **Notifications**: System alerts and insights based on watchlist and portfolio activity.
- **Authentication**: Secure user registration and login using JWT.

## Tech Stack
- **Frontend**: React 19, Vite, React Router, Recharts, Tailwind CSS / Vanilla CSS, Lucide Icons
- **Backend**: Django, Django REST Framework (DRF), Simple JWT
- **Machine Learning**: Scikit-Learn (Random Forest), Pandas, NumPy
- **Data Source**: yfinance (Yahoo Finance API)
- **Database**: SQLite (Development)

## Architecture
The application is split into a decoupled client-server architecture:
- A React-based Single Page Application (SPA) serves the interactive user interface.
- A Django REST Framework API serves as the backend, handling business logic, machine learning inference, and database interactions.

## AI Prediction
Predictions are generated using a pre-trained machine learning model (stock_model.pkl) that leverages historical closing prices and engineered technical features to forecast the next day's closing price.

## Stock Market Data
Real-time and historical market data is fetched securely on the backend using the yfinance library, ensuring accurate pricing for transactions and analytics.

## Authentication
User authentication is handled via Django REST Framework SimpleJWT, providing secure, token-based stateless authentication for all API endpoints.

## Portfolio Management
Users can view their total invested amount, current portfolio value, and individual stock performance (P/L and return percentages).

## Watchlist
A personalized watchlist allows users to keep track of interesting stocks for quick access to predictions and historical charts.

## Buy/Sell
The platform features a virtual trading system. Users can execute Buy and Sell orders. The backend securely validates all transactions against real-time market prices to prevent frontend price manipulation.

## Notifications
The system generates automated notifications for user actions and system alerts.

## Project Structure
\\\
StockPredictor/
├── backend/          # Django backend & ML models
├── frontend/         # React frontend application
└── README.md         # Project documentation
\\\

## Local Setup
To run the project locally, you will need Node.js and Python installed.

## Backend Setup
1. Navigate to the backend directory: cd backend
2. Create a virtual environment: python -m venv venv
3. Activate the virtual environment:
   - Windows: env\Scripts\activate
   - Mac/Linux: source venv/bin/activate
4. Install dependencies: pip install -r requirements.txt
5. Apply migrations: python manage.py migrate
6. Start the server: python manage.py runserver

## Frontend Setup
1. Navigate to the frontend directory: cd frontend
2. Install dependencies: 
pm install
3. Start the development server: 
pm run dev

## Environment Variables
- **Backend**: Requires a .env file containing SECRET_KEY and other Django settings (refer to ackend/.env.example).
- **Frontend**: Requires a .env file defining the backend API URL (e.g., VITE_API_BASE_URL=http://127.0.0.1:8000/api/).

## API Overview
The backend exposes various RESTful endpoints under /api/:
- /api/login/ & /api/register/: Authentication
- /api/stocks/portfolio/analytics/: Portfolio data
- /api/stocks/buy/ & /api/stocks/sell/: Secure transactions
- /api/stocks/predict/: AI stock predictions
- /api/stocks/market-overview/: Global market data

## Screenshots
*(Add screenshots of Dashboard, Portfolio, and Prediction screens here)*

## Future Improvements
- Migration to a production-grade database (PostgreSQL).
- Deployment to cloud hosting (e.g., AWS, Vercel, Render).
- Enhanced AI models for longer-term predictions.
