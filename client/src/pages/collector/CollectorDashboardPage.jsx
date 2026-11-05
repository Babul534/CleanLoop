import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Upload,
  RefreshCw,
  ArrowRight,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import CollectorLayout from '../../components/collector/CollectorLayout';
import Button from '../../components/common/Button';
import {
  getCollectorDashboardStats,
  acceptCollectorTask
} from '../../services/collectorService';

export const CollectorDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      setError('');
      const res = await getCollectorDashboardStats();
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      console.error('[Collector Dashboard Load Error]:', err);
      setError('Failed to fetch real field metrics from the database.');
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

  const handleQuickAccept = async (assignmentId) => {
    try {
      setActionLoadingId(assignmentId);
      const res = await acceptCollectorTask(assignmentId);
      if (res?.success) {
        await fetchStats();
      }
    } catch (err) {
      console.error('[Quick Accept Error]:', err);
      alert(err.response?.data?.message || 'Failed to accept task.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const stats = data?.stats || {};
  const currentActive = data?.currentActiveTask;
  const newAssignments = data?.newAssignmentsList || [];
  const upcomingTasks = data?.upcomingTasks || [];
  const recentCompleted = data?.recentCompletedTasks || [];

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
    <CollectorLayout
      title="Field Operations Dispatch"
      subtitle="Real-time route assignments, remediation execution, and photographic completion reporting."
    >
      <div className="admin-page-container">
        {/* Top Control Bar */}
        <div className="admin-controls-bar">
          <div className="admin-badge-strip">
            <span className="admin-pill-tag" style={{ backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>
              Pending Acceptance: <strong>{stats.newAssignments || 0} New</strong>
            </span>
            <span className="admin-pill-tag" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}>
              Active on Site: <strong>{stats.inProgress || 0} In Progress</strong>
            </span>
            <span className="admin-pill-tag" style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' }}>
              Completed Today: <strong>{stats.todayCompleted || 0}</strong>
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
            {refreshing ? 'Refreshing...' : 'Refresh Route'}
          </Button>
        </div>

        {loading ? (
          <div className="complaints-card" style={{ padding: '2.5rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '100px' }} />
              <div className="notif-skeleton-item" style={{ height: '140px' }} />
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
            <Button variant="secondary" size="sm" onClick={handleRefresh}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {/* CURRENT ACTIVE TASK SPOTLIGHT (MOBILE-FRIENDLY & HIGH VISIBILITY) */}
            <div
              className="complaints-card"
              style={{
                marginBottom: '1.5rem',
                borderLeft: currentActive
                  ? currentActive.status === 'in_progress'
                    ? '4px solid #d97706'
                    : '4px solid #0284c7'
                  : '4px solid var(--color-forest)',
                background: currentActive
                  ? currentActive.status === 'in_progress'
                    ? 'linear-gradient(to right, #fffbeb, #ffffff)'
                    : 'linear-gradient(to right, #f0f9ff, #ffffff)'
                  : 'var(--color-paper-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={22} color="var(--color-forest)" />
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-forest)', margin: 0 }}>
                    {currentActive ? 'Current Assigned Work Order' : 'Field Status: Standby'}
                  </h2>
                </div>

                {currentActive && (
                  <span
                    className={`complaint-status-pill complaint-status-${currentActive.status}`}
                    style={{ textTransform: 'capitalize', fontSize: '0.8rem', padding: '4px 10px', fontWeight: 700 }}
                  >
                    {currentActive.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {currentActive ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--color-forest)' }}>
                          {currentActive.complaint?.complaintCode}
                        </span>
                        <span className="complaint-category-pill" style={{ textTransform: 'capitalize' }}>
                          {currentActive.complaint?.category}
                        </span>
                        <span className={`complaint-priority-pill ${getPriorityBadgeClass(currentActive.complaint?.priority)}`}>
                          {currentActive.complaint?.priority} Priority
                        </span>
                      </div>

                      <p style={{ color: 'var(--color-forest)', fontSize: '0.925rem', margin: '8px 0 12px 0', lineHeight: 1.5 }}>
                        {currentActive.complaint?.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                        <MapPin size={16} color="var(--color-clay)" style={{ flexShrink: 0 }} />
                        <span>
                          {currentActive.complaint?.location?.address?.formattedAddress ||
                            currentActive.complaint?.location?.address?.landmark ||
                            'Location coordinates registered'}
                        </span>
                      </div>
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                      {currentActive.status === 'accepted' ? (
                        <Button
                          variant="secondary"
                          size="md"
                          icon={Play}
                          iconPosition="left"
                          onClick={() => navigate(`/collector/tasks/${currentActive._id}`)}
                          style={{ minHeight: '44px', fontWeight: 600 }}
                        >
                          Start Work On Site →
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          icon={Upload}
                          iconPosition="left"
                          onClick={() => navigate(`/collector/tasks/${currentActive._id}`)}
                          style={{ minHeight: '44px', fontWeight: 600 }}
                        >
                          Submit Completion Photos →
                        </Button>
                      )}

                      {/* Direct External Map Directions */}
                      {currentActive.complaint?.location?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${currentActive.complaint.location.coordinates[1]},${currentActive.complaint.location.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(23,84,58,0.06)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-forest)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={14} />
                          <span>Open Navigation GPS</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem 0', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  No active remediation currently underway. Accept a new task below or set your duty status to Available.
                </div>
              )}
            </div>

            {/* REAL MONGODB STATISTICS METRIC CARDS */}
            <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(23, 84, 58, 0.1)', color: 'var(--color-forest)' }}>
                  <ClipboardList size={22} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Assigned Workload</span>
                  <div className="admin-stat-value">{stats.totalAssigned || 0}</div>
                  <span className="admin-stat-sub">Active &amp; pending tasks</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <Clock size={22} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">New Awaiting Acceptance</span>
                  <div className="admin-stat-value">{stats.newAssignments || 0}</div>
                  <span className="admin-stat-sub">Dispatched by supervisors</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <Play size={22} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">In Remediation</span>
                  <div className="admin-stat-value">{stats.inProgress || 0}</div>
                  <span className="admin-stat-sub">{stats.accepted || 0} accepted queued</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Verified Completed</span>
                  <div className="admin-stat-value">{stats.completed || 0}</div>
                  <span className="admin-stat-sub">
                    {stats.todayCompleted || 0} completed today ({stats.submittedForVerification || 0} in audit)
                  </span>
                </div>
              </div>
            </div>

            {/* NEW ASSIGNMENTS QUEUE */}
            <div className="complaints-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="var(--color-forest)" />
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                    New Task Allocations Awaiting Acceptance ({newAssignments.length})
                  </h3>
                </div>
                <Link to="/collector/tasks?status=assigned" style={{ fontSize: '0.8125rem', color: 'var(--color-forest)', fontWeight: 600, textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {newAssignments.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  No pending assignments awaiting acceptance. Your route queue is clear.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {newAssignments.map((task) => (
                    <div
                      key={task._id}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-forest)' }}>
                            {task.complaint?.complaintCode}
                          </span>
                          <span className="complaint-category-pill" style={{ textTransform: 'capitalize' }}>
                            {task.complaint?.category}
                          </span>
                          <span className={`complaint-priority-pill ${getPriorityBadgeClass(task.complaint?.priority)}`}>
                            {task.complaint?.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} />
                          <span>{task.complaint?.location?.address?.formattedAddress || 'Location mapped'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickAccept(task._id)}
                          disabled={actionLoadingId === task._id}
                        >
                          {actionLoadingId === task._id ? 'Accepting...' : 'Accept Task'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          to={`/collector/tasks/${task._id}`}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPCOMING & RECENT SPLIT GRID */}
            <div className="admin-split-grid">
              {/* Upcoming Accepted Tasks */}
              <div className="complaints-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Play size={18} color="var(--color-forest)" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-forest)', margin: 0 }}>
                      Accepted Work Queue ({upcomingTasks.length})
                    </h3>
                  </div>
                  <Link to="/collector/tasks?status=accepted" style={{ fontSize: '0.75rem', color: 'var(--color-forest)', fontWeight: 600 }}>
                    View All →
                  </Link>
                </div>

                {upcomingTasks.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No accepted tasks awaiting work.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {upcomingTasks.map((task) => (
                      <Link
                        key={task._id}
                        to={`/collector/tasks/${task._id}`}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-paper)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-forest)' }}>
                            {task.complaint?.complaintCode}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                            {task.complaint?.location?.address?.formattedAddress || task.complaint?.category}
                          </div>
                        </div>
                        <ArrowRight size={14} color="var(--color-forest)" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Completed Work */}
              <div className="complaints-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-forest)', margin: 0 }}>
                      Recent Verified Closures
                    </h3>
                  </div>
                  <Link to="/collector/tasks?status=completed" style={{ fontSize: '0.75rem', color: 'var(--color-forest)', fontWeight: 600 }}>
                    View All →
                  </Link>
                </div>

                {recentCompleted.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No verified closures yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentCompleted.map((task) => (
                      <div
                        key={task._id}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-paper)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-forest)' }}>
                            {task.complaint?.complaintCode}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                            Verified &amp; Cleared
                          </div>
                        </div>
                        <Link to={`/collector/tasks/${task._id}`} style={{ fontSize: '0.75rem', color: 'var(--color-forest)', fontWeight: 600 }}>
                          Report →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </CollectorLayout>
  );
};

export default CollectorDashboardPage;

