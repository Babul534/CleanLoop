import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import { getAdminDashboardStats } from '../../services/adminService';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setError('');
      const res = await getAdminDashboardStats();
      if (res?.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('[Admin Dashboard Load Error]:', err);
      setError('Failed to fetch administrative metrics from MongoDB.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const complaints = stats?.complaints || {};
  const collectors = stats?.collectors || {};
  const overview = stats?.overview || {};

  return (
    <AdminLayout
      title="Municipal Command Center"
      subtitle="Comprehensive overview of civic reports, operational workload, and sanitation crew deployment."
    >
      <div className="admin-page-container">
        {/* Top Control Bar */}
        <div className="admin-controls-bar">
          <div className="admin-badge-strip">
            <span className="admin-pill-tag">
              Attention Required: <strong>{overview.attentionRequired || 0} Urgent</strong>
            </span>
            <span className="admin-pill-tag">
              Available Crews: <strong>{collectors.available || 0} / {collectors.active || 0}</strong>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            iconPosition="left"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
        </div>

        {loading ? (
          <div className="complaints-card" style={{ padding: '2.5rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '90px' }} />
              <div className="notif-skeleton-item" style={{ height: '180px' }} />
              <div className="notif-skeleton-item" style={{ height: '220px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={36} color="var(--color-clay)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '12px 0 6px 0' }}>
              Connection Issue
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              {error}
            </p>
            <Button variant="secondary" size="sm" onClick={fetchStats}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {/* Primary Metrics Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(23, 84, 58, 0.08)' }}>
                  <ClipboardList size={22} color="var(--color-forest)" />
                </div>
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Total Reports</span>
                  <h3 className="admin-stat-number">{complaints.total || 0}</h3>
                  <span className="admin-stat-sub">All-time recorded</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(217, 56, 30, 0.08)' }}>
                  <Clock size={22} color="#D9381E" />
                </div>
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Pending Triage</span>
                  <h3 className="admin-stat-number" style={{ color: '#D9381E' }}>
                    {complaints.pending || 0}
                  </h3>
                  <span className="admin-stat-sub">Awaiting initial review</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(2, 132, 199, 0.08)' }}>
                  <Truck size={22} color="#0284c7" />
                </div>
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Active Field Work</span>
                  <h3 className="admin-stat-number" style={{ color: '#0284c7' }}>
                    {(complaints.assigned || 0) + (complaints.in_progress || 0)}
                  </h3>
                  <span className="admin-stat-sub">Assigned or in remediation</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
                  <CheckCircle2 size={22} color="#16a34a" />
                </div>
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Resolved & Verified</span>
                  <h3 className="admin-stat-number" style={{ color: '#16a34a' }}>
                    {complaints.resolved || 0}
                  </h3>
                  <span className="admin-stat-sub">Closed successfully</span>
                </div>
              </div>
            </div>

            {/* Spatial Intelligence & Map Analytics Banner */}
            <div
              className="admin-fleet-card"
              style={{
                background: 'linear-gradient(135deg, rgba(23,84,58,0.06) 0%, rgba(200,85,61,0.06) 100%)',
                border: '1px solid rgba(23,84,58,0.16)',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="admin-stat-icon-wrap"
                    style={{
                      backgroundColor: 'var(--color-forest)',
                      color: '#ffffff',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MapPin size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-forest)' }}>
                      Spatial Intelligence & City Hotspots
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                      Real-time interactive city map with dynamic clustering, kernel density heatmaps, and spatial triage.
                    </p>
                  </div>
                </div>
                <Link to="/admin/map" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                    Open City Map Analytics
                  </Button>
                </Link>
              </div>
            </div>

            {/* Status Breakdown Bar */}
            <div className="admin-breakdown-card">
              <h4 className="admin-section-subtitle">Comprehensive Status Breakdown</h4>
              <div className="admin-status-pills-row">
                <span className="status-pill-metric">
                  Pending: <strong>{complaints.pending || 0}</strong>
                </span>
                <span className="status-pill-metric">
                  Under Review: <strong>{complaints.under_review || 0}</strong>
                </span>
                <span className="status-pill-metric">
                  Assigned: <strong>{complaints.assigned || 0}</strong>
                </span>
                <span className="status-pill-metric">
                  In Progress: <strong>{complaints.in_progress || 0}</strong>
                </span>
                <span className="status-pill-metric">
                  Awaiting Verification: <strong>{complaints.awaiting_verification || 0}</strong>
                </span>
                <span className="status-pill-metric">
                  Resolved: <strong>{complaints.resolved || 0}</strong>
                </span>
                <span className="status-pill-metric is-rejected">
                  Rejected: <strong>{complaints.rejected || 0}</strong>
                </span>
              </div>
            </div>

            {/* Collector Fleet Overview */}
            <div className="admin-fleet-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--color-forest)" />
                  <h3 className="admin-section-title" style={{ margin: 0 }}>
                    Sanitation Collector Fleet
                  </h3>
                </div>
                <Link to="/admin/collectors" className="admin-card-link">
                  Manage Roster <ArrowRight size={13} />
                </Link>
              </div>

              <div className="admin-fleet-grid">
                <div className="fleet-item">
                  <span className="fleet-label">Total Officers</span>
                  <span className="fleet-value">{collectors.total || 0}</span>
                </div>
                <div className="fleet-item">
                  <span className="fleet-label">Active Commission</span>
                  <span className="fleet-value" style={{ color: '#16a34a' }}>
                    {collectors.active || 0}
                  </span>
                </div>
                <div className="fleet-item">
                  <span className="fleet-label">Available for Dispatch</span>
                  <span className="fleet-value" style={{ color: 'var(--color-forest)' }}>
                    {collectors.available || 0}
                  </span>
                </div>
                <div className="fleet-item">
                  <span className="fleet-label">Active Tasks</span>
                  <span className="fleet-value">{collectors.assignedWorkload || 0}</span>
                </div>
                <div className="fleet-item">
                  <span className="fleet-label">Idle (No Active Task)</span>
                  <span className="fleet-value" style={{ color: '#b45309' }}>
                    {collectors.idle || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Lists 2-Column Split */}
            <div className="admin-split-grid">
              {/* Recent Complaints */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 className="admin-card-title">Recent Submissions</h3>
                  <Link to="/admin/complaints" className="admin-card-link">
                    View Queue <ArrowRight size={13} />
                  </Link>
                </div>

                {overview.recentComplaints?.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No complaints filed yet.</p>
                ) : (
                  <div className="admin-mini-list">
                    {overview.recentComplaints.map((item) => (
                      <div key={item._id} className="admin-mini-row">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="complaint-code-badge" style={{ fontSize: '0.75rem' }}>
                              {item.complaintCode}
                            </span>
                            <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                              {item.category}
                            </span>
                          </div>
                          <span className="mini-row-sub">
                            {item.location?.address?.formattedAddress || 'Location attached'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-status-${item.status}`} style={{ fontSize: '0.72rem' }}>
                            {item.status.replace(/_/g, ' ')}
                          </span>
                          <span className="mini-row-date">
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Administrative Activity */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 className="admin-card-title">Supervisory Audit Ledger</h3>
                  <Link to="/admin/activity" className="admin-card-link">
                    Full Ledger <ArrowRight size={13} />
                  </Link>
                </div>

                {overview.recentActivity?.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No activity records logged.</p>
                ) : (
                  <div className="admin-mini-list">
                    {overview.recentActivity.map((log) => (
                      <div key={log._id} className="admin-mini-row">
                        <div>
                          <span className="mini-log-action">{log.action.replace(/_/g, ' ')}</span>
                          <p className="mini-log-desc">{log.description || 'System operation executed'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="mini-row-date">
                            {new Date(log.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="mini-log-actor">{log.actor?.name || 'Administrator'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

