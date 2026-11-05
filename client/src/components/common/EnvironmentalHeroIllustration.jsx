import React from 'react';

/**
 * EnvironmentalHeroIllustration Component
 *
 * A refined, premium environmental illustration combining:
 * - Minimal modern city architecture & skyline
 * - Clean tree-lined streetscapes & urban nature
 * - Smart circular waste management & electric transit
 * - Subtle ambient motion without visual clutter
 *
 * Palette: Warm ivory (#F4F1EA), deep slate (#263C38), soft sage (#A9B9AC),
 * muted stone (#D9D2C5), light neutral (#FFFFFF), and restrained lime (#C6D96B).
 */
export const EnvironmentalHeroIllustration = () => {
  return (
    <div
      className="env-hero-illustration-container"
      aria-label="CleanLoop environmental city and smart waste management illustration"
    >
      {/* Ambient background aura */}
      <div className="env-illus-aura" aria-hidden="true" />

      {/* Main SVG Composition */}
      <svg
        className="env-hero-svg"
        viewBox="0 0 540 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="skyGrad" x1="270" y1="0" x2="270" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#F4F1EA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E6E0D4" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="buildingFar" x1="0" y1="120" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D9D2C5" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E2DDD2" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="buildingMid" x1="0" y1="140" x2="0" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A9B9AC" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#D9D2C5" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="buildingNear" x1="0" y1="170" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#263C38" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1C2E2A" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="streetGrad" x1="0" y1="340" x2="540" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#263C38" />
            <stop offset="100%" stopColor="#1B2B28" />
          </linearGradient>

          <linearGradient id="loopGlowGrad" x1="120" y1="140" x2="420" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C6D96B" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#A9B9AC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D9D2C5" stopOpacity="0.2" />
          </linearGradient>

          <filter id="subtleBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Sky / Atmospheric Backdrop */}
        <rect x="20" y="20" width="500" height="420" rx="24" fill="url(#skyGrad)" />

        {/* Sun / Circular Harmonic Disk */}
        <circle cx="390" cy="110" r="48" fill="#F4F1EA" stroke="#D9D2C5" strokeWidth="1.5" />
        <circle cx="390" cy="110" r="36" fill="#FFFFFF" fillOpacity="0.6" />

        {/* Distant City Skyline (Minimal Architectural Silhouette) */}
        <g className="env-skyline-distant">
          {/* Tower A */}
          <rect x="70" y="160" width="34" height="180" rx="3" fill="url(#buildingFar)" />
          {/* Tower B */}
          <rect x="110" y="130" width="46" height="210" rx="3" fill="url(#buildingFar)" />
          {/* Tower C with spire */}
          <rect x="162" y="100" width="38" height="240" rx="3" fill="url(#buildingFar)" />
          <line x1="181" y1="74" x2="181" y2="100" stroke="#D9D2C5" strokeWidth="2" />
          {/* Tower D */}
          <rect x="206" y="145" width="52" height="195" rx="3" fill="url(#buildingFar)" />
          {/* Mid Skyline East */}
          <rect x="330" y="150" width="44" height="190" rx="3" fill="url(#buildingFar)" />
          <rect x="380" y="120" width="40" height="220" rx="3" fill="url(#buildingFar)" />
          <rect x="426" y="170" width="36" height="170" rx="3" fill="url(#buildingFar)" />
        </g>

        {/* Midground Sustainable Civic Architecture */}
        <g className="env-skyline-mid">
          {/* Clean modern building with solar glass */}
          <rect x="90" y="190" width="60" height="150" rx="4" fill="url(#buildingMid)" />
          {/* Window vertical bands */}
          <line x1="105" y1="205" x2="105" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="120" y1="205" x2="120" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="135" y1="205" x2="135" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Green roof terrace */}
          <rect x="86" y="186" width="68" height="5" rx="2" fill="#A9B9AC" />
          <ellipse cx="102" cy="184" rx="8" ry="4" fill="#C6D96B" fillOpacity="0.8" />
          <ellipse cx="132" cy="184" rx="10" ry="5" fill="#A9B9AC" />

          {/* Eco Civic Center East */}
          <rect x="340" y="190" width="80" height="150" rx="4" fill="url(#buildingMid)" />
          <line x1="360" y1="210" x2="360" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="380" y1="210" x2="380" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="400" y1="210" x2="400" y2="330" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
          {/* Rooftop garden terrace */}
          <rect x="336" y="186" width="88" height="5" rx="2" fill="#C6D96B" fillOpacity="0.7" />
        </g>

        {/* Dynamic Closed-Loop Orbital Flow (Symbolizing circularity & waste recovery) */}
        <g className="env-orbital-flow">
          <path
            d="M 60 290 C 90 200, 240 180, 310 240 C 370 290, 460 280, 480 340"
            stroke="url(#loopGlowGrad)"
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          <path
            className="env-flow-pulse"
            d="M 120 250 C 180 200, 280 210, 340 260 C 400 310, 450 320, 470 340"
            stroke="#C6D96B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Clean Municipal Streetscape & Pavement */}
        <g className="env-streetscape">
          {/* Elevated civic esplanade */}
          <path
            d="M 20 340 C 160 340, 380 340, 520 340 L 520 440 L 20 440 Z"
            fill="url(#streetGrad)"
          />
          {/* Clean curb divider line in muted stone */}
          <line x1="20" y1="340" x2="520" y2="340" stroke="#D9D2C5" strokeWidth="2" strokeOpacity="0.6" />
          {/* Tactile pedestrian paving stripe */}
          <line x1="20" y1="362" x2="520" y2="362" stroke="#A9B9AC" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="12 8" />
        </g>

        {/* Nature & Urban Trees (Soft Sage and Lime canopies) */}
        <g className="env-trees">
          {/* Tree Left */}
          <line x1="160" y1="340" x2="160" y2="295" stroke="#D9D2C5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="160" cy="275" r="26" fill="#A9B9AC" fillOpacity="0.9" />
          <circle cx="152" cy="268" r="18" fill="#C6D96B" fillOpacity="0.75" />
          <circle cx="168" cy="278" r="16" fill="#FFFFFF" fillOpacity="0.3" />

          {/* Tree Center-Right */}
          <line x1="310" y1="340" x2="310" y2="285" stroke="#D9D2C5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="310" cy="260" r="30" fill="#263C38" fillOpacity="0.7" />
          <circle cx="304" cy="252" r="22" fill="#A9B9AC" fillOpacity="0.85" />
          <circle cx="318" cy="264" r="18" fill="#C6D96B" fillOpacity="0.65" />

          {/* Tree Far Right */}
          <line x1="470" y1="340" x2="470" y2="305" stroke="#D9D2C5" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="470" cy="285" r="22" fill="#A9B9AC" fillOpacity="0.85" />
          <circle cx="465" cy="278" r="15" fill="#C6D96B" fillOpacity="0.7" />
        </g>

        {/* Smart Waste Hub Station (Foreground Left) */}
        <g className="env-smart-station">
          {/* Base Pad */}
          <rect x="200" y="325" width="76" height="32" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#D9D2C5" strokeWidth="1.5" />
          {/* Three Stream Separation Pods */}
          <rect x="206" y="315" width="18" height="26" rx="3" fill="#263C38" />
          <rect x="229" y="315" width="18" height="26" rx="3" fill="#A9B9AC" />
          <rect x="252" y="315" width="18" height="26" rx="3" fill="#C6D96B" />

          {/* Smart Telemetry Sensor Mast */}
          <line x1="268" y1="315" x2="268" y2="295" stroke="#263C38" strokeWidth="2" strokeLinecap="round" />
          <circle cx="268" cy="294" r="3.5" fill="#C6D96B" className="sensor-beacon-pulse" />
        </g>

        {/* Clean Electric Collection Fleet Vehicle (Foreground Right) */}
        <g className="env-electric-vehicle">
          {/* Vehicle Body */}
          <path
            d="M 370 380 L 440 380 L 452 396 L 452 410 L 366 410 L 366 394 Z"
            fill="#FFFFFF"
            stroke="#D9D2C5"
            strokeWidth="1.5"
          />
          {/* Cabin Windshield */}
          <path
            d="M 428 384 L 444 384 L 448 396 L 428 396 Z"
            fill="#263C38"
            fillOpacity="0.85"
          />
          {/* Electric Green Accent Stripe */}
          <rect x="368" y="400" width="60" height="3" rx="1.5" fill="#C6D96B" />
          {/* Wheels */}
          <circle cx="384" cy="412" r="7" fill="#263C38" stroke="#D9D2C5" strokeWidth="2" />
          <circle cx="436" cy="412" r="7" fill="#263C38" stroke="#D9D2C5" strokeWidth="2" />
          <circle cx="384" cy="412" r="2.5" fill="#C6D96B" />
          <circle cx="436" cy="412" r="2.5" fill="#C6D96B" />
        </g>

        {/* Interactive Floating Civic Seal Tag */}
        <g className="env-floating-tag">
          <rect
            x="60"
            y="70"
            width="170"
            height="38"
            rx="19"
            fill="#FFFFFF"
            stroke="#D9D2C5"
            strokeWidth="1.5"
            filter="url(#subtleBlur)"
          />
          <rect
            x="60"
            y="70"
            width="170"
            height="38"
            rx="19"
            fill="#FFFFFF"
          />
          {/* Pulse node */}
          <circle cx="78" cy="89" r="6" fill="#C6D96B" />
          <circle cx="78" cy="89" r="2.5" fill="#263C38" />
          {/* Tag text */}
          <text
            x="94"
            y="93"
            fontFamily="var(--font-heading, sans-serif)"
            fontSize="11"
            fontWeight="700"
            fill="#263C38"
            letterSpacing="0.04em"
          >
            CLEAN URBAN LOOP
          </text>
        </g>
      </svg>
    </div>
  );
};

export default EnvironmentalHeroIllustration;

