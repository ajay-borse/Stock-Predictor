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
        setError("Unable to connect to the server. Please check your connection.");
      } else {
        setError("Unable to load your watchlist. Please try again.");
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
    setRemovingSymbol(symbol);
    try {
      await api.delete(`stocks/watchlist/?symbol=${symbol}`);
      setWatchlist(watchlist.filter(item => item.symbol !== symbol));
      showToast(`✓ ${symbol} removed from your watchlist.`);
    } catch (err) {
      showToast(`⚠️ Unable to remove ${symbol}. Please try again.`);
    } finally {
      setRemovingSymbol(null);
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
        <header className="dashboard-header animate-fade-in" style={{ marginBottom: '2.5rem', alignItems: 'flex-start' }}>
          <div className="dashboard-title-group">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>Watchlist Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>Track and analyze your favorite stocks with AI.</p>
          </div>
          <button className="primary-btn" onClick={() => navigate('/')} style={{ width: 'auto' }}>
            Explore Stocks
          </button>
        </header>

        {error && (
          <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--error-color)', background: 'var(--error-glow)', marginBottom: '2rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Unable to load your watchlist</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
            <button className="primary-btn" onClick={fetchWatchlist} style={{ maxWidth: '200px', margin: '0 auto', background: 'var(--error-color)' }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-dashboard animate-fade-in">
            <div className="skeleton-box" style={{ height: '80px', width: '100%', marginBottom: '1rem', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '80px', width: '100%', marginBottom: '1rem', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '80px', width: '100%', marginBottom: '1rem', borderRadius: '12px' }}></div>
          </div>
        ) : !error && (
          <>
            {watchlist.length === 0 ? (
              <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px solid var(--card-border)', background: 'var(--bg-surface)', borderRadius: '16px' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>📋</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '600' }}>Your watchlist is empty</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>Add stocks you're interested in to track them easily.</p>
                <button className="primary-btn" onClick={() => navigate('/')} style={{ width: 'auto', padding: '0.75rem 2rem', fontSize: '1rem' }}>
                  Explore Stocks
                </button>
              </div>
            ) : (
              <div className="glass-card animate-fade-in" style={{ padding: '0', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--card-border)' }}>
                      <tr>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Stock</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Market Price</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Today's Change</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist.map((item) => {
                        const data = watchlistData[item.symbol] || {};
                        const isRemoving = removingSymbol === item.symbol;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s ease', opacity: isRemoving ? 0.5 : 1 }}>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary-color)' }}>
                                  {item.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{item.symbol}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.1rem' }}>EQUITY</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                              {formatCurrency(data.price)}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              {data.price ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: data.pctChange > 0 ? 'rgba(22, 163, 74, 0.1)' : data.pctChange < 0 ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-main)' }}>
                                  <span className={getProfitClass(data.pctChange)} style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                    {formatCurrency(data.change)}
                                  </span>
                                  <span className={getProfitClass(data.pctChange)} style={{ fontSize: '0.85rem' }}>
                                    ({formatPercentage(data.pctChange)})
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button className="secondary-btn" onClick={() => handleAnalyze(item.symbol)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                                  Analyze
                                </button>
                                <button className="primary-btn" onClick={() => openBuyModal(item.symbol)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', width: 'auto', borderRadius: '8px' }}>
                                  Buy
                                </button>
                                <button 
                                  onClick={() => confirmRemove(item.symbol)}
                                  disabled={isRemoving}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Remove from Watchlist"
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
