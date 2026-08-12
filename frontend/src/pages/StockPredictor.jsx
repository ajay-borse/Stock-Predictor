import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../App.css';

function StockPredictor() {
  const [symbol, setSymbol] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Loading sequence steps for visual effect
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Fetching market data...",
    "Analyzing price history...",
    "Calculating indicators...",
    "Running prediction model...",
    "Generating insight..."
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingMessages.length - 1) return prev + 1;
          return prev;
        });
      }, 800); // cycle through steps every 800ms
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      // Small artificial delay to allow animation to finish if API is too fast
      setTimeout(() => setLoading(false), 500);
    }
  };

  const isBullish = prediction && (prediction.predicted_price > prediction.current_price);
  
  // Calculate percentage change safely
  let percentageChange = 0;
  if (prediction && prediction.current_price > 0) {
    percentageChange = ((prediction.predicted_price - prediction.current_price) / prediction.current_price) * 100;
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <h1>StockMind AI</h1>
          <div className="ai-status">
            <div className="ai-status-dot"></div>
            System Online
          </div>
        </div>
        
        <div className="nav-links">
          <a href="#" className="active">Dashboard</a>
          <a href="#">Prediction</a>
          <a href="#">Portfolio</a>
          <a href="#">Transactions</a>
          <a href="#">Profile</a>
        </div>

        <button onClick={handleLogout} className="secondary-btn">
          Logout
        </button>
      </nav>

      <main className="main-content">
        <section className="hero-section">
          <h2>Good evening.</h2>
          <p>Your AI market intelligence is ready.</p>
        </section>

        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-color)', letterSpacing: '0.1em', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              AI Stock Prediction
            </h3>
          </div>

          <form onSubmit={handlePredict}>
            <div className="search-wrapper">
              <input
                id="stock-symbol"
                type="text"
                className="premium-input"
                placeholder="Enter a stock symbol (e.g. TCS.NS)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={loading}
                style={{ textTransform: 'uppercase' }}
              />
              <button 
                type="submit" 
                className="primary-btn"
                disabled={loading}
              >
                Analyze with AI
              </button>
            </div>
          </form>

          {error && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error-color)', borderRadius: '4px', color: 'var(--error-color)', fontSize: '0.95rem' }}>
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="ai-loading-container">
              <div className="ai-scanline"></div>
              <div className="ai-step-text">
                {loadingMessages[loadingStep]}
              </div>
            </div>
          )}

          {prediction && !loading && (
            <div className="insight-card">
              <div className="insight-header">
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AI Market Insight</div>
                  <div className="insight-symbol">{prediction.symbol}</div>
                </div>
                <div className={`insight-badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}`}>
                  {isBullish ? '▲ BULLISH' : '▼ BEARISH'} {Math.abs(percentageChange).toFixed(2)}%
                </div>
              </div>
              
              <div className="price-grid">
                <div className="price-item">
                  <div className="price-label">Current Price</div>
                  <div className="price-value">
                    ₹{prediction.current_price.toFixed(2)}
                  </div>
                </div>
                
                <div className="price-item">
                  <div className="price-label">Predicted Price</div>
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
