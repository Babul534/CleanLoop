import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Inbox,
  Image as ImageIcon,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ComplaintDetailModal from '../../components/dashboard/ComplaintDetailModal';
import { getMyComplaintSummary, getMyComplaints } from '../../services/complaintService';
import { getMyPointsSummary } from '../../services/rewardService';
import Button from '../../components/common/Button';

export const CitizenDashboardPage = () => {
  const [summary, setSummary] = useState({
    total: 0,
    awaitingReview: 0,
    beingHandled: 0,
    resolved: 0,
    rejected: 0
  });

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, complaintsRes, pointsRes] = await Promise.allSettled([
        getMyComplaintSummary(),
        getMyComplaints({ page: 1, limit: 5 }),
        getMyPointsSummary()
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success && summaryRes.value.summary) {
        setSummary(summaryRes.value.summary);
      }

      if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.success && Array.isArray(complaintsRes.value.complaints)) {
        setRecentComplaints(complaintsRes.value.complaints);
      }

      if (pointsRes.status === 'fulfilled' && pointsRes.value?.success && pointsRes.value.summary) {
        setPointsData(pointsRes.value.summary);
      }
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
      setError(err.response?.data?.message || 'Failed to load your dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="badge badge-status-resolved">Resolved</span>;
      case 'rejected':
        return <span className="badge badge-status-rejected">Rejected</span>;
      case 'assigned':
      case 'in_progress':
      case 'awaiting_verification':
        return (
          <span className="badge badge-status-in_progress">
            {status.replace(/_/g, ' ')}
          </span>
        );
      case 'pending':
      case 'under_review':
      default:
        return (
          <span className="badge badge-status-pending">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge badge-priority-high">High</span>;
      case 'low':
        return <span className="badge badge-priority-low">Low</span>;
      case 'medium':
      default:
        return <span className="badge badge-priority-medium">Medium</span>;
    }
  };

  return (
    <DashboardLayout>
      {/* Error Banner */}
      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} className="auth-alert-icon" />
          <div className="auth-alert-content">
            <strong>System Notice:</strong> {error}
            <button
              onClick={fetchDashboardData}
              style={{
                marginLeft: '1rem',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'inherit'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Green Points Civic Impact Banner */}
      <div
        className="points-hero-card"
        style={{
          padding: '1.25rem 1.75rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #0d3824 0%, #17543A 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(217, 243, 106, 0.15)',
                color: '#D9F36A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                Civic Environmental Rewards
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                  {pointsData?.balance || 0}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#D9F36A', fontWeight: 700 }}>GREEN POINTS</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/rewards" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" style={{ backgroundColor: '#D9F36A', color: '#17543A', borderColor: '#D9F36A', fontWeight: 700 }}>
                My Badges & Rewards
              </Button>
            </Link>
            <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Overview Statistics Cards */}
      <section className="stats-grid" aria-label="Incident Summary Metrics">
        {/* Total Reports */}
        <div className="stat-card stat-card-total">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Reports</span>
            <span className="stat-card-icon-wrap">
              <FileText size={18} />
            </span>
          </div>
          <div className="stat-card-number">
            {loading ? '—' : summary.total}
          </div>
          <div className="stat-card-subtext">All submitted civic incidents</div>
        </div>

        {/* Awaiting Review */}
        <div className="stat-card stat-card-review">
          <div className="stat-card-header">
            <span className="stat-card-label">Awaiting Review</span>
            <span className="stat-card-icon-wrap">
              <Clock size={18} />
            </span>
          </div>
          <div className="stat-card-number">
            {loading ? '—' : summary.awaitingReview}
          </div>
          <div className="stat-card-subtext">Pending intake &amp; triage</div>
        </div>

        {/* Being Handled */}
        <div className="stat-card stat-card-progress">
          <div className="stat-card-header">
            <span className="stat-card-label">Being Handled</span>
            <span className="stat-card-icon-wrap">
              <Truck size={18} />
            </span>
          </div>
          <div className="stat-card-number">
            {loading ? '—' : summary.beingHandled}
          </div>
          <div className="stat-card-subtext">Assigned to field collectors</div>
        </div>

        {/* Resolved */}
        <div className="stat-card stat-card-resolved">
          <div className="stat-card-header">
            <span className="stat-card-label">Resolved</span>
            <span className="stat-card-icon-wrap">
              <CheckCircle size={18} />
            </span>
          </div>
          <div className="stat-card-number">
            {loading ? '—' : summary.resolved}
          </div>
          <div className="stat-card-subtext">Cleaned &amp; verified by municipality</div>
        </div>
      </section>

      {/* Recent Reports Panel */}
      <section className="section-panel-card">
        <div className="section-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 className="section-panel-title">
              <FileText size={20} />
              Recent Reports
            </h2>
            <button
              type="button"
              onClick={fetchDashboardData}
              title="Refresh dashboard records"
              disabled={loading}
              aria-label="Refresh dashboard data"
              style={{
                background: 'none',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--color-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'authSpin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
          {recentComplaints.length > 0 && (
            <Link
              to="/my-reports"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-forest)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View All ({summary.total}) <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <span className="auth-loading-spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading your civic complaints...</p>
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="empty-state-panel">
            <div className="empty-state-icon-box">
              <Inbox size={32} />
            </div>
            <h3 className="empty-state-title">No waste complaints reported yet</h3>
            <p className="empty-state-desc">
              Spot an overflowing dumpster, uncollected roadside waste, or illegal dumping? Submit your first verified report to dispatch municipal cleaners.
            </p>
            <Button
              variant="secondary"
              size="md"
              to="/report-issue"
              icon={Plus}
            >
              Report Your First Problem
            </Button>
          </div>
        ) : (
          <div className="complaints-list">
            {recentComplaints.map((item) => {
              const firstImage = item.images && item.images.length > 0 ? item.images[0].url : null;
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent';

              return (
                <div
                  key={item._id}
                  className="complaint-item-row"
                  onClick={() => setSelectedComplaint(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedComplaint(item)}
                >
                  <div className="complaint-thumb-wrap">
                    {firstImage ? (
                      <img src={firstImage} alt="Waste Thumbnail" className="complaint-thumb-img" />
                    ) : (
                      <ImageIcon size={22} />
                    )}
                  </div>

                  <div className="complaint-meta-primary">
                    <span className="complaint-code-badge">{item.complaintCode}</span>
                    <p className="complaint-desc-snippet">{item.description}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block', marginTop: '2px' }}>
                      Reported {dateStr}
                    </span>
                  </div>

                  <div className="complaint-badges-group">
                    <span className="badge badge-category">{item.category}</span>
                    {getPriorityBadge(item.reportedPriority || item.priority)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default CitizenDashboardPage;

