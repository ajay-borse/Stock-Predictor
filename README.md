# 📈 StockMind AI

### Intelligent Stock Prediction & Portfolio Management Platform

> StockMind AI is a full-stack financial technology platform designed to help users analyze market data, predict next-day stock price direction, and manage their investment activity through a unified web application.

<p align="center">

  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">

  <img src="https://img.shields.io/badge/Backend-Django%20REST-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django">

  <img src="https://img.shields.io/badge/Language-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">

  <img src="https://img.shields.io/badge/Authentication-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">

  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployment">

</p>

<p align="center">

  <a href="https://stock-predictor-o486.vercel.app/">
    <img src="https://img.shields.io/badge/🚀%20Live%20Application-Visit%20StockMind%20AI-00C853?style=for-the-badge" alt="Live Application">
  </a>

</p>

---

### 🎯 What StockMind AI Does

StockMind AI combines **historical market-data analysis, predictive modeling, and portfolio management** into a single full-stack application.

The platform currently provides:

- 📊 Historical stock-data analysis
- 🤖 Next-day **Upward / Downward** price-direction prediction
- 🎯 **74% prediction accuracy**
- 💼 Portfolio management
- ⭐ Watchlist functionality
- 💰 Transaction tracking
- 🔐 JWT-based authentication
- 👤 User profile management
- 🔌 RESTful API architecture
- ☁️ Production deployment with Vercel & Render

## ✨ Core Features

### 🤖 Intelligent Stock Prediction
- Analyzes the previous **10 days of historical stock data**.
- Predicts next-day stock movement as **Upward 📈 or Downward 📉**.
- Achieves approximately **74% prediction accuracy** on the evaluated data.

### 📊 Market Analysis
- Retrieves and processes historical stock-market data.
- Presents prediction results through an interactive web interface.

### 💼 Portfolio Management
- Create and manage personal stock portfolios.
- Track investment holdings and portfolio activity.

### ⭐ Watchlist
- Add and manage stocks you want to monitor.
- Quickly access selected stocks for analysis.

### 💰 Transaction Management
- Record and manage investment transactions.
- Maintain transaction history for portfolio tracking.

### 🔐 Secure Authentication
- JWT-based user authentication.
- Secure registration and login.
- Protected API endpoints.
- Access and refresh token support.
- User profile management.

### 🔌 RESTful API Architecture
- Django REST Framework backend.
- APIs for authentication, stocks, portfolios, and transactions.
- Axios-based frontend-backend integration.
- Centralized API authorization and error handling.

### ☁️ Production Deployment
- React frontend deployed on **Vercel**.
- Django REST backend deployed on **Render**.
- Production CORS and API configuration.
- PostgreSQL support for production.

---

## 🛠️ Technology Stack

### 🎨 Frontend
- **React.js** — Component-based user interface
- **Vite** — Fast frontend development and production build
- **JavaScript** — Application logic and interactions
- **Axios** — REST API communication
- **HTML5 & CSS3** — Structure and responsive styling

### ⚙️ Backend
- **Python** — Backend and prediction logic
- **Django** — Web application framework
- **Django REST Framework** — RESTful API development
- **Simple JWT** — Token-based authentication

### 🗄️ Database
- **PostgreSQL** — Production database
- **SQLite** — Local development database

### ☁️ Deployment
- **Vercel** — Frontend hosting
- **Render** — Backend hosting

### 🔧 Development Tools
- **Git & GitHub**
- **Postman**
- **VS Code**

---

## 🏗️ System Architecture

StockMind AI follows a modern **client-server architecture**, where the React frontend communicates with the Django REST backend through secure REST APIs.

```text
                         👤 USER
                           │
                           ▼
                ┌─────────────────────┐
                │   React + Vite      │
                │     Frontend        │
                │                     │
                │ • Dashboard         │
                │ • Stock Analysis    │
                │ • Portfolio         │
                │ • Watchlist         │
                │ • Transactions      │
                └──────────┬──────────┘
                           │
                           │ Axios / REST API
                           │ HTTPS
                           ▼
                ┌─────────────────────┐
                │ Django REST API     │
                │      Backend        │
                │                     │
                │ • Authentication    │
                │ • Stock Services    │
                │ • Portfolio APIs    │
                │ • Transaction APIs │
                │ • User Profiles    │
                └──────────┬──────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌────────────┐
        │ Accounts │ │  Stocks  │ │ Portfolio  │
        └──────────┘ └──────────┘ └────────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                   ┌────────────────┐
                   │   PostgreSQL   │
                   │    Database    │
                   └────────────────┘

🔄 Prediction Workflow

Historical Stock Data
          │
          ▼
   Data Processing
          │
          ▼
  Last 10 Days Data
          │
          ▼
 Prediction Model
          │
          ▼
 ┌────────┴────────┐
 ▼                 ▼
📈 UPWARD       📉 DOWNWARD
          │
          ▼
   React Dashboard

🌐 Deployment Architecture
        ┌─────────────────┐
        │     Vercel      │
        │ React Frontend  │
        └────────┬────────┘
                 │
                 │ HTTPS / REST API
                 ▼
        ┌─────────────────┐
        │     Render      │
        │ Django Backend  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   PostgreSQL    │
        │    Database     │
        └─────────────────┘

      
