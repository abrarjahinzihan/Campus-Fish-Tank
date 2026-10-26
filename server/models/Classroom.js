import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    courseCode: {
      type: String,
      default: 'CS 301',
      trim: true,
    },
    courseName: {
      type: String,
      default: 'Algorithms & Data Structures',
      trim: true,
    },
    title: {
      type: String,
      default: 'CS 301: Algorithms & Data Structures',
      trim: true,
    },
    subTitle: {
      type: String,
      default: 'Tap any fish to reward lab problem sets • Tap title to customize',
    },
    department: {
      type: String,
      default: 'Computer Science',
    },
    semester: {
      type: String,
      default: 'Fall 2026',
    },
    instructor: {
      type: String,
      default: 'Instructor',
    },
    instructorEmail: {
      type: String,
      default: '',
      index: true,
    },
    description: {
      type: String,
      default: 'Weekly problem sets, algorithmic puzzles, and lab code reviews.',
    },
    colorGradient: {
      type: String,
      default: 'from-cyan-500 to-blue-600',
    },
    theme: {
      type: String,
      enum: ['sunnyReef', 'nightGlow', 'sunsetLagoon', 'deepAtlantis'],
      default: 'nightGlow',
    },
    language: {
      type: String,
      enum: ['en', 'uz', 'es'],
      default: 'en',
    },
    nameVisibility: {
      type: String,
      enum: ['always', 'hover', 'never'],
      default: 'always',
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    decorations: [
      {
        id: String,
        type: { type: String },
        name: String,
        x: Number,
        y: Number,
        active: Boolean,
      },
    ],
  },
  { timestamps: true }
);

export const ClassroomModel = mongoose.model('Classroom', classroomSchema);
