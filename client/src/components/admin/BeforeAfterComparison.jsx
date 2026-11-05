import React, { useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Camera,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';

/**
 * BeforeAfterComparison Component
 *
 * Professional side-by-side photographic comparison for municipal incident verification.
 * Compares the citizen's original report images (BEFORE) with the collector's cleanup evidence (AFTER).
 * Supports click-to-enlarge Lightbox, thumbnail switching, keyboard navigation, and responsive layouts.
 */
export const BeforeAfterComparison = ({
  beforeImages = [],
  afterImages = [],
  citizenName = 'Citizen',
  citizenEmail = '',
  reportedAt = null,
  collectorName = null,
  collectorEmail = '',
  submittedAt = null,
  collectorNotes = '',
  assignmentStatus = null,
  complaintStatus = null
}) => {
  const [activeBeforeIndex, setActiveBeforeIndex] = useState(0);
  const [activeAfterIndex, setActiveAfterIndex] = useState(0);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxType, setLightboxType] = useState('before'); // 'before' | 'after'
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Ensure active indices stay within bounds if arrays change
  useEffect(() => {
    if (activeBeforeIndex >= beforeImages.length) {
      setActiveBeforeIndex(Math.max(0, beforeImages.length - 1));
    }
  }, [beforeImages.length, activeBeforeIndex]);

  useEffect(() => {
    if (activeAfterIndex >= afterImages.length) {
      setActiveAfterIndex(Math.max(0, afterImages.length - 1));
    }
  }, [afterImages.length, activeAfterIndex]);

  const openLightbox = (type, index = 0) => {
    setLightboxType(type);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const currentLightboxImages = lightboxType === 'before' ? beforeImages : afterImages;
  const currentPhoto = currentLightboxImages[lightboxIndex] || null;

  const handlePrevPhoto = useCallback(() => {
    if (currentLightboxImages.length <= 1) return;
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : currentLightboxImages.length - 1));
  }, [currentLightboxImages.length]);

  const handleNextPhoto = useCallback(() => {
    if (currentLightboxImages.length <= 1) return;
    setLightboxIndex((prev) => (prev < currentLightboxImages.length - 1 ? prev + 1 : 0));
  }, [currentLightboxImages.length]);

  const handleToggleLightboxType = () => {
    if (lightboxType === 'before') {
      if (afterImages.length > 0) {
        setLightboxType('after');
        setLightboxIndex(0);
      }
    } else {
      if (beforeImages.length > 0) {
        setLightboxType('before');
        setLightboxIndex(0);
      }
    }
  };

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrevPhoto, handleNextPhoto]);

  // Formatted Timestamps
  const formattedReportedAt = reportedAt
    ? new Date(reportedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Date not recorded';

  const formattedSubmittedAt = submittedAt
    ? new Date(submittedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : null;

  const hasBefore = beforeImages && beforeImages.length > 0;
  const hasAfter = afterImages && afterImages.length > 0;

  return (
    <div className="before-after-container">
      {/* Header bar */}
      <div className="before-after-header-bar">
        <div className="before-after-title-group">
          <Camera size={18} className="before-after-main-icon" />
          <h4 className="before-after-main-title">Before & After Photo Comparison</h4>
        </div>
        <div className="before-after-status-tag">
          {hasBefore && hasAfter ? (
            <span className="comparison-status-pill pill-ready">
              <CheckCircle2 size={13} /> Ready for Supervisory Review
            </span>
          ) : hasBefore && !hasAfter ? (
            <span className="comparison-status-pill pill-waiting">
              <Clock size={13} /> Awaiting Remediation Photos
            </span>
          ) : (
            <span className="comparison-status-pill pill-neutral">
              <AlertCircle size={13} /> Visual Verification Pending
            </span>
          )}
        </div>
      </div>

      {/* Comparison Grid (Side by side on desktop, stacked on mobile) */}
      <div className="before-after-grid">
        {/* ================================================================= */}
        {/* BEFORE CARD — REPORTED BY CITIZEN */}
        {/* ================================================================= */}
        <div className="comparison-card comparison-card-before">
          {/* Card Top Meta */}
          <div className="comparison-card-header">
            <div className="comparison-card-title-row">
              <span className="comparison-label-badge label-before">BEFORE</span>
              <span className="comparison-card-heading">Reported by Citizen</span>
            </div>
            <span className="comparison-card-count">
              {hasBefore ? `${beforeImages.length} photo${beforeImages.length > 1 ? 's' : ''}` : 'No photos'}
            </span>
          </div>

          <div className="comparison-card-meta">
            <span className="comparison-meta-item" title={citizenEmail}>
              <User size={13} /> {citizenName}
            </span>
            <span className="comparison-meta-item">
              <Calendar size={13} /> {formattedReportedAt}
            </span>
          </div>

          {/* Main Visual Display */}
          {hasBefore ? (
            <div className="comparison-featured-box">
              <div
                className="comparison-featured-wrap"
                onClick={() => openLightbox('before', activeBeforeIndex)}
                title="Click to enlarge"
              >
                <img
                  src={beforeImages[activeBeforeIndex]?.url}
                  alt={`Citizen evidence ${activeBeforeIndex + 1}`}
                  className="comparison-featured-img"
                  loading="lazy"
                />
                <span className="comparison-overlay-tag tag-before">
                  BEFORE #{activeBeforeIndex + 1}
                </span>
                <div className="comparison-zoom-hint">
                  <ZoomIn size={16} />
                  <span>Enlarge</span>
                </div>
              </div>

              {/* Thumbnails strip (if multiple photos) */}
              {beforeImages.length > 1 && (
                <div className="comparison-thumbnails-strip">
                  {beforeImages.map((img, idx) => (
                    <button
                      key={img.publicId || idx}
                      type="button"
                      className={`comparison-thumb-btn ${activeBeforeIndex === idx ? 'is-active-before' : ''}`}
                      onClick={() => setActiveBeforeIndex(idx)}
                      title={`View Before Photo ${idx + 1}`}
                    >
                      <img src={img.url} alt={`Before thumb ${idx + 1}`} />
                      <span className="thumb-idx">{idx + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="comparison-empty-box">
              <Camera size={36} className="comparison-empty-icon" />
              <p className="comparison-empty-text">No initial photographs were submitted by the citizen.</p>
              <span className="comparison-empty-sub">Inspection must rely on physical field survey.</span>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* AFTER CARD — SUBMITTED BY COLLECTOR */}
        {/* ================================================================= */}
        <div className="comparison-card comparison-card-after">
          {/* Card Top Meta */}
          <div className="comparison-card-header">
            <div className="comparison-card-title-row">
              <span className="comparison-label-badge label-after">AFTER</span>
              <span className="comparison-card-heading">Submitted by Collector</span>
            </div>
            <span className="comparison-card-count">
              {hasAfter ? `${afterImages.length} photo${afterImages.length > 1 ? 's' : ''}` : 'No photos'}
            </span>
          </div>

          <div className="comparison-card-meta">
            <span className="comparison-meta-item" title={collectorEmail}>
              <User size={13} /> {collectorName || 'Assigned Field Collector'}
            </span>
            <span className="comparison-meta-item">
              <Calendar size={13} /> {formattedSubmittedAt || 'Awaiting completion'}
            </span>
          </div>

          {/* Collector Notes Callout if present */}
          {collectorNotes && (
            <div className="comparison-collector-notes">
              <FileText size={13} className="notes-icon" />
              <div className="notes-body">
                <span className="notes-heading">Remediation Notes:</span>
                <span className="notes-text">"{collectorNotes}"</span>
              </div>
            </div>
          )}

          {/* Main Visual Display */}
          {hasAfter ? (
            <div className="comparison-featured-box">
              <div
                className="comparison-featured-wrap"
                onClick={() => openLightbox('after', activeAfterIndex)}
                title="Click to enlarge"
              >
                <img
                  src={afterImages[activeAfterIndex]?.url}
                  alt={`Collector remediation evidence ${activeAfterIndex + 1}`}
                  className="comparison-featured-img"
                  loading="lazy"
                />
                <span className="comparison-overlay-tag tag-after">
                  AFTER #{activeAfterIndex + 1}
                </span>
                <div className="comparison-zoom-hint">
                  <ZoomIn size={16} />
                  <span>Enlarge</span>
                </div>
              </div>

              {/* Thumbnails strip (if multiple photos) */}
              {afterImages.length > 1 && (
                <div className="comparison-thumbnails-strip">
                  {afterImages.map((img, idx) => (
                    <button
                      key={img.publicId || idx}
                      type="button"
                      className={`comparison-thumb-btn ${activeAfterIndex === idx ? 'is-active-after' : ''}`}
                      onClick={() => setActiveAfterIndex(idx)}
                      title={`View After Photo ${idx + 1}`}
                    >
                      <img src={img.url} alt={`After thumb ${idx + 1}`} />
                      <span className="thumb-idx">{idx + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="comparison-empty-box">
              <Clock size={36} className="comparison-empty-icon" />
              <p className="comparison-empty-text">
                {complaintStatus === 'awaiting_verification'
                  ? 'Task was submitted for review without completion photos.'
                  : complaintStatus === 'in_progress'
                  ? 'Remediation is currently underway. Cleanup photos will appear upon collector submission.'
                  : complaintStatus === 'assigned'
                  ? 'Task assigned to field crew. Work commencement pending.'
                  : 'Awaiting completion evidence from assigned waste collector.'}
              </p>
              <span className="comparison-empty-sub">
                {collectorName ? `Assigned crew: ${collectorName}` : 'No collector assigned yet'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* LIGHTBOX MODAL */}
      {/* =================================================================== */}
      {lightboxOpen && currentPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
            {/* Lightbox Topbar */}
            <div className="lightbox-topbar">
              <div className="lightbox-title-area">
                <span className={`lightbox-badge ${lightboxType === 'before' ? 'badge-before' : 'badge-after'}`}>
                  {lightboxType === 'before' ? 'BEFORE — Reported by Citizen' : 'AFTER — Submitted by Collector'}
                </span>
                <span className="lightbox-counter">
                  Photo {lightboxIndex + 1} of {currentLightboxImages.length}
                </span>
              </div>

              <div className="lightbox-actions">
                {/* Switch between Before / After if both sets exist */}
                {hasBefore && hasAfter && (
                  <button
                    type="button"
                    className="lightbox-action-btn"
                    onClick={handleToggleLightboxType}
                    title={`Switch to ${lightboxType === 'before' ? 'AFTER' : 'BEFORE'} gallery`}
                  >
                    <ArrowRightLeft size={15} />
                    <span>View {lightboxType === 'before' ? 'AFTER' : 'BEFORE'}</span>
                  </button>
                )}

                {/* Direct Cloudinary Link */}
                <a
                  href={currentPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lightbox-action-btn"
                  title="Open high-resolution original in new tab"
                >
                  <ExternalLink size={15} />
                  <span>Original</span>
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={closeLightbox}
                  title="Close (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox Main Stage */}
            <div className="lightbox-stage">
              {currentLightboxImages.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn nav-prev"
                  onClick={handlePrevPhoto}
                  title="Previous Photo (Left Arrow)"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <div className="lightbox-image-wrapper">
                <img
                  src={currentPhoto.url}
                  alt={`${lightboxType} photo ${lightboxIndex + 1}`}
                  className="lightbox-image"
                />
              </div>

              {currentLightboxImages.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn nav-next"
                  onClick={handleNextPhoto}
                  title="Next Photo (Right Arrow)"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* Lightbox Footer Bar */}
            <div className="lightbox-footer">
              <div className="lightbox-footer-info">
                {lightboxType === 'before' ? (
                  <span>
                    <strong>Submitted by:</strong> {citizenName} ({citizenEmail || 'Citizen'}) •{' '}
                    <strong>Date:</strong> {formattedReportedAt}
                  </span>
                ) : (
                  <span>
                    <strong>Remediation by:</strong> {collectorName || 'Field Collector'} •{' '}
                    <strong>Submitted:</strong> {formattedSubmittedAt || 'Awaiting timestamp'}
                    {collectorNotes && (
                      <span className="lightbox-footer-note"> — Notes: "{collectorNotes}"</span>
                    )}
                  </span>
                )}
              </div>

              {/* Thumbnails in Lightbox */}
              {currentLightboxImages.length > 1 && (
                <div className="lightbox-thumb-strip">
                  {currentLightboxImages.map((img, idx) => (
                    <button
                      key={img.publicId || idx}
                      type="button"
                      className={`lightbox-thumb ${lightboxIndex === idx ? 'is-active' : ''}`}
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img src={img.url} alt={`Thumb ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterComparison;

