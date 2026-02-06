import React, { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getGamePlayers } from '../graphql/queries'; 
import About from './About';

import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Gauge } from 'lucide-react';

const client = generateClient();

const METRICS = [
  { key: 'ts', label: 'True Shooting %', isPercent: true },
  { key: 'efg', label: 'eFG %', isPercent: true },
  { key: 'points', label: 'Points', isPercent: false },
  { key: 'assists', label: 'Assists', isPercent: false },
  { key: 'rebounds', label: 'Rebounds', isPercent: false },
  { key: 'plusminus', label: '+/-', isPercent: false },
  { key: 'minutes', label: 'Minutes', isPercent: false },
];

const ClickableBar = (props) => {
  const { x, y, width, height, fill, payload, onPlayerSelect } = props;

  return (
    <rect 
      x={x} 
      y={y} 
      width={width} 
      height={height} 
      fill={fill}
      rx={4}
      ry={4}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onPlayerSelect && payload.name) {
             onPlayerSelect(payload.name);
        }
      }}
      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
      onMouseLeave={(e) => e.target.style.opacity = '1'}
    />
  );
};

export default function GameView({ selectedGame, onPlayerSelect }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);

  useEffect(() => {
    if (selectedGame?.PK) {
      setLoading(true);
      
      const fetchPlayers = async () => {
        try {
          const result = await client.graphql({
            query: getGamePlayers,
            variables: { PK: selectedGame.PK }
          });

          const players = result.data.getGamePlayers;

          const transformedData = players.map(player => {
             const processedPlayer = {
                ...player,
                name: player.player_name,
                sentiment: player.sentiment || 0,
                mentions: player.mentions || 0
             };

             METRICS.forEach(metric => {
                const rawVal = player[metric.key];
                if (rawVal !== undefined && rawVal !== null) {
                    processedPlayer[metric.key] = metric.isPercent ? (rawVal * 100) : rawVal;
                } else {
                    processedPlayer[metric.key] = 0;
                }
             });

             return processedPlayer;
          });
          
          const getLastName = (fullName) => {
            const parts = fullName.split(' ');
            // Filter out common suffixes
            const relevantParts = parts.filter(p => !['Jr.', 'Sr.', 'II', 'III', 'IV'].includes(p));
            return relevantParts[relevantParts.length - 1];
          };

          transformedData.sort((a, b) => {
            const lastA = getLastName(a.name);
            const lastB = getLastName(b.name);
            
            // sort by last name
            return lastA.localeCompare(lastB);
          });

          setData(transformedData);
        } catch (error) {
          console.error("Error fetching player stats:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPlayers();
    }
  }, [selectedGame]);

  // Avg sentiment
  const weightedAvgSentiment = useMemo(() => {
    if (data.length === 0) return 0;

    const totalMentions = data.reduce((sum, player) => sum + player.mentions, 0);
    if (totalMentions === 0) return 0;

    const weightedSum = data.reduce((sum, player) => {
      return sum + (player.sentiment * player.mentions);
    }, 0);

    return (weightedSum / totalMentions).toFixed(2);
  }, [data]);

  if (!selectedGame) {
    return <div className="h-[400px] flex items-center justify-center text-slate-500">Select a game to view stats</div>;
  }

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-700">
      {/* Score Card */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
            label={`${selectedGame.away} @ ${selectedGame.home}`} 
            value={`${selectedGame.away_pts} - ${selectedGame.home_pts}`} 
            isAccent
        />
        <StatCard label="Average Sentiment" value={weightedAvgSentiment}/>
        <StatCard label="# Player Mentions" value={data.reduce((sum, p) => sum + p.mentions, 0)} />
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Header with Metric Selector */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
          <h3 className="text font-bold uppercase tracking flex items-center gap-2">
            <Gauge className="w-4 h-4 text-white-500" />
            <span className="flex gap-1">
              <span className="text-yellow-500">Sentiment</span>
              <span className="text-white">vs</span>
              <span className="text-[#2774b3]">{selectedMetric.label}</span>
            </span>
          </h3>

          {/* Metric Buttons */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map(metric => (
                <button
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedMetric.key === metric.key
                        ? "bg-[#38bdf8] text-slate-900 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                        : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                    }`}
                >
                    {metric.label}
                </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500 min-w-max">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"/> Fan Sentiment</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-sky-400 rounded-full"/> {selectedMetric.label}</span>
          </div>
        </div>

        <div className="h-[400px] w-full">
            {loading ? (
                <div className="flex h-full w-full items-center justify-center text-blue-400 animate-pulse">
                    Loading Stats...
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="white" 
                      fontSize={11}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke="#FEC524" 
                      fontSize={11} 
                      domain={[-100, 100]}
                    />
                    
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#38bdf8" 
                      fontSize={11} 
                      domain={['auto', 'auto']}
                    />
                    
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value, name) => {
                            if (name === "metric_val") return [`${Number(value).toFixed(1)}`, selectedMetric.label];
                            return [Number(value).toFixed(2), "Sentiment"];
                        }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                    />
                    
                    <Bar 
                        yAxisId="left" 
                        dataKey="sentiment" 
                        fill="#FEC524" 
                        radius={[4, 4, 0, 0]} 
                        barSize={20}
                        shape={<ClickableBar onPlayerSelect={onPlayerSelect} />}
                    />

                    <Bar 
                        yAxisId="right" 
                        dataKey={selectedMetric.key}
                        name="metric_val"
                        fill="#38bdf8" 
                        radius={[4, 4, 4, 4]} 
                        barSize={20}
                        shape={<ClickableBar onPlayerSelect={onPlayerSelect} />}
                    />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>
      <About />
    </div>
  );
}

const StatCard = ({ label, value, isAccent }) => (
  <div className={`p-6 rounded-2xl border ${isAccent ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{label}</p>
    <p className={`text-2xl font-black italic ${isAccent ? 'text-yellow-500' : 'text-white'}`}>{value}</p>
  </div>
);