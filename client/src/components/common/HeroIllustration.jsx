import React from 'react';
import { Camera, MapPin, CheckCircle2, Truck, Sparkles, Navigation } from 'lucide-react';

/**
 * HeroIllustration Component
 * Purposeful architectural SVG & CSS visual composition depicting:
 * 1. Citizen photo capture & reporting
 * 2. Precision GPS location tagging
 * 3. Verified municipal dispatch pipeline
 * 4. Resolved pristine neighborhood environment
 */
export const HeroIllustration = () => {
  return (
    <div className="hero-illustration-wrapper" aria-label="Visual workflow diagram of CleanLoop citizen waste reporting and resolution">
      {/* Background architectural grid plane */}
      <div className="hero-illus-backdrop">
        <svg className="hero-grid-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="civic-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#DFE4DC" strokeWidth="1" strokeOpacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#civic-grid)" />
        </svg>
      </div>

      <div className="hero-illus-scene">
        {/* Node 1: Citizen Mobile Capture Card */}
        <div className="illus-card illus-card-report">
          <div className="card-header-bar">
            <span className="card-status-dot pulse-lime" />
            <span className="card-kicker">01 // INCIDENT DETECTED</span>
          </div>
          
          <div className="report-preview-box">
            <div className="camera-frame">
              <Camera size={20} className="camera-icon" />
              <div className="camera-reticle" />
            </div>
            <div className="report-meta">
              <span className="report-subject">Overflowing Public Bin</span>
              <span className="report-coords">
                <MapPin size={12} /> 28.6139° N, 77.2090° E
              </span>
            </div>
          </div>

          <div className="report-status-pill">
            <span className="pill-pulse" />
            <span>Geo-tagged &amp; Transmitted</span>
          </div>
        </div>

        {/* Central Connecting Pipeline Ribbon */}
        <div className="illus-pipeline-spine" aria-hidden="true">
          <svg className="pipeline-svg" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 20 40 C 90 40, 100 130, 200 130"
              stroke="#DFE4DC"
              strokeWidth="3"
              strokeDasharray="6 6"
            />
            <path
              className="flowing-path"
              d="M 20 40 C 90 40, 100 130, 200 130"
              stroke="#D9F36A"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Node 2: Municipal Dispatch & Route Node */}
        <div className="illus-card illus-card-dispatch">
          <div className="dispatch-badge">
            <Truck size={16} />
            <span>Assigned Team: Sector 4 Alpha</span>
          </div>
          <div className="dispatch-route-info">
            <div className="route-indicator">
              <Navigation size={13} className="nav-arrow" />
              <span>Route Optimized &bull; Real-time Dispatch</span>
            </div>
          </div>
        </div>

        {/* Node 3: Restored Clean Urban Environment Scene */}
        <div className="illus-card illus-card-resolution">
          <div className="resolution-header">
            <div className="verified-badge">
              <CheckCircle2 size={16} />
              <span>Status: Resolved &amp; Verified</span>
            </div>
            <span className="sparkle-icon"><Sparkles size={16} /></span>
          </div>

          <div className="clean-street-render">
            <svg viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="street-svg">
              {/* Pristine road and sidewalk */}
              <rect x="0" y="70" width="280" height="40" fill="#285744" rx="2" />
              <line x1="0" y1="90" x2="280" y2="90" stroke="#DFE4DC" strokeWidth="2" strokeDasharray="12 10" />
              
              {/* Sidewalk curb */}
              <rect x="0" y="62" width="280" height="8" fill="#DFE4DC" />
              
              {/* Clean Municipal Waste Container (Lidded, Organized) */}
              <rect x="180" y="24" width="38" height="42" rx="4" fill="#193A2E" stroke="#D9F36A" strokeWidth="2" />
              <rect x="176" y="20" width="46" height="6" rx="2" fill="#D9F36A" />
              <line x1="192" y1="36" x2="192" y2="54" stroke="#9CCDB8" strokeWidth="2" strokeLinecap="round" />
              <line x1="200" y1="36" x2="200" y2="54" stroke="#9CCDB8" strokeWidth="2" strokeLinecap="round" />
              <line x1="208" y1="36" x2="208" y2="54" stroke="#9CCDB8" strokeWidth="2" strokeLinecap="round" />
              
              {/* Urban Greenery / Tree */}
              <rect x="58" y="38" width="6" height="26" fill="#77847B" rx="1" />
              <circle cx="61" cy="28" r="18" fill="#9CCDB8" fillOpacity="0.9" />
              <circle cx="70" cy="22" r="14" fill="#285744" />
              <circle cx="52" cy="24" r="12" fill="#D9F36A" fillOpacity="0.85" />
              
              {/* Cleanliness sparkle nodes */}
              <circle cx="160" cy="30" r="2.5" fill="#D9F36A" />
              <circle cx="140" cy="48" r="1.5" fill="#FFFFFF" />
              <circle cx="236" cy="35" r="2" fill="#D9F36A" />
            </svg>
          </div>

          <div className="resolution-footer">
            <span className="res-tag">Municipal Audit Passed</span>
            <span className="res-date">Audit Trail Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroIllustration;
