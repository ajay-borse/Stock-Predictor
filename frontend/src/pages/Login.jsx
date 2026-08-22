import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../App.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.post('login/', {
        username,
        password
      });

      // Save tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Redirect to predictor
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Side: Brand / AI Visualization */}
      <div className="auth-left">
        <div className="ai-visual-container">
          <div className="ai-grid"></div>
        </div>
        
        <div style={{ zIndex: 10 }}>
          <h1 style={{ fontWeight: '700' }}>StockMind AI</h1>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '600' }}>AI-Powered Market Intelligence</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '2' }}>
            <li>✓ Analyze stocks.</li>
            <li>✓ Track investments.</li>
            <li>✓ Understand market movements.</li>
          </ul>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="auth-right">
        <div className="glass-card auth-card">
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sign in to access your StockMind AI dashboard.</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="premium-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="premium-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="primary-btn"
              style={{ marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          {error && (
            <div className="field-error" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--error-glow)', borderRadius: '8px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
