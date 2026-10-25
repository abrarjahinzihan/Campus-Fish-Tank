import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Crown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  X,
  Sparkles,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function LeaderboardTab({
  students = [],
  viewMode = '7days',
  onSelectViewMode = () => {},
  selectedStudentId = null,
  onSelectStudent = () => {},
  language = 'en',
}) {
  const t = translations[language] || translations.en;

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // Window offset in days for the 4-day carousel (0 means right-most item is today)
  const [windowOffset, setWindowOffset] = useState(0);

  // Calendar popover modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const calendarRef = useRef(null);
  const nativeDateInputRef = useRef(null);

  // Helper: check if two dates are on the same calendar day
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const isToday = (d) => isSameDay(d, new Date());

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  // Compute 4 sliding date tabs based on windowOffset
  const dayTabs = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + windowOffset);

    const tabs = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const dayLabel = isToday(d)
        ? 'Today'
        : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      tabs.push({
        dateObj: d,
        day: dayLabel,
        date: dateLabel,
        isToday: isToday(d),
      });
    }
    return tabs;
  }, [windowOffset]);

  // Handle selecting a date from the carousel
  const handleSelectDate = (dateObj) => {
    sounds.playPop();
    setSelectedDate(dateObj);
    if (isToday(dateObj)) {
      onSelectViewMode('today');
    } else {
      onSelectViewMode('date');
    }
  };

  // Shift carousel by offset
  const handleShiftCarousel = (delta) => {
    sounds.playPop();
    setWindowOffset((prev) => prev + delta);
  };

  // Calculate points for a student depending on viewMode and selectedDate
  const getPoints = (student) => {
    if (!student) return 0;

    // In 7-days / all-time mode
    if (viewMode === '7days') {
      return student.sevenDayPoints || student.points || 0;
    }

    // In Today mode
    if (isToday(selectedDate)) {
      return student.todayPoints !== undefined ? student.todayPoints : (student.points || 0);
    }

    // Specific date mode: calculate points earned on selectedDate from student.history
    if (student.history && Array.isArray(student.history)) {
      const dayEntries = student.history.filter((h) => {
        if (!h.createdAt) return false;
        return isSameDay(new Date(h.createdAt), selectedDate);
      });
      if (dayEntries.length > 0) {
        return dayEntries.reduce((sum, h) => sum + (h.points || 0), 0);
      }
    }

    return 0;
  };

  // Sort students by points for the active view
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const ptsA = getPoints(a);
      const ptsB = getPoints(b);
      return ptsB - ptsA;
    });
  }, [students, viewMode, selectedDate]);

  // Calendar month data
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const handlePrevMonth = () => {
    sounds.playPop();
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    sounds.playPop();
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handlePickCalendarDate = (day) => {
    sounds.playPop();
    const chosen = new Date(calendarYear, calendarMonth, day);
    setSelectedDate(chosen);

    // Sync carousel so chosen date is visible
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenCopy = new Date(chosen);
    chosenCopy.setHours(0, 0, 0, 0);
    const diffDays = Math.round((chosenCopy - today) / (1000 * 60 * 60 * 24));
    setWindowOffset(diffDays);

    if (isToday(chosen)) {
      onSelectViewMode('today');
    } else {
      onSelectViewMode('date');
    }
    setIsCalendarOpen(false);
  };

  // Formatted date string for input[type="date"]
  const toYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex flex-col h-full text-slate-100 select-none relative">
      {/* Top Header: Fish Count & Interactive Day Carousel */}
      <div className="p-3 border-b border-slate-700/60 bg-slate-900/40 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-cyan-300">
            {students.length} {t.fishCount}
          </span>

          {/* Interactive Date Slider with Clickable Date Buttons */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <button
              onClick={() => handleShiftCarousel(-1)}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex gap-1">
              {dayTabs.map((d, i) => {
                const isActive =
                  viewMode !== '7days' && isSameDay(d.dateObj, selectedDate);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectDate(d.dateObj)}
                    className={`px-2 py-1 rounded text-center text-[10px] transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/60 shadow-sm shadow-cyan-500/20 scale-102'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{d.day}</div>
                    <div className="text-[9px] opacity-90">{d.date}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleShiftCarousel(1)}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Next Day"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* View Mode Filters: Today, 7 days, Calendar Popover Trigger */}
        <div className="flex items-center gap-1.5 pt-1 relative">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setSelectedDate(new Date());
              setWindowOffset(0);
              onSelectViewMode('today');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'today' && isToday(selectedDate)
                ? 'bg-teal-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            {t.today}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onSelectViewMode('7days');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === '7days'
                ? 'bg-teal-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            {t.sevenDays}
          </button>

          {/* Calendar Picker Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setCalendarYear(selectedDate.getFullYear());
              setCalendarMonth(selectedDate.getMonth());
              setIsCalendarOpen(!isCalendarOpen);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ml-auto cursor-pointer ${
              isCalendarOpen || (viewMode !== '7days' && !isToday(selectedDate))
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
            title="Pick date from Calendar"
          >
            <Calendar size={13} className="stroke-[2.5]" />
            <span>{t.calendar}</span>
          </button>
        </div>

        {/* Hidden Native Date Input for instant system picker access */}
        <input
          ref={nativeDateInputRef}
          type="date"
          className="hidden"
          value={toYYYYMMDD(selectedDate)}
          onChange={(e) => {
            if (e.target.value) {
              const [y, m, d] = e.target.value.split('-').map(Number);
              const chosen = new Date(y, m - 1, d);
              handlePickCalendarDate(d);
            }
          }}
        />

        {/* Floating Calendar Popover Modal */}
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute right-2 top-24 z-50 w-72 bg-slate-900 border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl animate-fade-in text-white"
          >
            {/* Header: Month / Year Navigation */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs font-black text-cyan-300 tracking-wide">
                {monthNames[calendarMonth]} {calendarYear}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1"
                  title="Close Calendar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty leading padding slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}

              {/* Month Day Buttons */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const cellDate = new Date(calendarYear, calendarMonth, dayNum);
                const isSelectedCell = isSameDay(cellDate, selectedDate);
                const isTodayCell = isToday(cellDate);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handlePickCalendarDate(dayNum)}
                    className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelectedCell
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30 scale-105'
                        : isTodayCell
                        ? 'border border-cyan-400/80 text-cyan-300 font-bold hover:bg-cyan-950/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Calendar Quick Shortcuts Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  const today = new Date();
                  setCalendarYear(today.getFullYear());
                  setCalendarMonth(today.getMonth());
                  handlePickCalendarDate(today.getDate());
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  setCalendarYear(yest.getFullYear());
                  setCalendarMonth(yest.getMonth());
                  handlePickCalendarDate(yest.getDate());
                }}
                className="text-slate-400 hover:text-white font-medium"
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  nativeDateInputRef.current?.showPicker
                    ? nativeDateInputRef.current.showPicker()
                    : nativeDateInputRef.current?.click();
                }}
                className="text-slate-400 hover:text-cyan-300 font-medium underline underline-offset-2"
              >
                Date Picker...
              </button>
            </div>
          </div>
        )}

        {/* Selected Date Notice Banner (shown when viewing a specific past date) */}
        {viewMode !== '7days' && !isToday(selectedDate) && (
          <div className="mt-2 py-1 px-2.5 bg-cyan-950/60 border border-cyan-500/30 rounded-xl flex items-center justify-between text-[11px] text-cyan-300">
            <span className="flex items-center gap-1 font-semibold truncate">
              <Clock size={12} />
              Points for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setSelectedDate(new Date());
                setWindowOffset(0);
                onSelectViewMode('today');
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-white hover:text-cyan-200 underline"
            >
              <RotateCcw size={10} />
              Back to Today
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
        {sortedStudents.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl my-2">
            <Award size={24} className="mx-auto text-amber-400 mb-2" />
            <div className="text-xs font-bold text-white mb-1">00 Ranked Fish</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No students in this course yet. Switch to the Students tab to add students and reward them!
            </p>
          </div>
        ) : (
          sortedStudents.map((s, idx) => {
            const rank = idx + 1;
            const isSelected = selectedStudentId === s._id;
            const pts = getPoints(s);

            // Crown styling for Top 3
            let rankBadge = null;
            let cardStyle =
              'bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50';

            if (rank === 1) {
              rankBadge = <Crown size={18} className="text-amber-400 fill-amber-400" />;
              cardStyle =
                'bg-gradient-to-r from-amber-500/20 to-slate-800/90 border border-amber-400/60 shadow-amber-500/10 shadow-sm';
            } else if (rank === 2) {
              rankBadge = <Crown size={18} className="text-slate-200 fill-slate-200" />;
              cardStyle =
                'bg-gradient-to-r from-slate-300/20 to-slate-800/90 border border-slate-300/60 shadow-sm';
            } else if (rank === 3) {
              rankBadge = <Crown size={18} className="text-amber-600 fill-amber-600" />;
              cardStyle =
                'bg-gradient-to-r from-amber-700/20 to-slate-800/90 border border-amber-600/50 shadow-sm';
            } else {
              rankBadge = (
                <span className="text-xs font-bold text-slate-400 w-5 text-center">
                  {rank}
                </span>
              );
            }

            return (
              <div
                key={s._id}
                onClick={() => {
                  sounds.playPop();
                  onSelectStudent(s);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${cardStyle} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''
                }`}
              >
                {/* Left: Rank & Student Name with Fish Swatch */}
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex items-center justify-center w-6">{rankBadge}</div>

                  {/* Fish Color Dot */}
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/40 shadow-sm"
                    style={{ backgroundColor: s.fishColor || '#0ea5e9' }}
                  />

                  <span className="font-bold text-sm truncate text-white">
                    {s.name}
                  </span>
                </div>

                {/* Right: Points */}
                <div className="flex items-center gap-1 font-mono font-black text-sm text-cyan-200 flex-shrink-0">
                  <span>{pts}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
