import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Home, Shield, User, MapPin, Award, CheckCircle, Info, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Container from '../components/common/Container';
import BrandMark from '../components/common/BrandMark';
import Button from '../components/common/Button';

export const WorkspacePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Municipal Administrator',
          className: 'workspace-role-admin',
          description: 'Full supervisory authority over municipal zones, personnel, and complaint audits.'
        };
      case 'collector':
        return {
          label: 'Waste Collector',
          className: 'workspace-role-collector',
          description: 'Field execution authority for dispatch routes, pickups, and remediation proof.'
        };
      case 'user':
      default:
        return {
          label: 'Citizen',
          className: 'workspace-role-user',
          description: 'Civic participant with rights to file incident complaints and accumulate green points.'
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);
  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Active Session';

  return (
    <div className="workspace-page">
      {/* Workspace Header */}
      <header className="workspace-header">
        <Container className="workspace-header-content">
          <BrandMark size="md" showWordmark={true} />
          
          <div className="workspace-header-actions">
            <Button
              variant="outline"
              size="sm"
              icon={Home}
              href="/"
            >
              Public Home
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </Container>
      </header>

      {/* Main Workspace Body */}
      <main className="workspace-main">
        <Container>
          {/* Welcome Banner */}
          <div className="workspace-hero-banner">
            <span className={`workspace-hero-badge ${roleConfig.className}`}>
              <Shield size={13} />
              {roleConfig.label}
            </span>
            <h1 className="workspace-title">
              Welcome back, {user?.name || 'Civic Participant'}
            </h1>
            <p className="workspace-subtitle">
              {roleConfig.description}
            </p>
          </div>

          <div className="workspace-grid">
            {/* Account Profile Card */}
            <div className="workspace-card">
              <h2 className="workspace-card-title">
                <User size={20} />
                Civic Credentials &amp; Profile
              </h2>

              <div className="workspace-info-list">
                <div className="workspace-info-item">
                  <span className="workspace-info-label">Full Name</span>
                  <span className="workspace-info-value">{user?.name || '—'}</span>
                </div>

                <div className="workspace-info-item">
                  <span className="workspace-info-label">Email Address</span>
                  <span className="workspace-info-value">{user?.email || '—'}</span>
                </div>

                <div className="workspace-info-item">
                  <span className="workspace-info-label">Phone</span>
                  <span className="workspace-info-value">{user?.phone || 'Not registered'}</span>
                </div>

                <div className="workspace-info-item">
                  <span className="workspace-info-label">Account Status</span>
                  <span className="workspace-info-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#17543A' }}>
                    <CheckCircle size={14} />
                    {user?.accountStatus ? user.accountStatus.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>

                <div className="workspace-info-item">
                  <span className="workspace-info-label">Registered Since</span>
                  <span className="workspace-info-value">{formattedDate}</span>
                </div>

                <div className="workspace-info-item">
                  <span className="workspace-info-label">System User ID</span>
                  <span className="workspace-info-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {user?._id || user?.id || '—'}
                  </span>
                </div>
              </div>

              {/* Service Areas (if collector or admin) */}
              {user?.serviceAreas && user.serviceAreas.length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                  <span className="workspace-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                    <MapPin size={14} /> Assigned Service Areas
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {user.serviceAreas.map((area, idx) => (
                      <span key={idx} className="auth-requirement-chip is-valid">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase Roadmap Information Banner */}
              {user?.role === 'admin' ? (
                <div className="workspace-roadmap-banner" style={{ backgroundColor: 'rgba(23, 84, 58, 0.08)', borderColor: 'var(--color-forest)' }}>
                  <h4>
                    <Shield size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Municipal Administration Command Center
                  </h4>
                  <p style={{ marginBottom: '1rem' }}>
                    As a verified municipal administrator, you have complete supervisory control over civic incident triage, collector fleet allocations, and operational audits.
                  </p>
                  <Button variant="secondary" size="sm" to="/admin/dashboard">
                    Enter Admin Dashboard →
                  </Button>
                </div>
              ) : user?.role === 'collector' ? (
                <div className="workspace-roadmap-banner" style={{ backgroundColor: 'rgba(217, 243, 106, 0.1)', borderColor: 'var(--color-forest)' }}>
                  <h4>
                    <Shield size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Sanitation Field Operations Portal
                  </h4>
                  <p style={{ marginBottom: '1rem' }}>
                    As an authenticated municipal waste collector, you can review assigned route work orders, navigate directly to incident locations, and submit photographic completion evidence.
                  </p>
                  <Button variant="secondary" size="sm" to="/collector/dashboard">
                    Enter Collector Dashboard →
                  </Button>
                </div>
              ) : (
                <div className="workspace-roadmap-banner">
                  <h4>
                    <Info size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Phase 3 Verification Milestone
                  </h4>
                  <p>
                    Your authenticated session has been validated via cryptographic JWT. In upcoming phases, this surface will be upgraded into role-dedicated command dashboards: Citizen Incident Filing (Phase 4), Collector Route Dispatch (Phase 5), and Municipal Admin Analytics (Phase 6).
                  </p>
                </div>
              )}
            </div>

            {/* Quick Security Status Sidebar */}
            <div className="workspace-card">
              <h2 className="workspace-card-title">
                <Shield size={20} />
                Session Security
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-paper-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-forest)', marginBottom: '2px' }}>
                    Session Token Storage
                  </div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    Isolated in <code>sessionStorage</code>; cleared on browser tab close or logout.
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-paper-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-forest)', marginBottom: '2px' }}>
                    Token Lifespan
                  </div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    1 Hour maximum lifespan with proactive 401 interception.
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-paper-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-forest)', marginBottom: '2px' }}>
                    Role Enforcement
                  </div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    Backend validated on every sensitive request using DB-verified status checks.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
};

export default WorkspacePage;

