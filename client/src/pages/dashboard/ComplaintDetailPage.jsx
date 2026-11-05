import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  MapPin,
  Tag,
  AlertTriangle,
  Clock,
  Layers,
  ExternalLink,
  Shield,
  Truck,
  Image as ImageIcon
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusTimeline from '../../components/timeline/StatusTimeline';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import Button from '../../components/common/Button';
import { getComplaintById } from '../../services/complaintService';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getComplaintById(id);
        if (isMounted) {
          if (res?.success && res.complaint) {
            setComplaint(res.complaint);
            if (res.complaint.images && res.complaint.images.length > 0) {
              setActiveImage(res.complaint.images[0].url);
            }
          } else {
            setError('Complaint record not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Complaint Detail Load Error]:', err);
          if (err.response?.status === 403) {
            setError('Access forbidden: You can only view complaints submitted from your own account.');
          } else if (err.response?.status === 404) {
            setError('Complaint not found. It may have been archived or removed.');
          } else {
            setError(err.response?.data?.message || 'Failed to retrieve complaint details.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyCode = () => {
    if (!complaint?.complaintCode) return;
    navigator.clipboard.writeText(complaint.complaintCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [lng, lat] = complaint?.location?.coordinates || [0, 0];
  const hasCoords = Boolean(lat && lng);

  const formattedDate = complaint?.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="badge badge-status-resolved">Resolved</span>;
      case 'rejected':
        return <span className="badge badge-status-rejected">Rejected</span>;
      case 'assigned':
      case 'in_progress':
      case 'awaiting_verification':
        return <span className="badge badge-status-in_progress">{status.replace(/_/g, ' ')}</span>;
      case 'pending':
      case 'under_review':
      default:
        return <span className="badge badge-status-pending">{status ? status.replace(/_/g, ' ') : 'Pending'}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge badge-priority-high">High Priority</span>;
      case 'low':
        return <span className="badge badge-priority-low">Low Priority</span>;
      case 'medium':
      default:
        return <span className="badge badge-priority-medium">Medium Priority</span>;
    }
  };

  return (
    <DashboardLayout
      title="Complaint Tracking & Status"
      subtitle="Comprehensive audit trail and lifecycle verification."
    >
      <div className="complaint-detail-page-container">
        {/* Navigation Bar */}
        <div className="detail-top-nav">
          <Link to="/my-reports" className="detail-back-link">
            <ArrowLeft size={16} />
            <span>Back to My Reports</span>
          </Link>

          {complaint?.complaintCode && (
            <div className="detail-code-widget">
              <span className="code-label">Case Reference:</span>
              <span className="code-value">{complaint.complaintCode}</span>
              <button
                type="button"
                className="code-copy-btn"
                onClick={handleCopyCode}
                title="Copy Reference Code"
                aria-label="Copy reference code"
              >
                {copied ? <Check size={14} color="#17543A" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="complaints-card" style={{ padding: '2.5rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '40px', width: '60%' }} />
              <div className="notif-skeleton-item" style={{ height: '200px' }} />
              <div className="notif-skeleton-item" style={{ height: '300px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={36} color="var(--color-clay)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '12px 0 6px 0' }}>
              Access Notice
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              {error}
            </p>
            <Button variant="outline" size="sm" to="/my-reports" icon={ArrowLeft} iconPosition="left">
              Return to My Reports
            </Button>
          </div>
        ) : complaint ? (
          <div className="detail-layout-grid">
            {/* Left Main Column: Timeline, Description, Photographs */}
            <div className="detail-left-col">
              {/* Status Banner Card */}
              <div className="detail-overview-card">
                <div className="overview-card-header">
                  <div>
                    <span className="overview-category-tag">{complaint.category} Waste</span>
                    <h2 className="overview-title">
                      {complaint.location?.address?.formattedAddress || `Report ${complaint.complaintCode}`}
                    </h2>
                    <span className="overview-submitted-meta">
                      <Calendar size={13} style={{ marginRight: '4px' }} />
                      Submitted on {formattedDate}
                    </span>
                  </div>

                  <div className="overview-badges-cluster">
                    {getStatusBadge(complaint.status)}
                    {getPriorityBadge(complaint.reportedPriority || complaint.priority)}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <StatusTimeline complaint={complaint} />

              {/* Problem Description Card */}
              <div className="detail-card">
                <h3 className="detail-card-title">Problem Description</h3>
                <p className="detail-desc-text">{complaint.description}</p>
              </div>

              {/* Photographic Evidence Gallery */}
              {complaint.images && complaint.images.length > 0 && (
                <div className="detail-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 className="detail-card-title" style={{ margin: 0 }}>
                      Photographic Evidence ({complaint.images.length})
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      Verified Cloudinary Storage
                    </span>
                  </div>

                  {/* Active Large Preview */}
                  {activeImage && (
                    <div className="gallery-featured-wrap">
                      <img
                        src={activeImage}
                        alt="Enlarged waste evidence"
                        className="gallery-featured-img"
                      />
                      <a
                        href={activeImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gallery-expand-link"
                        title="Open full resolution in new tab"
                      >
                        <ExternalLink size={14} /> Full Resolution
                      </a>
                    </div>
                  )}

                  {/* Thumbnails row */}
                  {complaint.images.length > 1 && (
                    <div className="gallery-thumbs-row">
                      {complaint.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`gallery-thumb-btn ${activeImage === img.url ? 'is-active' : ''}`}
                          onClick={() => setActiveImage(img.url)}
                          aria-label={`View photo evidence ${idx + 1}`}
                        >
                          <img src={img.url} alt={`Evidence ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Meta Column: Location, Map, Technical Audit */}
            <div className="detail-right-col">
              {/* Geographic Location Card */}
              <div className="detail-card">
                <h3 className="detail-card-title">Geographic Coordinates</h3>

                <div className="meta-info-item">
                  <span className="meta-info-label">
                    <MapPin size={13} style={{ marginRight: '4px' }} /> Formatted Address
                  </span>
                  <span className="meta-info-value">
                    {complaint.location?.address?.formattedAddress || 'No street address provided'}
                  </span>
                </div>

                {complaint.location?.address?.landmark && (
                  <div className="meta-info-item">
                    <span className="meta-info-label">Landmark</span>
                    <span className="meta-info-value">{complaint.location.address.landmark}</span>
                  </div>
                )}

                <div className="meta-info-item">
                  <span className="meta-info-label">Latitude / Longitude</span>
                  <code className="meta-coords-code">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </code>
                </div>

                <div className="meta-info-item">
                  <span className="meta-info-label">Telemetry Source</span>
                  <span className="badge badge-priority-low" style={{ textTransform: 'uppercase' }}>
                    {complaint.location?.source || 'gps'} telemetry
                  </span>
                </div>

                {/* Embedded Leaflet Preview */}
                {hasCoords && (
                  <div style={{ marginTop: '1rem', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <LocationPickerMap
                      latitude={lat}
                      longitude={lng}
                      readOnly={true}
                      height="200px"
                    />
                  </div>
                )}
              </div>

              {/* Municipal Administration Ledger Card */}
              <div className="detail-card">
                <h3 className="detail-card-title">Municipal Ledger Details</h3>

                <div className="meta-info-item">
                  <span className="meta-info-label">Waste Classification</span>
                  <span className="meta-info-value" style={{ textTransform: 'capitalize' }}>
                    {complaint.category}
                  </span>
                </div>

                <div className="meta-info-item">
                  <span className="meta-info-label">Priority Assessment</span>
                  <span className="meta-info-value" style={{ textTransform: 'capitalize' }}>
                    Citizen suggested: <strong>{complaint.reportedPriority}</strong> / Operational:{' '}
                    <strong>{complaint.priority}</strong>
                  </span>
                </div>

                <div className="meta-info-item">
                  <span className="meta-info-label">Field Assignment</span>
                  <span className="meta-info-value">
                    {complaint.assignedCollector ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} color="#17543A" />
                        {complaint.assignedCollector.name || 'Assigned Crew'}
                      </span>
                    ) : (
                      'Pending municipal crew dispatch'
                    )}
                  </span>
                </div>

                <div className="meta-info-item">
                  <span className="meta-info-label">Record Security</span>
                  <span className="meta-info-value" style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    <Shield size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Immutable audit log entry
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default ComplaintDetailPage;

