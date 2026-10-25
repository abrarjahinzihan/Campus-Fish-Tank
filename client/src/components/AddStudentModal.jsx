import React, { useState } from 'react';
import { X, UserPlus, FileText, Check } from 'lucide-react';
import { translations } from '../translations';
import { sounds } from '../audio/soundEngine';

export default function AddStudentModal({
  isOpen = false,
  isBulkMode = false,
  onClose = () => {},
  onAddStudent = () => {},
  onAddBulk = () => {},
  language = 'en',
}) {
  if (!isOpen) return null;
  const t = translations[language] || translations.en;

  const [mode, setMode] = useState(isBulkMode ? 'bulk' : 'single');
  const [name, setName] = useState('');
  const [points, setPoints] = useState(20);
  const [color, setColor] = useState('#0ea5e9');
  const [pattern, setPattern] = useState('floral');
  const [bulkText, setBulkText] = useState('');

  const colorPalette = [
    { name: 'Sky Blue', hex: '#0ea5e9' },
    { name: 'Teal Emerald', hex: '#0d9488' },
    { name: 'Ocean Cyan', hex: '#0284c7' },
    { name: 'Lavender Purple', hex: '#c084fc' },
    { name: 'Blossom Pink', hex: '#f472b6' },
    { name: 'Hot Pink', hex: '#ec4899' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Coral Orange', hex: '#f97316' },
    { name: 'Sunflower Gold', hex: '#eab308' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Silver Pearl', hex: '#e2e8f0' },
    { name: 'Mint Green', hex: '#10b981' },
  ];

  const patterns = [
    { id: 'floral', label: '🌸 Floral' },
    { id: 'dots', label: '⚪ Polka Dots' },
    { id: 'scales', label: '🐟 Scales' },
    { id: 'sparkles', label: '✨ Sparkles' },
    { id: 'plain', label: '🌊 Smooth' },
  ];

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddStudent({
      name: name.trim(),
      fishColor: color,
      fishPattern: pattern,
      points: Number(points) || 10,
    });
    setName('');
    onClose();
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;
    onAddBulk(names);
    setBulkText('');
    onClose();
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

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'single'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            {t.addStudent}
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'bulk'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText size={14} />
            {t.importRoster}
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                {t.studentName}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Emma Watson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Fish Color Palette */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                {t.fishColor}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {colorPalette.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      color === c.hex ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {color === c.hex && <Check size={16} className="text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Fish Pattern */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                {t.fishPattern}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {patterns.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPattern(p.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                      pattern === p.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Points */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Starting Points
              </label>
              <input
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                {t.addStudent}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Paste Multiple Student Names
              </label>
              <textarea
                rows={7}
                placeholder={t.bulkPlaceholder}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Copy and paste a column from Google Sheets or Excel! Each student automatically gets a unique colorful fish and patterns.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95"
              >
                Import All
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
