import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  MapPin,
  Clock,
  Play,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CollectorLayout from '../../components/collector/CollectorLayout';
import Button from '../../components/common/Button';
import {
  getCollectorTasks,
  acceptCollectorTask,
  startCollectorTask
} from '../../services/collectorService';

export const CollectorTasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters from query params
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(searchQuery);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery.trim() || undefined
      };

      const res = await getCollectorTasks(params);
      if (res?.success) {
        setTasks(res.tasks || []);
        setPagination(res.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      }
    } catch (err) {
      console.error('[Collector Tasks Load Error]:', err);
      setError('Failed to retrieve task allocations.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === 'all') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    updated.set('page', '1'); // Reset to page 1 on filter update
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handlePageChange = (newPage) => {
    const updated = new URLSearchParams(searchParams);
    updated.set('page', String(newPage));
    setSearchParams(updated);
  };

  const handleQuickAccept = async (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setActionLoadingId(taskId);
      const res = await acceptCollectorTask(taskId);
      if (res?.success) {
        await fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept task.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickStart = async (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setActionLoadingId(taskId);
      const res = await startCollectorTask(taskId);
      if (res?.success) {
        await fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to commence work.');
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned':
        return { label: 'New Assignment', color: '#d97706', bg: '#fef3c7' };
      case 'accepted':
        return { label: 'Accepted', color: '#0284c7', bg: '#e0f2fe' };
      case 'in_progress':
        return { label: 'In Progress', color: '#b45309', bg: '#fffbeb' };
      case 'submitted_for_verification':
        return { label: 'Awaiting Audit', color: '#0f766e', bg: '#ccfbf1' };
      case 'verified':
        return { label: 'Verified & Cleared', color: '#16a34a', bg: '#dcfce7' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' };
      case 'reassigned':
        return { label: 'Reassigned', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { label: status, color: '#4b5563', bg: '#f3f4f6' };
    }
  };

  const statusTabs = [
    { key: 'all', label: 'All Tasks' },
    { key: 'assigned', label: 'New' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'submitted_for_verification', label: 'In Audit' },
    { key: 'verified', label: 'Completed' }
  ];

  return (
    <CollectorLayout
      title="My Route Allocations"
      subtitle="Complete ledger of incident assignments, field triage, and verification progress."
    >
      <div className="admin-page-container">
        {/* Status Navigation Filter Tabs */}
        <div className="admin-filter-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`complaints-filter-btn ${statusFilter === tab.key ? 'is-active' : ''}`}
              onClick={() => updateFilters({ status: tab.key })}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                backgroundColor: statusFilter === tab.key ? 'var(--color-forest)' : 'var(--color-paper-card)',
                color: statusFilter === tab.key ? 'var(--color-lime)' : 'var(--color-forest)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Secondary Filter Controls */}
        <div className="complaints-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search reference code, location, or category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-paper)',
                  color: 'var(--color-forest)',
                  fontSize: '0.875rem'
                }}
              />
              <Search
                size={16}
                color="var(--color-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => updateFilters({ priority: e.target.value })}
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>
        </div>

        {/* Task Allocations Listing */}
        {loading ? (
          <div className="complaints-card" style={{ padding: '2rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '80px' }} />
              <div className="notif-skeleton-item" style={{ height: '80px' }} />
              <div className="notif-skeleton-item" style={{ height: '80px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={32} color="var(--color-clay)" />
            <h3 style={{ color: 'var(--color-forest)', margin: '10px 0 4px 0' }}>Data Error</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTasks} style={{ marginTop: '10px' }}>
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="complaints-empty-state" style={{ padding: '3rem 1.5rem' }}>
            <ClipboardList size={36} color="var(--color-sage)" />
            <h3 style={{ color: 'var(--color-forest)', margin: '12px 0 4px 0' }}>No Tasks Found</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto' }}>
              No route allocations match the selected filters. Change filters or check with dispatch supervisors.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map((task) => {
              const statusBadge = getStatusBadge(task.status);
              const complaint = task.complaint;
              const formattedDate = task.assignedAt
                ? new Date(task.assignedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Pending Date';

              return (
                <div
                  key={task._id}
                  className="complaints-card"
                  style={{
                    padding: '1.25rem',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-forest)' }}>
                        {complaint?.complaintCode || 'UNCODED'}
                      </span>
                      <span className="complaint-category-pill" style={{ textTransform: 'capitalize' }}>
                        {complaint?.category || 'mixed'}
                      </span>
                      <span className={`complaint-priority-pill ${getPriorityBadgeClass(complaint?.priority)}`}>
                        {complaint?.priority || 'medium'}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <p style={{ color: 'var(--color-forest)', fontSize: '0.9rem', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                    {complaint?.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-muted)' }}>
                        <MapPin size={14} color="var(--color-clay)" />
                        <span>{complaint?.location?.address?.formattedAddress || 'Registered Coordinates'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                        <Clock size={13} />
                        <span>Assigned {formattedDate}</span>
                      </div>
                    </div>

                    {/* Quick Touch Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {task.status === 'assigned' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleQuickAccept(e, task._id)}
                          disabled={actionLoadingId === task._id}
                        >
                          {actionLoadingId === task._id ? 'Accepting...' : 'Accept Task'}
                        </Button>
                      )}

                      {task.status === 'accepted' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Play}
                          iconPosition="left"
                          onClick={(e) => handleQuickStart(e, task._id)}
                          disabled={actionLoadingId === task._id}
                        >
                          {actionLoadingId === task._id ? 'Starting...' : 'Start Work'}
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Upload}
                          iconPosition="left"
                          to={`/collector/tasks/${task._id}`}
                        >
                          Submit Photos
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        to={`/collector/tasks/${task._id}`}
                      >
                        Task Details →
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 4px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} tasks)
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronRight}
                    iconPosition="right"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CollectorLayout>
  );
};

export default CollectorTasksPage;

