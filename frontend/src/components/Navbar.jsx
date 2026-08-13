import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>StockMind AI</h1>
        <div className="ai-status">
          <div className="ai-status-dot"></div>
          System Online
        </div>
      </div>
      
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
        <Link to="/" className={location.pathname === '/prediction' ? 'active' : ''}>Prediction</Link>
        <Link to="/watchlist" className={location.pathname === '/watchlist' ? 'active' : ''}>Watchlist</Link>
        <Link to="#">Profile</Link>
      </div>

      <button onClick={handleLogout} className="secondary-btn">
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
