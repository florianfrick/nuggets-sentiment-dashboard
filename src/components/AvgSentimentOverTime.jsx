import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function AvgSentimentOverTime({ sentiments = [], games = [] }) {
  const trendData = useMemo(() => {
    if (!games.length || !sentiments.length) return [];
    
    const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));

    return sortedGames.map(game => {
      const gameSentiments = sentiments.filter(s => s.PK === game.PK);
      
      if (gameSentiments.length === 0) return null;

      const totalMentions = gameSentiments.reduce((acc, s) => acc + (s.mentions || 0), 0);
      
      //  Weighted Average Sentiment
      const weightedSum = gameSentiments.reduce((acc, s) => {
          // null sentiments
          const val = s.sentiment != null ? Number(s.sentiment) : 0;
          const count = s.mentions || 0;
          return acc + (val * count);
      }, 0);

      return {
        date: new Date(game.date).toLocaleDateString('en-US', { timeZone:'MST', year: "numeric", month: 'short', day: 'numeric'}),
        avgSentiment: totalMentions > 0 ? (weightedSum / totalMentions) : 0,
        opponent: game.away === 'Denver Nuggets' ? `@ ${game.home}` : `vs ${game.away}`,
        PK: game.PK 
      };
    }).filter(Boolean); // Remove nulls (games with no data)
  }, [games, sentiments]);

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col overflow-hidden">
      
      {/* Header - Fixed Height */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <TrendingUp className="text-yellow-500" size={20} /> Average Sentiment
        </h3>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Season Trend</span>
      </div>
      
      {/* Chart Container - Fills remaining space */}
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {/* Gradient Definition for the area under line */}
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            
            <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickMargin={10} 
                tick={{fill: '#94a3b8'}}
                minTickGap={30}
            />
            
            <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                domain={['auto', 'auto']} 
                tick={{fill: '#94a3b8'}}
            />
            
            <Tooltip 
                cursor={{stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4'}}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl z-50">
                                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</div>
                                <div className="text-white font-bold text-sm mb-1">{d.opponent}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-slate-400 text-xs">Avg Sentiment:</span>
                                    <span className={d.avgSentiment >= 0 ? "text-emerald-400 font-mono font-bold" : "text-rose-400 font-mono font-bold"}>
                                        {d.avgSentiment.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            
            <Line 
              type="monotone" 
              dataKey="avgSentiment" 
              stroke="#fbbf24" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#fff', stroke: '#fbbf24', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}