import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  Trophy,
  History,
  TrendingUp,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/common/Button';
import { getMyPointsSummary } from '../../services/rewardService';

export const CitizenRewardsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setError('');
      const res = await getMyPointsSummary();
      if (res?.success) {
        setData(res.summary);
      }
    } catch (err) {
      console.error('[Rewards Page Error]:', err);
      setError('Failed to load your Green Points ledger.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles size={22} />;
      case 'leaf':
        return <Leaf size={22} />;
      case 'award':
        return <Award size={22} />;
      case 'shield-check':
        return <ShieldCheck size={22} />;
      case 'trophy':
        return <Trophy size={22} />;
      default:
        return <Award size={22} />;
    }
  };

  return (
    <DashboardLayout
      title="Green Points & Achievements"
      subtitle="Track your civic sustainability impact, unlock civic achievement badges, and climb the municipal leaderboard."
    >
      <div className="rewards-container">
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" icon={Trophy} iconPosition="left">
              View Leaderboard
            </Button>
          </Link>
          <Link to="/rewards/history" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm" icon={History} iconPosition="left">
              Transaction History
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

        {loading ? (
          <div className="complaints-card" style={{ padding: '3rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '160px' }} />
              <div className="notif-skeleton-item" style={{ height: '100px' }} />
              <div className="notif-skeleton-item" style={{ height: '260px' }} />
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
            <Button variant="secondary" size="sm" onClick={fetchSummary}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {/* 1. Hero Points Balance Card */}
            <div className="points-hero-card">
              <div className="points-hero-content">
                <div className="points-hero-left">
                  <div className="points-hero-badge-wrap">
                    <Sparkles size={36} />
                  </div>
                  <div className="points-hero-balance-wrap">
                    <span className="points-hero-label">Available Green Points</span>
                    <div className="points-hero-number">
                      {data?.balance || 0}
                      <span className="points-hero-unit">PTS</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to="/report-issue" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="md" style={{ backgroundColor: '#D9F36A', color: '#17543A', borderColor: '#D9F36A', fontWeight: 700 }}>
                      Earn More Points
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Footer Row */}
              <div className="points-hero-stats-row">
                <div className="points-hero-stat-item">
                  <span className="points-hero-stat-label">Lifetime Points Earned</span>
                  <span className="points-hero-stat-val">+{data?.lifetimeEarned || 0}</span>
                </div>
                <div className="points-hero-stat-item">
                  <span className="points-hero-stat-label">Verified Cleanups</span>
                  <span className="points-hero-stat-val">{data?.verifiedCleanups || 0} Sites</span>
                </div>
                <div className="points-hero-stat-item">
                  <span className="points-hero-stat-label">Badges Unlocked</span>
                  <span className="points-hero-stat-val">
                    {data?.unlockedBadgesCount || 0} / {data?.badges?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Next Achievement Progress Banner */}
            {data?.nextBadge && (
              <div className="next-achievement-strip">
                <div className="next-achievement-info">
                  <div className="next-achievement-icon">
                    {getBadgeIcon(data.nextBadge.icon)}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', fontWeight: 700 }}>
                      Next Civic Milestone
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1rem' }}>
                      {data.nextBadge.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      {data.nextBadge.description}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-forest)' }}>
                    <span>{data.nextBadge.currentValue} / {data.nextBadge.targetValue} {data.nextBadge.targetType}</span>
                    <span>{data.nextBadge.progressPercentage}%</span>
                  </div>
                  <div className="progress-track" style={{ maxWidth: '100%' }}>
                    <div className="progress-fill" style={{ width: `${data.nextBadge.progressPercentage}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Achievements & Badges Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.25rem' }}>
                    Civic Achievement Badges
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    Permanent milestone recognitions awarded for verified neighborhood remediations.
                  </p>
                </div>
              </div>

              <div className="badges-grid">
                {data?.badges?.map((badge) => (
                  <div key={badge.badgeCode} className={`badge-card ${badge.isUnlocked ? 'is-unlocked' : 'is-locked'}`}>
                    <div className="badge-card-header">
                      <div className="badge-icon-box">
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <span className={`badge-pill-status ${badge.isUnlocked ? 'unlocked' : 'locked'}`}>
                        {badge.isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>

                    <h4 className="badge-title">{badge.title}</h4>
                    <p className="badge-desc">{badge.description}</p>

                    <div className="badge-footer-progress">
                      {badge.isUnlocked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={15} />
                          Unlocked on {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : (
                        <div>
                          <div className="badge-progress-meta">
                            <span>Progress</span>
                            <strong>{badge.currentValue} / {badge.targetValue} ({badge.progressPercentage}%)</strong>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${badge.progressPercentage}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Recent Transactions Preview & Earning Guide Split */}
            <div className="admin-split-grid" style={{ marginTop: '0.5rem' }}>
              {/* Recent Activity */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 className="admin-card-title">Recent Point Awards</h3>
                  <Link to="/rewards/history" className="admin-card-link">
                    Full Ledger <ArrowRight size={13} />
                  </Link>
                </div>

                {data?.recentTransactions?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    <p style={{ margin: 0 }}>No points recorded yet.</p>
                    <p style={{ margin: '4px 0 1rem 0' }}>Submit a cleanup report to earn your first reward!</p>
                    <Link to="/report-issue" style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="sm">File a Report</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="admin-mini-list">
                    {data.recentTransactions.map((tx) => (
                      <div key={tx._id} className="admin-mini-row">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="complaint-code-badge" style={{ fontSize: '0.75rem' }}>
                              {tx.complaint?.complaintCode || 'CIVIC REWARD'}
                            </span>
                            <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                              {tx.complaint?.category || 'General'}
                            </span>
                          </div>
                          <span className="mini-row-sub">{tx.reason}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>
                            +{tx.points} PTS
                          </span>
                          <span className="mini-row-date">
                            {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How It Works Guide */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Info size={18} color="var(--color-forest)" />
                  <h3 className="admin-card-title" style={{ margin: 0 }}>
                    How Green Points Work
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(23,84,58,0.1)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      1
                    </span>
                    <div>
                      <strong>Report Civic Waste:</strong> Submit genuine geolocation photos of illegal dumping or overflowing bins.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(23,84,58,0.1)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      2
                    </span>
                    <div>
                      <strong>Field Clearance:</strong> Municipal sanitation crews are dispatched to clear and photograph the remediation.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(23,84,58,0.1)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      3
                    </span>
                    <div>
                      <strong>Supervisory Audit:</strong> Administrators verify photographic proof. Once resolved, <strong>+50 to +75 Green Points</strong> are credited directly to your authoritative ledger.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(23,84,58,0.1)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      4
                    </span>
                    <div>
                      <strong>Unlock Badges:</strong> Reach community milestones and rank on the city-wide sustainability leaderboard.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitizenRewardsPage;

