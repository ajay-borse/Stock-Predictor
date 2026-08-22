import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/prediction', label: 'Prediction' },
    { path: '/watchlist', label: 'Watchlist' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/profile', label: 'Profile' }
  ];

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
