import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  Shield,
  Layers,
  ExternalLink,
  X
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import StatusTimeline from '../../components/timeline/StatusTimeline';
import BeforeAfterComparison from '../../components/admin/BeforeAfterComparison';
import {
  getAdminComplaints,
  getAdminComplaintById,
  reviewComplaint,
  rejectComplaint,
  updateOperationalPriority,
  getCollectors,
  createAssignment,
  verifyComplaintResolution
} from '../../services/adminService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_verification', label: 'Awaiting Verification' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'organic', label: 'Organic' },
  { value: 'construction', label: 'Construction' },
  { value: 'household', label: 'Household' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' }
];

export const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Triage Drawer / Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Sub-actions State
  const [reviewNote, setReviewNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('');

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [collectorsList, setCollectorsList] = useState([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getAdminComplaints({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search: searchQuery,
        sortBy
      });

      if (res?.success) {
        setComplaints(res.complaints || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Admin Complaints Load Error]:', err);
      setError('Failed to fetch complaint queue.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenDetail = async (complaintId) => {
    try {
      setDetailLoading(true);
      setActionError('');
      setActionSuccess('');
      setShowRejectForm(false);
      const res = await getAdminComplaintById(complaintId);
      if (res?.success) {
        setSelectedComplaint(res.complaint);
        setSelectedAssignments(res.assignments || []);
        setSelectedPriority(res.complaint.priority || 'medium');
      }
    } catch (err) {
      console.error('[Open Detail Error]:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStartReview = async () => {
    if (!selectedComplaint) return;
    try {
      setActionError('');
      setActionSuccess('');
      const res = await reviewComplaint(selectedComplaint._id, { note: reviewNote });
      if (res?.success) {
        setActionSuccess('Complaint moved into active review.');
        setSelectedComplaint(res.complaint);
        fetchList();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to start review.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      setActionError('');
      setActionSuccess('');
      const res = await rejectComplaint(selectedComplaint._id, { rejectionReason: rejectReason });
      if (res?.success) {
        setActionSuccess('Complaint rejected and citizen notified.');
        setSelectedComplaint(res.complaint);
        setShowRejectForm(false);
        fetchList();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject complaint.');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!selectedComplaint) return;
    try {
      setActionError('');
      setActionSuccess('');
      const res = await updateOperationalPriority(selectedComplaint._id, {
        priority: newPriority,
        note: `Priority set to ${newPriority} by administrator`
      });
      if (res?.success) {
        setSelectedPriority(newPriority);
        setActionSuccess(`Operational priority set to ${newPriority}.`);
        setSelectedComplaint(res.complaint);
        fetchList();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update priority.');
    }
  };

  const handleOpenAssignModal = async () => {
    try {
      setShowAssignModal(true);
      setAssignLoading(true);
      const res = await getCollectors({ accountStatus: 'active', limit: 30 });
      if (res?.success) {
        setCollectorsList(res.collectors || []);
        if (res.collectors?.length > 0) {
          setSelectedCollectorId(res.collectors[0]._id);
        }
      }
    } catch (err) {
      console.error('[Fetch Collectors Error]:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !selectedCollectorId) return;
    try {
      setActionError('');
      setActionSuccess('');
      const res = await createAssignment({
        complaintId: selectedComplaint._id,
        collectorId: selectedCollectorId,
        notes: assignNotes
      });

      if (res?.success) {
        setShowAssignModal(false);
        setActionSuccess('Collector dispatched successfully.');
        // Refresh detail
        handleOpenDetail(selectedComplaint._id);
        fetchList();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create assignment.');
    }
  };

  const [verifying, setVerifying] = useState(false);

  const handleVerifyResolution = async () => {
    if (!selectedComplaint) return;
    try {
      setVerifying(true);
      setActionError('');
      setActionSuccess('');
      const res = await verifyComplaintResolution(selectedComplaint._id, {
        note: 'Supervisory verification passed. Remediation confirmed.'
      });
      if (res?.success) {
        setSelectedComplaint(res.complaint);
        setActionSuccess(`Cleanup verified! +${res.reward?.points || 50} Green Points awarded to citizen.`);
        // Refresh full complaint record and assignment evidence
        handleOpenDetail(selectedComplaint._id);
        fetchList();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to verify resolution.');
    } finally {
      setVerifying(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const latestEvidenceAssignment = (selectedAssignments || []).find(
    (a) => a.completionImages && a.completionImages.length > 0
  ) || (selectedAssignments && selectedAssignments[0]) || null;

  return (
    <AdminLayout
      title="Complaints Triage & Queue"
      subtitle="Examine citizen incident reports, update operational priority, and deploy remediation teams."
    >
      <div className="admin-page-container">
        {/* Filter Controls Bar */}
        <div className="admin-filter-card">
          <div className="admin-filter-grid">
            {/* Search */}
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search reference, street address, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Showing {complaints.length} of {pagination.totalCount} reports matching criteria
            </span>
            <button type="button" onClick={clearFilters} className="admin-clear-link">
              Reset Filters
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="complaints-card" style={{ padding: '2rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '60px' }} />
              <div className="notif-skeleton-item" style={{ height: '60px' }} />
              <div className="notif-skeleton-item" style={{ height: '60px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={32} color="var(--color-clay)" />
            <p>{error}</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="complaints-empty-state">
            <ClipboardList size={36} color="var(--color-muted)" style={{ opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '8px 0 4px 0' }}>
              No Reports Match Criteria
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              Try broadening your filters or clearing search keywords.
            </p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Case Code</th>
                  <th>Category</th>
                  <th>Reported By</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item._id} className="admin-table-row">
                    <td>
                      <span className="complaint-code-badge" style={{ fontSize: '0.75rem' }}>
                        {item.complaintCode}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className="table-user-cell">{item.user?.name || 'Citizen'}</span>
                    </td>
                    <td>
                      <span className="table-location-cell" title={item.location?.address?.formattedAddress}>
                        {item.location?.address?.formattedAddress || 'Location attached'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${item.priority}`} style={{ fontSize: '0.7rem' }}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${item.status}`} style={{ fontSize: '0.72rem' }}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="admin-row-action-btn"
                        onClick={() => handleOpenDetail(item._id)}
                        title="Triage & Manage Report"
                      >
                        <Eye size={14} />
                        <span>Triage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="admin-pagination-bar">
                <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    iconPosition="left"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronRight}
                    iconPosition="right"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Triage Modal / Drawer */}
        {selectedComplaint && (
          <div className="detail-modal-overlay" onClick={() => setSelectedComplaint(null)}>
            <div
              className="detail-modal-card admin-triage-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="detail-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="complaint-code-badge" style={{ fontSize: '0.9rem' }}>
                      {selectedComplaint.complaintCode}
                    </span>
                    <span className={`badge badge-status-${selectedComplaint.status}`}>
                      {selectedComplaint.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'block', marginTop: '4px' }}>
                    Reported by {selectedComplaint.user?.name} ({selectedComplaint.user?.email})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="detail-modal-body">
                {/* Feedback Alerts */}
                {actionError && (
                  <div className="timeline-alert-banner alert-rejected" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div className="timeline-alert-banner alert-resolved" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                    {actionSuccess}
                  </div>
                )}

                {/* Primary Action Buttons Bar */}
                <div className="admin-actions-ribbon">
                  {/* Verify Cleanup & Award Points Button */}
                  {selectedComplaint.status === 'awaiting_verification' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      iconPosition="left"
                      onClick={handleVerifyResolution}
                      disabled={verifying}
                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                    >
                      {verifying ? 'Verifying...' : 'Verify Cleanup (+Award Green Points)'}
                    </Button>
                  )}

                  {/* Start Review Button */}
                  {selectedComplaint.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Clock}
                      iconPosition="left"
                      onClick={handleStartReview}
                    >
                      Start Review
                    </Button>
                  )}

                  {/* Assign Collector Button */}
                  {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'rejected' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Truck}
                      iconPosition="left"
                      onClick={handleOpenAssignModal}
                    >
                      {selectedComplaint.assignedCollector ? 'Reassign Crew' : 'Assign Collector'}
                    </Button>
                  )}

                  {/* Reject Button */}
                  {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      iconPosition="left"
                      onClick={() => setShowRejectForm((prev) => !prev)}
                      style={{ color: '#D9381E', borderColor: '#D9381E' }}
                    >
                      Reject Report
                    </Button>
                  )}
                </div>

                {/* Rejection Form Drawer */}
                {showRejectForm && (
                  <form onSubmit={handleReject} className="admin-rejection-box">
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#D9381E', fontFamily: 'var(--font-heading)' }}>
                      Specify Ground for Rejection
                    </h4>
                    <textarea
                      rows={3}
                      placeholder="Enter legal or operational justification (e.g. Private property outside municipality purview, Duplicate report)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                      className="admin-textarea"
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: '#D9381E' }}>
                        Confirm Rejection
                      </Button>
                      <Button variant="outline" size="sm" type="button" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Operational Priority Selector */}
                <div className="admin-priority-selector-card">
                  <span className="review-item-label">Set Operational Priority</span>
                  <div className="priority-pills-cluster">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-pill-btn ${selectedPriority === p ? `is-active priority-${p}` : ''}`}
                        onClick={() => handlePriorityChange(p)}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginLeft: 'auto' }}>
                      Citizen suggested: <strong>{selectedComplaint.reportedPriority}</strong>
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="review-item-label">Problem Statement</span>
                  <p className="detail-desc-text" style={{ fontSize: '0.9rem' }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Before & After Photo Comparison */}
                <BeforeAfterComparison
                  beforeImages={selectedComplaint.images || []}
                  afterImages={latestEvidenceAssignment?.completionImages || []}
                  citizenName={selectedComplaint.user?.name || 'Citizen'}
                  citizenEmail={selectedComplaint.user?.email || ''}
                  reportedAt={selectedComplaint.createdAt}
                  collectorName={latestEvidenceAssignment?.collector?.name || selectedComplaint.assignedCollector?.name}
                  collectorEmail={latestEvidenceAssignment?.collector?.email || selectedComplaint.assignedCollector?.email || ''}
                  submittedAt={latestEvidenceAssignment?.submittedAt || latestEvidenceAssignment?.updatedAt}
                  collectorNotes={latestEvidenceAssignment?.notes || ''}
                  assignmentStatus={latestEvidenceAssignment?.status}
                  complaintStatus={selectedComplaint.status}
                />

                {/* Map Coordinates */}
                {selectedComplaint.location?.coordinates && (
                  <div>
                    <span className="review-item-label">Location Telemetry</span>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {selectedComplaint.location.address?.formattedAddress || 'No formatted address'}
                    </p>
                    <LocationPickerMap
                      latitude={selectedComplaint.location.coordinates[1]}
                      longitude={selectedComplaint.location.coordinates[0]}
                      readOnly={true}
                      height="180px"
                    />
                  </div>
                )}

                {/* Timeline Component */}
                <StatusTimeline complaint={selectedComplaint} />
              </div>
            </div>
          </div>
        )}

        {/* Collector Assignment Modal */}
        {showAssignModal && (
          <div className="detail-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="detail-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Deploy Waste Collector
                </h3>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="detail-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Select Active Collector</label>
                  {assignLoading ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Loading active roster...</p>
                  ) : collectorsList.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#D9381E' }}>No active collectors currently available.</p>
                  ) : (
                    <select
                      value={selectedCollectorId}
                      onChange={(e) => setSelectedCollectorId(e.target.value)}
                      className="admin-select"
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      {collectorsList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} — {c.availability} ({c.activeWorkload || 0} active tasks)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Dispatch Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Use heavy compaction vehicle #12; access via rear service lane..."
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="admin-textarea"
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" size="sm" type="submit" disabled={!selectedCollectorId}>
                    Confirm Dispatch
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminComplaintsPage;

