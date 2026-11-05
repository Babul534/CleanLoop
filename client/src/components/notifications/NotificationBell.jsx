import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  getUnreadCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load unread count on mount & interval
  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res?.success) {
        setUnreadCount(res.count || 0);
      }
    } catch (err) {
      // Quiet fail for badge polling
      console.warn('[NotificationBell] Could not fetch unread count:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    // Poll unread count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Load latest notifications when panel opens
  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getNotifications({ page: 1, limit: 6 });
      if (res?.success) {
        setNotifications(res.notifications || []);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.error('[NotificationBell] Load Error:', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecentNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date() }))
      );
    } catch (err) {
      console.error('[NotificationBell] Mark All Error:', err);
    }
  };

  const handleItemClick = async (item) => {
    // Mark as read if currently unread
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('[NotificationBell] Mark Read Error:', err);
      }
    }

    setIsOpen(false);

    // If related complaint is attached, navigate to dedicated complaint page
    const complaintId = item.relatedComplaint?._id || item.relatedComplaint;
    if (complaintId) {
      navigate(`/complaint/${complaintId}`);
    } else {
      navigate('/notifications');
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'resolution':
        return <CheckCircle2 size={16} className="notif-type-icon icon-resolution" />;
      case 'assignment':
        return <Truck size={16} className="notif-type-icon icon-assignment" />;
      case 'reopen_request':
        return <AlertTriangle size={16} className="notif-type-icon icon-reopen" />;
      case 'reward':
        return <Sparkles size={16} className="notif-type-icon icon-reward" />;
      case 'complaint_update':
        return <Clock size={16} className="notif-type-icon icon-update" />;
      case 'system':
      default:
        return <Info size={16} className="notif-type-icon icon-system" />;
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className={`notif-bell-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        aria-label={`Civic notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown-card" role="region" aria-label="Recent Notifications">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="notif-dropdown-title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-pill-unread">{unreadCount} unread</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-action-btn"
                onClick={handleMarkAllRead}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="notif-dropdown-body">
            {loading ? (
              <div className="notif-loading-wrap">
                <div className="notif-skeleton-item" />
                <div className="notif-skeleton-item" />
                <div className="notif-skeleton-item" />
              </div>
            ) : error ? (
              <div className="notif-empty-state">
                <AlertTriangle size={20} color="var(--color-clay)" />
                <p>{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={24} color="var(--color-muted)" style={{ opacity: 0.5 }} />
                <p className="notif-empty-title">All caught up!</p>
                <span className="notif-empty-desc">
                  You have no notifications right now. Status updates will appear here.
                </span>
              </div>
            ) : (
              <div className="notif-list">
                {notifications.map((item) => (
                  <div
                    key={item._id}
                    className={`notif-item-card ${item.isRead ? 'is-read' : 'is-unread'}`}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                  >
                    <div className="notif-item-left">
                      {getTypeIcon(item.type)}
                      {!item.isRead && <span className="notif-unread-dot" />}
                    </div>

                    <div className="notif-item-content">
                      <div className="notif-item-topbar">
                        <h4 className="notif-item-title">{item.title}</h4>
                        <span className="notif-item-time">{getRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className="notif-item-msg">{item.message}</p>
                    </div>

                    <ChevronRight size={14} className="notif-item-arrow" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="notif-dropdown-footer">
            <Link
              to="/notifications"
              className="notif-view-all-link"
              onClick={() => setIsOpen(false)}
            >
              <span>View full notification history</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

