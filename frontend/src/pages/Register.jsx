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
    
    // Clear global error
    setGlobalError(null);

    // Validate the specific field
    const fieldError = validateField(id, value);
    setErrors(prev => ({ ...prev, [id]: fieldError }));

    // Real-time password matching check if modifying either password field
    if (id === 'password' || id === 'confirm_password') {
       const pwd = id === 'password' ? value : formData.password;
       const cpwd = id === 'confirm_password' ? value : formData.confirm_password;
       if (cpwd) {
         if (pwd !== cpwd) {
           setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match.' }));
         } else {
           setErrors(prev => ({ ...prev, confirm_password: '' })); // Valid match
         }
       }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate all fields
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
        setGlobalError('Unable to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="success-card scale-in-animation">
            <div className="success-icon-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-message">Welcome to the family! 🎉<br/>Your account has been successfully created.</p>
            <div className="redirect-message">
              Redirecting you to Login... <span className="countdown">{countdown}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>📈 AI Stock Predictor</h1>
      </nav>

      <main className="main-content">
        <section className="header-section">
          <h2>Create Your Account</h2>
          <p>Join to access advanced stock predictions.</p>
        </section>

        <div className="predictor-card register-card">
          <form onSubmit={handleRegister} className="register-form">
            
            <div className="input-group">
              <label htmlFor="username">Username *</label>
              <input id="username" type="text" className={`symbol-input ${errors.username ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.username} onChange={handleChange} disabled={loading} placeholder="Choose a username" />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="first_name">First Name *</label>
                <input id="first_name" type="text" className={`symbol-input ${errors.first_name ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.first_name} onChange={handleChange} disabled={loading} />
                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="middle_name">Middle Name</label>
                <input id="middle_name" type="text" className="symbol-input" style={{ textTransform: 'none' }} value={formData.middle_name} onChange={handleChange} disabled={loading} />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="last_name">Last Name *</label>
              <input id="last_name" type="text" className={`symbol-input ${errors.last_name ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.last_name} onChange={handleChange} disabled={loading} />
              {errors.last_name && <span className="field-error">{errors.last_name}</span>}
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="phone_number">Phone Number *</label>
                <input id="phone_number" type="tel" className={`symbol-input ${errors.phone_number ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.phone_number} onChange={handleChange} disabled={loading} placeholder="+1234567890" />
                {errors.phone_number && <span className="field-error">{errors.phone_number}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="date_of_birth">Date of Birth *</label>
                <input id="date_of_birth" type="date" className={`symbol-input ${errors.date_of_birth ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.date_of_birth} onChange={handleChange} disabled={loading} max={new Date().toISOString().split('T')[0]} />
                {errors.date_of_birth && <span className="field-error">{errors.date_of_birth}</span>}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address *</label>
              <input id="email" type="email" className={`symbol-input ${errors.email ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.email} onChange={handleChange} disabled={loading} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="input-group relative-group">
                <label htmlFor="password">Password *</label>
                <div className="password-wrapper">
                  <input id="password" type={showPassword ? "text" : "password"} className={`symbol-input ${errors.password ? 'input-error' : ''}`} style={{ textTransform: 'none' }} value={formData.password} onChange={handleChange} disabled={loading} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="input-group relative-group">
                <label htmlFor="confirm_password">Confirm Password *</label>
                <div className="password-wrapper">
                  <input id="confirm_password" type={showConfirmPassword ? "text" : "password"} className={`symbol-input ${errors.confirm_password ? 'input-error' : formData.confirm_password && !errors.confirm_password ? 'input-success' : ''}`} style={{ textTransform: 'none' }} value={formData.confirm_password} onChange={handleChange} disabled={loading} />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "Hide" : "Show"}</button>
                </div>
                {errors.confirm_password && <span className="field-error">❌ {errors.confirm_password}</span>}
                {formData.confirm_password && !errors.confirm_password && <span className="field-success">✓ Passwords match.</span>}
              </div>
            </div>

            {globalError && (
              <div className="error-message">
                ⚠️ {globalError}
              </div>
            )}

            <button type="submit" className="predict-btn" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
