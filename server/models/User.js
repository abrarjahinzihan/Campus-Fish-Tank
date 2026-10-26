import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    university: {
      type: String,
      default: 'University Campus',
      trim: true,
    },
    institute: {
      type: String,
      default: 'University Campus',
      trim: true,
    },
    department: {
      type: String,
      default: 'Faculty Member',
      trim: true,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
