import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import { getAdminActivityLogs } from '../../services/adminService';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Audit Actions' },
  { value: 'COMPLAINT_REVIEW_STARTED', label: 'Review Started' },
  { value: 'COMPLAINT_REJECTED', label: 'Complaint Rejected' },
  { value: 'COMPLAINT_PRIORITY_UPDATE', label: 'Priority Updated' },
  { value: 'COMPLAINT_STATUS_UPDATE', label: 'Status Transition' },
  { value: 'COLLECTOR_CREATED', label: 'Collector Created' },
  { value: 'COLLECTOR_UPDATED', label: 'Collector Profile Updated' },
  { value: 'COLLECTOR_AVAILABILITY_UPDATE', label: 'Availability Changed' },
  { value: 'COLLECTOR_ACTIVATED', label: 'Collector Activated' },
  { value: 'COLLECTOR_DEACTIVATED', label: 'Collector Suspended' },
  { value: 'COLLECTOR_ASSIGNED', label: 'Collector Dispatched' },
  { value: 'COLLECTOR_REASSIGNED', label: 'Task Reassigned' }
];

export const AdminActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getAdminActivityLogs({
        page: currentPage,
        limit: 15,
        action: actionFilter
      });

      if (res?.success) {
        setLogs(res.logs || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Admin Activity Load Error]:', err);
      setError('Failed to fetch activity audit trail.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action) => {
    if (action.includes('REJECT') || action.includes('DEACTIVATED')) {
      return 'badge-status-rejected';
    }
    if (action.includes('ASSIGN') || action.includes('CREATED') || action.includes('ACTIVATED')) {
      return 'badge-status-resolved';
    }
    if (action.includes('REVIEW') || action.includes('PRIORITY')) {
      return 'badge-status-in_progress';
    }
    return 'badge-priority-medium';
  };

  return (
    <AdminLayout
      title="Administrative Activity Ledger"
      subtitle="Immutable supervisory ledger capturing complaint reviews, crew dispatches, and policy modifications."
    >
      <div className="admin-page-container">
        {/* Filter Controls Bar */}
        <div className="admin-filter-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--color-forest)" />
              <h3 className="admin-section-title" style={{ margin: 0 }}>
                Municipal Audit Trail
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-select"
                style={{ width: '240px' }}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchLogs}>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
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
        ) : logs.length === 0 ? (
          <div className="complaints-empty-state">
            <ShieldAlert size={36} color="var(--color-muted)" style={{ opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '8px 0 4px 0' }}>
              No Activity Logs Recorded
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              Administrative operations will automatically appear in this verifiable ledger.
            </p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Responsible Actor</th>
                  <th>Operation Action</th>
                  <th>Entity Type</th>
                  <th>Operational Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="admin-table-row">
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>
                        <strong>
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </strong>
                        <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.72rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: 'var(--color-forest)', fontSize: '0.85rem' }}>
                          {log.actor?.name || 'Municipal System'}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                          {log.actor?.role ? log.actor.role.toUpperCase() : 'AUTOMATION'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: '0.7rem' }}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-priority-low" style={{ fontSize: '0.72rem' }}>
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-ink)' }}>
                          {log.description || 'Administrative state update.'}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                            {log.metadata.rejectionReason && (
                              <span>Reason: <em>"{log.metadata.rejectionReason}"</em> </span>
                            )}
                            {log.metadata.newPriority && (
                              <span>Priority: <strong>{log.metadata.newPriority}</strong> </span>
                            )}
                            {log.metadata.note && (
                              <span>Note: <em>"{log.metadata.note}"</em></span>
                            )}
                          </div>
                        )}
                      </div>
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
      </div>
    </AdminLayout>
  );
};

export default AdminActivityPage;

