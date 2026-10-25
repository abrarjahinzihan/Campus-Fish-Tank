import React, { useState } from 'react';
import { X, GraduationCap, Sparkles, BookOpen, Layers, Users, Check } from 'lucide-react';
import { sounds } from '../audio/soundEngine';

export default function CreateCourseModal({
  isOpen = false,
  onClose = () => {},
  onCreateCourse = () => {},
  user = null,
}) {
  if (!isOpen) return null;

  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState('Fall 2026');
  const [instructor, setInstructor] = useState(user?.name || 'Instructor');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('nightGlow');
  const [gradient, setGradient] = useState('from-cyan-500 via-blue-600 to-indigo-700');
  const [studentNamesText, setStudentNamesText] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCourseCode('');
      setCourseName('');
      setInstructor(user?.name || 'Instructor');
      setDescription('');
      setStudentNamesText('');
    }
  }, [isOpen, user]);

  const departments = [
    'Computer Science',
    'Engineering',
    'Mathematics & Data Science',
    'Biological Sciences',
    'Physics & Chemistry',
    'Business & Economics',
    'Humanities & Social Sciences',
    'Medicine & Health',
    'Arts & Architecture',
  ];

  const semesters = ['Fall 2026', 'Spring 2027', 'Summer 2026', 'Winter 2027'];

  const gradients = [
    { label: 'Cyan / Deep Blue', value: 'from-cyan-500 via-blue-600 to-indigo-700' },
    { label: 'Emerald / Teal', value: 'from-emerald-500 via-teal-600 to-cyan-700' },
    { label: 'Violet / Purple', value: 'from-purple-500 via-violet-600 to-indigo-800' },
    { label: 'Amber / Rose', value: 'from-amber-500 via-orange-600 to-rose-700' },
    { label: 'Ruby / Crimson', value: 'from-rose-500 via-red-600 to-orange-700' },
  ];

  const themes = [
    { id: 'nightGlow', label: '🌙 Night Glow', desc: 'Bioluminescent reef' },
    { id: 'sunnyReef', label: '☀️ Sunny Reef', desc: 'Tropical clear lagoon' },
    { id: 'sunsetLagoon', label: '🌅 Sunset Lagoon', desc: 'Warm violet twilight' },
  ];

  const handleInsertSampleRoster = () => {
    sounds.playPop();
    const sample = [
      'Alexander Vance',
      'Maya Lin',
      'Liam Gallagher',
      'Sophia Zheng',
      'Noah Campbell',
      'Chloe Richardson',
      'Ethan Brooks',
      'Isabella Rossi',
      'Lucas Sterling',
      'Olivia Zhang',
    ].join('\n');
    setStudentNamesText(sample);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    const names = studentNamesText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    onCreateCourse({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      title: `${courseCode.trim().toUpperCase()}: ${courseName.trim()}`,
      subTitle: description.trim() || 'Tap any fish to award lab and assignment points',
      department,
      semester,
      instructor: instructor.trim() || user?.name || 'Instructor',
      instructorEmail: user?.email || '',
      description: description.trim(),
      theme,
      colorGradient: gradient,
      initialStudentNames: names,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <GraduationCap size={26} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Create University Course Tank</h2>
            <p className="text-xs text-slate-400">
              Set up a live interactive aquarium for your university lecture, lab, or seminar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Course Code & Course Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS 301"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced Algorithms & Data Structures"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Row 2: Department & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Semester / Term
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Instructor & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Instructor
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Course Goals / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Laboratory problem sets, homework, and peer reviews"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Row 4: Aquarium Theme Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Aquarium Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    theme === t.id
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-md scale-[1.02]'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{t.label}</div>
                  <div className="text-[10px] text-slate-400">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 5: Initial Student Roster */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enrolled Students Roster (Optional • 00 students by default)
              </label>
              <button
                type="button"
                onClick={handleInsertSampleRoster}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Insert Sample 10 Students
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Leave empty for 00 students by default, or paste student names (one per line)..."
              value={studentNamesText}
              onChange={(e) => setStudentNamesText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              <span>Create Course Tank</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
