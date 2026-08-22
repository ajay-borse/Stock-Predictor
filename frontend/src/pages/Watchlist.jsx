import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';
import '../App.css';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistData, setWatchlistData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingSymbol, setRemovingSymbol] = useState(null);
  const [notification, setNotification] = useState(null);

  // Global Buy Modal State
  const { toast, showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, type: 'buy', symbol: '', availableShares: 0 });

  const openBuyModal = (sym) => setModal({ isOpen: true, type: 'buy', symbol: sym, availableShares: 0 });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  const handleTransactionSuccess = (sym, type) => {
    closeModal();
    showToast(`✓ ${sym} purchased successfully.`);
  };

  const navigate = useNavigate();

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('stocks/watchlist/');
      const wList = response.data;
      setWatchlist(wList);

      // Fetch market data for each watchlist item
      const promises = wList.map(item => api.get(`stocks/history/?symbol=${item.symbol}`).catch(() => null));
      const results = await Promise.all(promises);

      const dataMap = {};
      results.forEach((res, index) => {
        if (res && res.data && res.data.data && res.data.data.length >= 2) {
          const history = res.data.data;
          const latest = history[history.length - 1];
          const prev = history[history.length - 2];
          const change = latest.close - prev.close;
          const pctChange = (change / prev.close) * 100;
          dataMap[wList[index].symbol] = {
            price: latest.close,
            change: change,
            pctChange: pctChange
          };
        }
      });
      setWatchlistData(dataMap);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.request && !err.response) {
        setError("Unable to connect to the server.");
      } else {
        setError("Unable to load watchlist. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAnalyze = (symbol) => {
    navigate('/prediction', { state: { symbol } });
  };

  const confirmRemove = async (symbol) => {
    try {
      await api.delete(`stocks/watchlist/?symbol=${symbol}`);
      setWatchlist(watchlist.filter(item => item.symbol !== symbol));
      setRemovingSymbol(null);
      setNotification(`${symbol} removed from your watchlist.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError("Unable to update your watchlist. Please try again.");
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '-';
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (val) => {
    if (val === undefined || val === null) return '-';
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
        <header className="dashboard-header animate-fade-in">
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Watchlist</h2>
            <p style={{ color: 'var(--text-muted)' }}>Monitor your selected stocks.</p>
          </div>
        </header>

        {notification && (
          <div className="watchlist-notification animate-fade-in" style={{ padding: '1rem', background: 'var(--success-glow)', color: 'var(--success-color)', border: '1px solid var(--success-color)', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
            {notification}
          </div>
        )}

        {error && (
          <div className="glass-card error-state-card animate-fade-in" style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--error-color)', background: 'rgba(239, 68, 68, 0.05)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--error-color)', fontWeight: '500', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-box" style={{ height: '300px', width: '100%' }}></div>
          </div>
        ) : (
          <>
            {watchlist.length === 0 ? (
              <div className="glass-card empty-state-compact animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--card-border)', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>📋</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>No stocks in your watchlist</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add stocks to track their market movement and AI insights.</p>
                <button className="primary-btn" onClick={() => navigate('/')} style={{ width: 'auto' }}>
                  Explore Stocks
                </button>
              </div>
            ) : (
              <div className="glass-card transactions-table-wrapper animate-fade-in" style={{ padding: '0', background: 'var(--bg-surface)' }}>
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Current Price</th>
                      <th>Change</th>
                      <th>Added Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((item) => {
                      const data = watchlistData[item.symbol] || {};
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.symbol}</td>
                          <td style={{ color: 'var(--text-main)' }}>{formatCurrency(data.price)}</td>
                          <td className={getProfitClass(data.pctChange)}>
                            {data.price ? `${formatCurrency(data.change)} (${formatPercentage(data.pctChange)})` : '-'}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            {removingSymbol === item.symbol ? (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="secondary-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setRemovingSymbol(null)}>Cancel</button>
                                <button className="primary-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto', background: 'var(--error-color)' }} onClick={() => confirmRemove(item.symbol)}>Confirm</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="secondary-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleAnalyze(item.symbol)}>
                                  Analyze
                                </button>
                                <button className="primary-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', background: 'var(--success-color)' }} onClick={() => openBuyModal(item.symbol)}>
                                  Buy
                                </button>
                                <button className="secondary-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--error-color)' }} onClick={() => setRemovingSymbol(item.symbol)}>
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

export default Watchlist;
