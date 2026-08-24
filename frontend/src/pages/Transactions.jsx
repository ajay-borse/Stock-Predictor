import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import '../App.css';

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
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (!err.response) {
        setError("Unable to connect to the server. Please check your network.");
      } else {
        setError('Unable to load transactions. Please try again later.');
      }
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
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="app-container page-transition">
      <Navbar />

      <main className="main-content">
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2.5rem', alignItems: 'flex-start' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>Transaction Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>Track and filter every buy and sell activity.</p>
          </div>
          <button className="secondary-btn" onClick={() => navigate('/portfolio')} style={{ width: 'auto' }}>
            View Portfolio
          </button>
        </header>

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)', marginBottom: '2rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Unable to load transactions</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
            <button className="primary-btn" onClick={fetchTransactions} style={{ maxWidth: '200px', margin: '0 auto', background: 'var(--error-color)' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: '120px', borderRadius: '16px' }}></div>)}
            </div>
            <div className="skeleton-box" style={{ height: '400px', borderRadius: '16px' }}></div>
          </div>
        ) : !error && (
          <>
            {/* Summary Cards */}
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Total Transactions</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalTransactions}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Buy Orders</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success-color)' }}>{buyOrders}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Sell Orders</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--error-color)' }}>{sellOrders}</span>
              </div>
            </div>

            {/* Main Content Area */}
            {transactions.length === 0 ? (
              <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-surface)', borderRadius: '16px' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>🧾</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '600' }}>No transactions yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>Your completed buy and sell activity will appear here.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="primary-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/')}>Explore Stocks</button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                {/* Filters */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setFilter('ALL')} style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s ease', background: filter === 'ALL' ? 'var(--primary-color)' : 'var(--bg-main)', color: filter === 'ALL' ? '#fff' : 'var(--text-muted)' }}>
                    All
                  </button>
                  <button onClick={() => setFilter('BUY')} style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s ease', background: filter === 'BUY' ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-main)', color: filter === 'BUY' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                    Buy
                  </button>
                  <button onClick={() => setFilter('SELL')} style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s ease', background: filter === 'SELL' ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-main)', color: filter === 'SELL' ? 'var(--error-color)' : 'var(--text-muted)' }}>
                    Sell
                  </button>
                </div>

                {/* Table for Desktop */}
                <div className="table-responsive">
                  <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-main)' }}>
                      <tr>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date & Time</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Stock</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Quantity</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Price</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Amount</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{formatDate(tx.created_at)}</td>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', background: tx.transaction_type === 'BUY' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: tx.transaction_type === 'BUY' ? 'var(--success-color)' : 'var(--error-color)' }}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{tx.symbol}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: 'var(--text-main)' }}>{tx.quantity}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrency(tx.price)}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(tx.total_amount)}</td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)' }}>
                              ✓ COMPLETED
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>No {filter} transactions found.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
