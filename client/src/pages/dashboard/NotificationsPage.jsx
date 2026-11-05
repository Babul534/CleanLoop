import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/common/Button';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchNotificationList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getNotifications({
        page: currentPage,
        limit: 10,
        unreadOnly
      });

      if (res?.success) {
        setNotifications(res.notifications || []);
        if (res.pagination) setPagination(res.pagination);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.error('[Notifications Page Error]:', err);
      setError('Failed to retrieve notification records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, unreadOnly]);

  useEffect(() => {
    fetchNotificationList();
  }, [fetchNotificationList]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date() }))
      );
    } catch (err) {
      console.error('[Notifications Mark All Error]:', err);
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('[Notification Mark Read Error]:', err);
      }
    }

    const complaintId = item.relatedComplaint?._id || item.relatedComplaint;
    if (complaintId) {
      navigate(`/complaint/${complaintId}`);
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'resolution':
        return <CheckCircle2 size={18} className="notif-type-icon icon-resolution" />;
      case 'assignment':
        return <Truck size={18} className="notif-type-icon icon-assignment" />;
      case 'reopen_request':
        return <AlertTriangle size={18} className="notif-type-icon icon-reopen" />;
      case 'reward':
        return <Sparkles size={18} className="notif-type-icon icon-reward" />;
      case 'complaint_update':
        return <Clock size={18} className="notif-type-icon icon-update" />;
      case 'system':
      default:
        return <Info size={18} className="notif-type-icon icon-system" />;
    }
  };

  return (
    <DashboardLayout
      title="Civic Activity & Alerts"
      subtitle="Chronological feed of municipal reviews, crew assignments, and resolution audits."
    >
      <div className="notif-page-container">
        {/* Controls Bar */}
        <div className="notif-page-header">
          <div className="notif-tabs-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!unreadOnly}
              className={`notif-tab-btn ${!unreadOnly ? 'is-active' : ''}`}
              onClick={() => {
                setUnreadOnly(false);
                setCurrentPage(1);
              }}
            >
              All Notifications
              <span className="notif-tab-badge">{pagination.totalCount || 0}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={unreadOnly}
              className={`notif-tab-btn ${unreadOnly ? 'is-active' : ''}`}
              onClick={() => {
                setUnreadOnly(true);
                setCurrentPage(1);
              }}
            >
              Unread Only
              {unreadCount > 0 && <span className="notif-tab-badge is-unread">{unreadCount}</span>}
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              iconPosition="left"
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="complaints-card" style={{ padding: '2rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={32} color="var(--color-clay)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '8px 0' }}>
              Error Loading Alerts
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNotificationList}>
              Retry Connection
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="complaints-empty-state">
            <Bell size={40} color="var(--color-muted)" style={{ opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '12px 0 4px 0' }}>
              {unreadOnly ? 'No unread notifications' : 'No notifications found'}
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
              {unreadOnly
                ? 'All of your civic notifications have been reviewed.'
                : 'As your submitted waste reports proceed through municipal verification and collector dispatch, notifications will be recorded here.'}
            </p>
            {unreadOnly && (
              <Button variant="secondary" size="sm" onClick={() => setUnreadOnly(false)}>
                Show All Notifications
              </Button>
            )}
          </div>
        ) : (
          <div className="complaints-card" style={{ overflow: 'hidden' }}>
            <div className="notif-full-list">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notif-row-card ${item.isRead ? 'is-read' : 'is-unread'}`}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                >
                  <div className="notif-row-icon-wrap">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="notif-row-body">
                    <div className="notif-row-topbar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 className="notif-row-title">{item.title}</h4>
                        {!item.isRead && <span className="notif-new-tag">New</span>}
                      </div>
                      <span className="notif-row-time">{getRelativeTime(item.createdAt)}</span>
                    </div>

                    <p className="notif-row-message">{item.message}</p>

                    {item.relatedComplaint && (
                      <div className="notif-row-complaint-meta">
                        <span className="complaint-code-badge" style={{ fontSize: '0.75rem' }}>
                          {item.relatedComplaint.complaintCode || 'Report Reference'}
                        </span>
                        {item.relatedComplaint.status && (
                          <span className="badge badge-priority-low" style={{ fontSize: '0.72rem' }}>
                            Status: {item.relatedComplaint.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
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
    </DashboardLayout>
  );
};

export default NotificationsPage;

