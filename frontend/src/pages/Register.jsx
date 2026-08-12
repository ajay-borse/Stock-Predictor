import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../App.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate('/login');
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        if (!value) error = 'Username is required.';
        else if (/[^a-zA-Z0-9_]/.test(value)) error = 'Username can only contain letters, numbers, and underscores.';
        break;
      case 'first_name':
        if (!value) error = 'First name is required.';
        break;
      case 'last_name':
        if (!value) error = 'Last name is required.';
        break;
      case 'phone_number':
        if (!value) error = 'Phone number is required.';
        else if (!/^\+?[\d\s-]{10,}$/.test(value)) error = 'Please enter a valid phone number.';
        break;
      case 'email':
        if (!value) error = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Please enter a valid email address.';
        break;
      case 'date_of_birth':
        if (!value) error = 'Date of birth is required.';
        else if (new Date(value) > new Date()) error = 'Date of birth cannot be in the future.';
        break;
      case 'password':
        if (!value) error = 'Password is required.';
        else if (value.length < 8) error = 'Password must be at least 8 characters.';
        break;
      case 'confirm_password':
        if (!value) error = 'Please confirm your password.';
        else if (value !== formData.password) error = 'Passwords do not match.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    setGlobalError(null);
    const fieldError = validateField(id, value);
    setErrors(prev => ({ ...prev, [id]: fieldError }));

    if (id === 'password' || id === 'confirm_password') {
       const pwd = id === 'password' ? value : formData.password;
       const cpwd = id === 'confirm_password' ? value : formData.confirm_password;
       if (cpwd) {
         if (pwd !== cpwd) {
           setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match.' }));
         } else {
           setErrors(prev => ({ ...prev, confirm_password: '' })); 
         }
       }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('Please fix the errors below.');
      return;
    }

    setGlobalError(null);
    setLoading(true);

    try {
      await api.post('register/', formData);
      setIsSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        const backendErrors = err.response.data;
        const mappedErrors = {};
        let gError = null;

        for (const [key, value] of Object.entries(backendErrors)) {
          if (formData.hasOwnProperty(key)) {
            mappedErrors[key] = Array.isArray(value) ? value[0] : value;
          } else {
            gError = Array.isArray(value) ? value[0] : value;
          }
        }
        
        if (Object.keys(mappedErrors).length > 0) {
           setErrors(mappedErrors);
        }
        if (gError || Object.keys(mappedErrors).length === 0) {
           setGlobalError(gError || 'Registration failed. Please try again.');
        }
      } else {
        setGlobalError('Backend registration API is not yet available. Or unable to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="success-container">
        <div className="light-sweep"></div>
        <div className="success-content">
          <div className="glowing-ring">
            <div className="ring-circle"></div>
            <div className="premium-check">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
          </div>
          <h2 className="success-title">Welcome to the Intelligence.</h2>
          <p className="success-message">
            Your account has been successfully created.<br/>
            Welcome to StockMind AI.
          </p>
          <div className="countdown-box">
            <span style={{color: 'var(--text-muted)'}}>Preparing your workspace in </span> 
            <span className="countdown-number">0{countdown}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout" style={{ display: 'block', padding: '2rem 1rem' }}>
      <div className="register-container">
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Join the next generation of intelligent investing.</p>
        </div>

        <div className="glass-card">
          <form onSubmit={handleRegister}>
            
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" className={`premium-input ${errors.username ? 'input-error' : ''}`} value={formData.username} onChange={handleChange} disabled={loading} placeholder="Choose a username" />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="first_name">First Name</label>
                <input id="first_name" type="text" className={`premium-input ${errors.first_name ? 'input-error' : ''}`} value={formData.first_name} onChange={handleChange} disabled={loading} placeholder="First name" />
                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="middle_name">Middle Name (Optional)</label>
                <input id="middle_name" type="text" className="premium-input" value={formData.middle_name} onChange={handleChange} disabled={loading} placeholder="Middle name" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="last_name">Last Name</label>
                <input id="last_name" type="text" className={`premium-input ${errors.last_name ? 'input-error' : ''}`} value={formData.last_name} onChange={handleChange} disabled={loading} placeholder="Last name" />
                {errors.last_name && <span className="field-error">{errors.last_name}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input id="phone_number" type="tel" className={`premium-input ${errors.phone_number ? 'input-error' : ''}`} value={formData.phone_number} onChange={handleChange} disabled={loading} placeholder="+1234567890" />
                {errors.phone_number && <span className="field-error">{errors.phone_number}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" className={`premium-input ${errors.email ? 'input-error' : ''}`} value={formData.email} onChange={handleChange} disabled={loading} placeholder="Enter your email" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input id="date_of_birth" type="date" className={`premium-input ${errors.date_of_birth ? 'input-error' : ''}`} value={formData.date_of_birth} onChange={handleChange} disabled={loading} max={new Date().toISOString().split('T')[0]} />
                {errors.date_of_birth && <span className="field-error">{errors.date_of_birth}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input id="password" type={showPassword ? "text" : "password"} className={`premium-input ${errors.password ? 'input-error' : ''}`} value={formData.password} onChange={handleChange} disabled={loading} placeholder="Create password" />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirm_password">Confirm Password</label>
                <div className="password-wrapper">
                  <input id="confirm_password" type={showConfirmPassword ? "text" : "password"} className={`premium-input ${errors.confirm_password ? 'input-error' : formData.confirm_password && !errors.confirm_password ? 'input-success' : ''}`} value={formData.confirm_password} onChange={handleChange} disabled={loading} placeholder="Confirm password" />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "Hide" : "Show"}</button>
                </div>
                {errors.confirm_password && <span className="field-error">❌ {errors.confirm_password}</span>}
                {formData.confirm_password && !errors.confirm_password && <span className="field-success">✓ Passwords match.</span>}
              </div>
            </div>

            {globalError && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error-color)', borderRadius: '4px', color: 'var(--error-color)', fontSize: '0.9rem' }}>
                ⚠️ {globalError}
              </div>
            )}

            <button type="submit" className="primary-btn" style={{ marginTop: '2rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
