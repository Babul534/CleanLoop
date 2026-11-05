import mongoose from 'mongoose';

/**
 * CleanLoop RewardRule Model
 * Configurable administrative parameters governing Green Points allocation
 * for verified civic remediation contributions.
 */

const rewardRuleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Rule code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: [true, 'Rule title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: ''
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      min: [1, 'Points must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Points must be an integer'
      }
    },
    category: {
      type: String,
      enum: {
        values: ['all', 'plastic', 'organic', 'construction', 'household', 'industrial', 'mixed', 'other'],
        message: '{VALUE} is not a valid waste category'
      },
      default: 'all'
    },
    priority: {
      type: String,
      enum: {
        values: ['all', 'low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority tier'
      },
      default: 'all'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
rewardRuleSchema.index({ isActive: 1, category: 1, priority: 1 });

export const RewardRule = mongoose.model('RewardRule', rewardRuleSchema);
export default RewardRule;

