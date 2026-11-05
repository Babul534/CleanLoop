import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import BrandMark from '../../components/common/BrandMark';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/workspace';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email.trim(), password);
      
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname, { replace: true });
      } else if (user?.role === 'user') {
        navigate('/dashboard', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user?.role === 'collector') {
        navigate('/collector/dashboard', { replace: true });
      } else {
        navigate('/workspace', { replace: true });
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Authentication failed. Please verify your credentials.';
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Editorial Left Panel */}
      <aside className="auth-hero-panel" aria-label="CleanLoop Identity and Highlights">
        <div className="auth-hero-top">
          <Link to="/" className="auth-hero-backlink" aria-label="Return to CleanLoop Homepage">
            <ArrowLeft size={16} />
            <span>Return to CleanLoop</span>
          </Link>
          <BrandMark size="lg" isInverse={true} />
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-pill">
            <ShieldCheck size={14} />
            Civic Security Framework
          </div>
          <h1 className="auth-hero-title">
            Empowering citizens and municipalities with <span>accountable intelligence</span>.
          </h1>
          <p className="auth-hero-description">
            Sign in to access your verified civic workspace, track waste remediation requests, and collaborate across neighborhoods.
          </p>

          <div className="auth-hero-features">
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>Encrypted token sessions with automated expiration</span>
            </div>
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>Strict role-based segregation for citizens, collectors & admins</span>
            </div>
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>Rate-limited security guards against credential stuffing</span>
            </div>
          </div>
        </div>

        <div className="auth-hero-footer">
          <span>CleanLoop &bull; Smart Waste Management</span>
          <span>Security Protocol v1.0</span>
        </div>
      </aside>

      {/* Interactive Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          {/* Mobile Brand Header */}
          <div className="auth-form-mobile-brand">
            <Link to="/" className="auth-hero-backlink" style={{ color: 'var(--color-forest)', marginBottom: '1rem' }}>
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
            <BrandMark size="md" />
          </div>

          <header className="auth-form-header">
            <h2 className="auth-form-title">Sign in to CleanLoop</h2>
            <p className="auth-form-subtitle">
              Enter your registered credentials to access your civic workspace.
            </p>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert" aria-live="assertive">
              <AlertCircle size={18} className="auth-alert-icon" />
              <div className="auth-alert-content">
                <strong>Authentication Notice:</strong> {error}
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="auth-input-group">
              <label htmlFor="login-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="name@organization.com"
                  className={`auth-input auth-input-with-icon ${error ? 'has-error' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-input-group">
              <label htmlFor="login-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className={`auth-input auth-input-with-icon ${error ? 'has-error' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-inline-spinner" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign in to Workspace</span>
              )}
            </button>
          </form>

          {/* Switch Link */}
          <footer className="auth-switch-footer">
            <span>New to CleanLoop?</span>
            <Link to="/register" className="auth-switch-link">
              Create a citizen account
            </Link>
          </footer>

          {/* Municipal Collector / Admin Notice */}
          <div className="auth-notice-card">
            <strong>Municipal &amp; Field Staff:</strong> Administrator and Collector accounts are provisioned directly by municipal supervisors via CLI management tools.
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

