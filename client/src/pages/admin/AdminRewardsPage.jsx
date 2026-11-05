import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Sparkles,
  Settings,
  History,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Edit2,
  X,
  FileText
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import {
  getAdminRewardRules,
  createAdminRewardRule,
  updateAdminRewardRule,
  getAdminRewardHistory,
  getAdminCitizenRewardInspect
} from '../../services/adminService';

export const AdminRewardsPage = () => {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'history'
  const [rules, setRules] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  // History state
  const [historyData, setHistoryData] = useState({
    transactions: [],
    metrics: { totalPointsDistributed: 0, uniqueCitizensRewarded: 0, totalTransactions: 0 },
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [inspectedCitizen, setInspectedCitizen] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Forms
  const [newRule, setNewRule] = useState({
    code: '',
    title: '',
    description: '',
    points: 50,
    category: 'all',
    priority: 'all',
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch Rules
  const fetchRules = useCallback(async () => {
    try {
      setError('');
      const res = await getAdminRewardRules();
      if (res?.success) {
        setRules(res.rules || []);
        setAchievements(res.achievementDefinitions || []);
      }
    } catch (err) {
      console.error('[Admin Reward Rules Error]:', err);
      setError('Failed to fetch reward rules from MongoDB.');
    } finally {
      setRulesLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Fetch History
  const fetchHistory = useCallback(async (targetPage = 1) => {
    try {
      setHistoryLoading(true);
      const res = await getAdminRewardHistory({
        page: targetPage,
        limit: 20,
        search: searchQuery || undefined
      });
      if (res?.success) {
        setHistoryData(res);
      }
    } catch (err) {
      console.error('[Admin Reward History Error]:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, fetchHistory, historyPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'rules') fetchRules();
    else fetchHistory(historyPage);
  };

  // Create Rule Handler
  const handleCreateRuleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await createAdminRewardRule(newRule);
      if (res?.success) {
        setShowCreateModal(false);
        setNewRule({
          code: '',
          title: '',
          description: '',
          points: 50,
          category: 'all',
          priority: 'all',
          isActive: true
        });
        fetchRules();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create reward rule.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Rule Status
  const handleToggleRuleActive = async (rule) => {
    try {
      await updateAdminRewardRule(rule._id, { isActive: !rule.isActive });
      fetchRules();
    } catch (err) {
      console.error('[Toggle Rule Error]:', err);
    }
  };

  // Edit Points Submit
  const handleEditRuleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRule) return;
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await updateAdminRewardRule(editingRule._id, {
        title: editingRule.title,
        description: editingRule.description,
        points: editingRule.points,
        category: editingRule.category,
        priority: editingRule.priority,
        isActive: editingRule.isActive
      });
      if (res?.success) {
        setEditingRule(null);
        fetchRules();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update rule.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Inspect Citizen
  const handleInspectCitizen = async (userId) => {
    try {
      setInspectLoading(true);
      const res = await getAdminCitizenRewardInspect(userId);
      if (res?.success) {
        setInspectedCitizen(res);
      }
    } catch (err) {
      console.error('[Inspect Citizen Error]:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const metrics = historyData?.metrics || {};

  return (
    <AdminLayout
      title="Green Points & Reward Governance"
      subtitle="Supervise municipal incentive schemes, calibrate verified cleanup allocations, and audit citizen reward ledgers."
    >
      <div className="admin-page-container">
        {/* Top Control Bar */}
        <div className="admin-controls-bar">
          <div className="admin-badge-strip">
            <span className="admin-pill-tag">
              Total Points Distributed: <strong>{metrics.totalPointsDistributed || 0} PTS</strong>
            </span>
            <span className="admin-pill-tag">
              Active Reward Rules: <strong>{rules.filter((r) => r.isActive).length} / {rules.length}</strong>
            </span>
            <span className="admin-pill-tag">
              Citizens Rewarded: <strong>{metrics.uniqueCitizensRewarded || 0}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              iconPosition="left"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'rules' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: activeTab === 'rules' ? 'var(--color-forest)' : 'transparent',
              color: activeTab === 'rules' ? '#ffffff' : 'var(--color-muted)'
            }}
          >
            Reward Rules Configuration
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: activeTab === 'history' ? 'var(--color-forest)' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : 'var(--color-muted)'
            }}
          >
            Point Award Audit Ledger
          </button>
        </div>

        {error && (
          <div className="complaints-empty-state" style={{ padding: '1.5rem' }}>
            <AlertTriangle size={32} color="#D9381E" />
            <p style={{ margin: '8px 0 0 0', color: '#D9381E', fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

        {/* TAB 1: REWARD RULES CONFIGURATION */}
        {activeTab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.15rem' }}>
                  Municipal Reward Calculation Rules
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Active policies determining points granted to citizens upon verified incident remediation.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                iconPosition="left"
                onClick={() => setShowCreateModal(true)}
              >
                Add Reward Rule
              </Button>
            </div>

            {rulesLoading ? (
              <div className="notif-loading-wrap">
                <div className="notif-skeleton-item" style={{ height: '80px' }} />
                <div className="notif-skeleton-item" style={{ height: '80px' }} />
              </div>
            ) : rules.length === 0 ? (
              <div className="complaints-empty-state">
                <Award size={36} color="var(--color-muted)" />
                <p>No reward rules found.</p>
              </div>
            ) : (
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rule Code & Title</th>
                      <th>Category Scope</th>
                      <th>Priority Scope</th>
                      <th>Points Awarded</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule._id}>
                        <td>
                          <div>
                            <span className="complaint-code-badge" style={{ fontSize: '0.72rem' }}>
                              {rule.code}
                            </span>
                            <div style={{ fontWeight: 700, color: 'var(--color-forest)', marginTop: '2px' }}>
                              {rule.title}
                            </div>
                            {rule.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                            {rule.category === 'all' ? 'All Categories' : rule.category}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge badge-priority-${rule.priority}`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {rule.priority === 'all' ? 'All Priorities' : rule.priority}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>
                            +{rule.points} PTS
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill-metric ${rule.isActive ? '' : 'is-rejected'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {rule.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit2}
                              onClick={() => setEditingRule(rule)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleRuleActive(rule)}
                              style={{
                                color: rule.isActive ? '#D9381E' : '#16a34a',
                                borderColor: rule.isActive ? '#D9381E' : '#16a34a'
                              }}
                            >
                              {rule.isActive ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Achievement Rules Review Reference */}
            <div className="admin-card" style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                System Achievement Milestones
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: 'var(--color-muted)' }}>
                Canonical automated achievements evaluated on complaint resolution.
              </p>

              <div className="badges-grid">
                {achievements.map((ach) => (
                  <div key={ach.badgeCode} className="badge-card" style={{ padding: '1.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div className="badge-icon-box" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--color-forest)', fontSize: '0.95rem' }}>
                          {ach.title}
                        </h5>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          Code: {ach.badgeCode}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      {ach.description}
                    </p>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-forest)', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                      Unlock Criteria: <strong>{ach.targetValue} {ach.targetType}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POINT AWARD AUDIT LEDGER */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', minWidth: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  placeholder="Search reason or report code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 10px 8px 34px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    width: '100%',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                Page {historyData.pagination.page} of {historyData.pagination.totalPages} ({historyData.pagination.total} records)
              </span>
            </div>

            {historyLoading ? (
              <div className="notif-loading-wrap">
                <div className="notif-skeleton-item" style={{ height: '70px' }} />
                <div className="notif-skeleton-item" style={{ height: '70px' }} />
              </div>
            ) : historyData.transactions.length === 0 ? (
              <div className="complaints-empty-state">
                <History size={36} color="var(--color-muted)" />
                <p>No reward transactions recorded matching criteria.</p>
              </div>
            ) : (
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Citizen Recipient</th>
                      <th>Associated Report</th>
                      <th>Award Reason</th>
                      <th>Points Credited</th>
                      <th>Timestamp</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(23,84,58,0.1)',
                                color: 'var(--color-forest)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}
                            >
                              {tx.user?.name ? tx.user.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-forest)', fontSize: '0.875rem' }}>
                                {tx.user?.name || 'Citizen'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                {tx.user?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {tx.complaint ? (
                            <div>
                              <span className="complaint-code-badge" style={{ fontSize: '0.72rem' }}>
                                {tx.complaint.complaintCode}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                                {tx.complaint.category}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>System Incentive</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                            {tx.reason}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>
                            +{tx.points} PTS
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {tx.user?._id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectCitizen(tx.user._id)}
                            >
                              Inspect Citizen
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {historyData.pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  iconPosition="left"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1}
                >
                  Previous
                </Button>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Page {historyPage} of {historyData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  iconPosition="right"
                  onClick={() => setHistoryPage((p) => Math.min(historyData.pagination.totalPages, p + 1))}
                  disabled={historyPage >= historyData.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Create Rule Modal */}
        {showCreateModal && (
          <div className="detail-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="detail-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Define New Reward Policy
                </h3>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRuleSubmit} className="detail-modal-body">
                {formError && (
                  <p style={{ color: '#D9381E', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{formError}</p>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Rule Code (Unique Identifier)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HAZARD_RESPONSE_BONUS"
                    value={newRule.code}
                    onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Rule Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hazardous Remediation Bonus"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Points Awarded</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRule.points}
                    onChange={(e) => setNewRule({ ...newRule, points: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                  <div>
                    <label className="review-item-label">Category Scope</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="all">All Categories</option>
                      <option value="plastic">Plastic</option>
                      <option value="organic">Organic</option>
                      <option value="construction">Construction</option>
                      <option value="household">Household</option>
                      <option value="industrial">Industrial</option>
                      <option value="mixed">Mixed</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="review-item-label">Priority Scope</label>
                    <select
                      value={newRule.priority}
                      onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Operational notes explaining when this reward is credited..."
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={formSubmitting}>
                    {formSubmitting ? 'Creating...' : 'Save Policy'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Rule Modal */}
        {editingRule && (
          <div className="detail-modal-overlay" onClick={() => setEditingRule(null)}>
            <div className="detail-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Configure Points: {editingRule.code}
                </h3>
                <button type="button" onClick={() => setEditingRule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditRuleSubmit} className="detail-modal-body">
                {formError && (
                  <p style={{ color: '#D9381E', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{formError}</p>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Title</label>
                  <input
                    type="text"
                    required
                    value={editingRule.title}
                    onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="review-item-label">Points Awarded (Integer)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingRule.points}
                    onChange={(e) => setEditingRule({ ...editingRule, points: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="review-item-label">Policy Status</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={editingRule.isActive === true}
                        onChange={() => setEditingRule({ ...editingRule, isActive: true })}
                      />
                      Active (Incentive Enabled)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={editingRule.isActive === false}
                        onChange={() => setEditingRule({ ...editingRule, isActive: false })}
                      />
                      Disabled
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => setEditingRule(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={formSubmitting}>
                    {formSubmitting ? 'Saving...' : 'Update Policy'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Citizen Inspector Drawer */}
        {inspectedCitizen && (
          <div className="detail-modal-overlay" onClick={() => setInspectedCitizen(null)}>
            <div className="detail-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.15rem' }}>
                    Citizen Reward Profile
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    {inspectedCitizen.citizen?.name} ({inspectedCitizen.citizen?.email})
                  </span>
                </div>
                <button type="button" onClick={() => setInspectedCitizen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="detail-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="fleet-item" style={{ textAlign: 'center' }}>
                    <span className="fleet-label">Balance</span>
                    <span className="fleet-value" style={{ color: '#16a34a' }}>
                      {inspectedCitizen.summary?.balance || 0}
                    </span>
                  </div>
                  <div className="fleet-item" style={{ textAlign: 'center' }}>
                    <span className="fleet-label">Lifetime Earned</span>
                    <span className="fleet-value">
                      {inspectedCitizen.summary?.lifetimeEarned || 0}
                    </span>
                  </div>
                  <div className="fleet-item" style={{ textAlign: 'center' }}>
                    <span className="fleet-label">Cleanups</span>
                    <span className="fleet-value" style={{ color: 'var(--color-forest)' }}>
                      {inspectedCitizen.summary?.verifiedCleanups || 0}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                    Unlocked Badges ({inspectedCitizen.summary?.badges?.filter((b) => b.isUnlocked).length || 0})
                  </h5>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {inspectedCitizen.summary?.badges?.filter((b) => b.isUnlocked).map((b) => (
                      <span key={b.badgeCode} className="badge badge-category" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        ★ {b.title}
                      </span>
                    ))}
                    {inspectedCitizen.summary?.badges?.filter((b) => b.isUnlocked).length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>No badges unlocked yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                    Recent Ledger Entries
                  </h5>
                  <div className="admin-mini-list">
                    {inspectedCitizen.summary?.recentTransactions?.map((tx) => (
                      <div key={tx._id} className="admin-mini-row">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-forest)' }}>
                            {tx.complaint?.complaintCode || 'Incentive'}
                          </div>
                          <span className="mini-row-sub">{tx.reason}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.875rem' }}>
                            +{tx.points} PTS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRewardsPage;

