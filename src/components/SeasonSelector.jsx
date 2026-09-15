import React from 'react';
import { CalendarRange } from 'lucide-react';

export default function SeasonSelector({
  seasons = [],
  value,
  onChange,
  expanded = true,
  onExpand,
}) {
  if (!seasons.length) return null;

  // Collapsed sidebar: show an icon that re-expands so the picker stays reachable.
  if (!expanded) {
    return (
      <button
        onClick={onExpand}
        title="Select season"
        className="mx-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <CalendarRange size={20} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Season
      </span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/70 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#38bdf8] transition-all cursor-pointer"
      >
        {seasons.map((s) => (
          <option key={s} value={s} className="bg-slate-800 text-slate-100">
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}