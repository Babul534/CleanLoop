import mongoose from 'mongoose';

/**
 * CleanLoop Feedback Model
 * Captures citizen satisfaction ratings and qualitative comments upon complaint resolution.
 */

const feedbackSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rating user reference is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating value is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5'
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index: prevents multiple feedback submissions from the same user on a complaint
feedbackSchema.index({ complaint: 1, user: 1 }, { unique: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
