import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Play, Pause, RefreshCcw, Calendar, Users } from 'lucide-react';

const METRICS = [
  { key: 'ts', label: 'True Shooting %', isPercent: true, min: 0.40, max: 0.75 },
  { key: 'efg', label: 'eFG %', isPercent: true, min: 0.40, max: 0.75 },
  { key: 'points', label: 'Points', isPercent: false, min: 0, max: 35 },
  { key: 'plusminus', label: 'Plus/Minus', isPercent: false, min: -15, max: 15 },
  { key: 'minutes', label: 'Minutes', isPercent: false, min: 5, max: 40 },
];

const getMetricColor = (value, metricConfig) => {
  if (value === null || value === undefined) return '#334155'; 
  
  let val = Number(value);
  if (metricConfig.isPercent && val > 1) val = val / 100;

  let normalized = Math.min(Math.max((val - metricConfig.min) / (metricConfig.max - metricConfig.min), 0), 1);

  if (metricConfig.invertColor) {
    normalized = 1 - normalized;
  }

  const r = normalized < 0.5 ? 255 : Math.round(255 * (1 - (normalized - 0.5) * 2));
  const g = normalized > 0.5 ? 255 : Math.round(255 * (normalized * 2));
  
  return `rgb(${r}, ${g}, 50)`;
};

export default function PlayerSentimentByGame({ sentiments = [], games = [] }) {
  const [gameIndex, setGameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0]); 

  // Extract unique player names
  const playerNames = useMemo(() => {
    if (!sentiments.length) return [];
    return [...new Set(sentiments.map(s => s.player_name))].sort();
  }, [sentiments]);

  // Sort games chronologically
  const sortedGames = useMemo(() => {
    if (!games.length) return [];
    return [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [games]);

  const currentFrameData = useMemo(() => {
    const currentGame = sortedGames[gameIndex];
    if (!currentGame) return [];

    const gameStats = sentiments.filter(s => s.PK === currentGame.PK);

    return playerNames.map(name => {
      const pData = gameStats.find(s => s.player_name === name);
      
      let rawVal = pData ? pData[selectedMetric.key] : null;
      if (rawVal !== null) rawVal = Number(rawVal);

      const displayVal = rawVal; 

      return {
        name: name,
        sentiment: pData ? Number(pData.sentiment) : 0,
        metricVal: displayVal,
        mentions: pData ? pData.mentions : 0,
        color: getMetricColor(rawVal, selectedMetric),
        minutes: pData?.minutes || 0,
      };
    }).filter(p => p.minutes > 0); // Only show players who played
  }, [sentiments, sortedGames, gameIndex, playerNames, selectedMetric]);

  useEffect(() => {
    let interval;
    if (isPlaying && gameIndex < sortedGames.length - 1) {
      interval = setInterval(() => setGameIndex(prev => prev + 1), 1500);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameIndex, sortedGames.length]);

  if (!games || games.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono">
        Waiting for game data...
      </div>
    );
  }

  const currentGame = sortedGames[gameIndex] || {};

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="text-yellow-500" /> Season Sentiment Tracker
          </h2>
          <div className="flex items-center gap-3 mt-1 text-slate-400 font-mono text-sm">
            <span className="flex items-center gap-1">
                <Calendar size={14}/> 
                {new Date(currentGame.date).toLocaleDateString('en-US', {
                  timeZone: 'MST',
                  year: "numeric", 
                  month: 'short', 
                  day: 'numeric'
                })}
            </span>
            <span className="text-slate-700">|</span>

            <span className={currentGame.away === "Nuggets" ? "text-yellow-500/80:text-white transition-colors" : ""}>
              {currentGame.away}
            </span>
            
            <span> @ </span>

            <span className={currentGame.home === "Nuggets" ? "text-yellow-500 group-hover:text-white transition-colors" : ""}>
              {currentGame.home}
            </span>
          
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-start sm:items-center">
            {/* Metric Selector */}
            <div className="flex flex-wrap gap-1">
                {METRICS.map(metric => (
                    <button
                        key={metric.key}
                        onClick={() => setSelectedMetric(metric)}
                        className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            selectedMetric.key === metric.key
                            ? "bg-slate-700 text-white border-slate-500"
                            : "bg-transparent text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300"
                        }`}
                    >
                        {metric.label}
                    </button>
                ))}
            </div>

            {/* Play Controls */}
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-full border border-slate-800 shrink-0">
                <button 
                    onClick={() => { if(gameIndex >= sortedGames.length -1) setGameIndex(0); setIsPlaying(!isPlaying); }}
                    className="p-2 bg-yellow-500 text-black rounded-full hover:scale-105 transition"
                >
                    {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
                </button>
                <button onClick={() => {setGameIndex(0); setIsPlaying(false);}} className="p-2 text-slate-400 hover:text-white">
                    <RefreshCcw size={18} />
                </button>
                <div className="px-4 text-xs font-bold text-slate-500 border-l border-slate-800 ml-2">
                    {gameIndex + 1} / {sortedGames.length}
                </div>
            </div>
        </div>
      </div>

      {/* Manual Slider */}
      <div className="flex-shrink-0 mb-2 px-2">
        <input 
          type="range"
          min="0"
          max={Math.max(0, sortedGames.length - 1)}
          value={gameIndex}
          onChange={(e) => {
            setGameIndex(parseInt(e.target.value));
            setIsPlaying(false);
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
        />
        <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Season Start</span>
          <span>Present</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart
            data={currentFrameData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
            <XAxis 
                type="number" 
                domain={[-100, 100]}
                stroke="#475569" 
                fontSize={11}
                tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#94a3b8" 
                fontSize={12} 
                width={120}
                tick={{ fill: '#f1f5f9', fontWeight: 600 }}
                interval={0} 
            />
            <Tooltip
                cursor={{ fill: '#1e293b' }}
                content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                    const d = payload[0].payload;
                    return (
                        <div className="bg-slate-950 border border-yellow-500/30 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50">
                        <p className="text-white font-bold mb-1 border-b border-slate-800 pb-1">{d.name}</p>
                        <div className="space-y-1 text-xs pt-1">
                            <p className="flex justify-between gap-6">
                                <span className="text-slate-400 uppercase tracking-tighter font-semibold">Sentiment</span>
                                <span className={d.sentiment >= 0 ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
                                    {d.sentiment > 0 ? `+${d.sentiment.toFixed(1)}` : d.sentiment.toFixed(1)}
                                </span>
                            </p>
                            <p className="flex justify-between gap-6">
                                <span className="text-slate-400 uppercase tracking-tighter font-semibold">{selectedMetric.label}</span>
                                <span className="text-white font-mono">{d.metricVal !== null ? d.metricVal.toFixed(1) : 'N/A'}</span>
                            </p>
                            <p className="flex justify-between gap-6">
                                <span className="text-slate-400 uppercase tracking-tighter font-semibold">Mentions</span>
                                <span className="text-white font-mono">{d.mentions}</span>
                            </p>
                        </div>
                        </div>
                    );
                    }
                    return null;
                }}
            />
            <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
            
            <Bar 
                dataKey="sentiment" 
                maxBarSize={32}
                isAnimationActive={true}
                animationDuration={400}
                animationEasing="ease-out"
            >
            {currentFrameData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    fillOpacity={entry.metricVal !== null ? 1 : 0.3} 
                />
            ))}
            </Bar>
        </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="mt-2 flex-shrink-0 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
        <div className="flex gap-4 items-center">
            <span className="text-red-500">
                {selectedMetric.invertColor ? `High ${selectedMetric.label}` : `Low ${selectedMetric.label} `}
            </span>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
            <span className="text-green-500">
                {selectedMetric.invertColor ? `Low ${selectedMetric.label} ` : `High ${selectedMetric.label} `}
            </span>
        </div>
          {currentGame.permalink && (
          <div className="text-slate-500 hover:text-yellow-500 transition">
              <a href={`https://www.reddit.com${currentGame.permalink}`} target="_blank" rel="noreferrer">Discussion Thread ↗</a>
          </div>
        )}

      </div>
    </div>
  );
}