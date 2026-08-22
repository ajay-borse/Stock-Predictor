import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import HistoricalChart from '../components/HistoricalChart';
import Navbar from '../components/Navbar';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';
import '../App.css';

function StockPredictor() {
  const [symbol, setSymbol] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [loadingMessages] = useState([
    "Analyzing stock..."
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Global Buy Modal State
  const { toast, showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, type: 'buy', symbol: '', availableShares: 0 });

  const openBuyModal = (sym) => setModal({ isOpen: true, type: 'buy', symbol: sym, availableShares: 0 });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  const handleTransactionSuccess = (sym, type) => {
    closeModal();
    showToast(`✓ ${sym} purchased successfully.`);
  };

  useEffect(() => {
    if (location.state?.symbol) {
      const sym = location.state.symbol;
      setSymbol(sym);
      executePrediction(sym);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    // simplified loading without interval as requested
  }, [loading]);

  const checkWatchlistStatus = async (sym) => {
    try {
      const res = await api.get('stocks/watchlist/');
      const isSaved = res.data.some(s => s.symbol === sym);
      setInWatchlist(isSaved);
    } catch (err) {
      console.error("Failed to check watchlist status", err);
    }
  };

  const toggleWatchlist = async () => {
    if (!prediction) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`stocks/watchlist/?symbol=${prediction.symbol}`);
        setInWatchlist(false);
      } else {
        await api.post('stocks/watchlist/', { symbol: prediction.symbol });
        setInWatchlist(true);
      }
    } catch (err) {
      console.error("Failed to update watchlist", err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const executePrediction = async (sym) => {
    if (!sym.trim()) {
      setError({
        title: "Enter a stock symbol",
        message: "Please enter a stock symbol to continue.",
        buttonText: null
      });
      return;
    }

    setError(null);
    setPrediction(null);
    setLoading(true);

    try {
      const response = await api.post('stocks/predict/', {
        symbol: sym.trim().toUpperCase()
      });

      // Validate the response data to prevent frontend crashes
      if (!response || !response.data || typeof response.data !== 'object' || !response.data.symbol || response.data.current_price === undefined || response.data.predicted_price === undefined) {
        throw new Error("Invalid or missing prediction data");
      }

      setPrediction(response.data);
      checkWatchlistStatus(response.data.symbol);
    } catch (err) {
      setError({
        title: "Oops! Something went wrong",
        message: "Please try again later.",
        subMessage: "We couldn't find or load this stock. Please check the stock symbol and try again.",
        buttonText: "Try Again"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault(); 
    executePrediction(symbol);
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

  let movementClass = "movement-small";
  let movementText = "Very small";
  const absPct = Math.abs(percentageChange);
  if (absPct > 3) {
    movementClass = "movement-large";
    movementText = "Larger";
  } else if (absPct >= 1) {
    movementClass = "movement-moderate";
    movementText = "Moderate";
  }

  let aiExpects = "";
  let aiComparison = "";
  let modelInterp = "";
  let directionIcon = "";

  if (direction === "UPWARD") {
    aiExpects = "AI expects a potential upward movement based on the current prediction.";
    aiComparison = "The predicted price is higher than the current market price.";
    modelInterp = "Based on the model prediction, the expected price is slightly above the current price, indicating a potential upward movement.";
    directionIcon = "↑";
  } else if (direction === "DOWNWARD") {
    aiExpects = "AI expects a potential downward movement based on the current prediction.";
    aiComparison = "The predicted price is lower than the current market price.";
    modelInterp = "Based on the model prediction, the expected price is slightly below the current price, indicating a potential downward movement.";
    directionIcon = "↓";
  } else {
    aiExpects = "AI expects limited price movement.";
    aiComparison = "The predicted price is approximately equal to the current market price.";
    modelInterp = "The model prediction is close to the current price, indicating limited expected movement.";
    directionIcon = "→";
  }

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <section className="hero-section">
          <h2>AI Stock Intelligence</h2>
          <p>Analyze the next market move with AI-powered prediction.</p>
        </section>

        <div className="glass-card">
          {!error && (
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
          )}

          {error && (
            <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)' }}>
              <div className="error-icon" style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '700' }}>{error.title}</h3>
              <p style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '1rem', fontWeight: '500' }}>{error.message}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>{error.subMessage}</p>
              <button 
                className="primary-btn" 
                onClick={() => {
                  setError(null);
                  setSymbol('');
                }}
                style={{ maxWidth: '220px', margin: '0 auto', background: 'var(--error-color)', color: '#fff' }}
              >
                {error.buttonText}
              </button>
            </div>
          )}

          {loading && (
            <div className="ai-loading-container animate-fade-in" style={{ margin: '2rem 0', textAlign: 'center' }}>
              <div className="skeleton-box" style={{ height: '30px', width: '200px', margin: '0 auto 1rem auto' }}></div>
              <div className="skeleton-box" style={{ height: '20px', width: '150px', margin: '0 auto 2rem auto' }}></div>
              <div className="skeleton-box" style={{ height: '300px', width: '100%' }}></div>
            </div>
          )}

          {prediction && !loading && (
            <div className="ai-insight-card animate-fade-in stagger-1">
              <div className="ai-insight-header stagger-2">
                <div style={{ flex: 1 }}>
                  <div className="ai-insight-title">✦ AI INSIGHT</div>
                  <div className="ai-insight-subtitle">Understanding the model's prediction</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={toggleWatchlist} 
                    disabled={watchlistLoading}
                    className={`watchlist-btn ${inWatchlist ? 'active' : ''}`}
                  >
                    {inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
                  </button>
                  <button 
                    className="primary-btn buy-submit" 
                    onClick={() => openBuyModal(prediction.symbol)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    Buy
                  </button>
                </div>
              </div>

              <div className="ai-insight-grid stagger-3">
                <div>
                  <div className="insight-section-title">EXPECTED DIRECTION</div>
                  <div className={`insight-direction-badge direction-${direction.toLowerCase()}`}>
                    {directionIcon} {direction}
                  </div>
                </div>
                <div>
                  <div className="insight-section-title">EXPECTED MOVEMENT</div>
                  <div className={`insight-movement ${dirClass}`}>
                    {formatDiff(difference)} <span style={{fontSize: '1rem', marginLeft: '0.25rem'}}>({formatPct(percentageChange)})</span>
                  </div>
                </div>
              </div>

              <div className="ai-flow-visualization stagger-4">
                <div className="flow-node">
                  <div className="flow-label">CURRENT PRICE</div>
                  <div className="flow-price">{formatPrice(prediction.current_price)}</div>
                </div>
                <div className="flow-arrow">
                  <div>AI</div>
                  <div className="flow-line"></div>
                </div>
                <div className="flow-node">
                  <div className="flow-label">PREDICTED PRICE</div>
                  <div className="flow-price" style={{ color: direction === 'UPWARD' ? 'var(--success-color)' : direction === 'DOWNWARD' ? 'var(--error-color)' : 'var(--text-main)', borderColor: 'var(--card-border)' }}>
                    {formatPrice(prediction.predicted_price)}
                  </div>
                </div>
              </div>

              <div className="stagger-5">
                <div className="insight-section-title">MODEL INTERPRETATION</div>
                <div className="insight-interpretation">
                  <p style={{ marginBottom: '0.5rem' }}>{aiExpects}</p>
                  <p style={{ marginBottom: '1rem' }}>{aiComparison}</p>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{modelInterp}</p>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    Expected movement: <span className={movementClass}>{movementText}</span>
                  </p>
                </div>
              </div>

              <div className="insight-disclaimer stagger-6">
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

      <TransactionModal 
        isOpen={modal.isOpen} 
        type={modal.type} 
        symbol={modal.symbol} 
        availableShares={modal.availableShares} 
        onClose={closeModal} 
        onSuccess={handleTransactionSuccess} 
      />

      <Toast toast={toast} />
    </div>
  );
}

export default StockPredictor;
