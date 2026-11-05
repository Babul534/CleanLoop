import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Flame,
  Layers,
  Filter,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Clock,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import AdminCityMap from '../../components/map/AdminCityMap';
import {
  getAdminMapComplaints,
  getAdminMapAnalytics
} from '../../services/adminService';

export const AdminMapAnalyticsPage = () => {
  const [complaintsData, setComplaintsData] = useState({ complaints: [], heatPoints: [], center: [28.6139, 77.2090], bounds: null });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // View Mode: 'cluster' | 'heat'
  const [viewMode, setViewMode] = useState('cluster');

  // Selected complaint on marker click
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  const fetchMapData = useCallback(async () => {
    try {
      setError('');

      let startDate = undefined;
      let endDate = undefined;

      const now = new Date();
      if (dateRangeFilter === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      } else if (dateRangeFilter === 'week') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      } else if (dateRangeFilter === 'month') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      }

      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        startDate,
        endDate
      };

      const [complaintsRes, analyticsRes] = await Promise.all([
        getAdminMapComplaints(params),
        getAdminMapAnalytics(params)
      ]);

      if (complaintsRes?.success) {
        setComplaintsData(complaintsRes);
      }
      if (analyticsRes?.success) {
        setAnalyticsData(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('[Admin Map Load Error]:', err);
      setError('Failed to retrieve spatial map data and analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, dateRangeFilter]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMapData();
  };

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setFlyToCoords([complaint.lat, complaint.lng]);
  };

  const handleFocusHotspot = (hotspot) => {
    setFlyToCoords([hotspot.lat, hotspot.lng]);
  };

  const metrics = analyticsData?.metrics || {};
  const hotspots = analyticsData?.hotspots || [];
  const categoryDist = analyticsData?.categoryDistribution || [];
  const priorityDist = analyticsData?.priorityDistribution || [];
  const statusDist = analyticsData?.statusDistribution || [];

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'complaint-priority-high';
      case 'medium':
        return 'complaint-priority-medium';
      case 'low':
      default:
        return 'complaint-priority-low';
    }
  };

  return (
    <AdminLayout
      title="City Map Analytics & Spatial Clustering"
      subtitle="Interactive geospatial intelligence, incident density heatmaps, and neighborhood cluster analytics."
    >
      <div className="admin-page-container">
        {/* TOP CONTROLS & FILTER BAR */}
        <div className="admin-controls-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Dual-Mode View Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--color-paper-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setViewMode('cluster')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'cluster' ? 'var(--color-forest)' : 'transparent',
                color: viewMode === 'cluster' ? 'var(--color-lime)' : 'var(--color-forest)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} />
              <span>Marker Clusters</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('heat')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'heat' ? '#dc2626' : 'transparent',
                color: viewMode === 'heat' ? '#ffffff' : 'var(--color-forest)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Flame size={15} />
              <span>Density Heatmap</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_verification">In Audit</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all">All Waste Types</option>
              <option value="plastic">Plastic</option>
              <option value="organic">Organic</option>
              <option value="construction">Construction</option>
              <option value="household">Household</option>
              <option value="industrial">Industrial</option>
              <option value="mixed">Mixed</option>
              <option value="other">Other</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="admin-stats-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(23,84,58,0.1)', color: 'var(--color-forest)' }}>
              <MapPin size={22} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Mapped Incidents</span>
              <div className="admin-stat-value">{metrics.totalMappedComplaints || complaintsData.total || 0}</div>
              <span className="admin-stat-sub">Valid coordinates</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Flame size={22} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Critical Hotspots</span>
              <div className="admin-stat-value">{metrics.criticalHotspotsCount || 0}</div>
              <span className="admin-stat-sub">High density sectors</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={22} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Active Remediation</span>
              <div className="admin-stat-value">{metrics.pendingRemediations || 0}</div>
              <span className="admin-stat-sub">Pending municipal resolution</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Verified Cleared</span>
              <div className="admin-stat-value">{metrics.resolvedRemediations || 0}</div>
              <span className="admin-stat-sub">Sanitation verified</span>
            </div>
          </div>
        </div>

        {/* MAIN INTERACTIVE MAP & DETAILS SPLIT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {loading ? (
            <div className="complaints-card" style={{ height: '580px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="notif-loading-wrap" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="notif-skeleton-item" style={{ height: '140px' }} />
                <div className="notif-skeleton-item" style={{ height: '80px' }} />
              </div>
            </div>
          ) : error ? (
            <div className="complaints-empty-state">
              <AlertTriangle size={36} color="var(--color-clay)" />
              <h3 style={{ color: 'var(--color-forest)', margin: '10px 0 6px 0' }}>Map Service Notice</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{error}</p>
              <Button variant="secondary" size="sm" onClick={handleRefresh}>
                Retry Loading Map
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '2fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
              {/* Map Canvas */}
              <div>
                <AdminCityMap
                  complaints={complaintsData.complaints}
                  heatPoints={complaintsData.heatPoints}
                  center={complaintsData.center}
                  bounds={complaintsData.bounds}
                  viewMode={viewMode}
                  onSelectComplaint={handleSelectComplaint}
                  selectedComplaintId={selectedComplaint?._id}
                  flyToCoords={flyToCoords}
                  height="600px"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  <span>
                    Rendering <strong>{complaintsData.total}</strong> complaints in{' '}
                    <strong>{viewMode === 'cluster' ? 'Marker Cluster' : 'Density Heatmap'}</strong> mode.
                  </span>
                  <span>Click any cluster to zoom in &bull; Click any pin to inspect details</span>
                </div>
              </div>

              {/* Selected Complaint Inspection Drawer */}
              {selectedComplaint && (
                <div className="complaints-card" style={{ padding: '1.25rem', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer'
                    }}
                    title="Close selection"
                  >
                    <X size={18} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--color-forest)' }}>
                      {selectedComplaint.complaintCode}
                    </span>
                    <span
                      className={`complaint-status-pill complaint-status-${selectedComplaint.status}`}
                      style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                    >
                      {selectedComplaint.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <span className="complaint-category-pill" style={{ textTransform: 'capitalize' }}>
                      {selectedComplaint.category}
                    </span>
                    <span className={`complaint-priority-pill ${getPriorityBadgeClass(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority} Priority
                    </span>
                  </div>

                  <p style={{ color: 'var(--color-forest)', fontSize: '0.875rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                    {selectedComplaint.description}
                  </p>

                  {/* Citizen Photos Preview */}
                  {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Photographic Evidence ({selectedComplaint.images.length})
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedComplaint.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt="Complaint proof"
                            onClick={() => setLightboxImg(img.url)}
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Info */}
                  <div style={{ fontSize: '0.8125rem', padding: '8px 0', borderTop: '1px solid var(--color-border)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--color-forest)', marginBottom: '4px' }}>
                      <MapPin size={15} color="var(--color-clay)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{selectedComplaint.address || 'Location registered'}</span>
                    </div>
                    {selectedComplaint.landmark && (
                      <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginLeft: '21px' }}>
                        Landmark: {selectedComplaint.landmark}
                      </div>
                    )}
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', fontFamily: 'monospace', marginLeft: '21px', marginTop: '2px' }}>
                      GPS: {selectedComplaint.lat.toFixed(5)}, {selectedComplaint.lng.toFixed(5)}
                    </div>
                  </div>

                  {/* Assigned Crew Metadata */}
                  {selectedComplaint.assignedCollector && (
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius-sm)', marginBottom: '10px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--color-muted)', display: 'block', fontWeight: 600 }}>Assigned Sanitation Crew:</span>
                      <span style={{ color: 'var(--color-forest)', fontWeight: 700 }}>{selectedComplaint.assignedCollector.name}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      to={`/admin/complaints?search=${selectedComplaint.complaintCode}`}
                    >
                      Open Full Complaint Triage →
                    </Button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedComplaint.lat},${selectedComplaint.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-forest)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Open Directions in Google Maps</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GEOGRAPHIC ANALYTICS & HOTSPOTS BREAKDOWN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Top Spatial Hotspots Ledger */}
          <div className="complaints-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#dc2626" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                  Top Geographic Hotspots ({hotspots.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>~1.1 km spatial grid</span>
            </div>

            {hotspots.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No hotspot clusters found for current filters.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hotspots.map((spot) => (
                  <div
                    key={spot.rank}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-paper)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: spot.rank <= 3 ? '#dc2626' : 'var(--color-forest)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {spot.rank}
                        </span>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--color-forest)' }}>
                          {spot.locationName}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', gap: '8px' }}>
                        <span><strong>{spot.count}</strong> reports</span>
                        <span>•</span>
                        <span style={{ color: '#dc2626' }}><strong>{spot.highPriorityCount}</strong> urgent</span>
                        <span>•</span>
                        <span style={{ textTransform: 'capitalize' }}>Dominant: {spot.topCategory}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFocusHotspot(spot)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        backgroundColor: 'var(--color-forest)',
                        color: 'var(--color-lime)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Crosshair size={12} />
                      <span>Focus</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waste Category Spatial Breakdown */}
          <div className="complaints-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <BarChart3 size={20} color="var(--color-forest)" />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                Waste Category Breakdown
              </h3>
            </div>

            {categoryDist.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No category data available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryDist.map((cat) => (
                  <div key={cat.category} style={{ fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--color-forest)' }}>
                        {cat.category}
                      </span>
                      <span style={{ color: 'var(--color-muted)' }}>
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-paper)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${cat.percentage}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-forest)',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority & Status Breakdown */}
          <div className="complaints-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <TrendingUp size={20} color="var(--color-forest)" />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                Severity &amp; Status Proportions
              </h3>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Operational Priority
              </span>
              <div style={{ display: 'flex', height: '18px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                {priorityDist.map((p) => {
                  let bg = '#0284c7';
                  if (p.priority === 'high') bg = '#dc2626';
                  else if (p.priority === 'medium') bg = '#d97706';

                  return (
                    <div
                      key={p.priority}
                      style={{
                        width: `${p.percentage}%`,
                        backgroundColor: bg,
                        title: `${p.priority}: ${p.count}`
                      }}
                      title={`${p.priority.toUpperCase()}: ${p.count} (${p.percentage}%)`}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>High</span>
                <span style={{ color: '#d97706', fontWeight: 600 }}>Medium</span>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Low</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Remediation Lifecycle
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
                {statusDist.slice(0, 5).map((s) => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-paper)' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--color-forest)' }}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                    <strong style={{ color: 'var(--color-forest)' }}>{s.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="admin-modal-backdrop" onClick={() => setLightboxImg(null)}>
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
            <img src={lightboxImg} alt="Enlarged" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMapAnalyticsPage;

