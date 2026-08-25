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

---

## 📁 Project Structure

```text
StockPredictor/
│
├── 📂 backend/
│   ├── 📂 accounts/          # User authentication & profiles
│   ├── 📂 portfolio/         # Portfolio management
│   ├── 📂 stocks/            # Stock data & prediction
│   ├── 📂 transactions/      # Transaction management
│   ├── 📂 config/            # Django project configuration
│   ├── 📄 manage.py
│   └── 📄 requirements.txt
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/    # Reusable UI components
│   │   ├── 📂 pages/         # Application pages
│   │   ├── 📂 utils/         # Utilities & API configuration
│   │   └── 📄 App.jsx
│   ├── 📄 package.json
│   └── 📄 vite.config.js
│
└── 📄 README.md


🔹 Backend Modules
| Module         | Responsibility                                      |
| -------------- | --------------------------------------------------- |
| `accounts`     | Registration, login, authentication & user profiles |
| `stocks`       | Stock data and prediction functionality             |
| `portfolio`    | Portfolio and investment management                 |
| `transactions` | Transaction records and management                  |
| `config`       | Django settings, URLs and application configuration |

🔹 Frontend Structure
| Directory    | Responsibility                   |
| ------------ | -------------------------------- |
| `pages`      | Main application screens         |
| `components` | Reusable React components        |
| `utils`      | API client and utility functions |

---

## 🚀 Installation & Local Setup

Follow the steps below to run StockMind AI locally.

### 📋 Prerequisites

Make sure the following are installed:

- **Python 3.x**
- **Node.js & npm**
- **Git**
- **PostgreSQL** *(for production/database configuration)*

---

### 1️⃣ Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd StockPredictor


---

## 🔐 Environment Configuration

StockMind AI uses environment variables to separate configuration from source code and protect sensitive credentials.

### 🎨 Frontend Configuration

Create a `.env.local` file inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/

⚙️ Backend Configuration
DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain
DATABASE_URL=your-database-url
CORS_ALLOWED_ORIGINS=your-frontend-url

---

## 📡 REST API

StockMind AI uses a RESTful API architecture built with **Django REST Framework**.

### 🔐 Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/register/` | `POST` | Create a new user account |
| `/api/login/` | `POST` | Authenticate user and obtain JWT tokens |
| `/api/profile/` | `GET` | Retrieve authenticated user profile |

### 📈 Stock APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/stocks/` | `GET` | Retrieve stock-related data |

### 💼 Portfolio APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/portfolio/` | `GET / POST` | Retrieve or manage portfolio data |

### 💰 Transaction APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/` | `GET / POST` | Retrieve or create transaction records |

### 🔑 Authentication Header

Protected endpoints use JWT authentication:

```http
Authorization: Bearer <access_token>


---

## 🤖 Stock Prediction System

StockMind AI uses historical stock-market data to predict the **next-day price direction**.

### 🔄 Prediction Pipeline

```text
Historical Market Data
          │
          ▼
   Data Preprocessing
          │
          ▼
   Previous 10 Days
          │
          ▼
    Prediction Model
          │
          ▼
   ┌──────┴──────┐
   │             │
   ▼             ▼
📈 UPWARD     📉 DOWNWARD
   │             │
   └──────┬──────┘
          ▼
   Prediction Result
          │
          ▼
     React Dashboard

---

## 🧪 Testing & Validation

StockMind AI was tested across the major application workflows to verify reliable communication between the React frontend, Django REST backend, and production database.

### ✅ Tested Components

- User registration and account validation
- JWT-based user login and authentication
- Protected profile API
- Stock data and prediction APIs
- Portfolio management workflows
- Transaction management
- Watchlist functionality
- Frontend-to-backend REST API communication
- CORS configuration
- Production environment configuration
- Vercel frontend deployment
- Render backend deployment

### 🔍 API Validation

The REST API endpoints were tested for:

- Successful requests
- Authentication failures
- Validation errors
- Unauthorized requests
- Invalid endpoints
- Backend/server errors
- Frontend-backend connectivity

### 📦 Production Build

The React application was successfully verified using the production build process:

```bash
npm run build


---

## 🌐 Live Deployment

StockMind AI is deployed using a separated frontend and backend architecture.

### 🎨 Frontend — Vercel

The React/Vite application is deployed on **Vercel**.

🚀 **Live Application:**  
https://stock-predictor-o486.vercel.app/

### ⚙️ Backend — Render

The Django REST Framework API is deployed on **Render**.

🔗 **Backend:**  
https://stockmind-ai-backend-38f2.onrender.com/

### 🔄 Production Architecture

```text
                 🌐 USER
                    │
                    ▼
        ┌──────────────────────┐
        │        Vercel        │
        │   React + Vite App   │
        └──────────┬───────────┘
                   │
                   │ HTTPS / REST API
                   ▼
        ┌──────────────────────┐
        │        Render        │
        │ Django REST Backend  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │      PostgreSQL      │
        │       Database       │
        └──────────────────────┘

---

## 🔒 Security

Security was considered across authentication, API access, deployment, and configuration.

### 🛡️ Authentication & Authorization

- Implemented **JWT-based authentication** using Django REST Framework Simple JWT.
- Protected authenticated API endpoints using access tokens.
- Implemented access and refresh token handling on the frontend.
- Restricted user-specific resources to authenticated users.

### 🔐 Data & Configuration Security

- Sensitive configuration is managed through **environment variables**.
- Secret keys and database credentials are not stored directly in the source code.
- Production configuration is separated from local development settings.
- CORS is configured to allow communication only from approved frontend origins.

### 🌐 Production Security

- Frontend and backend communicate through **HTTPS** in production.
- Django security settings are configurable through environment variables.
- Authentication credentials are transmitted using secure API authorization headers.

> ⚠️ Never commit real secret keys, database passwords, API keys, or `.env` files to the repository.

---

## 📸 Application Preview

### 🔐 Authentication

<p align="center">
  <img src="screenshots/login.png" width="850" alt="StockMind AI Login">
</p>

<p align="center">
  <b>Secure JWT-based user authentication</b>
</p>

---

### 📊 Stock Prediction Dashboard

<p align="center">
  <img src="screenshots/dashboard.png" width="850" alt="StockMind AI Dashboard">
</p>

<p align="center">
  <b>Interactive stock analysis and prediction dashboard</b>
</p>

---

### 📈 Prediction Results

<p align="center">
  <img src="screenshots/prediction.png" width="850" alt="Stock Prediction Results">
</p>

<p align="center">
  <b>Next-day Upward / Downward prediction</b>
</p>

---

### 💼 Portfolio & Transactions

<p align="center">
  <img src="screenshots/portfolio.png" width="850" alt="Portfolio Management">
</p>

<p align="center">
  <b>Portfolio and transaction management</b>
</p>

---

## 🔮 Future Enhancements

The project can be further extended with:

- 📈 Advanced technical indicators such as **RSI, MACD, and Moving Averages**
- 🤖 Experimentation with additional machine-learning models to improve prediction performance
- 📊 Advanced portfolio analytics and performance visualization
- 🔔 Real-time stock price alerts and personalized notifications
- 📰 Market-news integration and sentiment analysis
- 📱 Improved responsive experience for mobile devices
- ⚡ API caching and performance optimization for high-frequency requests
- 📉 Additional prediction evaluation metrics such as **Precision, Recall, F1-Score, and ROC-AUC**

---

## 👨‍💻 Author

### Ajay Borse

Full-Stack Developer | Python | Django | React | Java

<p align="left">

<a href="https://github.com/ajay-borse">
  <img src="https://img.shields.io/badge/GitHub-Ajay%20Borse-181717?style=for-the-badge&logo=github" alt="GitHub">
</a>

<a href="YOUR_LINKEDIN_URL">
  <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin" alt="LinkedIn">
</a>

</p>

---

## ⭐ Support

If you found **StockMind AI** useful or interesting, consider giving the repository a ⭐ on GitHub.

Your feedback and suggestions are always welcome.

---

<p align="center">
  <b>Built with ❤️ using Python, Django, React & modern web technologies.</b>
</p>

<p align="center">
  <i>StockMind AI — Turning market data into actionable insights.</i>
</p>
      
