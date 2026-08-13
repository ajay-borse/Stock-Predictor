import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import '../App.css';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingSymbol, setRemovingSymbol] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('stocks/watchlist/');
      setWatchlist(response.data);
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
    navigate('/', { state: { symbol } });
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

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <section className="hero-section">
          <h2>My Watchlist</h2>
          <p>Your personalized market intelligence.</p>
        </section>

        {notification && (
          <div className="watchlist-notification animate-fade-in">
            {notification}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="watchlist-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card watchlist-card-skeleton animate-pulse">
                <div className="skeleton-bg" style={{ width: '120px', height: '24px', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton-bg" style={{ width: '80px', height: '14px', borderRadius: '4px', marginBottom: '24px' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton-bg" style={{ width: '90px', height: '36px', borderRadius: '8px' }}></div>
                  <div className="skeleton-bg" style={{ width: '80px', height: '36px', borderRadius: '8px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {watchlist.length === 0 ? (
              <div className="glass-card empty-state-card animate-fade-in">
                <div className="empty-icon">★</div>
                <h3>Your watchlist is empty.</h3>
                <p>Add stocks you're interested in to track them with AI.</p>
                <button className="primary-btn" onClick={() => navigate('/')}>
                  Explore Stocks
                </button>
              </div>
            ) : (
              <div className="watchlist-grid animate-fade-in">
                {watchlist.map((item, index) => (
                  <div key={item.id} className={`glass-card watchlist-card stagger-${(index % 5) + 1}`}>
                    <div className="card-header">
                      <h3>★ {item.symbol}</h3>
                      <span className="tracked-label">Tracked Stock</span>
                    </div>

                    {removingSymbol === item.symbol ? (
                      <div className="remove-confirm">
                        <p>Remove {item.symbol}?</p>
                        <div className="remove-actions">
                          <button className="cancel-btn" onClick={() => setRemovingSymbol(null)}>Cancel</button>
                          <button className="confirm-btn" onClick={() => confirmRemove(item.symbol)}>Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div className="card-actions">
                        <button className="analyze-btn" onClick={() => handleAnalyze(item.symbol)}>
                          View Analysis →
                        </button>
                        <button className="remove-init-btn" onClick={() => setRemovingSymbol(item.symbol)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
