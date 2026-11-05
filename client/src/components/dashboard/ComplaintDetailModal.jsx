import React from 'react';
import { X, MapPin, Calendar, AlertTriangle, Tag, Layers, CheckCircle, Clock } from 'lucide-react';
import LocationPickerMap from '../map/LocationPickerMap';

export const ComplaintDetailModal = ({ complaint, onClose }) => {
  if (!complaint) return null;

  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown Date';

  const [lng, lat] = complaint.location?.coordinates || [0, 0];
  const hasCoords = Boolean(lat && lng);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'resolved':
        return 'badge-status-resolved';
      case 'rejected':
        return 'badge-status-rejected';
      case 'assigned':
      case 'in_progress':
      case 'awaiting_verification':
        return 'badge-status-in_progress';
      case 'pending':
      case 'under_review':
      default:
        return 'badge-status-pending';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'badge-priority-high';
      case 'low':
        return 'badge-priority-low';
      case 'medium':
      default:
        return 'badge-priority-medium';
    }
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div>
            <span className="complaint-code-badge" style={{ fontSize: '0.9rem' }}>
              {complaint.complaintCode}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className={`badge ${getStatusBadgeClass(complaint.status)}`}>
                {complaint.status.replace(/_/g, ' ')}
              </span>
              <span className={`badge ${getPriorityBadgeClass(complaint.reportedPriority || complaint.priority)}`}>
                {complaint.reportedPriority || complaint.priority} priority
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
            aria-label="Close details"
          >
            <X size={22} />
          </button>
        </div>

        <div className="detail-modal-body">
          {/* Photographs Gallery */}
          {complaint.images && complaint.images.length > 0 && (
            <div>
              <span className="review-item-label" style={{ display: 'block', marginBottom: '8px' }}>
                Photographic Evidence ({complaint.images.length})
              </span>
              <div className="detail-gallery">
                {complaint.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Click to view full photograph"
                  >
                    <img src={img.url} alt={`Evidence ${idx + 1}`} className="detail-gallery-img" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <span className="review-item-label" style={{ display: 'block', marginBottom: '6px' }}>
              Problem Description
            </span>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-ink)' }}>
              {complaint.description}
            </p>
          </div>

          {/* Meta Details */}
          <div className="review-summary-box">
            <div className="review-summary-item">
              <span className="review-item-label">
                <Tag size={12} style={{ marginRight: '4px' }} /> Waste Category
              </span>
              <span className="review-item-value" style={{ textTransform: 'capitalize' }}>
                {complaint.category}
              </span>
            </div>

            <div className="review-summary-item">
              <span className="review-item-label">
                <Calendar size={12} style={{ marginRight: '4px' }} /> Submitted Date
              </span>
              <span className="review-item-value">{formattedDate}</span>
            </div>

            <div className="review-summary-item" style={{ gridColumn: 'span 2' }}>
              <span className="review-item-label">
                <MapPin size={12} style={{ marginRight: '4px' }} /> Geographic Location
              </span>
              <span className="review-item-value">
                {complaint.location?.address?.formattedAddress ||
                  `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
              </span>
              {complaint.location?.address?.landmark && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                  Landmark: {complaint.location.address.landmark}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Map Preview */}
          {hasCoords && (
            <div>
              <span className="review-item-label" style={{ display: 'block', marginBottom: '8px' }}>
                Map Position
              </span>
              <LocationPickerMap
                latitude={lat}
                longitude={lng}
                readOnly={true}
                height="220px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;

