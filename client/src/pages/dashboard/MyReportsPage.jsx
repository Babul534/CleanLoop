import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ComplaintDetailModal from '../../components/dashboard/ComplaintDetailModal';
import Button from '../../components/common/Button';
import { getMyComplaints } from '../../services/complaintService';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'organic', label: 'Organic' },
  { value: 'construction', label: 'Construction' },
  { value: 'household', label: 'Household' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' }
];

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_verification', label: 'Awaiting Verification' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

export const MyReportsPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getMyComplaints({
        page: currentPage,
        limit: 8,
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery
      });

      if (res?.success) {
        setComplaints(res.complaints || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[My Reports Load Error]:', err);
      setError(err.response?.data?.message || 'Failed to retrieve your complaints.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchComplaints();
  };

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
    <DashboardLayout
      title="My Waste Reports"
      subtitle="View, track, and review all garbage incident reports filed under your verified account."
    >
      {/* Filters & Search Toolbar */}
      <div
        className="section-panel-card"
        style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search by code (e.g. CLN-)"
              className="auth-input"
              style={{ height: '40px', paddingLeft: '36px', fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              style={{ height: '40px', padding: '0 0.85rem', width: 'auto', fontSize: '0.85rem' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              className="auth-input"
              style={{ height: '40px', padding: '0 0.85rem', width: 'auto', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-forest)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  padding: '0 0.5rem'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} className="auth-alert-icon" />
          <div className="auth-alert-content">
            <strong>System Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Complaints List Panel */}
      <section className="section-panel-card">
        <div className="section-panel-header">
          <h2 className="section-panel-title">
            <FileText size={20} />
            Submitted Complaints ({pagination.totalCount})
          </h2>
          <Button variant="secondary" size="sm" to="/report-issue" icon={Plus}>
            New Report
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <span className="auth-loading-spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Fetching complaint records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state-panel">
            <div className="empty-state-icon-box">
              <Inbox size={32} />
            </div>
            <h3 className="empty-state-title">No complaints found</h3>
            <p className="empty-state-desc">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No complaints matched your current search filters. Try clearing or broadening your criteria.'
                : 'You have not submitted any waste complaints yet. Spot garbage that needs clearing? File a report.'}
            </p>
            <Button variant="secondary" size="md" to="/report-issue" icon={Plus}>
              Report Waste Problem
            </Button>
          </div>
        ) : (
          <div className="complaints-list">
            {complaints.map((item) => {
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
                  onClick={() => navigate(`/complaint/${item._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/complaint/${item._id}`)}
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.75rem',
                        color: 'var(--color-muted)',
                        marginTop: '3px'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} /> {dateStr}
                      </span>
                      {item.location?.address?.formattedAddress && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={12} /> {item.location.address.formattedAddress}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="complaint-badges-group">
                    <span className="badge badge-category">{item.category}</span>
                    {getPriorityBadge(item.reportedPriority || item.priority)}
                    {getStatusBadge(item.status)}
                    <span className="complaint-track-cta">
                      Track Status <ArrowRight size={13} style={{ marginLeft: '3px' }} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
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
      </section>

      {/* Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default MyReportsPage;

