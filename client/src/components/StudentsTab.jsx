import React, { useState } from 'react';
import { Search, UserPlus, FileText, Trash2, Plus, Sparkles } from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function StudentsTab({
  students = [],
  onOpenAddModal = () => {},
  onOpenBulkModal = () => {},
  onFeedStudent = () => {},
  onDeleteStudent = () => {},
  language = 'en',
}) {
  const t = translations[language] || translations.en;
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full text-slate-100 select-none">
      {/* Top Controls: Search and Add Buttons */}
      <div className="p-3 border-b border-slate-700/60 bg-slate-900/40 space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchStudent}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playPop();
              onOpenAddModal();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <UserPlus size={14} />
            <span>{t.addStudent}</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onOpenBulkModal();
            }}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <FileText size={14} />
            <span>{t.importRoster}</span>
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
        {students.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl my-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-2.5">
              <UserPlus size={18} />
            </div>
            <div className="text-xs font-bold text-white mb-1">00 Students Enrolled</div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              This course starts with 00 students. Click below to add students anytime!
            </p>
            <button
              onClick={() => {
                sounds.playPop();
                onOpenAddModal();
              }}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              + Add Student
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No students matching "{search}"
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all shadow-sm"
            >
              {/* Left: Fish Swatch & Student Info */}
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white/50 shadow-sm"
                  style={{ backgroundColor: s.fishColor || '#0ea5e9' }}
                />
                <div className="truncate">
                  <div className="font-bold text-sm text-white truncate">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">
                    {s.points} pts • {s.todayPoints || 0} today
                  </div>
                </div>
              </div>

              {/* Right: Quick Feed Point Buttons (+1, +5, +10) and Delete */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {[1, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onFeedStudent(s._id, amt, 'Quick Reward')}
                    className="px-2 py-1 bg-slate-700 hover:bg-cyan-600 text-cyan-200 hover:text-white rounded-lg text-xs font-mono font-bold transition-all active:scale-90"
                    title={`Give +${amt} points`}
                  >
                    +{amt}
                  </button>
                ))}

                <button
                  onClick={() => onDeleteStudent(s._id, s.name)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors ml-1"
                  title="Remove student"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
