import React, { useState, useEffect } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import SectionLabel from '../components/common/SectionLabel';
import RevealSection from '../components/common/RevealSection';
import HeroIllustration from '../components/common/HeroIllustration';
import { checkApiHealth } from '../services/api';

export const HomePage = () => {
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

  return (
    <div className="page-wrapper">
      {/* SECTION 1 — NAVIGATION BAR */}
      <Navbar />

      <main className="main-content">
        {/* SECTION 2 — HERO SECTION */}
        <section className="hero-section" id="hero">
          <Container>
            <div className="hero-grid">
              {/* Left Column: Editorial Headline & Actions */}
              <div className="hero-content">
                <div className="hero-kicker-row">
                  <SectionLabel variant="forest" number="CIVIC CONCEPT">
                    Smart Sanitation Network
                  </SectionLabel>
                  
                  <div className="illustrative-workflow-tag">
                    <span className="tag-dot" aria-hidden="true" />
                    <span>Illustrative workflow</span>
                  </div>
                </div>

                <h1 className="hero-headline">
                  Cleaner streets begin with <span className="highlight-text">one simple report.</span>
                </h1>

                <p className="hero-subtext">
                  Spot an overflowing bin or a garbage-filled street? Report it, track the cleanup,
                  and help your community stay cleaner.
                </p>

                <div className="hero-cta-group">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => scrollTo('how-it-works')}
                    icon={ArrowRight}
                    aria-label="See how it works →"
                    className="hero-primary-cta"
                  >
                    See how it works
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => scrollTo('features')}
                  >
                    Explore features
                  </Button>
                </div>

                {/* Assurance & Core Principles Banner */}
                <div className="hero-trust-bar">
                  <div className="trust-item">
                    <CheckCircle2 size={16} className="trust-icon" />
                    <span>Geo-tagged evidence</span>
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <ShieldCheck size={16} className="trust-icon" />
                    <span>Direct municipal dispatch</span>
                  </div>
                  <div className="trust-divider" />
                  <div className="trust-item">
                    <Clock size={16} className="trust-icon" />
                    <span>Verifiable resolution</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Original Visual Composition */}
              <div className="hero-visual">
                <HeroIllustration />
              </div>
            </div>
          </Container>
        </section>

        {/* SECTION 3 — HOW IT WORKS */}
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
              {/* Connecting architectural line */}
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
                      <h3 className="step-title">Report the Problem</h3>
                      <p className="step-description">
                        Citizens capture clear photographic evidence of uncollected waste or overflowing bins.
                        Precise GPS coordinates are verified automatically to avoid duplicate tickets.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Photo &amp; Location Match</span>
                      <span className="step-meta-note">Submission Stage</span>
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
                      <h3 className="step-title">Get It Assigned</h3>
                      <p className="step-description">
                        Municipal supervisors review incoming complaints on a regional queue.
                        Sanitation crews receive direct route notifications with workload-balanced task dispatching.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Route Optimization</span>
                      <span className="step-meta-note">Allocation Stage</span>
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
                      <h3 className="step-title">Track the Cleanup</h3>
                      <p className="step-description">
                        Sanitation workers upload completion photos upon clearing the site.
                        Residents receive real-time notifications and community trust is permanently reinforced.
                      </p>
                    </div>
                    <div className="step-card-meta">
                      <span className="step-meta-tag">Audited Resolution</span>
                      <span className="step-meta-note">Verification Stage</span>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </Container>
        </section>

        {/* SECTION 4 — CORE FEATURES */}
        <section className="features-section" id="features">
          <Container>
            <div className="section-header-block">
              <SectionLabel variant="forest" number="02">
                Platform Architecture
              </SectionLabel>
              <h2 className="section-title">
                Targeted capabilities engineered for public accountability
              </h2>
              <p className="section-subtitle">
                Each feature directly addresses a systemic breakdown in standard municipal waste handling.
              </p>
            </div>

            {/* Asymmetric Editorial Grid (Not identical cards!) */}
            <div className="features-editorial-grid">
              {/* Feature 1: Featured Wide Card */}
              <RevealSection animation="fade-up" className="feature-block feature-block-wide">
                <div className="feature-content-side">
                  <div className="feature-tag">
                    <MapPin size={16} />
                    <span>Location Intelligence</span>
                  </div>
                  <h3 className="feature-title">
                    Location-based garbage reporting
                  </h3>
                  <p className="feature-text">
                    Pinpoint waste incidents with high-precision geo-coordinates. The system cross-references
                    existing municipal ward boundaries, preventing ambiguous descriptions and dispatch errors.
                  </p>
                  <div className="feature-specs">
                    <div className="spec-pill">Exact Lat / Long Mapping</div>
                    <div className="spec-pill">Ward Boundary Tagging</div>
                  </div>
                </div>
                <div className="feature-preview-graphic feature-graphic-map">
                  <div className="mini-map-card">
                    <div className="map-grid-pattern" />
                    <div className="map-pin-pulse">
                      <MapPin size={24} className="pin-icon" />
                    </div>
                    <div className="map-coord-box">
                      <span className="coord-zone">Sector 09 &bull; Central Ward</span>
                      <span className="coord-val">28.6139° N, 77.2090° E</span>
                    </div>
                  </div>
                </div>
              </RevealSection>

              {/* Feature 2: Photo Evidence */}
              <RevealSection animation="fade-up" delay={100} className="feature-block feature-block-standard">
                <div className="feature-icon-wrapper">
                  <Camera size={24} />
                </div>
                <h3 className="feature-title">Photo evidence verification</h3>
                <p className="feature-text">
                  Require timestamped photographic validation at submission and resolution.
                  Eliminates false complaints and guarantees transparent proof of cleanups.
                </p>
                <div className="feature-micro-badge">
                  <span>Tamper-evident submissions</span>
                </div>
              </RevealSection>

              {/* Feature 3: Live complaint tracking */}
              <RevealSection animation="fade-up" delay={150} className="feature-block feature-block-standard">
                <div className="feature-icon-wrapper">
                  <Activity size={24} />
                </div>
                <h3 className="feature-title">Live complaint tracking</h3>
                <p className="feature-text">
                  Follow ticket states through a transparent status lifecycle:
                  Submitted &rarr; In Review &rarr; Dispatched &rarr; Resolved.
                </p>
                <div className="feature-micro-badge">
                  <span>End-to-end timeline audit</span>
                </div>
              </RevealSection>

              {/* Feature 4: Smart collector assignment */}
              <RevealSection animation="fade-up" delay={200} className="feature-block feature-block-standard">
                <div className="feature-icon-wrapper">
                  <Route size={24} />
                </div>
                <h3 className="feature-title">Smart collector assignment</h3>
                <p className="feature-text">
                  Distribute maintenance orders evenly across sanitation fleets, factoring in proximity,
                  vehicle capability, and pending route workloads.
                </p>
                <div className="feature-micro-badge">
                  <span>Balanced resource allocation</span>
                </div>
              </RevealSection>

              {/* Feature 5: Interactive garbage map */}
              <RevealSection animation="fade-up" delay={100} className="feature-block feature-block-standard">
                <div className="feature-icon-wrapper">
                  <Map size={24} />
                </div>
                <h3 className="feature-title">Interactive garbage map</h3>
                <p className="feature-text">
                  Explore neighborhood cleanliness clusters in real time. Visual hot-spots enable
                  municipal planners to adjust bin placement and route frequencies.
                </p>
                <div className="feature-micro-badge">
                  <span>Civic hotspot detection</span>
                </div>
              </RevealSection>

              {/* Feature 6: Community Green Points */}
              <RevealSection animation="fade-up" delay={150} className="feature-block feature-block-standard feature-block-highlight">
                <div className="feature-icon-wrapper icon-lime">
                  <Award size={24} />
                </div>
                <h3 className="feature-title">Community Green Points</h3>
                <p className="feature-text">
                  Recognize conscientious citizens who consistently verify neighborhood conditions.
                  Incentivizes constructive participation without superficial gimmicks.
                </p>
                <div className="feature-micro-badge badge-lime">
                  <span>Conscientious citizenship</span>
                </div>
              </RevealSection>

              {/* Feature 7: Cleanliness analytics */}
              <RevealSection animation="fade-up" delay={200} className="feature-block feature-block-standard">
                <div className="feature-icon-wrapper">
                  <BarChart3 size={24} />
                </div>
                <h3 className="feature-title">Cleanliness analytics</h3>
                <p className="feature-text">
                  Aggregated turnaround times, recurrence rates, and sector recovery scores give municipal
                  leadership objective metrics for ongoing infrastructure planning.
                </p>
                <div className="feature-micro-badge">
                  <span>Actionable governance data</span>
                </div>
              </RevealSection>
            </div>
          </Container>
        </section>

        {/* SECTION 5 — COMMUNITY IMPACT */}
        <section className="impact-section" id="impact">
          <Container>
            <div className="impact-editorial-layout">
              <div className="impact-header-col">
                <SectionLabel variant="lime" number="03">
                  Civic Imperative
                </SectionLabel>
                <h2 className="impact-main-heading">
                  Why citizen participation transforms urban sanitation.
                </h2>
                <p className="impact-lead-paragraph">
                  Sanitation departments cannot maintain every back-alley and corner without eyes on the ground.
                  CleanLoop bridges this structural information gap, giving everyday residents a direct,
                  dignified lever for neighborhood improvement.
                </p>

                <div className="impact-quote-box">
                  <blockquote className="impact-quote">
                    &ldquo;When waste management transitions from a bureaucratic black box to an open,
                    verifiable workflow, civic trust and cleanliness rise simultaneously.&rdquo;
                  </blockquote>
                  <cite className="impact-cite">— CleanLoop Urban Policy Framework</cite>
                </div>
              </div>

              <div className="impact-pillars-col">
                {/* Pillar 1 */}
                <div className="impact-pillar-item">
                  <div className="pillar-marker">
                    <TreePine size={20} />
                  </div>
                  <div className="pillar-details">
                    <h3 className="pillar-title">Cleaner, Healthier Neighborhoods</h3>
                    <p className="pillar-body">
                      Prompt collection prevents refuse decomposition, pest infestation, and stormwater
                      drainage clogging during monsoon seasons.
                    </p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="impact-pillar-item">
                  <div className="pillar-marker">
                    <Clock size={20} />
                  </div>
                  <div className="pillar-details">
                    <h3 className="pillar-title">Faster Complaint Handling</h3>
                    <p className="pillar-body">
                      Direct routing eliminates paperwork loops between administrative offices,
                      cutting turnaround time from days to targeted operational cycles.
                    </p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="impact-pillar-item">
                  <div className="pillar-marker">
                    <Eye size={20} />
                  </div>
                  <div className="pillar-details">
                    <h3 className="pillar-title">Transparent Waste Collection</h3>
                    <p className="pillar-body">
                      Public timelines ensure both residents and municipal contractors have an immutable
                      record of when a ticket was created, acknowledged, and completed.
                    </p>
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="impact-pillar-item">
                  <div className="pillar-marker">
                    <Users size={20} />
                  </div>
                  <div className="pillar-details">
                    <h3 className="pillar-title">Active Citizen Participation</h3>
                    <p className="pillar-body">
                      Residents evolve from passive bystanders frustrated by street trash into active
                      co-managers of their public streetscapes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* SECTION 6 — CALL TO ACTION */}
        <section className="cta-section">
          <Container size="narrow">
            <RevealSection animation="fade-up" className="cta-card">
              <SectionLabel variant="lime" number="04">
                Public Action
              </SectionLabel>
              <h2 className="cta-headline">
                Your neighborhood deserves better.
              </h2>
              <p className="cta-subtext">
                Every neglected heap of waste began with someone walking past it.
                Step up, document uncollected refuse, and give municipal collection crews
                the exact intelligence needed to restore our shared streets.
              </p>
              <div className="cta-button-row">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => scrollTo('how-it-works')}
                  icon={ArrowRight}
                >
                  See how it works
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => scrollTo('features')}
                  className="cta-secondary-btn"
                >
                  Review civic features
                </Button>
              </div>
              <div className="cta-academic-note">
                <span>CleanLoop Demonstration Platform &bull; Academic Engineering Prototype</span>
              </div>
            </RevealSection>
          </Container>
        </section>
      </main>

      {/* SECTION 7 — FOOTER */}
      <Footer />
    </div>
  );
};

export default HomePage;

