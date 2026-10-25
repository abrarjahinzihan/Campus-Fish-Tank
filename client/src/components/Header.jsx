import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Sunset,
  Edit2,
  Check,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function Header({
  classroom = {},
  onUpdateClassroom = () => {},
  onFeedEveryone = () => {},
  onOpenSettings = () => {},
  isFullscreen = false,
  onToggleFullscreen = () => {},
  onBackToHome = null,
}) {
  const lang = classroom.language || 'en';
  const t = translations[lang] || translations.en;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(classroom.title || 'CS 301: Algorithms & Data Structures');
  const [soundActive, setSoundActive] = useState(classroom.soundEnabled !== false);

  React.useEffect(() => {
    if (classroom.title) {
      setTitleInput(classroom.title);
    }
  }, [classroom.title]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateClassroom({ title: titleInput.trim() });
    }
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    sounds.setEnabled(next);
    onUpdateClassroom({ soundEnabled: next });
    if (next) sounds.playPop();
  };

  const cycleNameVisibility = () => {
    sounds.playPop();
    const modes = ['always', 'hover', 'never'];
    const currentIdx = modes.indexOf(classroom.nameVisibility || 'always');
    const nextMode = modes[(currentIdx + 1) % modes.length];
    onUpdateClassroom({ nameVisibility: nextMode });
  };

  const getNamePillLabel = () => {
    if (classroom.nameVisibility === 'hover') return t.namesHover;
    if (classroom.nameVisibility === 'never') return t.namesNever;
    return t.namesAlways;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 text-white select-none">
      {/* Left: Back to Home + Class Title & Subtitle */}
      <div className="flex items-center gap-3">
        {onBackToHome && (
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onBackToHome();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/95 hover:bg-slate-750 text-white rounded-xl border border-cyan-500/40 hover:border-cyan-300 text-xs font-extrabold transition-all shadow-md active:scale-95 group cursor-pointer"
            title="Return to Courses Dashboard (or use browser Back button)"
          >
            <ArrowLeft size={16} className="text-cyan-400 group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
            <span>Back</span>
          </button>
        )}
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="bg-slate-800 border border-cyan-400 text-white font-extrabold text-xl px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
            >
              <Check size={18} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTitleInput(classroom.title || 'Course Aquarium');
              setIsEditingTitle(true);
            }}
            className="group cursor-pointer flex flex-col"
            title="Click to rename classroom"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-cyan-300 group-hover:text-cyan-200 transition-colors uppercase">
                {classroom.title || 'Course Aquarium'}
              </h1>
              <Edit2 size={16} className="text-cyan-400/50 group-hover:text-cyan-300 transition-colors" />
            </div>
            <span className="text-xs text-cyan-200/60 font-medium">
              {t.subtitle}
            </span>
          </div>
        )}
      </div>

      {/* Middle & Right: Action Buttons & Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Language Switcher */}
        <div className="flex items-center bg-slate-800/90 rounded-full p-0.5 border border-slate-700/60 shadow-inner">
          {['en', 'uz', 'es'].map((code) => (
            <button
              key={code}
              onClick={() => {
                sounds.playPop();
                onUpdateClassroom({ language: code });
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all uppercase ${
                lang === code
                  ? 'bg-cyan-500 text-slate-950 shadow-md scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {/* Theme Pills */}
        <div className="flex items-center bg-slate-800/90 rounded-full p-0.5 border border-slate-700/60">
          <button
            onClick={() => {
              sounds.playPop();
              onUpdateClassroom({ theme: 'sunnyReef' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              classroom.theme === 'sunnyReef'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sun size={13} />
            {t.sunnyReef}
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onUpdateClassroom({ theme: 'nightGlow' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              classroom.theme === 'nightGlow'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Moon size={13} />
            {t.nightGlow}
          </button>
        </div>

        {/* Names Visibility Pill */}
        <button
          onClick={cycleNameVisibility}
          className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-xs font-semibold rounded-full border border-slate-700/70 text-slate-200 hover:text-white transition-all shadow-sm"
        >
          {getNamePillLabel()}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            sounds.playPop();
            onOpenSettings();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-xs font-semibold rounded-full border border-slate-700/70 text-slate-200 hover:text-white transition-all shadow-sm"
        >
          <Settings size={14} className="text-cyan-400" />
          {t.settings}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className="p-2 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-cyan-300 rounded-full border border-slate-700/70 transition-all shadow-sm"
          title={soundActive ? 'Mute Sounds' : 'Enable Sounds'}
        >
          {soundActive ? <Volume2 size={15} /> : <VolumeX size={15} className="text-rose-400" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-cyan-300 rounded-full border border-slate-700/70 transition-all shadow-sm"
          title={isFullscreen ? t.exitFullScreen : t.fullScreen}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* "Feed everyone" Action Button */}
        <button
          onClick={onFeedEveryone}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-full shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all transform hover:-translate-y-0.5"
        >
          <Sparkles size={16} className="text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{t.feedEveryone}</span>
        </button>
      </div>
    </header>
  );
}
