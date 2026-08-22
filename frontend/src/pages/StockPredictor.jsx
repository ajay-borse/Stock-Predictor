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
            <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)' }}>
              <div className="error-icon" style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#ef4444', textShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}>⚠️</div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: '#fff', fontWeight: '700' }}>{error.title}</h3>
              <p style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '1rem', fontWeight: '500' }}>{error.message}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>{error.subMessage}</p>
              <button 
                className="primary-btn" 
                onClick={() => {
                  setError(null);
                  setSymbol('');
                }}
                style={{ maxWidth: '220px', margin: '0 auto', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)', color: '#fff' }}
              >
                {error.buttonText}
              </button>
            </div>
          )}

          {loading && (
            <div className="ai-loading-container animate-fade-in" style={{ margin: '2rem 0', textAlign: 'center' }}>
              <div className="ai-scanline"></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spinRing 1s linear infinite' }}></div>
                <div className="ai-step-text" style={{ fontSize: '1rem' }}>
                  {loadingMessages[0]}
                </div>
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
                    Buy Stock
                  </button>
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
