import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'BUY', 'SELL'

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('stocks/transactions/');
      setTransactions(res.data);
    } catch (err) {
      setError('Unable to load transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.transaction_type === filter;
  });

  const totalTransactions = transactions.length;
  const buyOrders = transactions.filter(tx => tx.transaction_type === 'BUY').length;
  const sellOrders = transactions.filter(tx => tx.transaction_type === 'SELL').length;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* Header */}
        <header className="portfolio-header-content animate-fade-in">
          <div className="portfolio-title-group">
            <h2>Transaction History</h2>
            <p>Track every buy and sell activity in your portfolio.</p>
          </div>
          <div className="ai-intelligence-badge">
            <div className="ai-status-dot"></div>
            AI TRANSACTION INTELLIGENCE
          </div>
        </header>

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>{error}</h3>
            <button className="primary-btn" onClick={fetchTransactions} style={{ maxWidth: '200px', margin: '1.5rem auto 0', background: 'var(--error-color)' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: '100px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '400px', marginTop: '2rem' }}></div>
          </div>
        ) : !error && (
          <>
            {/* Summary Cards */}
            <div className="transactions-summary-grid animate-fade-in stagger-1">
              <div className="glass-card summary-card-v2">
                <span className="label">Total Transactions</span>
                <span className="value">{totalTransactions}</span>
              </div>
              <div className="glass-card summary-card-v2">
                <span className="label">Buy Orders</span>
                <span className="value" style={{ color: 'var(--success-color)' }}>{buyOrders}</span>
              </div>
              <div className="glass-card summary-card-v2">
                <span className="label">Sell Orders</span>
                <span className="value" style={{ color: 'var(--error-color)' }}>{sellOrders}</span>
              </div>
            </div>

            {/* Main Content Area */}
            {transactions.length === 0 ? (
              <div className="glass-card empty-portfolio-premium animate-fade-in stagger-2" style={{ marginTop: '2rem' }}>
                <div className="icon">📋</div>
                <h3>No transactions yet.</h3>
                <p>Your completed stock transactions will appear here.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="primary-btn" style={{ maxWidth: '200px' }} onClick={() => navigate('/')}>Explore Stocks</button>
                  <button className="secondary-btn" onClick={() => navigate('/portfolio')}>View Portfolio</button>
                </div>
              </div>
            ) : (
              <div className="transactions-container animate-fade-in stagger-2" style={{ marginTop: '2rem' }}>
                {/* Filters */}
                <div className="transactions-filters">
                  <button className={`tx-filter-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>ALL</button>
                  <button className={`tx-filter-btn ${filter === 'BUY' ? 'active' : ''}`} onClick={() => setFilter('BUY')}>BUY</button>
                  <button className={`tx-filter-btn ${filter === 'SELL' ? 'active' : ''}`} onClick={() => setFilter('SELL')}>SELL</button>
                </div>

                {/* Table for Desktop */}
                <div className="transactions-table-wrapper glass-card">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Stock</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{formatDate(tx.created_at)}</td>
                          <td>
                            <span className={`tx-badge ${tx.transaction_type === 'BUY' ? 'tx-buy' : 'tx-sell'}`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="tx-symbol">{tx.symbol}</td>
                          <td>{tx.quantity}</td>
                          <td>{formatCurrency(tx.price)}</td>
                          <td style={{ fontWeight: 500 }}>{formatCurrency(tx.total_amount)}</td>
                          <td>
                            <span className="tx-status-completed">COMPLETED</span>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No {filter} transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cards for Mobile */}
                <div className="transactions-mobile-list">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="tx-mobile-card glass-card">
                      <div className="tx-card-header">
                        <div className="tx-card-title">
                          <span className={`tx-badge ${tx.transaction_type === 'BUY' ? 'tx-buy' : 'tx-sell'}`}>
                            {tx.transaction_type}
                          </span>
                          <span className="tx-symbol">{tx.symbol}</span>
                        </div>
                        <span className="tx-status-completed">✓ COMPLETED</span>
                      </div>
                      
                      <div className="tx-card-body">
                        <div className="tx-detail">
                          <span className="lbl">Quantity</span>
                          <span className="val">{tx.quantity}</span>
                        </div>
                        <div className="tx-detail">
                          <span className="lbl">Price</span>
                          <span className="val">{formatCurrency(tx.price)}</span>
                        </div>
                        <div className="tx-meta">
                          <span className="lbl">Total</span>
                          <span className="val" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(tx.total_amount)}</span>
                        </div>
                      </div>
                      
                      <div className="tx-card-footer">
                        <span className="tx-date">{formatDate(tx.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No {filter} transactions found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Transactions;
