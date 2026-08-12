import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../App.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post('register/', {
        username,
        email,
        password
      });

      // Redirect to login after successful registration
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        // Collect all error messages from the backend
        const errorMessages = Object.values(err.response.data).flat().join(' ');
        setError(errorMessages || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>📈 AI Stock Predictor</h1>
      </nav>

      <main className="main-content">
        <section className="header-section">
          <h2>Create an Account</h2>
          <p>Join to access advanced stock predictions.</p>
        </section>

        <div className="predictor-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="symbol-input"
                style={{ textTransform: 'none' }}
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="symbol-input"
                style={{ textTransform: 'none' }}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="symbol-input"
                style={{ textTransform: 'none' }}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="predict-btn"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
