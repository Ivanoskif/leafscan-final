import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, tokenStorage } from '../../services/api';
import { Leaf, CheckCircle } from 'lucide-react';
import './Login.css';

const FEATURES = [
    'AI Disease Detection',
    'Real-time Analytics',
    'User Management',
    'Analysis History',
];

export default function Login() {
    const [email,    setEmail]    = useState('admin@leafscan.ai');
    const [password, setPassword] = useState('admin123');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields.'); return; }
        setLoading(true);

        try {
            const res = await authAPI.login({ email, password });
            const { access, refresh, user } = res.data || {};
            if (!access || !refresh) {
                throw new Error('Login response missing tokens');
            }
            // Чувај access + refresh во localStorage.
            tokenStorage.setBoth(access, refresh);
            // Notify AuthContext (state + ls_token + ls_user).
            login(access, user || { email });
            navigate('/dashboard');
        } catch (err) {
            const detail =
                err?.response?.data?.detail ||
                err?.response?.data?.email ||
                err?.response?.data?.password ||
                err?.message ||
                'Invalid email or password.';
            setError(Array.isArray(detail) ? detail[0] : String(detail));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left */}
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <Leaf size={22} color="#fff" strokeWidth={2} />
                    </div>
                    <span className="login-brand-name">LeafScanAI</span>
                </div>
                <div className="login-left-content">
                    <h1 className="login-left-title">Intelligent Plant Disease Detection</h1>
                    <p className="login-left-sub">
                        AI-powered admin panel for managing diseases, users and analysis history.
                    </p>
                    <div className="login-features">
                        {FEATURES.map(f => (
                            <div key={f} className="login-feature">
                                <CheckCircle size={18} color="var(--green-light)" strokeWidth={2} />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="login-right">
                <div className="login-card">
                    <div className="login-card-header">
                        <h2 className="login-card-title">Admin Login</h2>
                        <p className="login-card-sub">Sign in to your admin account</p>
                    </div>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label className="login-label">Email address</label>
                            <input
                                className="login-input"
                                type="email"
                                placeholder="admin@leafscan.ai"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="login-field">
                            <div className="login-label-row">
                                <label className="login-label">Password</label>
                                <button type="button" className="login-forgot">Forgot password?</button>
                            </div>
                            <input
                                className="login-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <div className="login-error">{error}</div>}
                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
