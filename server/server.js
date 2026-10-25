import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { store, setMongoStatus, initData } from './data/store.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Socket.io for Real-time Classroom & Projector sync
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join:classroom', (classroomId) => {
    socket.join(`class:${classroomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Try to connect to MongoDB if provided, or attempt localhost
async function connectDatabase() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2500 });
      console.log('✅ Connected to MongoDB at:', MONGO_URI);
      setMongoStatus(true);
      await initData();
      return;
    } catch (err) {
      console.warn('⚠️ Could not connect to MONGO_URI, falling back to local JSON store:', err.message);
    }
  } else {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/classfishtank', { serverSelectionTimeoutMS: 1500 });
      console.log('✅ Connected to local MongoDB instance!');
      setMongoStatus(true);
      await initData();
      return;
    } catch (err) {
      console.log('ℹ️ Local MongoDB service not active. Using high-performance JSON store with persistence (Zero-config MERN mode).');
      setMongoStatus(false);
    }
  }
}

// ---------------- REST API ROUTES ----------------

// 0. Teacher Authentication Endpoints
// 0. Teacher Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const normEmail = email.trim().toLowerCase();

  // Look up user in persistent store
  const user = await store.findUserByEmail(normEmail);

  // If user does not exist yet -> 1st time user! Needs to set Name and Institute
  if (!user) {
    return res.json({
      success: true,
      isNewUser: true,
      email: email.trim(),
      message: 'First time signing in! Please set your Name and Institute.',
    });
  }

  // User exists! Direct login into their profile with nothing further required
  res.json({
    success: true,
    isNewUser: false,
    message: `Welcome back, ${user.name}!`,
    user,
    token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, department, university, institute } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const inst = (institute || university || 'University Campus').trim();
  const formattedName = name.startsWith('Prof.') || name.startsWith('Dr.')
    ? name.trim()
    : `Prof. ${name.trim()}`;

  const user = await store.saveUser({
    email: email.trim(),
    name: formattedName,
    university: inst,
    institute: inst,
    department: (department || 'Faculty Member').trim(),
  });

  res.status(201).json({
    success: true,
    isNewUser: false,
    message: 'Profile saved successfully!',
    user,
    token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  });
});

// 1. All Classrooms / University Courses
app.get('/api/classrooms', async (req, res) => {
  try {
    const instructorEmail = req.query.instructorEmail || null;
    const classrooms = await store.getClassrooms(instructorEmail);
    res.json({ success: true, count: classrooms.length, classrooms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/classrooms', async (req, res) => {
  try {
    const newClass = await store.createClassroom(req.body);

    // If initial student names provided, bulk create them
    if (req.body.initialStudentNames && Array.isArray(req.body.initialStudentNames)) {
      await store.createBulkStudents(newClass._id, req.body.initialStudentNames);
    }

    io.emit('classroom:created', newClass);
    res.status(201).json({ success: true, classroom: newClass });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Classroom by ID (or default)
app.get('/api/classroom', async (req, res) => {
  try {
    const classroom = await store.getClassroom(req.query.id);
    res.json({ success: true, classroom });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/classrooms/:id', async (req, res) => {
  try {
    const classroom = await store.getClassroom(req.params.id);
    if (!classroom) return res.status(404).json({ success: false, error: 'Classroom not found' });
    const students = await store.getStudents(req.params.id);
    res.json({ success: true, classroom, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/classrooms/:id', async (req, res) => {
  try {
    const updated = await store.updateClassroom(req.params.id, req.body);
    io.emit('classroom:updated', updated);
    res.json({ success: true, classroom: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/classrooms/:id', async (req, res) => {
  try {
    await store.deleteClassroom(req.params.id);
    io.emit('classroom:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Student Endpoints (filtered by classroomId)
app.get('/api/students', async (req, res) => {
  try {
    const classroomId = req.query.classroomId;
    const students = await store.getStudents(classroomId);
    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, fishColor, fishPattern, avatarShape, points, classroomId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Student name is required' });
    }
    const student = await store.createStudent({ name, fishColor, fishPattern, avatarShape, points, classroomId });
    io.emit('student:added', student);
    res.status(201).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  try {
    const { names, classroomId } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of student names is required' });
    }
    const created = await store.createBulkStudents(classroomId, names);
    io.emit('students:bulk_added', created);
    res.status(201).json({ success: true, count: created.length, students: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await store.updateStudent(req.params.id, req.body);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    io.emit('student:updated', student);
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await store.deleteStudent(req.params.id);
    io.emit('student:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Feeding & Points
app.post('/api/students/:id/feed', async (req, res) => {
  try {
    const { points = 5, reason = 'Assignment completed' } = req.body;
    const student = await store.feedStudent(req.params.id, points, reason);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    io.emit('fish:fed', {
      studentId: student._id,
      classroomId: student.classroomId,
      points: Number(points),
      reason,
      student,
    });

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students/feed-all', async (req, res) => {
  try {
    const { points = 5, reason = 'Whole class bonus!', classroomId } = req.body;
    const students = await store.feedAllStudents(classroomId, points, reason);

    io.emit('fish:fed_all', {
      classroomId,
      points: Number(points),
      reason,
      students,
    });

    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Decoration toggle
app.post('/api/decorations/:id/toggle', async (req, res) => {
  try {
    const { classroomId } = req.body;
    const classroom = await store.toggleDecoration(classroomId, req.params.id);
    io.emit('classroom:updated', classroom);
    res.json({ success: true, classroom });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Reset today points
app.post('/api/students/reset-today', async (req, res) => {
  try {
    const { classroomId } = req.body;
    const students = await store.resetTodayPoints(classroomId);
    io.emit('students:reset', students);
    res.json({ success: true, message: 'Today points reset', students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
});

// Start Server
connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Class Fish Tank Server running on http://localhost:${PORT}`);
  });
});
