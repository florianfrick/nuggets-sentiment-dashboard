import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Activity } from 'lucide-react';

// Pearson Correlation Coefficient (r)
const calculateCorrelation = (data, metricKey, sentimentKey = 'sentiment') => {
  // Filter out data points where either value is null/undefined
  const filtered = data.filter(d => 
    d[metricKey] != null && 
    d[sentimentKey] != null && 
    !isNaN(d[metricKey]) && 
    !isNaN(d[sentimentKey])
  );
  
  const n = filtered.length;
  if (n < 2) return 0; // Need at least 2 points for correlation

  const sumX = filtered.reduce((acc, d) => acc + Number(d[metricKey]), 0);
  const sumY = filtered.reduce((acc, d) => acc + Number(d[sentimentKey]), 0);
  const sumXY = filtered.reduce((acc, d) => acc + (Number(d[metricKey]) * Number(d[sentimentKey])), 0);
  const sumX2 = filtered.reduce((acc, d) => acc + (Number(d[metricKey]) ** 2), 0);
  const sumY2 = filtered.reduce((acc, d) => acc + (Number(d[sentimentKey]) ** 2), 0);

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

const METRICS = [
  { key: 'ts', label: 'True Shooting %' },
  { key: 'efg', label: 'eFG %' },
  { key: 'plusminus', label: 'Plus/Minus (+/-)' },
  { key: 'points', label: 'Points' },
  { key: 'assists', label: 'Assists' },
  { key: 'rebounds', label: 'Rebounds' },
  { key: 'minutes', label: 'Minutes Played' },
  { key: 'mentions', label: 'Total Mentions' }
];

export default function PerformanceCorrelation({ sentiments = [] }) {
  const correlationData = useMemo(() => {
    if (!sentiments.length) return [];
    
    return METRICS.map(m => ({
      name: m.label,
      value: calculateCorrelation(sentiments, m.key),
    })).sort((a, b) => b.value - a.value); 
  }, [sentiments]);

  if (!correlationData.length) return null;

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Activity className="text-yellow-500" size={20} /> Correlation
        </h3>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Correlation with Fan Sentiment (r)</span>
      </div>

      {/* Chart Container */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            layout="vertical" 
            data={correlationData} 
            margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
          >
            <CartesianGrid stroke="#1e293b" horizontal={false} vertical={true} strokeDasharray="2 2" />
            
            {/* Domain -1 to 1 Correlation */}
            <XAxis type="number" domain={[-1, 1]} stroke="#64748b" fontSize={10} hide />
            
            <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#94a3b8" 
                fontSize={11} 
                width={110} 
                tick={{fill: '#f1f5f9', fontWeight: 600}} 
                interval={0} 
            />
            
            <Tooltip 
                cursor={{fill: '#1e293b', opacity: 0.4}}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                        <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg shadow-xl text-xs z-50">
                            <div className="font-bold text-white mb-1">{d.name}</div>
                            <div className="flex justify-between gap-4 text-slate-400">
                                <span>Correlation (r):</span>
                                <span className={d.value > 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                                    {d.value.toFixed(3)}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 italic">
                                {d.value > 0.5 ? "Strong Positive" : 
                                 d.value < -0.5 ? "Strong Negative" : 
                                 "Weak/No Correlation"}
                            </div>
                        </div>
                    );
                    }
                    return null;
                }}
            />
            
            <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
            
            <Bar dataKey="value" barSize={18}>
              {correlationData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 0 ? '#10b981' : '#f43f5e'} 
                    radius={entry.value > 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}