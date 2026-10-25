import React, { useState } from 'react';
import { X, Sparkles, Award, BookOpen, Heart, CheckCircle2 } from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function FeedModal({
  student = null,
  onClose = () => {},
  onConfirmFeed = () => {},
  language = 'en',
}) {
  if (!student) return null;
  const t = translations[language] || translations.en;

  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('Homework Completed');

  const presetRewards = [
    { label: t.homeworkCompleted, pts: 10, icon: <CheckCircle2 size={15} /> },
    { label: t.extraCredit, pts: 15, icon: <Sparkles size={15} /> },
    { label: t.kindnessAward, pts: 5, icon: <Heart size={15} /> },
    { label: t.readingTime, pts: 8, icon: <BookOpen size={15} /> },
    { label: t.quizAce, pts: 12, icon: <Award size={15} /> },
  ];

  const handleApplyPreset = (item) => {
    sounds.playPop();
    setPoints(item.pts);
    setReason(item.label.split(' (+')[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmFeed(student._id, points, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Fish & Student Header */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-lg text-white"
            style={{ backgroundColor: student.fishColor || '#0ea5e9' }}
          >
            <Sparkles size={24} />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">{student.name}</h2>
            <div className="text-xs text-cyan-300 font-mono mt-0.5">
              Current: {student.points} total pts • {student.todayPoints || 0} today
            </div>
          </div>
        </div>

        {/* Preset Badges */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Quick Homework & Praise Badges
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {presetRewards.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(item)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                  points === item.pts
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.pointsToGive}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={points}
                onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.feedReason}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Chapter 4 Reading"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95"
            >
              <Sparkles size={16} />
              <span>{t.feedStudent} (+{points})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
