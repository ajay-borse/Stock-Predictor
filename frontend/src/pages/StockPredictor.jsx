import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import HistoricalChart from '../components/HistoricalChart';
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
    "Analyzing market data",
    "Processing price history",
    "Running prediction model",
    "Generating prediction"
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
      setError("Please enter a valid stock symbol.");
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
        setError("Your session has expired. Please login again.");
      } else if (err.request && !err.response) {
        setError("Unable to connect to the prediction server.");
      } else {
        setError("Unable to generate prediction. Please try again.");
      }
    } finally {
      // Small artificial delay to allow animation to finish if API is too fast
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Derive metrics safely from the exact returned response
  let difference = 0;
  let percentageChange = 0;
  let direction = "NEUTRAL";
  let dirClass = "metric-neutral";

  if (prediction && prediction.current_price && prediction.predicted_price) {
    difference = prediction.predicted_price - prediction.current_price;
    percentageChange = (difference / prediction.current_price) * 100;

    if (prediction.predicted_price > prediction.current_price) {
      direction = "UPWARD";
      dirClass = "metric-positive";
    } else if (prediction.predicted_price < prediction.current_price) {
      direction = "DOWNWARD";
      dirClass = "metric-negative";
    }
  }

  const formatPrice = (val) => `₹${val.toFixed(2)}`;
  const formatDiff = (val) => `${val > 0 ? '+' : ''}₹${Math.abs(val).toFixed(2)}`;
  const formatPct = (val) => `${val > 0 ? '+' : ''}${Math.abs(val).toFixed(2)}%`;

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
          <h2>AI Stock Intelligence</h2>
          <p>Analyze the next market move with AI-powered prediction.</p>
        </section>

        <div className="glass-card">
          <form onSubmit={handlePredict}>
            <div className="search-wrapper">
              <input
                id="stock-symbol"
                type="text"
                className="premium-input"
                placeholder="Stock Symbol (e.g. TCS.NS)"
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
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>AI ANALYSIS IN PROGRESS</div>
              <div className="ai-scanline"></div>
              <div className="ai-step-text">
                {loadingMessages[loadingStep]}
              </div>
            </div>
          )}

          {prediction && !loading && (
            <div className="insight-card stagger-1">
              <div className="insight-header stagger-2">
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AI Prediction Result</div>
                  <div className="insight-symbol">{prediction.symbol}</div>
                </div>
              </div>
              
              {/* Premium AI Visualization connecting the prices */}
              <div className="ai-connection-wrapper stagger-3">
                <div className="ai-connection-line"></div>
                
                <div className="price-node-box">
                  <div className="price-label">Current Price</div>
                  <div className="price-value" style={{ fontSize: '1.75rem' }}>
                    {formatPrice(prediction.current_price)}
                  </div>
                </div>

                <div className="ai-node">
                  ✦ AI ✦
                </div>

                <div className="price-node-box">
                  <div className="price-label">Predicted Price</div>
                  <div className="price-value predicted" style={{ fontSize: '1.75rem' }}>
                    {formatPrice(prediction.predicted_price)}
                  </div>
                </div>
              </div>

              {/* Derived Metrics Grid */}
              <div className="derived-metrics-grid stagger-4">
                <div className="metric-card">
                  <div className="metric-label">Expected Price Change</div>
                  <div className={`metric-value ${dirClass}`}>
                    {formatDiff(difference)} <span style={{fontSize: '1rem', marginLeft: '0.25rem'}}>({formatPct(percentageChange)})</span>
                  </div>
                </div>
                
                <div className="metric-card stagger-5">
                  <div className="metric-label">Expected Direction</div>
                  <div className={`metric-value ${dirClass}`}>
                    {direction}
                  </div>
                </div>
              </div>
              
              <div className="disclaimer-text stagger-6">
                AI-generated prediction for informational purposes only. This is not financial advice.
              </div>
            </div>
          )}
        </div>
        
        {/* Historical Analytics Section */}
        {prediction && !loading && (
          <HistoricalChart symbol={prediction.symbol} />
        )}
      </main>
    </div>
  );
}

export default StockPredictor;
