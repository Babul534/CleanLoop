import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  Home,
  LogOut,
  Menu,
  X,
  Shield,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  Plus,
  Bell,
  Award,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';

export const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Report Garbage', to: '/report-issue', icon: PlusCircle },
    { label: 'My Reports', to: '/my-reports', icon: FileText },
    { label: 'Green Points', to: '/rewards', icon: Award },
    { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { label: 'Notifications', to: '/notifications', icon: Bell }
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Active Member';

  return (
    <div className="dashboard-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`dashboard-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
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

          <nav className="dashboard-nav" aria-label="Citizen Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
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

            <button
              type="button"
              className="dashboard-nav-item"
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => {
                setShowProfileModal(true);
                setMobileMenuOpen(false);
              }}
            >
              <User size={18} className="dashboard-nav-item-icon" />
              <span>Civic Profile</span>
            </button>

            <Link
              to="/"
              className="dashboard-nav-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ marginTop: 'auto', opacity: 0.8 }}
            >
              <Home size={18} className="dashboard-nav-item-icon" />
              <span>Public Home</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer with Logged In User Meta */}
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-user-card">
            <div className="dashboard-user-avatar">{userInitial}</div>
            <div className="dashboard-user-meta">
              <div className="dashboard-user-name" title={user?.name}>
                {user?.name || 'Citizen'}
              </div>
              <span className="dashboard-user-role-badge">Verified Citizen</span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={handleLogout}
            aria-label="Sign out of CleanLoop"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="dashboard-main-col">
        {/* Topbar */}
        <header className="dashboard-topbar">
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
              <h1 className="dashboard-greeting-title">
                {title || `Welcome back, ${user?.name ? user.name.split(' ')[0] : 'Citizen'}`}
              </h1>
              <p className="dashboard-greeting-subtitle">
                {subtitle || 'Clean neighborhoods start with verified, accountable reporting.'}
              </p>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <NotificationBell />
            <Button
              variant="secondary"
              size="sm"
              to="/report-issue"
              icon={Plus}
              className="header-cta-btn"
            >
              Report Garbage
            </Button>
          </div>
        </header>

        {/* Main Body */}
        <main className="dashboard-content-body">{children}</main>
      </div>

      {/* Profile Details Modal */}
      {showProfileModal && (
        <div className="detail-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div
            className="detail-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.15rem' }}>
                Civic Participant Profile
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <div className="dashboard-user-avatar" style={{ width: '52px', height: '52px', fontSize: '1.25rem' }}>
                  {userInitial}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-forest)' }}>
                    {user?.name}
                  </h4>
                  <span className="badge badge-priority-medium">Citizen Participant</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Mail size={16} color="var(--color-muted)" />
                  <strong>Email:</strong> {user?.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Phone size={16} color="var(--color-muted)" />
                  <strong>Phone:</strong> {user?.phone || 'Not provided'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Calendar size={16} color="var(--color-muted)" />
                  <strong>Joined:</strong> {formattedDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <CheckCircle2 size={16} color="#17543A" />
                  <strong>Status:</strong> Active Civic Participant
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <Shield size={16} color="var(--color-forest)" />
                  <strong>ID:</strong> <code style={{ fontSize: '0.78rem' }}>{user?._id || user?.id}</code>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <Button variant="outline" size="sm" onClick={() => setShowProfileModal(false)} style={{ width: '100%' }}>
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

export default DashboardLayout;

