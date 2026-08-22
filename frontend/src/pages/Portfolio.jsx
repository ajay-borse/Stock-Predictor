import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';

const Portfolio = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast } = useToast();

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'buy',
    symbol: '',
    availableShares: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [portfolioRes, transactionsRes] = await Promise.all([
        api.get('stocks/portfolio/analytics'),
        api.get('stocks/transactions/')
      ]);
      setPortfolio(portfolioRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (!err.response) {
        setError("Unable to connect to the server.");
      } else {
        setError("Unable to load portfolio data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type, symbol, availableShares = 0) => {
    setModal({ isOpen: true, type, symbol, availableShares });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleTransactionSuccess = (symbol, type) => {
    closeModal();
    showToast(`✓ ${symbol} ${type === 'buy' ? 'purchased' : 'sold'} successfully.`);
    fetchData();
  };

  const handleAnalyze = (symbol) => {
    navigate('/', { state: { symbol } });
  };

  const scrollToTransactions = () => {
    const el = document.getElementById('transactions-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  // Safe destructuring
  const totalInvested = portfolio?.total_invested || 0;
  const currentValue = portfolio?.current_value || 0;
  const totalPL = portfolio?.total_profit_loss || 0;
  const totalPLPct = portfolio?.profit_loss_percentage || 0;
  const holdings = portfolio?.holdings || [];
  const bestPerformer = portfolio?.best_performer;
  const worstPerformer = portfolio?.worst_performer;

  // Performance Bar calculation
  const maxBarValue = Math.max(totalInvested, currentValue, 1);
  const investedWidth = `${(totalInvested / maxBarValue) * 100}%`;
  const currentWidth = `${(currentValue / maxBarValue) * 100}%`;

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <header className="portfolio-header-content animate-fade-in">
          <div className="portfolio-title-group">
            <h2>My Portfolio</h2>
            <p>Your AI-powered investment overview.</p>
          </div>
          <div className="ai-intelligence-badge">
            <div className="ai-status-dot"></div>
            Portfolio Intelligence
          </div>
        </header>

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#ef4444' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#fff' }}>{error}</h3>
            <button className="primary-btn" onClick={fetchData} style={{ maxWidth: '200px', margin: '1.5rem auto 0', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '120px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '180px' }}></div>
            <div className="skeleton-box" style={{ height: '300px' }}></div>
          </div>
        ) : !error && portfolio && (
          <>
            {/* 2. SUMMARY CARDS */}
            <div className="summary-grid-v2 animate-fade-in stagger-1">
              <div className="glass-card summary-card-v2">
                <span className="label">Total Invested</span>
                <span className="value">{formatCurrency(totalInvested)}</span>
                <span className="sub-text">Principal Amount</span>
              </div>
              <div className="glass-card summary-card-v2">
                <span className="label">Current Value</span>
                <span className="value">{formatCurrency(currentValue)}</span>
                <span className="sub-text">Market Valuation</span>
              </div>
              <div className="glass-card summary-card-v2">
                <span className="label">Total Profit / Loss</span>
                <span className={`value ${getProfitClass(totalPL)}`}>
                  {totalPL > 0 ? '+' : ''}{formatCurrency(totalPL).replace('₹-', '-₹')}
                </span>
                <span className="sub-text">Overall Earnings</span>
              </div>
              <div className="glass-card summary-card-v2">
                <span className="label">Return</span>
                <span className={`value ${getProfitClass(totalPLPct)}`}>
                  {formatPercentage(totalPLPct)}
                </span>
                <span className="sub-text">Net Yield</span>
              </div>
            </div>

            {/* 3. PORTFOLIO PERFORMANCE */}
            {holdings.length > 0 && (
              <div className="glass-card performance-section animate-fade-in stagger-2">
                <div className="performance-header">
                  <h3>Portfolio Performance</h3>
                  <div className="ai-status" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    <div className="ai-status-dot"></div> Live Analysis
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div className="performance-labels" style={{ marginBottom: '0.5rem' }}>
                      <span>Invested Value</span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className="performance-bar-wrapper">
                      <div className="performance-bar-fill" style={{ width: investedWidth, background: 'linear-gradient(90deg, #475569, #94a3b8)', boxShadow: 'none' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="performance-labels" style={{ marginBottom: '0.5rem' }}>
                      <span>Current Value</span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{formatCurrency(currentValue)}</span>
                    </div>
                    <div className="performance-bar-wrapper">
                      <div className="performance-bar-fill" style={{ width: currentWidth, background: totalPL >= 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. BEST & WORST PERFORMER */}
            {holdings.length > 0 && (bestPerformer || worstPerformer) && (
              <div className="performers-grid animate-fade-in stagger-3">
                {bestPerformer && (
                  <div className="performer-card best">
                    <div className="performer-info">
                      <p style={{ color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>Best Performer</p>
                      <h4>{bestPerformer.symbol}</h4>
                      <p>{formatCurrency(bestPerformer.current_price)}</p>
                    </div>
                    <div className="performer-metrics metric-positive">
                      <div className="pl">+{formatCurrency(bestPerformer.profit_loss)}</div>
                      <div className="ret">{formatPercentage(bestPerformer.profit_loss_percentage)}</div>
                    </div>
                  </div>
                )}
                {worstPerformer && (
                  <div className="performer-card worst">
                    <div className="performer-info">
                      <p style={{ color: 'var(--error-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>Worst Performer</p>
                      <h4>{worstPerformer.symbol}</h4>
                      <p>{formatCurrency(worstPerformer.current_price)}</p>
                    </div>
                    <div className="performer-metrics metric-negative">
                      <div className="pl">{formatCurrency(worstPerformer.profit_loss).replace('₹-', '-₹')}</div>
                      <div className="ret">{formatPercentage(worstPerformer.profit_loss_percentage)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. HOLDINGS */}
            <div className="holdings-section animate-fade-in stagger-4">
              <h3>Your Holdings</h3>
              
              {holdings.length === 0 ? (
                /* 7. EMPTY PORTFOLIO */
                <div className="glass-card empty-portfolio-premium">
                  <div className="icon">✦</div>
                  <h3>Your portfolio is empty.</h3>
                  <p>Start building your investment portfolio with AI-powered market insights and predictive analytics.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="primary-btn" style={{ maxWidth: '200px' }} onClick={() => navigate('/')}>Explore Stocks</button>
                    <button className="secondary-btn" onClick={() => navigate('/watchlist')}>View Watchlist</button>
                  </div>
                </div>
              ) : (
                <div className="holdings-list">
                  {holdings.map((holding) => (
                    <div key={holding.id || holding.symbol} className="holding-row">
                      <div className="holding-main">
                        <span className="holding-symbol">{holding.symbol}</span>
                        <span className="holding-quantity">{holding.quantity} Shares</span>
                      </div>
                      
                      <div className="holding-metrics-grid">
                        <div className="holding-metric">
                          <span className="lbl">Avg Buy Price</span>
                          <span className="val">{formatCurrency(holding.average_buy_price)}</span>
                        </div>
                        <div className="holding-metric">
                          <span className="lbl">Current Price</span>
                          <span className="val">{formatCurrency(holding.current_price)}</span>
                        </div>
                        <div className="holding-metric">
                          <span className="lbl">Invested</span>
                          <span className="val">{formatCurrency(holding.invested_amount)}</span>
                        </div>
                        <div className="holding-metric">
                          <span className="lbl">Current Value</span>
                          <span className="val">{formatCurrency(holding.current_value)}</span>
                        </div>
                        <div className="holding-metric">
                          <span className="lbl">P/L</span>
                          <span className={`val ${getProfitClass(holding.profit_loss)}`}>
                            {holding.profit_loss > 0 ? '+' : ''}{formatCurrency(holding.profit_loss).replace('₹-', '-₹')}
                          </span>
                        </div>
                        <div className="holding-metric">
                          <span className="lbl">Return</span>
                          <span className={`val ${getProfitClass(holding.profit_loss_percentage)}`}>
                            {formatPercentage(holding.profit_loss_percentage)}
                          </span>
                        </div>
                      </div>

                      <div className="holding-actions-group">
                        <button className="secondary-btn" onClick={() => handleAnalyze(holding.symbol)}>View</button>
                        <button className="buy-btn" onClick={() => openModal('buy', holding.symbol)}>Buy</button>
                        <button className="sell-btn" onClick={() => openModal('sell', holding.symbol, holding.quantity)}>Sell</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. QUICK ACTIONS */}
            <div className="quick-actions-section animate-fade-in stagger-5" style={{ marginTop: '3rem' }}>
              <h3>Quick Actions</h3>
              <div className="quick-actions-row">
                <button className="action-card-btn" onClick={() => navigate('/')}>+ Buy Stock</button>
                <button className="action-card-btn" onClick={() => navigate('/watchlist')}>View Watchlist</button>
                <button className="action-card-btn" onClick={() => navigate('/')}>AI Prediction</button>
                <button className="action-card-btn" onClick={scrollToTransactions}>Transactions</button>
              </div>
            </div>

            {/* TRANSACTIONS - Kept backward compatible */}
            <section className="portfolio-section animate-fade-in stagger-6" id="transactions-section" style={{ marginTop: '3rem' }}>
              <h3>Transaction History</h3>
              {!transactions || transactions.length === 0 ? (
                <div className="empty-state glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>No transactions yet.</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Your buy and sell activity will appear here.</p>
                </div>
              ) : (
                <div className="transactions-list glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                  <div className="transaction-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <span>Date</span>
                    <span>Stock</span>
                    <span>Type</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {transactions.map((tx) => (
                    <div key={tx.id} className="transaction-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span className="tx-symbol" style={{ fontWeight: 600, color: '#fff' }}>{tx.symbol}</span>
                      <span className={`tx-type ${tx.type.toLowerCase()}`} style={{ color: tx.type.toLowerCase() === 'buy' ? 'var(--success-color)' : 'var(--error-color)', fontSize: '0.9rem', fontWeight: 500 }}>{tx.type}</span>
                      <span style={{ fontSize: '0.9rem' }}>{tx.quantity}</span>
                      <span style={{ fontSize: '0.9rem' }}>{formatCurrency(tx.price)}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatCurrency(tx.total_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
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

export default Portfolio;
