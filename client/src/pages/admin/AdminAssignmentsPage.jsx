import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Shield,
  ArrowRight,
  X
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import {
  getAssignments,
  reassignAssignment,
  getCollectors
} from '../../services/adminService';

const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted by Collector' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted_for_verification', label: 'Submitted for Audit' },
  { value: 'verified', label: 'Verified & Completed' },
  { value: 'reassigned', label: 'Reassigned' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const AdminAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Reassignment Modal
  const [reassignTarget, setReassignTarget] = useState(null);
  const [collectorsRoster, setCollectorsRoster] = useState([]);
  const [selectedNewCollector, setSelectedNewCollector] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getAssignments({
        page: currentPage,
        limit: 10,
        status: statusFilter
      });

      if (res?.success) {
        setAssignments(res.assignments || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Admin Assignments Load Error]:', err);
      setError('Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleOpenReassignModal = async (assignment) => {
    setReassignTarget(assignment);
    setReassignReason('');
    try {
      const res = await getCollectors({ accountStatus: 'active', limit: 30 });
      if (res?.success) {
        // Exclude currently assigned collector
        const eligible = (res.collectors || []).filter(
          (c) => c._id !== (assignment.collector?._id || assignment.collector)
        );
        setCollectorsRoster(eligible);
        if (eligible.length > 0) {
          setSelectedNewCollector(eligible[0]._id);
        }
      }
    } catch (err) {
      console.error('[Fetch Eligible Collectors Error]:', err);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTarget || !selectedNewCollector) return;
    try {
      setReassignLoading(true);
      setFeedback({ error: '', success: '' });

      const res = await reassignAssignment(reassignTarget._id, {
        newCollectorId: selectedNewCollector,
        reason: reassignReason
      });

      if (res?.success) {
        setFeedback({ error: '', success: 'Task reassigned to new collector successfully.' });
        setReassignTarget(null);
        fetchAssignments();
      }
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to reassign task.', success: '' });
    } finally {
      setReassignLoading(false);
    }
  };

  const isAssignmentActive = (status) =>
    ['assigned', 'accepted', 'in_progress', 'submitted_for_verification'].includes(status);

  return (
    <AdminLayout
      title="Task Allocations & Dispatch"
      subtitle="Supervise active collection routes, remediation milestones, and work reassignments."
    >
      <div className="admin-page-container">
        {/* Feedback Alerts */}
        {feedback.error && (
          <div className="timeline-alert-banner alert-rejected" style={{ padding: '0.85rem' }}>
            {feedback.error}
          </div>
        )}
        {feedback.success && (
          <div className="timeline-alert-banner alert-resolved" style={{ padding: '0.85rem' }}>
            {feedback.success}
          </div>
        )}

        {/* Filter Bar */}
        <div className="admin-filter-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="var(--color-forest)" />
              <h3 className="admin-section-title" style={{ margin: 0 }}>
                Municipal Dispatch Ledger
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-select"
                style={{ width: '220px' }}
              >
                {ASSIGNMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAssignments}>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
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
        ) : assignments.length === 0 ? (
          <div className="complaints-empty-state">
            <Truck size={36} color="var(--color-muted)" style={{ opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '8px 0 4px 0' }}>
              No Dispatch Assignments Recorded
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              Deploy collectors directly from the Complaints Triage queue.
            </p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Report Reference</th>
                  <th>Assigned Collector</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th>Authorized By</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} className="admin-table-row">
                    <td>
                      <div>
                        <span className="complaint-code-badge" style={{ fontSize: '0.75rem' }}>
                          {a.complaint?.complaintCode || 'Report Code'}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                          {a.complaint?.category || 'Waste'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: 'var(--color-forest)', fontSize: '0.85rem' }}>
                          {a.collector?.name || 'Collector Officer'}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                          {a.collector?.phone || a.collector?.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {new Date(a.assignedAt || a.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${a.status}`} style={{ fontSize: '0.72rem' }}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-ink)' }}>
                        {a.assignedBy?.name || 'Supervisor'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {a.notes || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isAssignmentActive(a.status) ? (
                        <button
                          type="button"
                          className="admin-row-action-btn"
                          onClick={() => handleOpenReassignModal(a)}
                          title="Reassign to another collector"
                        >
                          <UserCheck size={14} />
                          <span>Reassign</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                          Archived
                        </span>
                      )}
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

        {/* Reassignment Modal */}
        {reassignTarget && (
          <div className="detail-modal-overlay" onClick={() => setReassignTarget(null)}>
            <div className="detail-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Reassign Task Allocation
                </h3>
                <button type="button" onClick={() => setReassignTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReassignSubmit} className="detail-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <span className="review-item-label">Current Officer</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--color-forest)' }}>
                    {reassignTarget.collector?.name} ({reassignTarget.collector?.email})
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Select Replacement Collector</label>
                  {collectorsRoster.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#D9381E', marginTop: '4px' }}>
                      No alternative active collectors available.
                    </p>
                  ) : (
                    <select
                      value={selectedNewCollector}
                      onChange={(e) => setSelectedNewCollector(e.target.value)}
                      className="admin-select"
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      {collectorsRoster.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} — {c.availability} ({c.activeWorkload || 0} active tasks)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Reason for Reassignment</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Mechanical breakdown, collector on leave, sector shift..."
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    className="admin-textarea"
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setReassignTarget(null)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" size="sm" type="submit" disabled={reassignLoading || !selectedNewCollector}>
                    {reassignLoading ? 'Reassigning...' : 'Confirm Reassignment'}
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

export default AdminAssignmentsPage;

