import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './splash.css';

/**
 * CinematicSplashScreen Component
 *
 * A premium, elegant, animated opening experience for CleanLoop.
 * Visual Direction:
 * - Minimal, elegant, modern.
 * - Warm ivory (#F4F1EA), deep slate (#263C38), soft sage (#A9B9AC),
 *   muted stone (#D9D2C5), light neutral (#FFFFFF), and restrained lime (#C6D96B).
 *
 * Sequence:
 * 1. Scene 1 — Ambient Opening (0s - 1.2s): Warm ivory background, diffused light, soft drifting particles.
 * 2. Scene 2 — Logo Formation (1.2s - 2.6s): CleanLoop emblem with smooth rotation, scale, and organic leaf sweep.
 * 3. Scene 3 — Brand Reveal (2.6s - 3.8s): CLEANLOOP typography with letter-spacing animation and tagline reveal.
 * 4. Scene 4 — Transition (3.8s - 4.5s): Cinematic aperture dissolve revealing the homepage.
 */
export const CinematicSplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('ambient'); // 'ambient' | 'logo' | 'brand' | 'transition'
  const [isExiting, setIsExiting] = useState(false);

  // Generate lightweight ambient organic particles (stable across renders)
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: (i * 17 + 7) % 94 + 3,
      y: (i * 23 + 11) % 90 + 5,
      size: (i % 4) * 2 + 3,
      duration: 5 + (i % 5) * 1.5,
      delay: (i % 7) * 0.3,
      opacity: 0.12 + (i % 5) * 0.05,
      color: i % 3 === 0 ? '#C6D96B' : i % 2 === 0 ? '#A9B9AC' : '#D9D2C5'
    }));
  }, []);

  // Completion / Skip Handler
  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem('cleanloop_splash_viewed', 'true');
    } catch (_) {
      // Handle private browsing or restricted quota gracefully
    }
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      finishSplash();
    }, 240);
  }, [finishSplash]);

  // Keyboard shortcut: Escape or Space to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Main Choreography Timeline
  useEffect(() => {
    // Respect user's reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishSplash();
      return;
    }

    // Scene 2: Logo Formation begins at 1200ms
    const t1 = setTimeout(() => {
      setPhase('logo');
    }, 1200);

    // Scene 3: Brand Reveal begins at 2500ms
    const t2 = setTimeout(() => {
      setPhase('brand');
    }, 2500);

    // Scene 4: Cinematic Exit Transition begins at 3800ms
    const t3 = setTimeout(() => {
      setPhase('transition');
      setIsExiting(true);
    }, 3800);

    // Complete and unmount at 4500ms
    const t4 = setTimeout(() => {
      finishSplash();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [finishSplash]);

  return (
    <div
      className={`cinematic-splash-viewport ${isExiting ? 'is-exiting' : ''} phase-${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label="CleanLoop Brand Introduction"
    >
      {/* Ambient Lighting & Diffused Ray Planes */}
      <div className="splash-ambient-plane" aria-hidden="true" />
      <div className="splash-glow-core" aria-hidden="true" />

      {/* Floating Organic Particles */}
      <div className="splash-particles-container" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="splash-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Skip Intro Button */}
      <div className="splash-controls">
        <button
          type="button"
          onClick={handleSkip}
          className="splash-skip-btn"
          aria-label="Skip introduction animation"
        >
          <span>Skip Intro</span>
          <span className="skip-arrow" aria-hidden="true">&rarr;</span>
        </button>
      </div>

      {/* Central Visual Composition */}
      <div className="splash-center-stage">
        {/* Emblem Presentation Box */}
        <div className="splash-emblem-wrap">
          <div className="emblem-halo-pulse" aria-hidden="true" />
          
          <svg
            className="splash-emblem-svg"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#263C38" />
                <stop offset="100%" stopColor="#1B2D2A" />
              </linearGradient>

              <linearGradient id="loopRibbonGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C6D96B" />
                <stop offset="45%" stopColor="#A9B9AC" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>

              <linearGradient id="leafGrad" x1="60" y1="25" x2="90" y2="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C6D96B" />
                <stop offset="100%" stopColor="#A9B9AC" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Shield Foundation (Clean rounded municipal geometry) */}
            <rect
              className="emblem-shield-base"
              x="8"
              y="8"
              width="104"
              height="104"
              rx="28"
              fill="url(#shieldGrad)"
            />

            {/* Subtle Inner Concentric Boundary Ring */}
            <circle
              className="emblem-inner-orbit"
              cx="60"
              cy="60"
              r="40"
              stroke="#D9D2C5"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              strokeOpacity="0.45"
            />

            {/* Continuous Closed-Loop Orbital Arch */}
            <path
              className="emblem-loop-path"
              d="M 34 60 C 34 45.64 45.64 34 60 34 C 74.36 34 86 45.64 86 60 C 86 74.36 74.36 86 60 86 C 48 86 38.5 78 35.5 68"
              stroke="url(#loopRibbonGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Organic Leaf Sweep (Unfurls along upper right quadrant) */}
            <path
              className="emblem-leaf-shape"
              d="M 60 34 C 68 26 82 28 88 38 C 90 48 80 58 68 58 C 66 46 62 38 60 34 Z"
              fill="url(#leafGrad)"
              filter="url(#softGlow)"
              opacity="0.95"
            />

            {/* Harmonic Center Core */}
            <circle
              className="emblem-core-dot"
              cx="60"
              cy="60"
              r="4"
              fill="#FFFFFF"
            />

            {/* Satellite Action Node (Restrained Lime) */}
            <circle
              className="emblem-satellite-node"
              cx="86"
              cy="60"
              r="5"
              fill="#C6D96B"
            />
          </svg>
        </div>

        {/* Brand Typographic Reveal */}
        <div className="splash-brand-group">
          <div className="splash-wordmark-row">
            <h1 className="splash-title">
              <span className="title-letter">C</span>
              <span className="title-letter">L</span>
              <span className="title-letter">E</span>
              <span className="title-letter">A</span>
              <span className="title-letter">N</span>
              <span className="title-letter title-accent">L</span>
              <span className="title-letter title-accent">O</span>
              <span className="title-letter title-accent">O</span>
              <span className="title-letter title-accent">P</span>
            </h1>
          </div>

          <div className="splash-divider-line" aria-hidden="true" />

          <p className="splash-tagline">
            Small Actions. Cleaner Tomorrow.
          </p>
        </div>
      </div>

      {/* Bottom Subtitle / Year Indicator */}
      <div className="splash-footer-bar" aria-hidden="true">
        <span className="splash-micro-label">CIVIC SANITATION NETWORK</span>
      </div>
    </div>
  );
};

export default CinematicSplashScreen;

