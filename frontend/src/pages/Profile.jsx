import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('profile/');

            setUser(response.data);
        } catch (err) {
            console.error('Profile loading error:', err);

            if (err.response?.status === 401) {
                setError('Your session has expired. Please login again.');
            } else if (!err.response) {
                setError('Unable to connect to the server.');
            } else {
                setError('Unable to load your profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const getInitials = () => {
        if (!user) return 'U';

        const firstName = user.first_name || '';
        const lastName = user.last_name || '';

        if (firstName || lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        return (user.username || 'U').substring(0, 2).toUpperCase();
    };

    const getFullName = () => {
        if (!user) return 'User';

        const fullName =
            `${user.first_name || ''} ${user.last_name || ''}`.trim();

        return fullName || user.username || 'User';
    };

    const formatDate = (value) => {
        if (!value) return 'Not available';

        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="app-container page-transition">
            <Navbar />

            <main className="main-content">

                <section className="hero-section">
                    <h2>My Profile</h2>
                    <p>View your personal account information.</p>
                </section>

                {loading && (
                    <div
                        className="glass-card"
                        style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                        }}
                    >
                        <h3>Loading Profile...</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Fetching your account information.
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div
                        className="glass-card error-state-card animate-fade-in"
                        style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            border: '1px solid var(--error-color)',
                            background: 'var(--error-glow)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                            }}
                        >
                            ⚠️
                        </div>

                        <h3>{error}</h3>

                        <button
                            className="primary-btn"
                            onClick={fetchProfile}
                            style={{
                                marginTop: '1.5rem',
                                maxWidth: '200px',
                                background: 'var(--error-color)',
                                color: '#fff'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && user && (
                    <div>

                        {/* Profile Header */}

                        <div
                            className="glass-card"
                            style={{
                                textAlign: 'center',
                                padding: '3rem 2rem',
                                marginBottom: '1.5rem',
                                background: 'var(--bg-surface)'
                            }}
                        >
                            <div
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    margin: '0 auto 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#fff',
                                    background: 'var(--primary-color)',
                                }}
                            >
                                {getInitials()}
                            </div>

                            <h2>{getFullName()}</h2>

                            <p
                                style={{
                                    color: 'var(--text-muted)',
                                    marginTop: '0.5rem',
                                }}
                            >
                                @{user.username}
                            </p>

                            <div
                                style={{
                                    marginTop: '1rem',
                                    color: 'var(--success-color)',
                                    fontWeight: '600',
                                }}
                            >
                                ● Account Active
                            </div>
                        </div>


                        {/* Account Information */}

                        <div
                            className="glass-card"
                            style={{
                                padding: '2rem',
                                background: 'var(--bg-surface)'
                            }}
                        >
                            <h3 style={{ marginBottom: '1.5rem' }}>
                                Account Information
                            </h3>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1rem',
                                }}
                            >

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Username</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {user.username || 'Not available'}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Email</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {user.email || 'Not available'}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>First Name</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {user.first_name || 'Not available'}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Last Name</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {user.last_name || 'Not available'}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Phone</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {user.phone || user.phone_number || 'Not available'}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {formatDate(user.date_of_birth)}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Member Since</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {formatDate(user.date_joined)}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}>
                                    <span className="label" style={{ color: 'var(--text-muted)' }}>Last Login</span>
                                    <div className="value" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                        {formatDate(user.last_login)}
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}

export default Profile;