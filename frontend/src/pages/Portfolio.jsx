import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';
import '../App.css';

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
        api.get('stocks/portfolio/analytics/'),
        api.get('stocks/transactions/')
      ]);
      setPortfolio(portfolioRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (!err.response) {
        setError("Unable to connect to the server. Please check your network.");
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

  const totalInvested = portfolio?.total_invested || 0;
  const currentValue = portfolio?.current_value || 0;
  const totalPL = portfolio?.total_profit_loss || 0;
  const totalPLPct = portfolio?.profit_loss_percentage || 0;
  const holdings = portfolio?.holdings || [];

  const maxBarValue = Math.max(totalInvested, currentValue, 1);
  const investedWidth = `${(totalInvested / maxBarValue) * 100}%`;
  const currentWidth = `${(currentValue / maxBarValue) * 100}%`;

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2.5rem', alignItems: 'flex-start' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>Portfolio Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>Your comprehensive investment dashboard.</p>
          </div>
        </header>

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)', marginBottom: '2rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Unable to load portfolio</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
            <button className="primary-btn" onClick={fetchData} style={{ maxWidth: '200px', margin: '0 auto', background: 'var(--error-color)' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '300px', marginTop: '2rem', borderRadius: '16px' }}></div>
          </div>
        ) : !error && portfolio && (
          <>
            {/* QUICK ACTIONS */}
            <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button className="secondary-btn" onClick={() => navigate('/')} style={{ flex: '1', minWidth: '150px', background: 'var(--bg-surface)' }}>🔍 Search Stocks</button>
              <button className="secondary-btn" onClick={() => navigate('/prediction')} style={{ flex: '1', minWidth: '150px', background: 'var(--bg-surface)' }}>🤖 AI Prediction</button>
              <button className="secondary-btn" onClick={() => navigate('/watchlist')} style={{ flex: '1', minWidth: '150px', background: 'var(--bg-surface)' }}>📋 Watchlist</button>
              <button className="secondary-btn" onClick={() => navigate('/transactions')} style={{ flex: '1', minWidth: '150px', background: 'var(--bg-surface)' }}>📊 Transactions</button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>💰</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Invested</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(totalInvested)}</div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>💼</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Current Value</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(currentValue)}</div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: totalPL >= 0 ? 'rgba(22, 163, 74, 0.03)' : 'rgba(220, 38, 38, 0.03)', border: `1px solid ${totalPL >= 0 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: totalPL >= 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{totalPL >= 0 ? '📈' : '📉'}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Profit/Loss</span>
                </div>
                <div className={getProfitClass(totalPL)} style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {totalPL > 0 ? '+' : ''}{formatCurrency(totalPL).replace('₹-', '-₹')}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: totalPLPct >= 0 ? 'rgba(22, 163, 74, 0.03)' : 'rgba(220, 38, 38, 0.03)', border: `1px solid ${totalPLPct >= 0 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: totalPLPct >= 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{totalPLPct >= 0 ? '🎯' : '🔻'}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Return %</span>
                </div>
                <div className={getProfitClass(totalPLPct)} style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {formatPercentage(totalPLPct)}
                </div>
              </div>
            </div>

            {/* PORTFOLIO PERFORMANCE */}
            {holdings.length > 0 && (
              <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2.5rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: '600' }}>Portfolio Performance</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Invested Value</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.05rem' }}>{formatCurrency(totalInvested)}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: investedWidth, height: '100%', background: 'var(--text-muted)', borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Current Value</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.05rem' }}>{formatCurrency(currentValue)}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: currentWidth, height: '100%', background: totalPL >= 0 ? 'var(--success-color)' : 'var(--error-color)', borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HOLDINGS */}
            <div className="animate-fade-in">
              <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: '600' }}>Your Holdings</h3>
              
              {holdings.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-surface)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>📈</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '600' }}>Your portfolio is empty</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>Start building your investment portfolio with AI insights.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="primary-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/')}>Explore Stocks</button>
                    <button className="secondary-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/watchlist')}>View Watchlist</button>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: 0, background: 'var(--bg-surface)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="table-responsive">
                    <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--card-border)' }}>
                        <tr>
                          <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Stock</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Qty</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Avg Buy</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Current Price</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Invested</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Current Value</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>P/L</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Return</th>
                          <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr key={holding.id || holding.symbol} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s ease' }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{holding.symbol}</td>
                            <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)' }}>{holding.quantity}</td>
                            <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)' }}>{formatCurrency(holding.average_buy_price)}</td>
                            <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)', fontWeight: '600' }}>{formatCurrency(holding.current_price)}</td>
                            <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{formatCurrency(holding.invested_amount)}</td>
                            <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)', fontWeight: '600' }}>{formatCurrency(holding.current_value)}</td>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <span className={getProfitClass(holding.profit_loss)} style={{ fontWeight: '600' }}>
                                {holding.profit_loss > 0 ? '+' : ''}{formatCurrency(holding.profit_loss).replace('₹-', '-₹')}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <span className={getProfitClass(holding.profit_loss_percentage)} style={{ fontWeight: '600', padding: '0.35rem 0.6rem', borderRadius: '6px', background: holding.profit_loss_percentage > 0 ? 'rgba(22, 163, 74, 0.1)' : holding.profit_loss_percentage < 0 ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-main)' }}>
                                {formatPercentage(holding.profit_loss_percentage)}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px' }} onClick={() => handleAnalyze(holding.symbol)}>Analyze</button>
                                <button className="primary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', background: 'var(--success-color)', borderRadius: '6px' }} onClick={() => openModal('buy', holding.symbol)}>Buy</button>
                                <button className="primary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', background: 'var(--error-color)', borderRadius: '6px' }} onClick={() => openModal('sell', holding.symbol, holding.quantity)}>Sell</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
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
