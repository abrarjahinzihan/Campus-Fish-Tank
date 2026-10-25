import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Trash2,
  BookOpen,
  Filter,
  CheckCircle2,
  Calendar,
  LogOut,
} from 'lucide-react';
import { sounds } from '../audio/soundEngine';

export default function HomePage({
  classrooms = [],
  onSelectCourse = () => {},
  onOpenCreateModal = () => {},
  onDeleteCourse = () => {},
  user = null,
  onLogout = () => {},
}) {
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  const semesters = ['All', 'Fall 2026', 'Spring 2027', 'Summer 2026'];
  const departments = [
    'All',
    'Computer Science',
    'Biological Sciences',
    'Mathematics & Data Science',
    'Engineering & Humanities',
  ];

  // Filter classrooms
  const filteredCourses = classrooms.filter((c) => {
    const matchesSearch =
      (c.courseCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.courseName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(search.toLowerCase());

    const matchesSemester =
      selectedSemester === 'All' || c.semester === selectedSemester;
    const matchesDept = selectedDept === 'All' || c.department === selectedDept;

    return matchesSearch && matchesSemester && matchesDept;
  });

  // Calculate summary metrics
  const totalCourses = classrooms.length;
  const totalStudents = classrooms.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const totalPoints = classrooms.reduce((sum, c) => sum + (c.totalPoints || 0), 0);
  const topCourse = [...classrooms].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* 1. University Campus Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <GraduationCap size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  Campus Fish Tank
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  University Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gamified Homework & Lab Engagement for Higher Education
              </p>
            </div>
          </div>

          {/* Right Controls: Instructor Profile & Create Course Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">{user?.name || 'Instructor'}</span>
            </div>

            <button
              onClick={() => {
                sounds.playPop();
                onOpenCreateModal();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-cyan-500/25 active:scale-95 transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={18} className="stroke-[3]" />
              <span>Create Course Tank</span>
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onLogout();
                }}
                className="p-2 bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/70 hover:border-rose-500/40 rounded-full transition-all"
                title="Log Out of Faculty Portal"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Header & Overview Metrics */}
      <section className="px-6 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              My University Courses
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Select a course below to launch its live interactive aquarium, reward problem sets, or manage student fish.
            </p>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Metric 1 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Courses</span>
              <BookOpen size={16} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalCourses}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Live Semester
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalStudents ? String(totalStudents).padStart(2, '0') : '00'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active student fish</div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Homework Points</span>
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">{totalPoints}</div>
            <div className="text-[11px] text-slate-400 mt-1">Total lab & quiz points</div>
          </div>

          {/* Metric 4 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Top Engaged Course</span>
              <Award size={16} className="text-purple-400" />
            </div>
            <div className="text-sm font-black text-purple-300 truncate font-mono">
              {topCourse?.courseCode || 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {topCourse?.totalPoints || 0} pts accumulated
            </div>
          </div>
        </div>

        {/* 3. Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl mb-6">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by course code (e.g. CS 301), title, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  sounds.playPop();
                  setSelectedSemester(sem);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  selectedSemester === sem
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Course Cards Grid */}
      <section className="px-6 pb-16 max-w-7xl mx-auto w-full flex-1">
        {classrooms.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-cyan-500/30 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">Welcome, {user?.name || 'Professor'}!</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
              You haven't set up any course tanks yet. Click below to create your first classroom. By default, it starts with <span className="text-cyan-300 font-bold">00 students</span>, and you can add any student anytime!
            </p>
            <button
              onClick={() => {
                sounds.playPop();
                onOpenCreateModal();
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              + Create Your First Course Tank
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
            <BookOpen size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No courses match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your search query or create a new course tank.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedSemester('All');
                setSelectedDept('All');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredCourses.map((c) => {
              const gradientClass =
                c.colorGradient || 'from-cyan-500 via-blue-600 to-indigo-700';

              return (
                <div
                  key={c._id || c.id}
                  className="group relative flex flex-col justify-between bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:shadow-cyan-500/10 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Decorative Color Top Ribbon */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradientClass}`}
                  />

                  {/* Course Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono font-black text-sm rounded-lg">
                          {c.courseCode || 'COURSE'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {c.semester || 'Fall 2026'}
                        </span>
                      </div>

                      {/* Delete Course Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(c._id || c.id, c.courseCode || c.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all"
                        title="Delete Course"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-cyan-200 transition-colors tracking-tight">
                      {c.courseName || c.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 mb-3">
                      <span className="text-slate-300 font-medium">{c.department}</span>
                      <span>•</span>
                      <span>{c.instructor || user?.name || 'Instructor'}</span>
                    </div>

                    <p className="text-xs text-slate-400/90 leading-relaxed line-clamp-2 mb-4">
                      {c.description || c.subTitle}
                    </p>
                  </div>

                  {/* Course Metrics & Launch Action */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="p-2 bg-slate-800/50 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Students</div>
                        <div className="text-sm font-black text-white font-mono mt-0.5">
                          {c.studentCount ? String(c.studentCount).padStart(2, '0') : '00'} 🐟
                        </div>
                      </div>

                      <div className="p-2 bg-slate-800/50 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Score</div>
                        <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                          {c.totalPoints || 0} pts
                        </div>
                      </div>

                      <div className="p-2 bg-slate-800/50 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Top Student</div>
                        <div className="text-xs font-bold text-amber-300 truncate mt-0.5">
                          👑 {c.topStudent?.name || 'None'}
                        </div>
                      </div>
                    </div>

                    {/* Launch Aquarium Button */}
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onSelectCourse(c);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 group-hover:shadow-cyan-500/25"
                    >
                      <span>Launch Course Aquarium</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <span>© 2026 Campus Fish Tank · Made by Zihan 🐠</span>
      </footer>
    </div>
  );
}
