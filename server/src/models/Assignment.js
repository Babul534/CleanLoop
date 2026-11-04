import mongoose from 'mongoose';

/**
 * CleanLoop Assignment Model
 * Maintains historical and active task allocations for municipal waste collectors.
 */

const completionImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Completion image URL is required'],
      trim: true
    },
    publicId: {
      type: String,
      required: [true, 'Completion image public identifier is required'],
      trim: true
    }
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required']
    },
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned collector reference is required']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigning administrator reference is required']
    },
    status: {
      type: String,
      enum: {
        values: [
          'assigned',
          'accepted',
          'in_progress',
          'submitted_for_verification',
          'verified',
          'reassigned',
          'cancelled'
        ],
        message: '{VALUE} is not a valid assignment status'
      },
      default: 'assigned'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    completionImages: {
      type: [completionImageSchema],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
assignmentSchema.index({ complaint: 1 });
assignmentSchema.index({ collector: 1, status: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ createdAt: -1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
