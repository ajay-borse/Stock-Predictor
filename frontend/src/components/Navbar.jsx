import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await api.get('stocks/notifications/');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Unable to load notifications");
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchNotifications();
    
    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setIsNotifOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleNotifPanel = () => {
    const newState = !isNotifOpen;
    setIsNotifOpen(newState);
    setMobileMenuOpen(false);
    if (newState) {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('stocks/notifications/read-all/');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read");
    }
  };

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/prediction', label: 'Prediction' },
    { path: '/watchlist', label: 'Watchlist' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/profile', label: 'Profile' }
  ];

  const getNotifIcon = (type) => {
    switch (type) {
      case 'WATCHLIST': return '📋';
      case 'BUY': return '🟢';
      case 'SELL': return '🔴';
      case 'PREDICTION': return '🤖';
      default: return '✦';
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr ago`;
    return d.toLocaleDateString();
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>StockMind AI</h1>
        <div className="ai-status">
          <div className="ai-status-dot"></div>
          <span className="ai-status-text">System Online</span>
        </div>
      </div>
      
      <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {navLinks.map((link) => (
          <Link 
            key={link.path}
            to={link.path} 
            className={location.pathname === link.path ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            {link.label}
          </Link>
        ))}
        <button onClick={handleLogout} className="secondary-btn mobile-logout-btn">
          Logout
        </button>
      </div>

      <div className="nav-actions">
        {/* Notifications Dropdown */}
        <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className="notif-btn" 
            onClick={toggleNotifPanel}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', 
              padding: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', top: '2px', right: '2px', background: 'var(--error-color)', 
                color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown animate-fade-in" style={{
              position: 'absolute', top: '100%', right: '0', width: '320px', background: '#ffffff', 
              border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
              zIndex: 1000, marginTop: '0.5rem', overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                    Mark all read
                  </button>
                )}
              </div>
              
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifLoading && notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500', fontSize: '0.95rem' }}>No new notifications</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>You're all caught up.</div>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {notifications.map(n => (
                      <li key={n.id} style={{ 
                        padding: '1rem', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem', 
                        background: n.is_read ? '#ffffff' : '#F8FAFC', transition: 'background 0.2s ease' 
                      }}>
                        <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{getNotifIcon(n.notification_type)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: n.is_read ? '400' : '500' }}>
                            {n.message}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(n.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="secondary-btn desktop-logout-btn">
          Logout
        </button>
        <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <div className={`hamburger-line ${mobileMenuOpen ? 'line-1-open' : ''}`}></div>
          <div className={`hamburger-line ${mobileMenuOpen ? 'line-2-open' : ''}`}></div>
          <div className={`hamburger-line ${mobileMenuOpen ? 'line-3-open' : ''}`}></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
