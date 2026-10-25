import mongoose from 'mongoose';

const feedLogSchema = new mongoose.Schema({
  points: { type: Number, required: true },
  reason: { type: String, default: 'Assignment completed' },
  createdAt: { type: Date, default: Date.now },
});

const studentSchema = new mongoose.Schema(
  {
    classroomId: {
      type: String,
      default: 'default',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fishColor: {
      type: String,
      default: '#a855f7',
    },
    fishPattern: {
      type: String,
      enum: ['floral', 'dots', 'scales', 'sparkles', 'plain'],
      default: 'floral',
    },
    points: {
      type: Number,
      default: 20,
    },
    todayPoints: {
      type: Number,
      default: 5,
    },
    sevenDayPoints: {
      type: Number,
      default: 20,
    },
    totalFedCount: {
      type: Number,
      default: 1,
    },
    avatarShape: {
      type: String,
      enum: ['chubby', 'goldfish', 'round', 'tropical', 'guppy'],
      default: 'chubby',
    },
    active: {
      type: Boolean,
      default: true,
    },
    history: [feedLogSchema],
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model('Student', studentSchema);
