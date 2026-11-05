import React from 'react';
import {
  Check,
  Clock,
  Truck,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const STANDARD_STAGES = [
  {
    key: 'pending',
    title: 'Report Submitted',
    desc: 'Citizen submission recorded with GPS telemetry and photographs.',
    icon: FileText
  },
  {
    key: 'under_review',
    title: 'Municipal Review',
    desc: 'Sanitation dispatch audits triage urgency, jurisdiction, and priority.',
    icon: Clock
  },
  {
    key: 'assigned',
    title: 'Collector Assigned',
    desc: 'Waste collection vehicle and designated field crew scheduled.',
    icon: Truck
  },
  {
    key: 'in_progress',
    title: 'Cleanup In Progress',
    desc: 'Crew on site executing waste removal and container clearing.',
    icon: Sparkles
  },
  {
    key: 'awaiting_verification',
    title: 'Awaiting Verification',
    desc: 'Field clearance completed; pending final supervisory audit.',
    icon: ShieldCheck
  },
  {
    key: 'resolved',
    title: 'Verified & Resolved',
    desc: 'Municipal supervisor verified clearance; civic ledger closed.',
    icon: CheckCircle2
  }
];

export const StatusTimeline = ({ complaint }) => {
  if (!complaint) return null;

  const currentStatus = complaint.status || 'pending';
  const isRejected = currentStatus === 'rejected';
  const historyList = complaint.statusHistory || [];

  // Map each status in history to its latest occurrence
  const historyMap = {};
  historyList.forEach((entry) => {
    historyMap[entry.status] = entry;
  });

  // Calculate current stage index in standard pipeline
  const standardKeys = STANDARD_STAGES.map((s) => s.key);
  const currentStageIndex = standardKeys.indexOf(currentStatus);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="status-timeline-card">
      <div className="timeline-header">
        <h3 className="timeline-title">Progress & Verification Timeline</h3>
        <span className="timeline-status-badge">
          Current State: <strong>{currentStatus === 'resolved' ? 'VERIFIED & RESOLVED' : currentStatus.replace(/_/g, ' ').toUpperCase()}</strong>
        </span>
      </div>

      {/* Prominent Banner for Rejection */}
      {isRejected && (
        <div className="timeline-alert-banner alert-rejected">
          <div style={{ display: 'flex', gap: '12px' }}>
            <XCircle size={22} className="alert-icon-reject" />
            <div>
              <h4 className="alert-banner-title">Report Not Accepted</h4>
              <p className="alert-banner-desc">
                {complaint.rejectionReason ||
                  historyMap.rejected?.note ||
                  'This report was reviewed by municipal officers and marked as rejected.'}
              </p>
              {historyMap.rejected?.changedAt && (
                <span className="alert-banner-time">
                  Decision logged: {formatTimestamp(historyMap.rejected.changedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prominent Banner for Resolution */}
      {currentStatus === 'resolved' && (
        <div className="timeline-alert-banner alert-resolved">
          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={22} className="alert-icon-resolve" />
            <div>
              <h4 className="alert-banner-title">Sanitation Verified & Resolved</h4>
              <p className="alert-banner-desc">
                {historyMap.resolved?.note ||
                  'The designated waste area has been cleared, sanitized, and audited by municipal officers.'}
              </p>
              {complaint.resolvedAt && (
                <span className="alert-banner-time">
                  Completed on: {formatTimestamp(complaint.resolvedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stepper Timeline */}
      <div className="timeline-stepper">
        {STANDARD_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const historyEntry = historyMap[stage.key];
          const hasOccurred = Boolean(historyEntry);

          let stageState = 'upcoming';
          if (isRejected) {
            stageState = hasOccurred ? 'completed' : 'disabled';
          } else if (currentStatus === 'resolved') {
            stageState = currentStageIndex >= idx || hasOccurred ? 'completed' : 'upcoming';
          } else if (stage.key === currentStatus) {
            stageState = 'active';
          } else if (currentStageIndex > idx || (hasOccurred && currentStageIndex >= idx)) {
            stageState = 'completed';
          }

          return (
            <div key={stage.key} className={`timeline-step is-${stageState}`}>
              {/* Vertical connector line */}
              {idx < STANDARD_STAGES.length - 1 && (
                <div
                  className={`timeline-connector ${
                    stageState === 'completed' && !isRejected ? 'is-filled' : ''
                  }`}
                />
              )}

              {/* Node indicator */}
              <div className="timeline-node">
                {stageState === 'completed' ? (
                  <Check size={14} className="node-icon-completed" />
                ) : stageState === 'active' ? (
                  <span className="node-active-pulse" />
                ) : (
                  <span className="node-dot-upcoming" />
                )}
              </div>

              {/* Step content */}
              <div className="timeline-content">
                <div className="timeline-step-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 className="timeline-step-title">{stage.title}</h4>
                    {stage.key === 'resolved' && currentStatus === 'resolved' ? (
                      <span className="timeline-tag-completed">VERIFIED</span>
                    ) : stageState === 'active' ? (
                      <span className="timeline-tag-current">
                        {stage.key === 'awaiting_verification' ? 'Awaiting Verification' : 'In Progress'}
                      </span>
                    ) : null}
                  </div>

                  {historyEntry?.changedAt && (
                    <span className="timeline-step-timestamp">
                      {formatTimestamp(historyEntry.changedAt)}
                    </span>
                  )}
                </div>

                <p className="timeline-step-desc">{stage.desc}</p>

                {/* Optional Operational Note from municipal logs */}
                {historyEntry?.note && (
                  <div className="timeline-note-callout">
                    <span className="note-actor-label">
                      Municipal Log:
                    </span>
                    <p className="note-text">"{historyEntry.note}"</p>
                    {historyEntry.changedBy?.name && (
                      <span className="note-byline">
                        — Recorded by {historyEntry.changedBy.name} ({historyEntry.changedBy.role || 'Staff'})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Append rejection node if rejected */}
        {isRejected && (
          <div className="timeline-step is-rejected">
            <div className="timeline-node node-rejected">
              <XCircle size={15} />
            </div>
            <div className="timeline-content">
              <div className="timeline-step-header">
                <h4 className="timeline-step-title" style={{ color: 'var(--color-clay)' }}>
                  Report Terminated (Rejected)
                </h4>
                {historyMap.rejected?.changedAt && (
                  <span className="timeline-step-timestamp">
                    {formatTimestamp(historyMap.rejected.changedAt)}
                  </span>
                )}
              </div>
              <p className="timeline-step-desc">
                {complaint.rejectionReason || 'Case closed without municipal field dispatch.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusTimeline;

