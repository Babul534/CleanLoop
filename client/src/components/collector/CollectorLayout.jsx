import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  LogOut,
  Menu,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';
import { updateCollectorAvailability } from '../../services/collectorService';

export const CollectorLayout = ({ children, title, subtitle }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [updatingAvail, setUpdatingAvail] = useState(false);
  const [availMenuOpen, setAvailMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Field Dashboard', to: '/collector/dashboard', icon: LayoutDashboard },
    { label: 'My Assigned Tasks', to: '/collector/tasks', icon: ClipboardList }
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  const currentAvailability = user?.availability || 'available';

  const availabilityOptions = [
    { value: 'available', label: 'Available / Ready for Dispatch', color: '#16a34a', bg: '#dcfce7' },
    { value: 'busy', label: 'Busy / On Active Remediation', color: '#d97706', bg: '#fef3c7' },
    { value: 'unavailable', label: 'Off-Duty / Unavailable', color: '#dc2626', bg: '#fee2e2' }
  ];

  const currentOption =
    availabilityOptions.find((opt) => opt.value === currentAvailability) || availabilityOptions[0];

  const handleAvailabilityChange = async (newVal) => {
    if (newVal === currentAvailability || updatingAvail) return;
    try {
      setUpdatingAvail(true);
      const res = await updateCollectorAvailability(newVal);
      if (res?.success) {
        if (updateUser) {
          updateUser({ ...user, availability: newVal });
        }
      }
    } catch (err) {
      console.error('[Availability Change Error]:', err);
    } finally {
      setUpdatingAvail(false);
      setAvailMenuOpen(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Field Crew Member';

  return (
    <div className="dashboard-layout collector-workspace-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`dashboard-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Collector Sidebar Navigation */}
      <aside className={`dashboard-sidebar collector-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div>
          <div className="dashboard-sidebar-header">
            <BrandMark size="sm" isInverse={true} />
            <button
              type="button"
              className="dashboard-sidebar-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="admin-badge-indicator" style={{ backgroundColor: 'rgba(217, 243, 106, 0.15)', borderColor: 'var(--color-lime)', color: 'var(--color-lime)' }}>
            <Truck size={14} />
            <span>Sanitation Field Crew</span>
          </div>

          <nav className="dashboard-nav" aria-label="Waste Collector Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/collector/dashboard'}
                  className={({ isActive }) =>
                    `dashboard-nav-item ${isActive ? 'is-active' : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className="dashboard-nav-item-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="dashboard-sidebar-footer">
          <div
            className="dashboard-user-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowProfileModal(true)}
            title="Click to view field crew profile"
          >
            <div className="dashboard-user-avatar" style={{ backgroundColor: 'var(--color-lime)', color: 'var(--color-forest)', fontWeight: 700 }}>
              {userInitial}
            </div>
            <div className="dashboard-user-info">
              <span className="dashboard-user-name" style={{ color: 'var(--color-white)', fontWeight: 600 }}>
                {user?.name || 'Sanitation Collector'}
              </span>
              <span className="dashboard-user-role" style={{ color: 'var(--color-sage)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: currentOption.color
                  }}
                />
                {currentOption.label.split('/')[0].trim()}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.625rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#d1d5db',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-content-area">
        {/* Topbar Navigation */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              type="button"
              className="dashboard-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu size={22} />
            </button>
            <div className="dashboard-topbar-title-wrap">
              <h1 className="dashboard-topbar-title">{title || 'Field Crew Portal'}</h1>
              {subtitle && <p className="dashboard-topbar-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="dashboard-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Collector Availability Control Pill */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setAvailMenuOpen((prev) => !prev)}
                disabled={updatingAvail}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  backgroundColor: currentOption.bg,
                  color: currentOption.color,
                  border: `1px solid ${currentOption.color}40`,
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Change duty availability status"
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: currentOption.color
                  }}
                />
                <span>{updatingAvail ? 'Updating...' : currentOption.label.split('/')[0].trim()}</span>
              </button>

              {availMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    width: '240px',
                    backgroundColor: 'var(--color-paper-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 200,
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Set Field Duty State
                  </div>
                  {availabilityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAvailabilityChange(opt.value)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        backgroundColor: opt.value === currentAvailability ? 'rgba(0,0,0,0.04)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        color: 'var(--color-forest)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: opt.color
                        }}
                      />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-app Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Trigger */}
            <button
              type="button"
              className="dashboard-user-avatar-btn"
              onClick={() => setShowProfileModal(true)}
              aria-label="View collector credentials"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-forest)',
                color: 'var(--color-lime)',
                border: '1px solid var(--color-border)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {userInitial}
            </button>
          </div>
        </header>

        {/* Main Routed Page Surface */}
        <main className="dashboard-main-surface">
          {children}
        </main>
      </div>

      {/* Collector Profile Inspection Modal */}
      {showProfileModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-forest)" />
                <h3 className="admin-modal-title">Field Crew Profile</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-forest)',
                    color: 'var(--color-lime)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px auto'
                  }}
                >
                  {userInitial}
                </div>
                <h4 style={{ margin: 0, color: 'var(--color-forest)', fontSize: '1.125rem' }}>
                  {user?.name}
                </h4>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: currentOption.bg, color: currentOption.color, fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: currentOption.color }} />
                  {currentOption.label}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Role</span>
                  <strong style={{ color: 'var(--color-forest)' }}>Waste Collector</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Email</span>
                  <span style={{ color: 'var(--color-forest)' }}>{user?.email}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Phone</span>
                  <span style={{ color: 'var(--color-forest)' }}>{user?.phone || 'Not registered'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Account Status</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    {(user?.accountStatus || 'ACTIVE').toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Enrolled Since</span>
                  <span style={{ color: 'var(--color-forest)' }}>{formattedDate}</span>
                </div>

                {user?.serviceAreas && user.serviceAreas.length > 0 && (
                  <div style={{ padding: '8px 0' }}>
                    <span style={{ color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>Service Areas</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user.serviceAreas.map((area, i) => (
                        <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(23,84,58,0.08)', color: 'var(--color-forest)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="outline" size="sm" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorLayout;

