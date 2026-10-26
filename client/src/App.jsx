import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Maximize2, Minimize2, Calendar, Sparkles } from 'lucide-react';
import Header from './components/Header';
import FishTankCanvas from './components/FishTankCanvas';
import LeaderboardTab from './components/LeaderboardTab';
import StudentsTab from './components/StudentsTab';
import DecorateTab from './components/DecorateTab';
import FeedModal from './components/FeedModal';
import AddStudentModal from './components/AddStudentModal';
import SettingsModal from './components/SettingsModal';
import HomePage from './components/HomePage';
import CreateCourseModal from './components/CreateCourseModal';
import LoginPage from './components/LoginPage';
import { translations } from './translations';
import { sounds } from './audio/soundEngine';
import { API_BASE, SOCKET_URL } from './config/api';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('faculty_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation view: 'login' | 'home' (University Course Hub) | 'tank' (Live Aquarium)
  const [currentView, setCurrentView] = useState(() => {
    try {
      return localStorage.getItem('faculty_user') ? 'home' : 'login';
    } catch {
      return 'login';
    }
  });

  const [classrooms, setClassrooms] = useState([]);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [students, setStudents] = useState([]);

  // Sidebar & Tank State
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'students' | 'decorate'
  const [viewMode, setViewMode] = useState('7days'); // 'today' | '7days'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedingEvent, setFeedingEvent] = useState(null);

  // Modals
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Fullscreen container
  const appContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lang = currentClassroom?.language || 'en';
  const t = translations[lang] || translations.en;

  // 1. Fetch All Courses for Home Page
  const fetchAllCourses = async (userEmail = null) => {
    try {
      const email = userEmail || currentUser?.email;
      const url = email
        ? `${API_BASE}/classrooms?instructorEmail=${encodeURIComponent(email)}`
        : `${API_BASE}/classrooms`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.classrooms) {
          setClassrooms(data.classrooms);
          if (data.classrooms.length > 0) {
            setCurrentClassroom(data.classrooms[0]);
          } else {
            setCurrentClassroom(null);
          }
        }
      }
    } catch (err) {
      console.warn('API error fetching courses:', err.message);
    }
  };

  // 2. Fetch Students for a specific course
  const fetchStudentsForCourse = async (classroomId) => {
    try {
      const res = await fetch(`${API_BASE}/students?classroomId=${classroomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.students) setStudents(data.students);
      }
    } catch (err) {
      console.warn('API error fetching students:', err.message);
    }
  };

  useEffect(() => {
    fetchAllCourses();

    // Socket.io for Real-time Classroom & Projector Sync
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });

    socket.on('fish:fed', (data) => {
      setFeedingEvent({ studentId: data.studentId, points: data.points, isAll: false });
      setStudents((prev) =>
        prev.map((s) => (s._id === data.student._id ? data.student : s))
      );
      setClassrooms((prev) =>
        prev.map((c) =>
          c._id === data.classroomId ? { ...c, totalPoints: (c.totalPoints || 0) + data.points } : c
        )
      );
    });

    socket.on('fish:fed_all', (data) => {
      setFeedingEvent({ points: data.points, isAll: true });
      if (data.students) setStudents(data.students);
    });

    socket.on('classroom:created', (newCourse) => {
      setClassrooms((prev) => [newCourse, ...prev]);
    });

    socket.on('classroom:updated', (updated) => {
      setClassrooms((prev) =>
        prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c))
      );
      if (currentClassroom && currentClassroom._id === updated._id) {
        setCurrentClassroom(updated);
      }
    });

    socket.on('classroom:deleted', ({ id }) => {
      setClassrooms((prev) => prev.filter((c) => c._id !== id));
      if (currentClassroom && currentClassroom._id === id) {
        setCurrentView('home');
      }
    });

    socket.on('student:added', (student) => {
      setStudents((prev) => [student, ...prev]);
    });

    socket.on('students:bulk_added', (newStudents) => {
      setStudents((prev) => [...newStudents, ...prev]);
    });

    socket.on('student:updated', (updated) => {
      setStudents((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s))
      );
    });

    socket.on('student:deleted', ({ id }) => {
      setStudents((prev) => prev.filter((s) => s._id !== id));
    });

    socket.on('students:reset', (resetList) => {
      setStudents(resetList);
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Initialize browser history state if empty
    const initialView = currentUser ? 'home' : 'login';
    if (!window.history.state) {
      window.history.replaceState({ view: initialView }, '', initialView === 'home' ? '#courses' : '#login');
    }

    // Handle browser Back / Forward navigation buttons
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.view) {
        if (state.view === 'home') {
          fetchAllCourses();
          setCurrentView('home');
        } else if (state.view === 'tank') {
          if (state.courseId) {
            const course = classrooms.find((c) => (c._id || c.id) === state.courseId);
            if (course) {
              setCurrentClassroom(course);
              fetchStudentsForCourse(state.courseId);
            }
          }
          setCurrentView('tank');
        } else if (state.view === 'login') {
          setCurrentView('login');
        }
      } else {
        const hash = window.location.hash;
        if (hash.startsWith('#course/')) {
          const cId = hash.replace('#course/', '');
          const course = classrooms.find((c) => (c._id || c.id) === cId);
          if (course) {
            setCurrentClassroom(course);
            fetchStudentsForCourse(cId);
            setCurrentView('tank');
            return;
          }
        }
        if (currentUser) {
          fetchAllCourses();
          setCurrentView('home');
        } else {
          setCurrentView('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      socket.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentClassroom, currentUser, classrooms]);

  // Auth Handlers
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('faculty_user', JSON.stringify(user));
      localStorage.setItem('faculty_token', token);
    } catch (e) {
      console.warn('Storage error:', e);
    }
    fetchAllCourses(user.email);
    window.history.pushState({ view: 'home' }, '', '#courses');
    setCurrentView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('faculty_user');
      localStorage.removeItem('faculty_token');
    } catch (e) {
      console.warn('Storage error:', e);
    }
    sounds.playPop();
    window.history.pushState({ view: 'login' }, '', '#login');
    setCurrentView('login');
  };

  // Handle selecting a course to launch its aquarium tank
  const handleSelectCourse = (course) => {
    setCurrentClassroom(course);
    const courseId = course._id || course.id;
    fetchStudentsForCourse(courseId);
    window.history.pushState({ view: 'tank', courseId }, '', `#course/${courseId}`);
    setCurrentView('tank');
  };

  // Handle Back to Courses Dashboard
  const handleBackToHome = () => {
    sounds.playPop();
    if (window.history.state && window.history.state.view === 'tank') {
      window.history.back();
    } else {
      window.history.pushState({ view: 'home' }, '', '#courses');
      fetchAllCourses();
      setCurrentView('home');
    }
  };

  // Create a new university course
  const handleCreateCourse = async (courseData) => {
    try {
      const res = await fetch(`${API_BASE}/classrooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (res.ok) {
        const data = await res.json();
        sounds.playCelebration();
        await fetchAllCourses(currentUser?.email);
        handleSelectCourse(data.classroom);
      }
    } catch (err) {
      console.error('Failed to create course:', err);
    }
  };

  // Delete a course
  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and its aquarium?`)) {
      return;
    }
    try {
      await fetch(`${API_BASE}/classrooms/${id}`, { method: 'DELETE' });
      sounds.playPop();
      setClassrooms((prev) => prev.filter((c) => c._id !== id && c.id !== id));
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // Update current course settings
  const handleUpdateClassroom = async (updates) => {
    if (!currentClassroom) return;
    const cid = currentClassroom._id || currentClassroom.id;
    setCurrentClassroom((prev) => ({ ...prev, ...updates }));
    try {
      await fetch(`${API_BASE}/classrooms/${cid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update classroom:', err);
    }
  };

  // Feed a single student
  const handleFeedStudent = async (studentId, points = 5, reason = 'Assignment completed') => {
    setFeedingEvent({ studentId, points, isAll: false });
    setStudents((prev) =>
      prev.map((s) => {
        if (s._id === studentId) {
          return {
            ...s,
            points: s.points + points,
            todayPoints: (s.todayPoints || 0) + points,
            sevenDayPoints: (s.sevenDayPoints || 0) + points,
          };
        }
        return s;
      })
    );

    try {
      await fetch(`${API_BASE}/students/${studentId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason }),
      });
    } catch (err) {
      console.error('Failed to feed student:', err);
    }
  };

  // Feed Everyone in Class
  const handleFeedEveryone = async () => {
    sounds.playFeedAll();
    setFeedingEvent({ points: 5, isAll: true });
    const cid = currentClassroom?._id || currentClassroom?.id;

    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        points: s.points + 5,
        todayPoints: (s.todayPoints || 0) + 5,
        sevenDayPoints: (s.sevenDayPoints || 0) + 5,
      }))
    );

    try {
      await fetch(`${API_BASE}/students/feed-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: 5, reason: 'Whole class bonus!', classroomId: cid }),
      });
    } catch (err) {
      console.error('Failed to feed everyone:', err);
    }
  };

  // Add student
  const handleAddStudent = async (studentData) => {
    const cid = currentClassroom?._id || currentClassroom?.id;
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...studentData, classroomId: cid }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents((prev) => [data.student, ...prev]);
        sounds.playCelebration();
      }
    } catch (err) {
      console.error('Failed to add student:', err);
    }
  };

  // Bulk add students
  const handleAddBulk = async (names) => {
    const cid = currentClassroom?._id || currentClassroom?.id;
    try {
      const res = await fetch(`${API_BASE}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names, classroomId: cid }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents((prev) => [...data.students, ...prev]);
        sounds.playCelebration();
      }
    } catch (err) {
      console.error('Failed to bulk add students:', err);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this course aquarium?`)) {
      return;
    }
    setStudents((prev) => prev.filter((s) => s._id !== id));
    try {
      await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  // Toggle decoration
  const handleToggleDecoration = async (decId) => {
    const cid = currentClassroom?._id || currentClassroom?.id;
    try {
      const res = await fetch(`${API_BASE}/decorations/${decId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: cid }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentClassroom(data.classroom);
      }
    } catch (err) {
      console.error('Failed to toggle decoration:', err);
    }
  };

  // Reset today points
  const handleResetTodayPoints = async () => {
    const cid = currentClassroom?._id || currentClassroom?.id;
    try {
      const res = await fetch(`${API_BASE}/students/reset-today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: cid }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Failed to reset today points:', err);
    }
  };

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (appContainerRef.current?.requestFullscreen) {
        appContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // ---------------- VIEW ROUTING ----------------

  // 0. LOGIN PAGE VIEW
  if (currentView === 'login' || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 1. HOME PAGE VIEW: University Course Dashboard
  if (currentView === 'home') {
    return (
      <>
        <HomePage
          classrooms={classrooms}
          onSelectCourse={handleSelectCourse}
          onOpenCreateModal={() => setIsCreateCourseModalOpen(true)}
          onDeleteCourse={handleDeleteCourse}
          user={currentUser}
          onLogout={handleLogout}
        />

        <CreateCourseModal
          isOpen={isCreateCourseModalOpen}
          onClose={() => setIsCreateCourseModalOpen(false)}
          onCreateCourse={handleCreateCourse}
          user={currentUser}
        />
      </>
    );
  }

  // 2. TANK VIEW: Live Interactive Aquarium for Selected Course
  const theme = currentClassroom?.theme || 'nightGlow';

  return (
    <div
      ref={appContainerRef}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${
        theme === 'nightGlow'
          ? 'bg-slate-950 text-white'
          : theme === 'sunsetLagoon'
          ? 'bg-slate-950 text-white'
          : 'bg-slate-900 text-white'
      }`}
    >
      {/* 1. Header Bar with Back to All Courses button */}
      <Header
        classroom={currentClassroom || {}}
        onUpdateClassroom={handleUpdateClassroom}
        onFeedEveryone={handleFeedEveryone}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onBackToHome={handleBackToHome}
      />

      {/* 2. Main Classroom Dashboard Layout */}
      <main className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden">
        {/* Left / Center: Interactive Aquarium Tank */}
        <section className="relative flex-1 flex flex-col min-h-[500px] lg:min-h-0 bg-slate-900/60 rounded-3xl p-2.5 border border-cyan-500/30 shadow-2xl overflow-hidden">
          {/* Overlay Floating Controls */}
          <div className="absolute top-5 left-5 z-20 flex items-center gap-2 select-none">
            <button
              onClick={() => {
                sounds.playPop();
                setViewMode(viewMode === '7days' ? 'today' : '7days');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold rounded-full border border-cyan-400/40 shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              <span>{viewMode === '7days' ? t.sizesFor7Days : 'Today’s Sizes'}</span>
            </button>

            {viewMode === '7days' && (
              <button
                onClick={() => {
                  sounds.playPop();
                  setViewMode('today');
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-full shadow-lg transition-all active:scale-95"
              >
                {t.backToToday}
              </button>
            )}
          </div>

          <div className="absolute top-5 right-5 z-20 select-none">
            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold rounded-full border border-cyan-400/40 shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullscreen ? t.exitFullScreen : t.fullScreen}</span>
            </button>
          </div>

          {/* HTML5 Canvas Tank Engine */}
          <FishTankCanvas
            students={students}
            classroom={currentClassroom || {}}
            selectedStudentId={selectedStudent?._id}
            viewMode={viewMode}
            feedingEvent={feedingEvent}
            onFishClick={(student) => {
              setSelectedStudent(student);
              setIsFeedModalOpen(true);
            }}
          />
        </section>

        {/* Right Sidebar: Tabs for Students, Decorate, Leaderboard */}
        <aside className="w-full lg:w-80 flex flex-col bg-slate-900/90 rounded-3xl border border-cyan-500/25 shadow-xl backdrop-blur-xl overflow-hidden select-none">
          {/* Tab Selector Buttons */}
          <div className="flex p-2 gap-1.5 bg-slate-950/60 border-b border-slate-800">
            {[
              { id: 'students', label: t.studentsTab },
              { id: 'decorate', label: t.decorateTab },
              { id: 'leaderboard', label: t.leaderboardTab },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playPop();
                  setActiveTab(tab.id);
                }}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-full transition-all text-center ${
                  activeTab === tab.id
                    ? 'bg-teal-400 text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab View Contents */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                students={students}
                viewMode={viewMode}
                onSelectViewMode={setViewMode}
                selectedStudentId={selectedStudent?._id}
                onSelectStudent={(stu) => {
                  setSelectedStudent(stu);
                  setIsFeedModalOpen(true);
                }}
                language={lang}
              />
            )}

            {activeTab === 'students' && (
              <StudentsTab
                students={students}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onOpenBulkModal={() => setIsBulkModalOpen(true)}
                onFeedStudent={(id, pts, reason) => handleFeedStudent(id, pts, reason)}
                onDeleteStudent={handleDeleteStudent}
                language={lang}
              />
            )}

            {activeTab === 'decorate' && (
              <DecorateTab
                classroom={currentClassroom || {}}
                students={students}
                onToggleDecoration={handleToggleDecoration}
                language={lang}
              />
            )}
          </div>
        </aside>
      </main>

      {/* Footer Signature */}
      <footer className="py-2 text-center text-xs text-slate-400/70 font-medium select-none border-t border-slate-800/40 bg-slate-950/40">
        <span>© 2026 Campus Fish Tank · Made by Zihan 🐠</span>
      </footer>

      {/* Modals */}
      <FeedModal
        student={selectedStudent}
        onClose={() => {
          setIsFeedModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirmFeed={(id, pts, reason) => handleFeedStudent(id, pts, reason)}
        language={lang}
      />

      <AddStudentModal
        isOpen={isAddModalOpen || isBulkModalOpen}
        isBulkMode={isBulkModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsBulkModalOpen(false);
        }}
        onAddStudent={handleAddStudent}
        onAddBulk={handleAddBulk}
        language={lang}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        classroom={currentClassroom || {}}
        students={students}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateClassroom={handleUpdateClassroom}
        onResetTodayPoints={handleResetTodayPoints}
        language={lang}
      />
    </div>
  );
}
