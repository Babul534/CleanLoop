import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import BrandMark from '../../components/common/BrandMark';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password requirement tests
  const passwordChecks = useMemo(() => {
    const pwd = formData.password;
    return {
      minLength: pwd.length >= 8,
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasDigit: /[0-9]/.test(pwd),
      passwordsMatch: pwd.length > 0 && pwd === formData.confirmPassword
    };
  }, [formData.password, formData.confirmPassword]);

  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasLetter && passwordChecks.hasDigit;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide your full legal or civic name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Registration failed. Please check your information.';
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Editorial Left Panel */}
      <aside className="auth-hero-panel" aria-label="Citizen Registration Information">
        <div className="auth-hero-top">
          <Link to="/" className="auth-hero-backlink" aria-label="Return to CleanLoop Homepage">
            <ArrowLeft size={16} />
            <span>Return to CleanLoop</span>
          </Link>
          <BrandMark size="lg" isInverse={true} />
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-pill">
            <Sparkles size={14} />
            Citizen Empowerment
          </div>
          <h1 className="auth-hero-title">
            Join the collective effort to build <span>cleaner cities</span>.
          </h1>
          <p className="auth-hero-description">
            Register as a verified citizen to submit geo-referenced waste complaints, track municipal resolution in real time, and earn civic green points.
          </p>

          <div className="auth-hero-features">
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <Check size={16} />
              </span>
              <span>Transparent civic accountability with public verification timestamps</span>
            </div>
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <Check size={16} />
              </span>
              <span>Zero-tolerance on spam with verified incident tracking</span>
            </div>
            <div className="auth-hero-feature-item">
              <span className="auth-hero-feature-icon">
                <Check size={16} />
              </span>
              <span>Earn civic credits redeemable for municipal sustainability perks</span>
            </div>
          </div>
        </div>

        <div className="auth-hero-footer">
          <span>Citizen Registry Protocol</span>
          <span>Open Civic Initiative</span>
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
            <h2 className="auth-form-title">Create Citizen Account</h2>
            <p className="auth-form-subtitle">
              Join your neighborhood network. Every report creates an accountable trail.
            </p>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert" aria-live="assertive">
              <AlertCircle size={18} className="auth-alert-icon" />
              <div className="auth-alert-content">
                <strong>Registration Notice:</strong> {error}
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="auth-input-group">
              <label htmlFor="reg-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <User size={16} />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="e.g. Alex Henderson"
                  className={`auth-input auth-input-with-icon ${error && !formData.name ? 'has-error' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="auth-input-group">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="alex.henderson@example.com"
                  className={`auth-input auth-input-with-icon ${error && !formData.email ? 'has-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="auth-input-group">
              <label htmlFor="reg-phone" className="auth-label">
                Phone Number <span className="auth-label-optional">(Optional)</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Phone size={16} />
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+1 (555) 234-5678"
                  className="auth-input auth-input-with-icon"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              <span className="auth-field-hint">Used strictly for municipal SMS cleanup status updates.</span>
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <label htmlFor="reg-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  placeholder="Minimum 8 characters..."
                  className="auth-input auth-input-with-icon"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Requirement Checklist */}
            <div className="auth-password-requirements">
              <span className="auth-requirements-label">Password Requirements</span>
              <ul className="auth-requirements-list">
                <li className={`auth-requirement-chip ${passwordChecks.minLength ? 'is-valid' : ''}`}>
                  <Check size={12} /> 8+ Characters
                </li>
                <li className={`auth-requirement-chip ${passwordChecks.hasLetter ? 'is-valid' : ''}`}>
                  <Check size={12} /> Contains Letters
                </li>
                <li className={`auth-requirement-chip ${passwordChecks.hasDigit ? 'is-valid' : ''}`}>
                  <Check size={12} /> Contains Numbers
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div className="auth-input-group">
              <label htmlFor="reg-confirm-password" className="auth-label">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter password"
                  className={`auth-input auth-input-with-icon ${
                    formData.confirmPassword && !passwordChecks.passwordsMatch ? 'has-error' : ''
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.confirmPassword && !passwordChecks.passwordsMatch && (
                <span className="auth-field-error">Passwords do not match yet.</span>
              )}
            </div>

            {/* Role Notice */}
            <div className="auth-notice-card" style={{ marginTop: '0.25rem' }}>
              <strong>Citizen Account:</strong> Public registrations grant citizen permissions to submit reports, track resolution, and earn community points.
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
                  <span>Creating citizen account...</span>
                </>
              ) : (
                <span>Register Citizen Account</span>
              )}
            </button>
          </form>

          {/* Switch Link */}
          <footer className="auth-switch-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="auth-switch-link">
              Sign in to CleanLoop
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;

