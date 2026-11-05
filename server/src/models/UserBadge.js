import mongoose from 'mongoose';

/**
 * CleanLoop UserBadge Model
 * Records unlocked civic achievements and badges for citizen participants.
 * Compound unique index on { user, badgeCode } strictly guarantees zero duplicate awards.
 */

const userBadgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    badgeCode: {
      type: String,
      required: [true, 'Badge code identifier is required'],
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Badge title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    icon: {
      type: String,
      trim: true,
      default: 'award'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Prevents duplicate badge award per citizen
userBadgeSchema.index({ user: 1, badgeCode: 1 }, { unique: true });

export const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
export default UserBadge;

