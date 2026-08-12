import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../App.css'; // Adjust path for CSS

function StockPredictor() {
  const [symbol, setSymbol] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handlePredict = async (e) => {
    e.preventDefault(); 
    
    if (!symbol.trim()) {
      setError("Please enter a valid stock symbol (e.g., INFY.NS)");
      return;
    }

    setError(null);
    setPrediction(null);
    setLoading(true);

    try {
      const response = await api.post('stocks/predict/', {
        symbol: symbol.trim().toUpperCase()
      });
      setPrediction(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (err.request && !err.response) {
        setError("Unable to connect to backend. Please check your connection or CORS settings.");
      } else {
        setError("Failed to fetch prediction.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>📈 AI Stock Predictor</h1>
        <button onClick={handleLogout} className="logout-btn" style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </nav>

      <main className="main-content">
        <section className="header-section">
          <h2>Predict Tomorrow's Market</h2>
          <p>
            Enter a stock symbol to get AI-powered price predictions for the next trading day. 
            Built with React and advanced machine learning algorithms.
          </p>
        </section>

        <div className="predictor-card">
          <form onSubmit={handlePredict}>
            <div className="input-group">
              <label htmlFor="stock-symbol">Stock Symbol</label>
              <div className="input-wrapper">
                <input
                  id="stock-symbol"
                  type="text"
                  className="symbol-input"
                  placeholder="e.g., INFY.NS, TCS.NS"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="predict-btn"
                  disabled={loading}
                >
                  {loading ? 'Predicting...' : 'Predict Now'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing market data for {symbol.toUpperCase()}...</p>
            </div>
          )}

          {prediction && !loading && (
            <div className="result-container">
              <div className="result-header">
                <h3>Prediction Results for</h3>
                <div className="stock-symbol">{prediction.symbol}</div>
              </div>
              
              <div className="price-cards">
                <div className="price-card">
                  <div className="price-label">Current Price</div>
                  <div className="price-value">
                    ₹{prediction.current_price.toFixed(2)}
                  </div>
                </div>
                
                <div className="price-card">
                  <div className="price-label">Tomorrow's Prediction</div>
                  <div className="price-value predicted">
                    ₹{prediction.predicted_price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StockPredictor;
