import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SmartSearch from '../components/SmartSearch';
import api from '../utils/api';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // States
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Market Overview State
  const [marketOverview, setMarketOverview] = useState(null);
  const [marketError, setMarketError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);

  const fetchMarketOverview = async () => {
    setMarketLoading(true);
    setMarketError(false);
    try {
      const res = await api.get('stocks/market-overview/');
      setMarketOverview(res.data);
    } catch (err) {
      console.error("Market overview fetch error:", err);
      setMarketError(true);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
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

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchMarketOverview();
  }, []);

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
        {/* Welcome Header */}
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {getGreeting()}, {profile?.username || 'Investor'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Track today's market at a glance.</p>
          </div>
          
          <div className="search-widget" style={{ width: '100%', maxWidth: '400px' }}>
            <SmartSearch onSelect={handleAnalyze} />
          </div>
        </header>

        {/* MARKET OVERVIEW SECTION */}
        <section className="market-overview-section" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>Market Overview</h3>
            {marketOverview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: marketOverview.market_status === 'OPEN' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(100, 116, 139, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: marketOverview.market_status === 'OPEN' ? 'var(--success-color)' : 'var(--text-muted)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: marketOverview.market_status === 'OPEN' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                  Market {marketOverview.market_status === 'OPEN' ? 'Open' : 'Closed'}
                </span>
              </div>
            )}
          </div>

          {marketLoading ? (
            <div className="skeleton-dashboard animate-fade-in">
              <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '100px' }}></div>)}
              </div>
              <div className="skeleton-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="skeleton-box" style={{ height: '300px' }}></div>
                <div className="skeleton-box" style={{ height: '300px' }}></div>
              </div>
            </div>
          ) : marketError ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Market data is temporarily unavailable. Please try again shortly.</p>
              <button className="primary-btn" onClick={fetchMarketOverview} style={{ width: 'auto' }}>Retry</button>
            </div>
          ) : marketOverview ? (
            <>
              {/* Indices */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {marketOverview.indices.map(idx => (
                  <div key={idx.symbol} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>{idx.name}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{idx.price.toFixed(2)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={getProfitClass(idx.change)} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {idx.change > 0 ? '↑' : (idx.change < 0 ? '↓' : '')} {Math.abs(idx.change).toFixed(2)}
                      </span>
                      <span className={getProfitClass(idx.change_percent)} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        ({formatPercentage(idx.change_percent)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Movers & Popular */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                
                {/* Top Movers */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1rem', marginTop: 0 }}>Top Market Movers</h4>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>Gainers</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {marketOverview.gainers.map(stock => (
                          <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{stock.symbol.replace('.NS', '')}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(stock.price)}</div>
                            </div>
                            <div className="metric-positive" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {formatPercentage(stock.change_percent)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>Losers</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {marketOverview.losers.map(stock => (
                          <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{stock.symbol.replace('.NS', '')}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(stock.price)}</div>
                            </div>
                            <div className="metric-negative" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {formatPercentage(stock.change_percent)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Popular Stocks */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1rem', marginTop: 0 }}>Popular Stocks</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {marketOverview.popular_stocks.map(stock => (
                      <div key={stock.symbol} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{stock.symbol.replace('.NS', '')}</span>
                          <span className={getProfitClass(stock.change_percent)} style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatPercentage(stock.change_percent)}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{formatCurrency(stock.price)}</div>
                        <button className="secondary-btn" onClick={() => handleAnalyze(stock.symbol)} style={{ fontSize: '0.8rem', padding: '0.4rem', width: '100%' }}>Analyze</button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          ) : null}
        </section>


        {/* EXISTING DASHBOARD BOTTOM AREA */}
        {loading ? (
           <div className="skeleton-dashboard animate-fade-in">
             <div className="skeleton-box" style={{ height: '200px' }}></div>
           </div>
        ) : (
          <div className="dashboard-grid animate-fade-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column */}
            <div className="dashboard-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
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
            </div>

            {/* Right Column */}
            <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Watchlist Section */}
              <div className="glass-card stagger-4" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Your Watchlist</h3>
                  <button className="secondary-btn" onClick={() => navigate('/watchlist')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>View All</button>
                </div>

                {watchlist && watchlist.length > 0 ? (
                  <div className="watchlist-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {watchlist.slice(0, 4).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.symbol.replace('.NS', '')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <button className="secondary-btn" onClick={() => handleAnalyze(item.symbol)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>Analyze</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-compact" style={{ textAlign: 'center', padding: '2rem 0', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Your watchlist is empty.</p>
                    <button className="primary-btn" onClick={() => navigate('/prediction')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>Explore Stocks</button>
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
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{tx.symbol.replace('.NS', '')}</div>
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

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
