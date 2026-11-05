import mongoose from 'mongoose';

/**
 * CleanLoop User Model
 * Represents citizens, administrative personnel, and municipal waste collectors.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    profileImage: {
      url: { type: String, trim: true, default: null },
      publicId: { type: String, trim: true, default: null }
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'collector'],
        message: '{VALUE} is not a valid role. Allowed roles: user, admin, collector'
      },
      default: 'user'
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'suspended'],
        message: '{VALUE} is not a valid account status'
      },
      default: 'active'
    },
    // Collector specific fields
    availability: {
      type: String,
      enum: {
        values: ['available', 'busy', 'unavailable'],
        message: '{VALUE} is not a valid availability state'
      },
      default: 'available'
    },
    serviceAreas: {
      type: [{ type: String, trim: true }],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
// 1. Email uniqueness is guaranteed by `unique: true`
// 2. Compound index on role & availability covers both role-only and role+availability queries
userSchema.index({ role: 1, availability: 1 });

export const User = mongoose.model('User', userSchema);
export default User;

