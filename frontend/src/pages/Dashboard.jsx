import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchSymbol, setSearchSymbol] = useState('');
  
  // States
  const [profile, setProfile] = useState(null);
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
        const [profRes, portRes, watchRes, transRes] = await Promise.allSettled([
          api.get('profile/'),
          api.get('stocks/portfolio/analytics/'),
          api.get('stocks/watchlist/'),
          api.get('stocks/transactions/')
        ]);

        if (profRes.status === 'fulfilled') setProfile(profRes.value.data);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* 1. Welcome Header */}
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600' }}>
              {getGreeting()}, {profile?.username || 'Investor'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Your AI-powered market overview</p>
          </div>
          
          <div className="search-widget" style={{ width: '100%', maxWidth: '400px' }}>
            <form onSubmit={handleSearch}>
              <div className="search-wrapper" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="premium-input"
                  placeholder="Search stocks..."
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" className="primary-btn" style={{ whiteSpace: 'nowrap', width: 'auto', padding: '0.5rem 1.5rem' }}>
                  Analyze
                </button>
              </div>
            </form>
          </div>
        </header>

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '120px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '300px', marginTop: '2rem' }}></div>
          </div>
        ) : (
          <div className="dashboard-grid animate-fade-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column */}
            <div className="dashboard-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Market Overview */}
              <div className="glass-card stagger-2" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Market Overview</h3>
                {popularStocks.length > 0 ? (
                  <div className="popular-stocks-list" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {popularStocks.map(stock => (
                      <div key={stock.symbol} className="popular-stock-item" onClick={() => handleAnalyze(stock.symbol)} style={{ minWidth: '140px', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--card-border)', transition: 'all 0.2s ease' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{stock.symbol.replace('.NS', '')}</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '1.1rem' }}>{formatCurrency(stock.price)}</div>
                        <div className={getProfitClass(stock.pctChange)} style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '0.25rem' }}>
                          {formatPercentage(stock.pctChange)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Market data currently unavailable.</p>
                )}
              </div>

              {/* Portfolio Snapshot */}
              <div className="glass-card stagger-3" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Portfolio Snapshot</h3>
                  <button className="secondary-btn" onClick={() => navigate('/portfolio')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View Portfolio</button>
                </div>
                
                {portfolio && portfolio.holdings && portfolio.holdings.length > 0 ? (
                  <div className="summary-grid-v2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="summary-card-v2" style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Value</span>
                      <span className="value" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(portfolio.current_value)}</span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Invested</span>
                      <span className="value" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(portfolio.total_invested)}</span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today's P/L</span>
                      <span className={`value ${getProfitClass(portfolio.total_profit_loss)}`} style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        {formatCurrency(portfolio.total_profit_loss).replace('₹-', '-₹')}
                      </span>
                    </div>
                    <div className="summary-card-v2" style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Overall Return</span>
                      <span className={`value ${getProfitClass(portfolio.profit_loss_percentage)}`} style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        {formatPercentage(portfolio.profit_loss_percentage)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '2rem 0', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Your portfolio is currently empty.</p>
                    <button className="primary-btn" onClick={() => navigate('/prediction')} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>Start Investing</button>
                  </div>
                )}
              </div>
              
              {/* Market Insights */}
              <div className="glass-card stagger-5" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>AI Market Insight</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  Our AI models process historical data, volume trends, and momentum indicators to forecast potential stock movements. Use the quick analyze tool to run deep neural analysis on specific equities before making investment decisions.
                </p>
              </div>

            </div>

            {/* Right Column */}
            <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Watchlist Preview */}
              <div className="glass-card stagger-4" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Watchlist</h3>
                  <button className="secondary-btn" onClick={() => navigate('/watchlist')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View Watchlist</button>
                </div>

                {watchlist && watchlist.length > 0 ? (
                  <div className="watchlist-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {watchlist.slice(0, 4).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.symbol}</span>
                        </div>
                        <button className="secondary-btn" onClick={() => handleAnalyze(item.symbol)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>Analyze</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '2rem 0', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No stocks in watchlist.</p>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="glass-card stagger-5" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Recent Transactions</h3>
                  <button className="secondary-btn" onClick={() => navigate('/transactions')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View All</button>
                </div>

                {transactions && transactions.length > 0 ? (
                  <div className="transactions-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {transactions.slice(0, 4).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{tx.symbol}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={tx.transaction_type === 'BUY' ? 'metric-positive' : 'metric-negative'} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {tx.transaction_type} {tx.quantity}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.1rem' }}>{formatCurrency(tx.total_amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '2rem 0', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No recent transactions.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="glass-card stagger-6" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button className="secondary-btn" onClick={() => navigate('/prediction')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Analyze Stock
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/portfolio')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    Portfolio
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/watchlist')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Watchlist
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/transactions')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Transactions
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
