import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ClassroomModel } from '../models/Classroom.js';
import { StudentModel } from '../models/Student.js';
import { initialClassrooms, initialStudents } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

let isMongoConnected = false;

// Local fallback store
let localDb = {
  classrooms: JSON.parse(JSON.stringify(initialClassrooms)),
  students: initialStudents.map((s, index) => ({
    _id: `stu_${Date.now()}_${index}`,
    ...s,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  users: [],
};

function loadLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.classrooms && Array.isArray(parsed.classrooms)) {
        localDb.classrooms = parsed.classrooms;
        if (parsed.students) localDb.students = parsed.students;
        if (parsed.users && Array.isArray(parsed.users)) {
          localDb.users = parsed.users;
        } else {
          localDb.users = localDb.users || [];
        }
      } else {
        saveLocalDb();
      }
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error('Error reading local JSON db, using initial data:', err.message);
  }
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local JSON db:', err.message);
  }
}

loadLocalDb();

export function setMongoStatus(status) {
  isMongoConnected = status;
}

export async function initData() {
  if (isMongoConnected) {
    const classCount = await ClassroomModel.countDocuments();
    if (classCount === 0) {
      await ClassroomModel.insertMany(initialClassrooms);
    }
    const studentCount = await StudentModel.countDocuments();
    if (studentCount === 0) {
      await StudentModel.insertMany(initialStudents);
    }
  }
}

export const store = {
  async getClassrooms(instructorEmail = null) {
    let classes = [];
    let allStudents = [];

    if (isMongoConnected) {
      const query = instructorEmail ? { instructorEmail } : {};
      classes = (await ClassroomModel.find(query).sort({ createdAt: -1 })).map((doc) => doc.toObject());
      allStudents = (await StudentModel.find({ active: true })).map((doc) => doc.toObject());
    } else {
      classes = localDb.classrooms;
      if (instructorEmail) {
        const normEmail = instructorEmail.toLowerCase();
        classes = classes.filter((c) => {
          return c.instructorEmail && c.instructorEmail.toLowerCase() === normEmail;
        });
      }
      allStudents = localDb.students.filter((s) => s.active !== false);
    }

    // Attach computed metrics for each classroom
    return classes.map((c) => {
      const cStudents = allStudents.filter((s) => s.classroomId === c._id || s.classroomId === c.id);
      const totalPoints = cStudents.reduce((sum, s) => sum + (s.points || 0), 0);
      const sorted = [...cStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
      return {
        ...c,
        studentCount: cStudents.length,
        totalPoints,
        topStudent: sorted[0] ? { name: sorted[0].name, points: sorted[0].points } : null,
      };
    });
  },

  async getClassroom(id) {
    if (isMongoConnected) {
      let room = null;
      if (id && mongoose.isValidObjectId(id)) {
        room = await ClassroomModel.findById(id);
      }
      if (!room && id) {
        room = await ClassroomModel.findOne({ _id: id });
      }
      if (!room) {
        room = await ClassroomModel.findOne();
      }
      return room ? room.toObject() : null;
    }

    let found = localDb.classrooms.find((c) => c._id === id || c.id === id);
    if (!found) found = localDb.classrooms[0];
    return found;
  },

  async createClassroom(data) {
    const courseCode = data.courseCode || 'UNIV 101';
    const courseName = data.courseName || 'Course Classroom';
    const title = data.title || `${courseCode}: ${courseName}`;

    const newClass = {
      _id: `course-${Date.now()}`,
      courseCode,
      courseName,
      title,
      subTitle: data.subTitle || 'Tap any fish to award points • Tap title to customize',
      department: data.department || 'General Studies',
      semester: data.semester || 'Fall 2026',
      instructor: data.instructor || 'Instructor',
      instructorEmail: data.instructorEmail || '',
      description: data.description || 'Course homework and live aquarium tank.',
      colorGradient: data.colorGradient || 'from-cyan-500 via-blue-600 to-indigo-700',
      theme: data.theme || 'nightGlow',
      language: data.language || 'en',
      nameVisibility: 'always',
      soundEnabled: true,
      decorations: [
        { id: 'dec-1', type: 'treasureChest', name: 'Treasure Chest', x: 50, y: 88, active: true },
        { id: 'dec-2', type: 'pearlClam', name: 'Giant Pearl Clam', x: 6, y: 35, active: true },
        { id: 'dec-3', type: 'pinkCoral', name: 'Pink Coral Reef', x: 9, y: 90, active: true },
        { id: 'dec-6', type: 'seaweed', name: 'Emerald Seaweed', x: 92, y: 88, active: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const created = await ClassroomModel.create(newClass);
      return created.toObject();
    }

    localDb.classrooms.unshift(newClass);
    saveLocalDb();
    return newClass;
  },

  async updateClassroom(id, updates) {
    if (isMongoConnected) {
      let room = await ClassroomModel.findByIdAndUpdate(id, updates, { new: true });
      if (!room) {
        room = await ClassroomModel.findOneAndUpdate({ _id: id }, updates, { new: true });
      }
      return room ? room.toObject() : null;
    }

    const idx = localDb.classrooms.findIndex((c) => c._id === id || c.id === id);
    if (idx === -1) return null;
    localDb.classrooms[idx] = { ...localDb.classrooms[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocalDb();
    return localDb.classrooms[idx];
  },

  async deleteClassroom(id) {
    if (isMongoConnected) {
      await ClassroomModel.findOneAndDelete({ _id: id });
      await StudentModel.deleteMany({ classroomId: id });
      return true;
    }
    localDb.classrooms = localDb.classrooms.filter((c) => c._id !== id && c.id !== id);
    localDb.students = localDb.students.filter((s) => s.classroomId !== id);
    saveLocalDb();
    return true;
  },

  async getStudents(classroomId) {
    if (isMongoConnected) {
      const query = { active: true };
      if (classroomId) query.classroomId = classroomId;
      const list = await StudentModel.find(query).sort({ points: -1 });
      return list.map((doc) => doc.toObject());
    }

    let list = localDb.students.filter((s) => s.active !== false);
    if (classroomId) {
      list = list.filter((s) => s.classroomId === classroomId);
    }
    return list.sort((a, b) => b.points - a.points);
  },

  async createStudent(data) {
    const newStudent = {
      _id: `stu_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      classroomId: data.classroomId || 'course-cs301',
      name: data.name.trim(),
      fishColor: data.fishColor || '#0ea5e9',
      fishPattern: data.fishPattern || 'floral',
      points: Number(data.points) || 10,
      todayPoints: Number(data.points) || 10,
      sevenDayPoints: Number(data.points) || 10,
      totalFedCount: 1,
      avatarShape: data.avatarShape || 'chubby',
      active: true,
      history: [{ points: Number(data.points) || 10, reason: 'Enrolled in course', createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const doc = await StudentModel.create(newStudent);
      return doc.toObject();
    }

    localDb.students.unshift(newStudent);
    saveLocalDb();
    return newStudent;
  },

  async createBulkStudents(classroomId, names) {
    const created = [];
    const colors = ['#0ea5e9', '#0d9488', '#0284c7', '#c084fc', '#ec4899', '#8b5cf6', '#f97316', '#eab308', '#f59e0b', '#fb923c', '#f472b6', '#06b6d4'];
    const patterns = ['floral', 'dots', 'scales', 'sparkles', 'plain'];
    const shapes = ['chubby', 'goldfish', 'round', 'tropical', 'guppy'];

    for (let i = 0; i < names.length; i++) {
      const name = names[i].trim();
      if (!name) continue;
      const student = await this.createStudent({
        classroomId,
        name,
        fishColor: colors[i % colors.length],
        fishPattern: patterns[i % patterns.length],
        avatarShape: shapes[i % shapes.length],
        points: 20,
      });
      created.push(student);
    }
    return created;
  },

  async feedStudent(id, pointsToAdd = 5, reason = 'Assignment completed') {
    const pts = Number(pointsToAdd) || 5;
    if (isMongoConnected) {
      const student = await StudentModel.findById(id);
      if (!student) return null;
      student.points += pts;
      student.todayPoints += pts;
      student.sevenDayPoints += pts;
      student.totalFedCount += 1;
      student.history.unshift({ points: pts, reason, createdAt: new Date() });
      await student.save();
      return student.toObject();
    }

    const idx = localDb.students.findIndex((s) => s._id === id);
    if (idx === -1) return null;
    const student = localDb.students[idx];
    student.points += pts;
    student.todayPoints += pts;
    student.sevenDayPoints += pts;
    student.totalFedCount = (student.totalFedCount || 0) + 1;
    student.history = student.history || [];
    student.history.unshift({ points: pts, reason, createdAt: new Date().toISOString() });
    student.updatedAt = new Date().toISOString();
    saveLocalDb();
    return student;
  },

  async feedAllStudents(classroomId, pointsToAdd = 5, reason = 'Whole class bonus!') {
    const pts = Number(pointsToAdd) || 5;
    if (isMongoConnected) {
      const query = { active: true };
      if (classroomId) query.classroomId = classroomId;
      await StudentModel.updateMany(query, {
        $inc: { points: pts, todayPoints: pts, sevenDayPoints: pts, totalFedCount: 1 },
        $push: {
          history: {
            $each: [{ points: pts, reason, createdAt: new Date() }],
            $position: 0,
          },
        },
      });
      return await this.getStudents(classroomId);
    }

    localDb.students.forEach((student) => {
      if (student.active !== false && (!classroomId || student.classroomId === classroomId)) {
        student.points += pts;
        student.todayPoints += pts;
        student.sevenDayPoints += pts;
        student.totalFedCount = (student.totalFedCount || 0) + 1;
        student.history = student.history || [];
        student.history.unshift({ points: pts, reason, createdAt: new Date().toISOString() });
      }
    });
    saveLocalDb();
    return this.getStudents(classroomId);
  },

  async toggleDecoration(classroomId, decId) {
    const room = await this.getClassroom(classroomId);
    if (!room) return null;
    const decs = (room.decorations || []).map((d) => {
      if (d.id === decId) return { ...d, active: !d.active };
      return d;
    });
    return await this.updateClassroom(room._id, { decorations: decs });
  },

  async resetTodayPoints(classroomId) {
    if (isMongoConnected) {
      const query = {};
      if (classroomId) query.classroomId = classroomId;
      await StudentModel.updateMany(query, { $set: { todayPoints: 0 } });
      return await this.getStudents(classroomId);
    }
    localDb.students.forEach((s) => {
      if (!classroomId || s.classroomId === classroomId) {
        s.todayPoints = 0;
      }
    });
    saveLocalDb();
    return this.getStudents(classroomId);
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const norm = email.trim().toLowerCase();
    return (localDb.users || []).find((u) => u.email.toLowerCase() === norm) || null;
  },

  async saveUser(userData) {
    if (!userData || !userData.email) return null;
    localDb.users = localDb.users || [];
    const norm = userData.email.trim().toLowerCase();
    const existingIdx = localDb.users.findIndex((u) => u.email.toLowerCase() === norm);

    const userObj = {
      id: userData.id || `user-${Date.now()}`,
      email: userData.email.trim(),
      name: userData.name.trim(),
      university: (userData.university || userData.institute || 'University Campus').trim(),
      institute: (userData.university || userData.institute || 'University Campus').trim(),
      department: (userData.department || 'Faculty Member').trim(),
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      localDb.users[existingIdx] = { ...localDb.users[existingIdx], ...userObj };
    } else {
      localDb.users.push(userObj);
    }
    saveLocalDb();
    return userObj;
  },
};
