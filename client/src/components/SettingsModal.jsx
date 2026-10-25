import React, { useState } from 'react';
import { X, Settings, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function SettingsModal({
  isOpen = false,
  classroom = {},
  students = [],
  onClose = () => {},
  onUpdateClassroom = () => {},
  onResetTodayPoints = () => {},
  language = 'en',
}) {
  if (!isOpen) return null;
  const t = translations[language] || translations.en;

  const [title, setTitle] = useState(classroom.title || '2-A SINF');
  const [subtitle, setSubtitle] = useState(classroom.subTitle || 'Tap the title to rename • Tap a fish to feed it');
  const [confirmReset, setConfirmReset] = useState(false);

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
  const topStudent = [...students].sort((a, b) => (b.points || 0) - (a.points || 0))[0];

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateClassroom({
      title: title.trim() || '2-A SINF',
      subTitle: subtitle.trim(),
    });
    onClose();
  };

  const handleExecuteReset = () => {
    sounds.playPop();
    onResetTodayPoints();
    setConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Settings size={20} />
          </div>
          <h2 className="text-xl font-black text-white">{t.classroomSettings}</h2>
        </div>

        {/* Classroom Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 mb-5 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Students</div>
            <div className="text-lg font-black text-white">{students.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Class Total</div>
            <div className="text-lg font-black text-cyan-300 font-mono">{totalPoints}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Top Student</div>
            <div className="text-xs font-bold text-amber-300 truncate mt-1">
              👑 {topStudent?.name || '-'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              {t.className}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Aquarium Subtitle / Instructions
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Reset Today Points */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Daily Class Reset
            </div>

            {confirmReset ? (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2">
                <p className="text-xs text-rose-200">{t.resetConfirm}</p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    Yes, Reset Today Points
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold transition-all w-full"
              >
                <RotateCcw size={14} />
                <span>{t.resetDailyPoints}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
