import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Award,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/common/Button';
import { getMyTransactionHistory } from '../../services/rewardService';

export const CitizenHistoryPage = () => {
  const [historyData, setHistoryData] = useState({
    transactions: [],
    currentBalance: 0,
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (targetPage = 1) => {
    try {
      setError('');
      const params = {
        page: targetPage,
        limit: 10,
        type: typeFilter !== 'all' ? typeFilter : undefined
      };
      const res = await getMyTransactionHistory(params);
      if (res?.success) {
        setHistoryData(res);
      }
    } catch (err) {
      console.error('[Transaction History Load Error]:', err);
      setError('Failed to load transaction ledger records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(page);
  };

  const { transactions, currentBalance, pagination } = historyData;

  return (
    <DashboardLayout
      title="Points Transaction Ledger"
      subtitle="Authoritative chronological record of all Green Points credited to your civic account."
    >
      <div className="rewards-container">
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="admin-pill-tag">
              Current Balance: <strong style={{ color: '#16a34a' }}>{currentBalance} PTS</strong>
            </span>
            <span className="admin-pill-tag">
              Total Transactions: <strong>{pagination.total}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-forest)',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all">All Award Types</option>
              <option value="complaint_resolved">Verified Cleanup Awards</option>
              <option value="admin_adjustment">Administrative Adjustments</option>
            </select>

            <Link to="/rewards" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm" icon={Award} iconPosition="left">
                Rewards Hub
              </Button>
            </Link>

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

        {loading ? (
          <div className="complaints-card" style={{ padding: '3rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
              <div className="notif-skeleton-item" style={{ height: '70px' }} />
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
            <Button variant="secondary" size="sm" onClick={() => fetchHistory(page)}>
              Retry Connection
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="complaints-empty-state">
            <History size={42} color="var(--color-muted)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '12px 0 6px 0' }}>
              No Transactions Recorded
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              You do not have any point transactions matching the selected criteria.
            </p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx._id} className="transaction-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-forest)', fontSize: '0.95rem' }}>
                        {tx.type === 'complaint_resolved' ? 'Verified Remediation Reward' : 'Administrative Credit'}
                      </span>
                      {tx.complaint?.complaintCode && (
                        <Link
                          to={`/complaint/${tx.complaint._id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <span className="complaint-code-badge" style={{ fontSize: '0.72rem', cursor: 'pointer' }}>
                            {tx.complaint.complaintCode}
                          </span>
                        </Link>
                      )}
                      {tx.complaint?.category && (
                        <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                          {tx.complaint.category}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '4px 0 6px 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {tx.reason}
                    </p>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      Timestamp: {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                      {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="tx-points-pill">
                  +{tx.points} PTS
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  iconPosition="left"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  iconPosition="right"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitizenHistoryPage;

