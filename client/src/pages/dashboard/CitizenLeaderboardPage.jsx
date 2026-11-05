import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Shield,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/common/Button';
import { getLeaderboard } from '../../services/rewardService';

export const CitizenLeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState({
    leaderboard: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    currentUserRank: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (targetPage = 1) => {
    try {
      setError('');
      const res = await getLeaderboard({ page: targetPage, limit: 20 });
      if (res?.success) {
        setLeaderboardData(res);
      }
    } catch (err) {
      console.error('[Leaderboard Load Error]:', err);
      setError('Failed to load civic leaderboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(page);
  }, [fetchLeaderboard, page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(page);
  };

  const { leaderboard, pagination, currentUserRank } = leaderboardData;
  const topThree = leaderboard.slice(0, 3);
  const remainingRanks = leaderboard.slice(3);

  return (
    <DashboardLayout
      title="Civic Sustainability Leaderboard"
      subtitle="Recognizing the foremost community champions driving cleaner, waste-resilient neighborhoods."
    >
      <div className="rewards-container">
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-pill-tag">
              Total Community Champions: <strong>{pagination?.total || 0}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/rewards" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm" icon={Award} iconPosition="left">
                My Points & Badges
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

        {/* Current User Rank Strip (if ranked) */}
        {currentUserRank && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(23,84,58,0.08) 0%, rgba(217,243,106,0.12) 100%)',
              border: '1.5px solid var(--color-forest)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-forest)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}
              >
                #{currentUserRank.rank}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', fontWeight: 700 }}>
                  Your Current Standing
                </span>
                <h4 style={{ margin: '2px 0 0 0', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1rem' }}>
                  Ranked #{currentUserRank.rank} across the Municipality
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                {currentUserRank.totalPoints}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>PTS</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="complaints-card" style={{ padding: '3rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '180px' }} />
              <div className="notif-skeleton-item" style={{ height: '240px' }} />
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
            <Button variant="secondary" size="sm" onClick={() => fetchLeaderboard(page)}>
              Retry Connection
            </Button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="complaints-empty-state">
            <Trophy size={42} color="var(--color-muted)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', margin: '12px 0 6px 0' }}>
              No Ranked Participants Yet
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Be the first community pioneer! Submit a verified cleanup report to claim the #1 municipal rank.
            </p>
            <Link to="/report-issue" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">File First Report</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Podium (Only on Page 1) */}
            {page === 1 && topThree.length > 0 && (
              <div className="leaderboard-podium">
                {/* Rank 2 (Silver) */}
                {topThree[1] ? (
                  <div className="podium-card rank-2">
                    <div className="podium-medal-badge">2</div>
                    <h4 className="podium-name">{topThree[1].displayName}</h4>
                    <span className="podium-badge-label">{topThree[1].badge}</span>
                    <span className="podium-points">{topThree[1].totalPoints} PTS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                      {topThree[1].verifiedCleanups} Verified Sites
                    </span>
                  </div>
                ) : (
                  <div style={{ minHeight: '180px' }} />
                )}

                {/* Rank 1 (Gold) */}
                {topThree[0] && (
                  <div className="podium-card rank-1">
                    <div className="podium-medal-badge">
                      <Trophy size={22} color="#854d0e" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#854d0e', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      Civic Grandmaster
                    </span>
                    <h4 className="podium-name" style={{ fontSize: '1.2rem' }}>{topThree[0].displayName}</h4>
                    <span className="podium-badge-label">{topThree[0].badge}</span>
                    <span className="podium-points" style={{ fontSize: '1.75rem', color: '#17543A' }}>
                      {topThree[0].totalPoints} PTS
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                      {topThree[0].verifiedCleanups} Verified Sites
                    </span>
                  </div>
                )}

                {/* Rank 3 (Bronze) */}
                {topThree[2] ? (
                  <div className="podium-card rank-3">
                    <div className="podium-medal-badge">3</div>
                    <h4 className="podium-name">{topThree[2].displayName}</h4>
                    <span className="podium-badge-label">{topThree[2].badge}</span>
                    <span className="podium-points">{topThree[2].totalPoints} PTS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                      {topThree[2].verifiedCleanups} Verified Sites
                    </span>
                  </div>
                ) : (
                  <div style={{ minHeight: '180px' }} />
                )}
              </div>
            )}

            {/* Complete Leaderboard Table */}
            <div className="leaderboard-table-card">
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.05rem' }}>
                  Municipal Standings
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Citizen Champion</th>
                      <th>Civic Rank / Badge</th>
                      <th style={{ textAlign: 'center' }}>Verified Sites</th>
                      <th style={{ textAlign: 'right' }}>Green Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item) => (
                      <tr key={item.userId} className={item.isCurrentUser ? 'is-current-user' : ''}>
                        <td className="leaderboard-rank-col">
                          {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
                              {item.displayName}
                            </span>
                            {item.isCurrentUser && (
                              <span className="badge badge-category" style={{ fontSize: '0.68rem', backgroundColor: 'var(--color-forest)', color: '#ffffff' }}>
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>
                            {item.badge}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--color-forest)', fontWeight: 600 }}>
                          {item.verifiedCleanups}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>
                          +{item.totalPoints} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footbar */}
              {pagination.totalPages > 1 && (
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    Showing page {page} of {pagination.totalPages}
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

            {/* Privacy Shield Notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
              <EyeOff size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Confidentiality Notice:</strong> In adherence to civic privacy policies, citizen names are masked to initial format and private emails or phone numbers are never disclosed on public scoreboards.
              </span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitizenLeaderboardPage;

