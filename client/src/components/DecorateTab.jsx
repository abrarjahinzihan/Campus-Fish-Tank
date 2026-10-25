import React from 'react';
import { Sparkles, Check, Lock } from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function DecorateTab({
  classroom = {},
  students = [],
  onToggleDecoration = () => {},
  language = 'en',
}) {
  const t = translations[language] || translations.en;

  const totalClassPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
  const milestoneTarget = 3000;
  const progressPercent = Math.min(100, Math.round((totalClassPoints / milestoneTarget) * 100));

  const items = classroom.decorations || [
    { id: 'dec-1', type: 'treasureChest', name: 'Treasure Chest', active: true },
    { id: 'dec-2', type: 'pearlClam', name: 'Giant Pearl Clam', active: true },
    { id: 'dec-3', type: 'pinkCoral', name: 'Pink Coral Reef', active: true },
    { id: 'dec-4', type: 'redCoral', name: 'Sunken Coral', active: true },
    { id: 'dec-5', type: 'rockArch', name: 'Grotto Arch', active: true },
    { id: 'dec-6', type: 'seaweed', name: 'Emerald Seaweed', active: true },
    { id: 'dec-7', type: 'castle', name: 'Atlantis Castle', active: true },
  ];

  return (
    <div className="flex flex-col h-full text-slate-100 select-none p-3 space-y-4 custom-scrollbar overflow-y-auto">
      {/* Classroom Point Milestone Progress Banner */}
      <div className="p-3 bg-gradient-to-br from-indigo-950/80 to-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-md">
        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Sparkles size={14} className="text-amber-400" />
            Class Milestone
          </span>
          <span className="font-mono text-cyan-300">
            {totalClassPoints} / {milestoneTarget} pts
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/80">
          <div
            className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
          {t.unlockProgress} ({progressPercent}%)
        </p>
      </div>

      {/* Aquarium Items List */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          {t.decorationsTitle}
        </h3>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                sounds.playPop();
                onToggleDecoration(item.id);
              }}
              className="flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Sparkles size={15} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.active ? 'Visible in tank' : 'Hidden'}
                  </div>
                </div>
              </div>

              {/* Toggle checkbox */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  item.active
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {item.active && <Check size={14} className="stroke-[3]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
