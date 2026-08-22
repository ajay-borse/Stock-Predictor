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
        api.get('stocks/portfolio/analytics/'),
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

  // Safe destructuring
  const totalInvested = portfolio?.total_invested || 0;
  const currentValue = portfolio?.current_value || 0;
  const totalPL = portfolio?.total_profit_loss || 0;
  const totalPLPct = portfolio?.profit_loss_percentage || 0;
  const holdings = portfolio?.holdings || [];

  // Performance Bar calculation
  const maxBarValue = Math.max(totalInvested, currentValue, 1);
  const investedWidth = `${(totalInvested / maxBarValue) * 100}%`;
  const currentWidth = `${(currentValue / maxBarValue) * 100}%`;

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Portfolio</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your investment performance.</p>
          </div>
        </header>

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--error-color)', fontWeight: '500', margin: 0 }}>⚠️ {error}</p>
            <button className="primary-btn" onClick={fetchData} style={{ marginTop: '1rem', width: 'auto' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: '120px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '300px', marginTop: '2rem' }}></div>
          </div>
        ) : !error && portfolio && (
          <>
            {/* SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Invested</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(totalInvested)}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Value</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(currentValue)}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Profit / Loss</span>
                <span className={getProfitClass(totalPL)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  {totalPL > 0 ? '+' : ''}{formatCurrency(totalPL).replace('₹-', '-₹')}
                </span>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Return</span>
                <span className={getProfitClass(totalPLPct)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  {formatPercentage(totalPLPct)}
                </span>
              </div>
            </div>

            {/* PORTFOLIO PERFORMANCE */}
            {holdings.length > 0 && (
              <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Performance Chart</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Invested Value</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatCurrency(totalInvested)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: investedWidth, height: '100%', background: 'var(--text-muted)', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Value</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatCurrency(currentValue)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: currentWidth, height: '100%', background: totalPL >= 0 ? 'var(--success-color)' : 'var(--error-color)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HOLDINGS */}
            <div className="animate-fade-in">
              <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Your Holdings</h3>
              
              {holdings.length === 0 ? (
                <div className="glass-card empty-state-compact" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>📈</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Your portfolio is empty</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Start building your investment portfolio with AI insights.</p>
                  <button className="primary-btn" style={{ width: 'auto' }} onClick={() => navigate('/prediction')}>Explore Stocks</button>
                </div>
              ) : (
                <div className="glass-card transactions-table-wrapper" style={{ padding: 0, background: 'var(--bg-surface)' }}>
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Qty</th>
                        <th>Avg Buy</th>
                        <th>Current Price</th>
                        <th>Invested</th>
                        <th>Current Value</th>
                        <th>P/L</th>
                        <th>Return</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.id || holding.symbol}>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{holding.symbol}</td>
                          <td style={{ color: 'var(--text-main)' }}>{holding.quantity}</td>
                          <td style={{ color: 'var(--text-main)' }}>{formatCurrency(holding.average_buy_price)}</td>
                          <td style={{ color: 'var(--text-main)' }}>{formatCurrency(holding.current_price)}</td>
                          <td style={{ color: 'var(--text-main)' }}>{formatCurrency(holding.invested_amount)}</td>
                          <td style={{ color: 'var(--text-main)' }}>{formatCurrency(holding.current_value)}</td>
                          <td className={getProfitClass(holding.profit_loss)}>
                            {holding.profit_loss > 0 ? '+' : ''}{formatCurrency(holding.profit_loss).replace('₹-', '-₹')}
                          </td>
                          <td className={getProfitClass(holding.profit_loss_percentage)}>
                            {formatPercentage(holding.profit_loss_percentage)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button className="secondary-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAnalyze(holding.symbol)}>Analyze</button>
                              <button className="primary-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto', background: 'var(--success-color)' }} onClick={() => openModal('buy', holding.symbol)}>Buy</button>
                              <button className="primary-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto', background: 'var(--error-color)' }} onClick={() => openModal('sell', holding.symbol, holding.quantity)}>Sell</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
