import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, ArrowUpRight, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import Button from '../common/Button';
import Container from '../common/Container';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar Component
 * Responsive civic navigation header with scroll-reactive elevation,
 * mobile drawer toggle, keyboard accessibility, and dynamic authentication actions.
 */
export const Navbar = () => {
  const isScrolled = useScrollHeader(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const dashboardRoute = user?.role === 'user' ? '/dashboard' : '/workspace';
  const dashboardLabel = user?.role === 'user' ? 'Dashboard' : 'Workspace';

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '/#hero' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'Impact', href: '/#impact' },
    { label: 'About', href: '/#about' },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      
      if (location.pathname === '/') {
        e.preventDefault();
        setMobileMenuOpen(false);

        if (targetId === 'hero' || targetId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState(null, '', window.location.pathname);
          return;
        }

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${targetId}`);
        }
      } else {
        // Navigating from a sub-page back to home with hash
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <Container className="site-header-container">
        <div className="site-header-left">
          <BrandMark size="md" showWordmark={true} />
        </div>

        {/* Desktop Navigation */}
        <nav className="site-nav-desktop" aria-label="Main Navigation">
          <ul className="nav-list">
            {navLinks.map((item) => (
              <li key={item.label} className="nav-item">
                <a
                  href={item.href}
                  className="nav-link"
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Actions: Authenticated vs Unauthenticated */}
        <div className="site-header-actions">
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                to={dashboardRoute}
                icon={LayoutDashboard}
                className="header-cta-btn"
              >
                {dashboardLabel}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                icon={LogOut}
                aria-label="Sign out of CleanLoop"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                style={{ fontWeight: 600, padding: '0.4rem 0.6rem' }}
              >
                Sign In
              </Link>
              <Button
                variant="secondary"
                size="sm"
                to="/register"
                icon={ArrowUpRight}
                className="header-cta-btn"
              >
                Register
              </Button>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-navigation"
        className={`site-nav-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="site-nav-mobile-drawer">
          <div className="mobile-drawer-header">
            <BrandMark size="md" showWordmark={true} />
            <button
              type="button"
              className="mobile-drawer-close"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <nav className="mobile-nav-list" aria-label="Mobile Navigation">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="mobile-nav-link"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  to={dashboardRoute}
                  icon={LayoutDashboard}
                  className="mobile-cta-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {dashboardLabel}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  icon={LogOut}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  to="/register"
                  icon={ArrowUpRight}
                  className="mobile-cta-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register Citizen Account
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  to="/login"
                  icon={LogIn}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Sign In
                </Button>
              </>
            )}
            <p className="mobile-drawer-tagline">
              A cleaner city. One report at a time.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
