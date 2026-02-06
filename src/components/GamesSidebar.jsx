import React, { useEffect, useRef } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

export default function Sidebar({ games, onSelect, activeId }) {
  const activeGameRef = useRef(null);

  // Scroll to the active element whenever activeId changes
  useEffect(() => {
    if (activeGameRef.current) {
      activeGameRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeId]);

  return (
    <aside className="w-80 sticky top-6 h-[calc(100vh-3rem)] flex flex-col bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} /> Games
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {games.map((game) => {
          const isActive = activeId === game.PK;

          return (
            <button
              key={game.PK}
              ref={isActive ? activeGameRef : null}
              onClick={() => onSelect(game)}
              className={`w-full group p-4 rounded-2xl transition-all duration-300 flex items-center justify-between ${
                isActive
                  ? 'bg-blue-900 shadow-lg scale-[1.02] border border-blue-700' 
                  : 'hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="text-left">
                <p className="text-[12px] font-mono text-slate-400 uppercase mb-1">
                  {new Date(game.date).toLocaleDateString('en-US', {
                    timeZone: 'MST',
                    year: "numeric", 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </p>
                
                <h4 className="font-black italic text-sm uppercase text-slate-100 flex gap-1">
                  <span className={game.away === "Nuggets" ? "text-yellow-500 group-hover:text-white transition-colors" : ""}>
                    {game.away}
                  </span>
                  
                  <span> @ </span>

                  <span className={game.home === "Nuggets" ? "text-yellow-500 group-hover:text-white transition-colors" : ""}>
                    {game.home}
                  </span>
                </h4>
                
                  <p className="text-xs text-slate-500 mt-1">
                    {game.away_pts} - {game.home_pts}
                  </p>
              </div>
              <ChevronRight 
                size={16} 
                className={`transition-transform ${
                  isActive ? 'translate-x-1 text-yellow-500' : 'text-slate-600'
                }`} 
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}