import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Camera,
  Activity,
  Route,
  Map,
  Award,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Eye,
  TreePine,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Compass
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import SectionLabel from '../components/common/SectionLabel';
import RevealSection from '../components/common/RevealSection';
import EnvironmentalHeroIllustration from '../components/common/EnvironmentalHeroIllustration';
import CinematicSplashScreen from '../components/splash/CinematicSplashScreen';
import { getPublicImpactStats } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';

/**
 * CleanLoop Premium Homepage
 * Refined civic identity: Warm ivory (#F4F1EA), deep slate (#263C38),
 * soft sage (#A9B9AC), muted stone (#D9D2C5), light neutral (#FFFFFF), and restrained lime (#C6D96B).
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Splash Screen State — plays once per browser session
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const viewed = sessionStorage.getItem('cleanloop_splash_viewed');
      if (viewed === 'true') return false;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  });

  // Real Database Impact Statistics (Strictly no fabricated numbers)
  const [impactStats, setImpactStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    inProgressReports: 0,
    resolutionRate: 100,
    loaded: false
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await getPublicImpactStats();
        if (res?.success && res.stats && isMounted) {
          setImpactStats({
            ...res.stats,
            loaded: true
          });
        }
      } catch (err) {
        console.warn('[Impact Stats Note]: Using verified database fallbacks if network restricted.');
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // If arriving with a hash, smoothly scroll to target
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const scrollTo = (id) => {
    if (id === 'hero' || id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', window.location.pathname);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const handleReportAction = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/report-issue');
    } else if (user?.role === 'user') {
      navigate('/report-issue');
    } else {
      navigate('/workspace');
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleReplayIntro = () => {
    setShowSplash(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper">
      {/* CINEMATIC SPLASH OPENING EXPERIENCE */}
      {showSplash && <CinematicSplashScreen onComplete={handleSplashComplete} />}

      {/* SECTION 1 — NAVIGATION BAR */}
      <Navbar />

      <main className="main-content">
        {/* ================================================================= */}
        {/* SECTION 2 — HERO SECTION (SPACIOUS TWO-COLUMN LAYOUT) */}
        {/* ================================================================= */}
        <section className="hero-section" id="hero">
          <Container>
            <div className="hero-grid">
              {/* Left Column: Editorial Headline & Actions */}
              <div className="hero-content">
                <div className="hero-kicker-row">
                  <SectionLabel variant="forest" number="CIVIC SANITATION">
                    Smart Community Stewardship
                  </SectionLabel>
                  <div className="hero-civic-badge">
                    <span className="badge-pulse-node" aria-hidden="true" />
                    <span>Closed-Loop Accountability</span>
                  </div>
                </div>

                <h1 className="hero-headline">
                  Small Actions. <span className="highlight-text">Cleaner Streets.</span> Better Tomorrow.
                </h1>

                <p className="hero-subtext">
                  Report waste, track municipal action, and see the difference your community can make.
                </p>

                <div className="hero-cta-group">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleReportAction}
                    icon={ArrowRight}
                    className="hero-primary-cta"
                  >
                    Report an Issue
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => scrollTo('how-it-works')}
                    className="hero-secondary-cta"
                  >
                    Discover How It Works
                  </Button>
                </div>

                {/* Assurance & Core Principles Banner */}
                <div className="hero-trust-bar">
                  <div className="trust-item">
                    <CheckCircle2 size={16} className="trust-icon" />
                    <span>Geo-Tagged Evidence</span>
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <ShieldCheck size={16} className="trust-icon" />
                    <span>Municipal Crew Dispatch</span>
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <Clock size={16} className="trust-icon" />
                    <span>Before &amp; After Proof</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Premium Environmental Illustration */}
              <div className="hero-visual">
                <EnvironmentalHeroIllustration />
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3 — HOW IT WORKS (THREE SPACIOUS STEPS) */}
        {/* ================================================================= */}
        <section className="how-it-works-section" id="how-it-works">
          <Container>
            <div className="section-header-block">
              <SectionLabel variant="forest" number="01">
                Workflow Lifecycle
              </SectionLabel>
              <h2 className="section-title">
                Three deliberate stages. Zero bureaucratic silence.
              </h2>
              <p className="section-subtitle">
                CleanLoop transforms disorderly waste complaints into an auditable, closed-loop resolution sequence.
              </p>
            </div>

            <div className="workflow-timeline-wrapper">
              <div className="workflow-spine" aria-hidden="true" />

              <div className="workflow-steps-grid">
                {/* Step 01 */}
                <RevealSection animation="fade-up" delay={0} className="step-card-wrapper">
                  <div className="step-card">
                    <div className="step-card-header">
                      <span className="step-index">01</span>
                      <div className="step-icon-badge">
                        <Camera size={22} />
                      </div>
                    </div>
                    <div className="step-card-body">
                      <h3 className="step-title">Report the Incident</h3>
                      <p className="step-description">
                        Residents capture clear photographic evidence of street refuse or overflowing bins.
                        Precise GPS coordinates are verified automatically against municipal ward boundaries.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Geo-Tagged Submission</span>
                      <span className="step-meta-note">Citizen Action</span>
                    </div>
                  </div>
                </RevealSection>

                {/* Step 02 */}
                <RevealSection animation="fade-up" delay={150} className="step-card-wrapper">
                  <div className="step-card is-accented">
                    <div className="step-card-header">
                      <span className="step-index">02</span>
                      <div className="step-icon-badge">
                        <Route size={22} />
                      </div>
                    </div>
                    <div className="step-card-body">
                      <h3 className="step-title">Municipal Dispatch</h3>
                      <p className="step-description">
                        Municipal supervisors review incoming reports on a regional queue and deploy sanitation
                        teams with balanced route allocation and vehicle optimization.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Route Optimization</span>
                      <span className="step-meta-note">Remediation Stage</span>
                    </div>
                  </div>
                </RevealSection>

                {/* Step 03 */}
                <RevealSection animation="fade-up" delay={300} className="step-card-wrapper">
                  <div className="step-card">
                    <div className="step-card-header">
                      <span className="step-index">03</span>
                      <div className="step-icon-badge">
                        <Sparkles size={22} />
                      </div>
                    </div>
                    <div className="step-card-body">
                      <h3 className="step-title">Verified Resolution</h3>
                      <p className="step-description">
                        Sanitation crews upload completion photographs. Supervisors confirm clearance through
                        Before &amp; After photo comparison, awarding citizen Green Points upon verification.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Audited Verification</span>
                      <span className="step-meta-note">Green Points Rewarded</span>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* SECTION 4 — FEATURES (SIX CONSISTENT BALANCED CARDS) */}
        {/* ================================================================= */}
        <section className="features-section" id="features">
          <Container>
            <div className="section-header-block">
              <SectionLabel variant="forest" number="02">
                Core Capabilities
              </SectionLabel>
              <h2 className="section-title">
                Targeted capabilities engineered for civic accountability
              </h2>
              <p className="section-subtitle">
                Purpose-built municipal tools connecting residents, supervisors, and sanitation teams.
              </p>
            </div>

            <div className="features-consistent-grid">
              {/* Feature 1 */}
              <RevealSection animation="fade-up" delay={0} className="feature-card-clean">
                <div className="feature-card-icon-wrap">
                  <MapPin size={22} />
                </div>
                <h3 className="feature-card-title">Precision Geolocation Tagging</h3>
                <p className="feature-card-text">
                  Pinpoint waste incidents with high-accuracy GPS coordinates and automated ward zoning,
                  preventing ambiguous descriptions and misdirected collection routes.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag">Location Intelligence</span>
                </div>
              </RevealSection>

              {/* Feature 2 */}
              <RevealSection animation="fade-up" delay={100} className="feature-card-clean">
                <div className="feature-card-icon-wrap">
                  <Camera size={22} />
                </div>
                <h3 className="feature-card-title">Before &amp; After Photo Proof</h3>
                <p className="feature-card-text">
                  Direct side-by-side photographic comparison allows supervisors to verify remediation
                  evidence before marking complaints resolved and awarding civic rewards.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag">Visual Verification</span>
                </div>
              </RevealSection>

              {/* Feature 3 */}
              <RevealSection animation="fade-up" delay={150} className="feature-card-clean">
                <div className="feature-card-icon-wrap">
                  <Activity size={22} />
                </div>
                <h3 className="feature-card-title">Real-Time Lifecycle Tracking</h3>
                <p className="feature-card-text">
                  Follow report states through an auditable, transparent status sequence: Submitted &rarr;
                  Under Review &rarr; In Progress &rarr; Verified &amp; Resolved.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag">Immutable Audit Trail</span>
                </div>
              </RevealSection>

              {/* Feature 4 */}
              <RevealSection animation="fade-up" delay={200} className="feature-card-clean">
                <div className="feature-card-icon-wrap">
                  <Route size={22} />
                </div>
                <h3 className="feature-card-title">Smart Fleet Route Allocation</h3>
                <p className="feature-card-text">
                  Distribute work orders evenly across active sanitation crews factoring in geographic proximity,
                  vehicle capability, and active task workloads.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag">Balanced Dispatch</span>
                </div>
              </RevealSection>

              {/* Feature 5 */}
              <RevealSection animation="fade-up" delay={250} className="feature-card-clean">
                <div className="feature-card-icon-wrap">
                  <Map size={22} />
                </div>
                <h3 className="feature-card-title">Interactive City Heatmap</h3>
                <p className="feature-card-text">
                  Explore neighborhood cleanliness clusters and complaint hot-spots in real time, enabling
                  municipal planners to deploy receptacles and optimize route frequencies.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag">Spatial Clustering</span>
                </div>
              </RevealSection>

              {/* Feature 6 */}
              <RevealSection animation="fade-up" delay={300} className="feature-card-clean feature-card-highlight">
                <div className="feature-card-icon-wrap icon-lime-accent">
                  <Award size={22} />
                </div>
                <h3 className="feature-card-title">Civic Green Points &amp; Leaderboard</h3>
                <p className="feature-card-text">
                  Recognize civic-minded citizens who document neighborhood incidents. Earn Green Points,
                  unlock milestone achievements, and climb the public community leaderboard.
                </p>
                <div className="feature-card-footer">
                  <span className="feature-card-tag tag-lime">Civic Rewards</span>
                </div>
              </RevealSection>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* SECTION 5 — IMPACT (ACTUAL DATABASE STATISTICS & CIVIC PILLARS) */}
        {/* ================================================================= */}
        <section className="impact-section" id="impact">
          <Container>
            <div className="section-header-block">
              <SectionLabel variant="lime" number="03">
                Civic Impact
              </SectionLabel>
              <h2 className="section-title">
                Actual impact across our municipal network
              </h2>
              <p className="section-subtitle">
                Measurable civic improvements powered by active resident vigilance and responsive public service.
              </p>
            </div>

            {/* Real Statistics Metric Ribbon (Strictly from MongoDB) */}
            <div className="impact-stats-ribbon">
              <div className="impact-stat-box">
                <span className="impact-stat-number">
                  {impactStats.loaded ? impactStats.totalReports : '—'}
                </span>
                <span className="impact-stat-label">Total Incidents Reported</span>
                <span className="impact-stat-sub">Documented by citizens</span>
              </div>

              <div className="impact-stat-box is-highlight">
                <span className="impact-stat-number stat-lime">
                  {impactStats.loaded ? impactStats.resolvedReports : '—'}
                </span>
                <span className="impact-stat-label">Verified Cleanups Resolved</span>
                <span className="impact-stat-sub">Audited with photo evidence</span>
              </div>

              <div className="impact-stat-box">
                <span className="impact-stat-number">
                  {impactStats.loaded ? impactStats.inProgressReports : '—'}
                </span>
                <span className="impact-stat-label">Active Remediation Pipeline</span>
                <span className="impact-stat-sub">Field crews dispatched</span>
              </div>

              <div className="impact-stat-box">
                <span className="impact-stat-number">
                  {impactStats.loaded ? `${impactStats.resolutionRate}%` : '—'}
                </span>
                <span className="impact-stat-label">Resolution Efficiency Rate</span>
                <span className="impact-stat-sub">Verified closure ratio</span>
              </div>
            </div>

            {/* Four Qualitative Civic Pillars */}
            <div className="impact-pillars-grid">
              <div className="impact-pillar-card">
                <div className="pillar-icon-box">
                  <TreePine size={22} />
                </div>
                <h3 className="pillar-card-title">Cleaner, Healthier Neighborhoods</h3>
                <p className="pillar-card-text">
                  Prompt refuse collection prevents waste decomposition, pest infestation, and stormwater
                  drainage obstruction during heavy weather.
                </p>
              </div>

              <div className="impact-pillar-card">
                <div className="pillar-icon-box">
                  <Clock size={22} />
                </div>
                <h3 className="pillar-card-title">Faster Turnaround Cycles</h3>
                <p className="pillar-card-text">
                  Direct digital dispatch cuts paperwork loops between municipal offices, reducing
                  remediation lag from weeks to focused operational shifts.
                </p>
              </div>

              <div className="impact-pillar-card">
                <div className="pillar-icon-box">
                  <Eye size={22} />
                </div>
                <h3 className="pillar-card-title">Transparent Waste Governance</h3>
                <p className="pillar-card-text">
                  Public timelines ensure residents and municipal leaders maintain an immutable, shared
                  record of when incidents were submitted, verified, and resolved.
                </p>
              </div>

              <div className="impact-pillar-card">
                <div className="pillar-icon-box">
                  <Users size={22} />
                </div>
                <h3 className="pillar-card-title">Active Citizen Co-Management</h3>
                <p className="pillar-card-text">
                  Residents transform from frustrated bystanders into empowered participants co-managing
                  their public streetscapes alongside city crews.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* SECTION 6 — ABOUT CLEANLOOP SECTION */}
        {/* ================================================================= */}
        <section className="about-section" id="about-section">
          <Container size="narrow">
            <div className="about-editorial-card">
              <SectionLabel variant="forest" number="04">
                About CleanLoop
              </SectionLabel>
              <h2 className="about-title">
                Transforming urban waste management into a transparent closed loop.
              </h2>
              <p className="about-body-lead">
                Every neglected heap of street refuse begins when someone walks past it assuming someone else
                will take care of it. Standard municipal complaint systems often swallow citizen reports into
                opaque bureaucratic queues where tickets stall without updates or proof.
              </p>
              <p className="about-body-secondary">
                CleanLoop replaces this breakdown with an end-to-end civic operating platform. From precision
                GPS logging and algorithmic dispatch to Before &amp; After photo verification and civic Green Points,
                we provide the transparency required to keep our shared public spaces clean, healthy, and dignified.
              </p>
              <div className="about-badges-row">
                <span className="about-pill">Public Accountability</span>
                <span className="about-pill">Zero Paid Paywalls</span>
                <span className="about-pill">Civic Tech Architecture</span>
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* SECTION 7 — CALL TO ACTION */}
        {/* ================================================================= */}
        <section className="cta-section">
          <Container size="narrow">
            <RevealSection animation="fade-up" className="cta-card">
              <SectionLabel variant="lime" number="ACT NOW">
                Civic Action
              </SectionLabel>
              <h2 className="cta-headline">
                Your neighborhood deserves better.
              </h2>
              <p className="cta-subtext">
                Join proactive residents in creating cleaner, healthier public streets.
                Document uncollected refuse and give municipal collection crews the exact intelligence needed.
              </p>
              <div className="cta-button-row">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleReportAction}
                  icon={ArrowRight}
                  className="cta-primary-btn"
                >
                  Report an Issue
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => scrollTo('how-it-works')}
                  className="cta-secondary-btn"
                >
                  Discover How It Works
                </Button>
              </div>
            </RevealSection>
          </Container>
        </section>
      </main>

      {/* SECTION 8 — FOOTER */}
      <Footer onReplayIntro={handleReplayIntro} />
    </div>
  );
};

export default HomePage;
