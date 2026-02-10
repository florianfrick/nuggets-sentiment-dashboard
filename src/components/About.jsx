import React from 'react';
import { Info } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex items-start gap-4 mt-6">
      <div className="bg-slate-800/50 p-3 rounded-xl hidden sm:block">
        <Info className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">
          About the Data
        </h4>
        <p className="text-slate-400 text-sm leading-relaxed">
          This dashboard correlates player performance statistics with fan sentiment over time.
          Sentiment data is aggregated from <span className="text-yellow-500 font-medium"><a href="https://www.reddit.com/r/denvernuggets/">r/denvernuggets</a></span> post-game threads. 
          <br></br>Comments are analyzed using <span className="text-slate-300 font-medium">Gemma 3 27B</span> for one-shot sentiment analysis to grade player sentiment after every game.
          Corresponding game performance statistics are gathered using NBA boxscore.
          <br></br>Preseason games are included. Only matches with a post-game thread are included in stats.
          <br></br>Dashboard is automatically updated daily.
        </p>
      </div>
    </div>
  );
}