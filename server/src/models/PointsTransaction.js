import mongoose from 'mongoose';

/**
 * CleanLoop PointsTransaction Model
 * Immutable ledger of Green Points transactions awarded or adjusted for civic activity.
 * Source of truth for all user reward calculations.
 */

const pointsTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      validate: {
        validator: (v) => typeof v === 'number' && Number.isInteger(v) && v !== 0,
        message: 'Points must be a non-zero integer'
      }
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['complaint_resolved', 'admin_adjustment'],
        message: '{VALUE} is not a valid points transaction type'
      }
    },
    reason: {
      type: String,
      required: [true, 'Transaction reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
// 1. User ledger index for fast point aggregation and transaction history
pointsTransactionSchema.index({ user: 1, createdAt: -1 });

// 2. Sparse unique index on idempotencyKey to ensure payment/award idempotence when provided
pointsTransactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

// 3. Partial unique index to strictly prevent duplicate resolution rewards for the same complaint
pointsTransactionSchema.index(
  { complaint: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'complaint_resolved',
      complaint: { $exists: true, $type: 'objectId' }
    }
  }
);

export const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
export default PointsTransaction;
