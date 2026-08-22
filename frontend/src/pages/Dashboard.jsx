import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchSymbol, setSearchSymbol] = useState('');
  
  // States
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [popularStocks, setPopularStocks] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Popular symbols to track
  const POPULAR_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch authenticated data
        const [portRes, watchRes, transRes] = await Promise.allSettled([
          api.get('stocks/portfolio/analytics/'),
          api.get('stocks/watchlist/'),
          api.get('stocks/transactions/')
        ]);

        if (portRes.status === 'fulfilled') setPortfolio(portRes.value.data);
        if (watchRes.status === 'fulfilled') setWatchlist(watchRes.value.data);
        if (transRes.status === 'fulfilled') setTransactions(transRes.value.data);

        // Fetch market overview data (popular stocks history for today's change)
        const marketData = await Promise.allSettled(
          POPULAR_SYMBOLS.map(sym => api.get(`stocks/history/?symbol=${sym}`))
        );

        const processedStocks = marketData.map((res, index) => {
          const sym = POPULAR_SYMBOLS[index];
          if (res.status === 'fulfilled' && res.value.data?.data?.length >= 2) {
            const history = res.value.data.data;
            const latest = history[history.length - 1];
            const prev = history[history.length - 2];
            const change = latest.close - prev.close;
            const pctChange = (change / prev.close) * 100;
            return {
              symbol: sym,
              price: latest.close,
              change,
              pctChange
            };
          }
          return { symbol: sym, price: null, change: null, pctChange: null };
        });

        setPopularStocks(processedStocks.filter(s => s.price !== null));

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      navigate('/prediction', { state: { symbol: searchSymbol.trim().toUpperCase() } });
    }
  };

  const handleAnalyze = (symbol) => {
    navigate('/prediction', { state: { symbol } });
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0.00';
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (val) => {
    if (val === undefined || val === null) return '0.00%';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const getProfitClass = (val) => {
    if (val > 0) return 'metric-positive';
    if (val < 0) return 'metric-negative';
    return 'metric-neutral';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* 1. Welcome Header */}
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-title-group">
            <h2>AI Stock Intelligence</h2>
            <p>Track markets, analyze stocks and manage your portfolio.</p>
          </div>
          <div className="ai-intelligence-badge">
            <div className="ai-status-dot"></div>
            System Active
          </div>
        </header>

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in" style={{ marginTop: '2rem' }}>
            <div className="skeleton-box" style={{ height: '80px', marginBottom: '2rem' }}></div>
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '120px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '300px', marginTop: '2rem' }}></div>
          </div>
        ) : (
          <div className="dashboard-grid animate-fade-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* 3. Stock Search */}
            <div className="glass-card search-widget stagger-2" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
              <form onSubmit={handleSearch}>
                <div className="search-wrapper">
                  <input
                    type="text"
                    className="premium-input"
                    placeholder="Search stock symbol to analyze (e.g. TCS.NS)"
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button type="submit" className="primary-btn" style={{ whiteSpace: 'nowrap', width: 'auto', padding: '1rem 2rem' }}>
                    Quick Analyze
                  </button>
                </div>
              </form>
            </div>

            {/* Left Column */}
            <div className="dashboard-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 5. Portfolio Summary */}
              <div className="glass-card stagger-3" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Portfolio Summary</h3>
                  <button className="secondary-btn" onClick={() => navigate('/portfolio')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View Portfolio</button>
                </div>
                
                {portfolio && portfolio.holdings && portfolio.holdings.length > 0 ? (
                  <div className="summary-grid-v2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="summary-card-v2" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                      <span className="label">Current Value</span>
                      <span className="value" style={{ fontSize: '1.25rem' }}>{formatCurrency(portfolio.current_value)}</span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                      <span className="label">Total P/L</span>
                      <span className={`value ${getProfitClass(portfolio.total_profit_loss)}`} style={{ fontSize: '1.25rem' }}>
                        {formatCurrency(portfolio.total_profit_loss).replace('₹-', '-₹')}
                      </span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                      <span className="label">Invested</span>
                      <span className="value" style={{ fontSize: '1.25rem' }}>{formatCurrency(portfolio.total_invested)}</span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                      <span className="label">Return</span>
                      <span className={`value ${getProfitClass(portfolio.profit_loss_percentage)}`} style={{ fontSize: '1.25rem' }}>
                        {formatPercentage(portfolio.profit_loss_percentage)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Your portfolio is currently empty.</p>
                    <button className="primary-btn" onClick={() => navigate('/prediction')} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginTop: '0.5rem', width: 'auto' }}>Start Investing</button>
                  </div>
                )}
              </div>

              {/* 4. Popular Stocks / Market Overview */}
              <div className="glass-card stagger-4" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1.5rem' }}>Market Overview</h3>
                {popularStocks.length > 0 ? (
                  <div className="popular-stocks-list">
                    {popularStocks.map(stock => (
                      <div key={stock.symbol} className="popular-stock-item" onClick={() => handleAnalyze(stock.symbol)} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{stock.symbol}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Popular</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{formatCurrency(stock.price)}</div>
                          <div className={getProfitClass(stock.pctChange)} style={{ fontSize: '0.85rem' }}>
                            {formatPercentage(stock.pctChange)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>Market data currently unavailable.</p>
                )}
              </div>
              
              {/* 8. AI Market Insight */}
              <div className="glass-card stagger-5" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.6))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧠</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#a5b4fc' }}>AI Market Insight</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  Our AI models process historical data, volume trends, and momentum indicators to forecast potential stock movements. Use the quick analyze tool to run deep neural analysis on specific equities before making investment decisions.
                </p>
              </div>

            </div>

            {/* Right Column */}
            <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 6. Watchlist Preview */}
              <div className="glass-card stagger-4" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Watchlist Preview</h3>
                  <button className="secondary-btn" onClick={() => navigate('/watchlist')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>Full Watchlist</button>
                </div>

                {watchlist && watchlist.length > 0 ? (
                  <div className="watchlist-compact-list">
                    {watchlist.slice(0, 4).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>★</span>
                          <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{item.symbol}</span>
                        </div>
                        <button className="secondary-btn" onClick={() => handleAnalyze(item.symbol)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: 'none', background: 'rgba(255,255,255,0.1)' }}>Analyze</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No stocks in watchlist.</p>
                  </div>
                )}
              </div>

              {/* 7. Recent Transactions */}
              <div className="glass-card stagger-5" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Recent Transactions</h3>
                  <button className="secondary-btn" onClick={() => navigate('/transactions')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View All</button>
                </div>

                {transactions && transactions.length > 0 ? (
                  <div className="transactions-compact-list">
                    {transactions.slice(0, 4).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{tx.symbol}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={tx.transaction_type === 'BUY' ? 'metric-positive' : 'metric-negative'} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {tx.transaction_type} {tx.quantity}
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{formatCurrency(tx.total_amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No recent transactions.</p>
                  </div>
                )}
              </div>

              {/* 9. Quick Actions */}
              <div className="glass-card stagger-6" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1.5rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="action-card-btn" onClick={() => navigate('/prediction')} style={{ textAlign: 'left', padding: '1rem', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>🔮</span> AI Prediction
                  </button>
                  <button className="action-card-btn" onClick={() => navigate('/portfolio')} style={{ textAlign: 'left', padding: '1rem', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>💼</span> View Portfolio
                  </button>
                  <button className="action-card-btn" onClick={() => navigate('/watchlist')} style={{ textAlign: 'left', padding: '1rem', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>⭐</span> Watchlist
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
