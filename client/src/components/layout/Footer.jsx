import React from 'react';
import BrandMark from '../common/BrandMark';
import Container from '../common/Container';
import SectionLabel from '../common/SectionLabel';

/**
 * Footer Component
 * Architectural, authoritative civic-tech footer adhering to CleanLoop design system.
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (e, id) => {
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <footer className="site-footer" id="about">
      <Container>
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <BrandMark size="lg" showWordmark={true} showTagline={true} inverse={true} />
            <p className="footer-mission-text">
              CleanLoop is a modern civic-technology initiative engineered to connect proactive residents
              directly with municipal waste sanitation departments for faster, verifiable public cleanups.
            </p>
            <div className="footer-tagline-badge">
              &ldquo;A cleaner city. One report at a time.&rdquo;
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#hero" onClick={(e) => handleScrollTo(e, 'hero')}>Home</a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')}>How It Works</a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleScrollTo(e, 'features')}>Core Capabilities</a>
              </li>
              <li>
                <a href="#impact" onClick={(e) => handleScrollTo(e, 'impact')}>Civic Impact</a>
              </li>
            </ul>
          </div>

          {/* Architecture / Modules */}
          <div className="footer-col">
            <h4 className="footer-col-title">System Modules</h4>
            <ul className="footer-nav-list">
              <li><span>Citizen Reporting Hub</span></li>
              <li><span>Dispatch & Allocation</span></li>
              <li><span>Real-time GPS Audit</span></li>
              <li><span>Green Points Network</span></li>
              <li><span>Sanitation Analytics</span></li>
            </ul>
          </div>

          {/* Academic & Demonstration Context */}
          <div className="footer-col">
            <h4 className="footer-col-title">Project Context</h4>
            <div className="footer-notice-box">
              <span className="footer-notice-tag">Capstone Demonstration</span>
              <p className="footer-notice-text">
                CleanLoop — Smart Waste Management System. Developed as an institutional computer science & civic engineering capstone project.
              </p>
              <div className="footer-contact-placeholder">
                <span className="placeholder-label">[Inquiry Channel Placeholder]</span>
                <span className="placeholder-value">demonstration@cleanloop.internal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-meta-info">
            &copy; {currentYear} CleanLoop — Smart Waste Management System. All rights reserved.
          </div>
          <div className="footer-tech-stack">
            <span>Built with React &amp; Express</span>
            <span className="separator">&bull;</span>
            <span>Civic Tech Architecture</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

