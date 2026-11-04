import mongoose from 'mongoose';

/**
 * CleanLoop Complaint Model
 * Tracks civic sanitation reports from citizen submission to verified resolution.
 */

const imageObjectSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    publicId: {
      type: String,
      required: [true, 'Image public identifier is required'],
      trim: true
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'pending',
        'under_review',
        'assigned',
        'in_progress',
        'awaiting_verification',
        'resolved',
        'rejected',
        'reopen_requested'
      ]
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: null
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const reopenRequestSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reopen reason cannot exceed 1000 characters']
    },
    evidenceImages: {
      type: [imageObjectSchema],
      validate: {
        validator: (imgs) => !imgs || imgs.length <= 5,
        message: 'Reopen request cannot include more than 5 evidence images'
      },
      default: []
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    decision: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintCode: {
      type: String,
      required: [true, 'Complaint code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      default: () => {
        const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
        const timestampSegment = Date.now().toString(36).toUpperCase();
        return `CLN-${timestampSegment}-${randomHex}`;
      }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting user reference is required']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Waste category is required'],
      enum: {
        values: [
          'plastic',
          'organic',
          'construction',
          'household',
          'industrial',
          'mixed',
          'other'
        ],
        message: '{VALUE} is not an authorized waste category'
      }
    },
    reportedPriority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'medium'
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'medium'
    },
    images: {
      type: [imageObjectSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 5,
        message: 'Cannot attach more than 5 images to a single complaint'
      },
      default: []
    },
    // GeoJSON Point location schema
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: [true, 'GeoJSON location type must be Point']
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            if (typeof lng !== 'number' || typeof lat !== 'number') return false;
            if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message:
            'Coordinates must be [longitude, latitude] where longitude is between -180 and 180 and latitude is between -90 and 90'
        }
      },
      address: {
        formattedAddress: { type: String, trim: true, default: '' },
        landmark: { type: String, trim: true, default: '' }
      },
      source: {
        type: String,
        enum: ['gps', 'manual'],
        default: 'gps'
      }
    },
    assignedCollector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'under_review',
          'assigned',
          'in_progress',
          'awaiting_verification',
          'resolved',
          'rejected',
          'reopen_requested'
        ],
        message: '{VALUE} is not a valid complaint status'
      },
      default: 'pending'
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    reopenRequest: {
      type: reopenRequestSchema,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
// complaintCode is unique via field definition
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ assignedCollector: 1, status: 1 });
complaintSchema.index({ location: '2dsphere' });

export const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
