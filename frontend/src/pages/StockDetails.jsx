import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import HistoricalChart from '../components/HistoricalChart';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';

const StockDetails = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [history, setHistory] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [watchlist, setWatchlist] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  
  // Modal State
  const { toast, showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, type: 'buy', symbol: symbol || '', availableShares: 0 });

  const openBuyModal = () => setModal({ isOpen: true, type: 'buy', symbol: symbol, availableShares: 0 });
  const openSellModal = (shares) => setModal({ isOpen: true, type: 'sell', symbol: symbol, availableShares: shares });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  
  const handleTransactionSuccess = (sym, type) => {
    closeModal();
    showToast(`✓ ${sym} ${type === 'buy' ? 'purchased' : 'sold'} successfully.`);
    // Refetch portfolio and transactions
    fetchData();
  };

  const fetchData = async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    
    try {
      const formattedSymbol = symbol.trim().toUpperCase();
      
      const [histRes, predRes, watchRes, portRes, txRes] = await Promise.allSettled([
        api.get(`stocks/history/?symbol=${formattedSymbol}`),
        api.post('stocks/predict/', { symbol: formattedSymbol }),
        api.get('stocks/watchlist/'),
        api.get('stocks/portfolio/analytics/'),
        api.get('stocks/transactions/')
      ]);

      if (histRes.status === 'rejected' && predRes.status === 'rejected') {
        throw new Error("Unable to load stock details. Please check the symbol and try again.");
      }

      if (histRes.status === 'fulfilled' && histRes.value.data.data) {
        const hData = histRes.value.data.data;
        if (hData.length > 0) {
          hData.sort((a, b) => new Date(a.date) - new Date(b.date));
          setHistory(hData);
        }
      }

      if (predRes.status === 'fulfilled') {
        setPrediction(predRes.value.data);
      }

      if (watchRes.status === 'fulfilled') {
        const isInWatchlist = watchRes.value.data.some(s => s.symbol === formattedSymbol);
        setWatchlist({ inWatchlist: isInWatchlist });
      }

      if (portRes.status === 'fulfilled') {
        const holding = portRes.value.data.holdings.find(h => h.symbol === formattedSymbol);
        setPortfolio(holding || null);
      }

      if (txRes.status === 'fulfilled') {
        const relevantTx = txRes.value.data.filter(tx => tx.symbol === formattedSymbol);
        setTransactions(relevantTx);
      }

    } catch {
      setError({
        title: "Stock Not Found",
        message: "We couldn't find market data for this symbol.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  const toggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (watchlist?.inWatchlist) {
        await api.delete(`stocks/watchlist/?symbol=${symbol.toUpperCase()}`);
        setWatchlist({ inWatchlist: false });
        showToast(`Removed from watchlist.`);
      } else {
        await api.post('stocks/watchlist/', { symbol: symbol.toUpperCase() });
        setWatchlist({ inWatchlist: true });
        showToast(`Added to watchlist.`);
      }
    } catch {
      showToast(`⚠️ Unable to update watchlist.`);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Helper formats
  const formatCurrency = (val) => val != null ? `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  const formatCompactVolume = (value) => {
    if (!value) return '-';
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toString();
  };
  const getProfitClass = (val) => val > 0 ? 'metric-positive' : val < 0 ? 'metric-negative' : 'metric-neutral';

  // Deriving current price details from history
  let currentPrice = null, change = null, changePct = null, latestData = null;
  if (history && history.length >= 2) {
    latestData = history[history.length - 1];
    const prevData = history[history.length - 2];
    currentPrice = latestData.close;
    change = currentPrice - prevData.close;
    changePct = (change / prevData.close) * 100;
  } else if (prediction) {
    currentPrice = prediction.current_price;
  }

  // AI Interpretation logic
  let aiDirection = "NEUTRAL", aiDirClass = "metric-neutral", aiDiff = 0, aiPct = 0;
  let aiIcon = "→", modelInterp = "";
  
  if (prediction && currentPrice) {
    aiDiff = prediction.predicted_price - currentPrice;
    aiPct = (aiDiff / currentPrice) * 100;
    if (aiPct > 0) {
      aiDirection = "UPWARD";
      aiDirClass = "metric-positive";
      aiIcon = "↑";
      modelInterp = "Based on the model prediction, the expected price is slightly above the current price, indicating a potential upward movement.";
    } else if (aiPct < 0) {
      aiDirection = "DOWNWARD";
      aiDirClass = "metric-negative";
      aiIcon = "↓";
      modelInterp = "Based on the model prediction, the expected price is slightly below the current price, indicating a potential downward movement.";
    } else {
      modelInterp = "The model prediction is close to the current price, indicating limited expected movement.";
    }
  }

  return (
    <div className="app-container page-transition">
      <Navbar />
      <main className="main-content">
        
        {loading && (
          <div className="skeleton-dashboard animate-fade-in" style={{ padding: '2rem 0' }}>
             <div className="skeleton-box" style={{ height: '120px', width: '100%', marginBottom: '2rem' }}></div>
             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="skeleton-box" style={{ height: '400px' }}></div>
                <div className="skeleton-box" style={{ height: '400px' }}></div>
             </div>
          </div>
        )}

        {error && !loading && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)' }}>
            <div className="error-icon" style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '700' }}>{error.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginBottom: '2rem' }}>{error.message}</p>
            <button className="primary-btn" onClick={() => navigate('/prediction')} style={{ maxWidth: '220px', margin: '0 auto' }}>
              Search another stock
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="stock-details-layout animate-fade-in stagger-1">
            
            {/* Header */}
            <div className="stock-details-header glass-card stagger-2" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
               <div>
                  <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{symbol.toUpperCase()}</h1>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>EQUITY • NSE</span>
               </div>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                  <button onClick={toggleWatchlist} disabled={watchlistLoading} className={`secondary-btn ${watchlist?.inWatchlist ? 'active-outline' : ''}`} style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
                     {watchlist?.inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                  </button>
                  <button onClick={openBuyModal} className="primary-btn" style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                     Buy Stock
                  </button>
               </div>
            </div>

            <div className="stock-details-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              
              {/* LEFT COLUMN: Chart & Pricing */}
              <div className="stock-details-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 2' }}>
                
                {/* Price Section */}
                {latestData && (
                  <div className="glass-card stagger-3" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(currentPrice)}</span>
                      <span className={getProfitClass(change)} style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                         {change > 0 ? '↑' : change < 0 ? '↓' : ''} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                       <div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open</div>
                         <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(latestData.open)}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High</div>
                         <div style={{ fontWeight: 600, color: 'var(--success-color)' }}>{formatCurrency(latestData.high)}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low</div>
                         <div style={{ fontWeight: 600, color: 'var(--error-color)' }}>{formatCurrency(latestData.low)}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume</div>
                         <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatCompactVolume(latestData.volume)}</div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Advanced Chart */}
                <HistoricalChart symbol={symbol.toUpperCase()} />
              </div>

              {/* RIGHT COLUMN: AI & User Data */}
              <div className="stock-details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 
                 {/* Portfolio Position */}
                 <div className="glass-card stagger-4" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Your Position</h3>
                    {portfolio ? (
                       <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                             <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{portfolio.total_quantity} shares</div>
                             </div>
                             <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Value</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{formatCurrency(portfolio.current_value)}</div>
                             </div>
                             <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Price</div>
                                <div style={{ fontWeight: 600 }}>{formatCurrency(portfolio.average_buy_price)}</div>
                             </div>
                             <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Return</div>
                                <div className={getProfitClass(portfolio.profit_loss_percentage)} style={{ fontWeight: 600 }}>
                                   {portfolio.profit_loss_percentage > 0 ? '+' : ''}{portfolio.profit_loss_percentage.toFixed(2)}%
                                </div>
                             </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button className="primary-btn" onClick={openBuyModal} style={{ padding: '0.5rem', flex: 1 }}>Buy More</button>
                             <button className="secondary-btn" onClick={() => openSellModal(portfolio.total_quantity)} style={{ padding: '0.5rem', flex: 1, color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>Sell</button>
                          </div>
                       </div>
                    ) : (
                       <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>You don't currently own this stock.</p>
                          <button className="primary-btn" onClick={openBuyModal} style={{ width: '100%' }}>Buy Stock</button>
                       </div>
                    )}
                 </div>

                 {/* AI Prediction Insight */}
                 {prediction && (
                    <div className="glass-card stagger-5" style={{ padding: '1.5rem' }}>
                       <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--primary-color)' }}>✦</span> AI Insight
                       </h3>
                       
                       <div className="ai-flow-visualization" style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
                          <div className="flow-node">
                             <div className="flow-label" style={{ fontSize: '0.7rem' }}>CURRENT</div>
                             <div className="flow-price" style={{ fontSize: '0.95rem' }}>{formatCurrency(currentPrice)}</div>
                          </div>
                          <div className="flow-arrow">
                             <div style={{ fontSize: '0.7rem' }}>AI</div>
                             <div className="flow-line"></div>
                          </div>
                          <div className="flow-node">
                             <div className="flow-label" style={{ fontSize: '0.7rem' }}>PREDICTED</div>
                             <div className="flow-price" style={{ fontSize: '0.95rem', color: aiDirection === 'UPWARD' ? 'var(--success-color)' : aiDirection === 'DOWNWARD' ? 'var(--error-color)' : 'var(--text-main)' }}>
                               {formatCurrency(prediction.predicted_price)}
                             </div>
                          </div>
                       </div>

                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIRECTION</div>
                             <div className={`insight-direction-badge direction-${aiDirection.toLowerCase()}`} style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                {aiIcon} {aiDirection}
                             </div>
                          </div>
                          <div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MOVEMENT</div>
                             <div className={aiDirClass} style={{ fontWeight: 600, marginTop: '0.25rem', fontSize: '0.9rem' }}>
                                {aiDiff > 0 ? '+' : ''}₹{Math.abs(aiDiff).toFixed(2)} ({aiPct > 0 ? '+' : ''}{Math.abs(aiPct).toFixed(2)}%)
                             </div>
                          </div>
                       </div>

                       <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {modelInterp}
                       </p>
                       <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          AI-generated prediction for informational purposes only. This is not financial advice.
                       </p>
                    </div>
                 )}

                 {/* Recent Transactions */}
                 <div className="glass-card stagger-6" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Recent Activity</h3>
                    {transactions.length > 0 ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {transactions.slice(0, 5).map(tx => (
                             <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                                <div>
                                   <div className={tx.transaction_type === 'BUY' ? 'metric-positive' : 'metric-negative'} style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                      {tx.transaction_type} {tx.quantity} shares
                                   </div>
                                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                      {new Date(tx.created_at).toLocaleDateString()}
                                   </div>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                                   {formatCurrency(tx.total_amount)}
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No transactions for this stock.</p>
                       </div>
                    )}
                 </div>

              </div>
            </div>
          </div>
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
};

export default StockDetails;
