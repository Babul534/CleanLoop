import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  ShieldAlert,
  MapPin,
  Home,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';

export const AdminLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'City Map Analytics', to: '/admin/map', icon: MapPin },
    { label: 'Complaints Triage', to: '/admin/complaints', icon: ClipboardList },
    { label: 'Field Collectors', to: '/admin/collectors', icon: Users },
    { label: 'Task Assignments', to: '/admin/assignments', icon: Truck },
    { label: 'Activity Audit', to: '/admin/activity', icon: ShieldAlert },
    { label: 'Reward Schemes', to: '/admin/rewards', icon: Award }
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Commissioned Officer';

  return (
    <div className="dashboard-layout admin-workspace-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`dashboard-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Admin Sidebar Navigation */}
      <aside className={`dashboard-sidebar admin-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
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

          <div className="admin-badge-indicator">
            <ShieldCheck size={14} />
            <span>Municipal Dispatch Control</span>
          </div>

          <nav className="dashboard-nav" aria-label="Administrator Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `dashboard-nav-item admin-nav-item ${isActive ? 'is-active' : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className="dashboard-nav-item-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              className="dashboard-nav-item admin-nav-item"
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onClick={() => {
                setShowProfileModal(true);
                setMobileMenuOpen(false);
              }}
            >
              <User size={18} className="dashboard-nav-item-icon" />
              <span>Supervisor Profile</span>
            </button>

            <Link
              to="/"
              className="dashboard-nav-item admin-nav-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ marginTop: 'auto', opacity: 0.8 }}
            >
              <Home size={18} className="dashboard-nav-item-icon" />
              <span>Public Portal</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="dashboard-sidebar-footer admin-sidebar-footer">
          <div className="dashboard-user-card">
            <div className="dashboard-user-avatar admin-avatar">{userInitial}</div>
            <div className="dashboard-user-meta">
              <div className="dashboard-user-name" title={user?.name}>
                {user?.name || 'Administrator'}
              </div>
              <span className="badge badge-priority-high" style={{ fontSize: '0.65rem' }}>
                Municipal Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={handleLogout}
            aria-label="Sign out of CleanLoop Administration"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="dashboard-main-col">
        {/* Topbar */}
        <header className="dashboard-topbar admin-topbar">
          <div className="dashboard-topbar-left">
            <button
              type="button"
              className="dashboard-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="dashboard-greeting-title admin-title">
                  {title || 'Command Overview'}
                </h1>
                <span className="admin-status-pill">Live Operations</span>
              </div>
              <p className="dashboard-greeting-subtitle">
                {subtitle || 'Supervisory audit, triage and field dispatch controls.'}
              </p>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              to="/admin/complaints"
              icon={ClipboardList}
              className="header-cta-btn"
            >
              Triage Queue
            </Button>
          </div>
        </header>

        {/* Main Body */}
        <main className="dashboard-content-body">{children}</main>
      </div>

      {/* Admin Profile Modal */}
      {showProfileModal && (
        <div className="detail-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div
            className="detail-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-forest)',
                  fontSize: '1.15rem'
                }}
              >
                Administrative Officer Credentials
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-modal-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div
                  className="dashboard-user-avatar admin-avatar"
                  style={{ width: '52px', height: '52px', fontSize: '1.25rem' }}
                >
                  {userInitial}
                </div>
                <div>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.1rem',
                      color: 'var(--color-forest)'
                    }}
                  >
                    {user?.name}
                  </h4>
                  <span className="badge badge-priority-high">Supervisory Clearance</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  fontSize: '0.875rem',
                  marginTop: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Mail size={16} color="var(--color-muted)" />
                  <strong>Official Email:</strong> {user?.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Phone size={16} color="var(--color-muted)" />
                  <strong>Dispatch Phone:</strong> {user?.phone || 'Not configured'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Calendar size={16} color="var(--color-muted)" />
                  <strong>Commissioned:</strong> {formattedDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <ShieldCheck size={16} color="#17543A" />
                  <strong>Authorization:</strong> Full Municipal Oversight
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileModal(false)}
                  style={{ width: '100%' }}
                >
                  Close Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

