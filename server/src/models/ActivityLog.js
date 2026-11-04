import mongoose from 'mongoose';

/**
 * CleanLoop ActivityLog Model
 * Auditable security and operational ledger recording administrative actions,
 * status transitions, and system events.
 */

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates system-automated action
    },
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      trim: true,
      maxlength: [120, 'Action identifier cannot exceed 120 characters']
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: ['User', 'Complaint', 'Assignment', 'Feedback', 'PointsTransaction'],
        message: '{VALUE} is not a valid audit entity type'
      }
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

