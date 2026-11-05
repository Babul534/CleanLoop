import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Edit2,
  Power,
  X
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import {
  getCollectors,
  createCollector,
  updateCollector,
  updateCollectorAvailability,
  toggleCollectorActivation
} from '../../services/adminService';

export const AdminCollectorsPage = () => {
  const [collectors, setCollectors] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    serviceAreas: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Modal
  const [editingCollector, setEditingCollector] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', serviceAreas: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getCollectors({
        page: currentPage,
        limit: 10,
        accountStatus: accountStatusFilter,
        availability: availabilityFilter,
        search: searchQuery
      });

      if (res?.success) {
        setCollectors(res.collectors || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Admin Collectors Load Error]:', err);
      setError('Failed to fetch collector roster.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, accountStatusFilter, availabilityFilter, searchQuery]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setFeedback({ error: '', success: '' });

      const res = await createCollector(createForm);
      if (res?.success) {
        setFeedback({ error: '', success: `Collector account for ${res.collector.name} created successfully.` });
        setShowCreateModal(false);
        setCreateForm({ name: '', email: '', password: '', phone: '', serviceAreas: '' });
        fetchRoster();
      }
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to provision collector account.', success: '' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditOpen = (collector) => {
    setEditingCollector(collector);
    setEditForm({
      name: collector.name || '',
      phone: collector.phone || '',
      serviceAreas: collector.serviceAreas ? collector.serviceAreas.join(', ') : ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCollector) return;
    try {
      setEditLoading(true);
      setFeedback({ error: '', success: '' });

      const res = await updateCollector(editingCollector._id, editForm);
      if (res?.success) {
        setFeedback({ error: '', success: 'Collector details updated.' });
        setEditingCollector(null);
        fetchRoster();
      }
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to update collector.', success: '' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActivation = async (collector) => {
    const targetStatus = collector.accountStatus === 'active' ? 'suspended' : 'active';
    try {
      setFeedback({ error: '', success: '' });
      const res = await toggleCollectorActivation(collector._id, { accountStatus: targetStatus });
      if (res?.success) {
        setFeedback({ error: '', success: `Collector ${collector.name} is now ${targetStatus}.` });
        fetchRoster();
      }
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to change activation status.',
        success: ''
      });
    }
  };

  const handleAvailabilityChange = async (collectorId, newAvail) => {
    try {
      setFeedback({ error: '', success: '' });
      const res = await updateCollectorAvailability(collectorId, { availability: newAvail });
      if (res?.success) {
        fetchRoster();
      }
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to update availability.', success: '' });
    }
  };

  return (
    <AdminLayout
      title="Field Sanitation Collectors"
      subtitle="Commission and manage municipal waste collectors, service sectors, and operational workload."
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

        {/* Action Header & Filters */}
        <div className="admin-filter-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--color-forest)" />
              <h3 className="admin-section-title" style={{ margin: 0 }}>
                Municipal Collector Roster
              </h3>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={UserPlus}
              iconPosition="left"
              onClick={() => setShowCreateModal(true)}
            >
              Provision New Collector
            </Button>
          </div>

          <div className="admin-filter-grid" style={{ gridTemplateColumns: '1fr 200px 200px' }}>
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, or telephone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>

            <select
              value={accountStatusFilter}
              onChange={(e) => {
                setAccountStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="all">All Account States</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="all">All Availabilities</option>
              <option value="available">Available for Dispatch</option>
              <option value="busy">Busy / On Route</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Collector Roster Table */}
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
        ) : collectors.length === 0 ? (
          <div className="complaints-empty-state">
            <Users size={36} color="var(--color-muted)" style={{ opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '8px 0 4px 0' }}>
              No Collectors Found
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              Provision a new collector account or adjust your search filters.
            </p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Contact</th>
                  <th>Service Sectors</th>
                  <th>Active Workload</th>
                  <th>Completed</th>
                  <th>Availability</th>
                  <th>Commission</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((c) => (
                  <tr key={c._id} className="admin-table-row">
                    <td>
                      <div>
                        <strong style={{ color: 'var(--color-forest)', fontSize: '0.88rem' }}>{c.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                          ID: {c._id.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>
                        <div>{c.email}</div>
                        <div style={{ color: 'var(--color-muted)' }}>{c.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td>
                      {c.serviceAreas?.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {c.serviceAreas.map((a, idx) => (
                            <span key={idx} className="badge badge-priority-low" style={{ fontSize: '0.65rem' }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Citywide</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>
                        {c.activeWorkload} active tasks
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
                        {c.completedWorkload} done
                      </span>
                    </td>
                    <td>
                      <select
                        value={c.availability}
                        onChange={(e) => handleAvailabilityChange(c._id, e.target.value)}
                        className="admin-mini-select"
                        disabled={c.accountStatus !== 'active'}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.accountStatus === 'active' ? 'badge-status-resolved' : 'badge-status-rejected'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {c.accountStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin-icon-action-btn"
                          onClick={() => handleEditOpen(c)}
                          title="Edit Collector Profile"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          className={`admin-icon-action-btn ${c.accountStatus === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleActivation(c)}
                          title={c.accountStatus === 'active' ? 'Suspend Collector' : 'Reactivate Collector'}
                        >
                          <Power size={13} />
                        </button>
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

        {/* Provision Collector Modal */}
        {showCreateModal && (
          <div className="detail-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="detail-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Provision Collector Account
                </h3>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="detail-modal-body">
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="collector@cleanloop.internal"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Temporary Access Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars, 1 letter, 1 number"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Dispatch Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-019-2834"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Assigned Sectors (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Sector 4, Central Hub, Harbor Lane"
                    value={createForm.serviceAreas}
                    onChange={(e) => setCreateForm({ ...createForm, serviceAreas: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" size="sm" type="submit" disabled={createLoading}>
                    {createLoading ? 'Provisioning...' : 'Provision Officer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Collector Modal */}
        {editingCollector && (
          <div className="detail-modal-overlay" onClick={() => setEditingCollector(null)}>
            <div className="detail-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Edit Collector Profile
                </h3>
                <button type="button" onClick={() => setEditingCollector(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="detail-modal-body">
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="review-item-label">Dispatch Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Service Sectors (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.serviceAreas}
                    onChange={(e) => setEditForm({ ...editForm, serviceAreas: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setEditingCollector(null)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" size="sm" type="submit" disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save Changes'}
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

export default AdminCollectorsPage;

