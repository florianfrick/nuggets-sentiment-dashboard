import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function SentimentLadder({ sentiments = [] }) {
  const chartData = useMemo(() => {
    if (!sentiments.length) return [];
    
    const playerStats = {};
    
    sentiments.forEach(s => {
      const pName = s.player_name; 
      
      if (!pName) return;

      if (!playerStats[pName]) {
          playerStats[pName] = { name: pName, total: 0, count: 0 };
      }
      
      const val = s.sentiment != null ? Number(s.sentiment) : 0;
      
      playerStats[pName].total += val;
      playerStats[pName].count += 1;
    });

    return Object.values(playerStats)
      .map(p => ({
        name: p.name,
        avg: p.count > 0 ? (p.total / p.count) : 0,
        games: p.count
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [sentiments]);

  if (!chartData.length) return (
      <div className="h-full flex items-center justify-center text-slate-500 text-xs">No Data</div>
  );

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <BarChart3 className="text-yellow-500" size={20} /> Player Ranking
        </h3>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg Sentiment</span>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart 
            layout="vertical" 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
            <CartesianGrid stroke="#1e293b" horizontal={false} vertical={true} strokeDasharray="3 3" />
            
            <XAxis 
                type="number" 
                hide 
                domain={['auto', 'auto']} 
            />
            
            <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#94a3b8" 
                fontSize={10} 
                width={100}
                tickMargin={10}
                tick={{ fill: '#f1f5f9', fontWeight: 600 }}
                interval={0}
            />
            
            <Tooltip 
                cursor={{fill: '#1e293b', opacity: 0.4}}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs z-50">
                            <div className="font-bold text-white mb-2 text-sm">{d.name}</div>
                            <div className="space-y-1">
                                <div className="flex justify-between gap-6 text-slate-400">
                                    <span>Avg Sentiment:</span>
                                    <span className={d.avg >= 0 ? "text-emerald-400 font-mono font-bold" : "text-rose-400 font-mono font-bold"}>
                                        {d.avg.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-6 text-slate-500">
                                    <span>Games Played:</span>
                                    <span className="font-mono text-slate-300">{d.games}</span>
                                </div>
                            </div>
                        </div>
                    );
                    }
                    return null;
                }}
            />
            
            <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
            
            <Bar dataKey="avg" maxBarSize={24} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.avg >= 0 ? '#10b981' : '#f43f5e'} 
                    radius={entry.avg >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]}
                    fillOpacity={0.9}
                />
            ))}
            </Bar>
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}