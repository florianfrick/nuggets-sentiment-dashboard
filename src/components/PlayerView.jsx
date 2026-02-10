import React, { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getPlayerHistory } from '../graphql/queries'; 
import About from './About';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Gauge } from 'lucide-react';

const client = generateClient();

const roster = [
  "Aaron Gordon", "Bruce Brown", "Cameron Johnson", "Christian Braun", "Curtis Jones", "DaRon Holmes II", "Hunter Tyson", "Jalen Pickett", "Jamal Murray", 
  "Jonas Valanciunas", "Julian Strawther", "Nikola Jokic", "Peyton Watson", "Spencer Jones", "Tamar Bates", "Tim Hardaway Jr.", "Zeke Nnaji", "David Adelman"
];

const METRICS = [
  { key: 'plusminus', label: 'Plus/Minus', isPercent: false },
  { key: 'points', label: 'Points', isPercent: false },
  { key: 'assists', label: 'Assists', isPercent: false },
  { key: 'rebounds', label: 'Rebounds', isPercent: false },
  { key: 'steals', label: 'Steals', isPercent: false },
  { key: 'blocks', label: 'Blocks', isPercent: false },
  { key: 'fg_pct', label: 'FG %', isPercent: true },
  { key: 'fg3_pct', label: '3-Point %', isPercent: true },
  { key: 'ts', label: 'True Shooting %', isPercent: true },
  { key: 'efg', label: 'Effective FG %', isPercent: true },
  { key: 'ft_pct', label: 'Free Throw %', isPercent: true },
  { key: 'mentions', label: 'Mentions', isPercent: false },
  { key: 'minutes', label: 'Minutes', isPercent: false },
];


const CustomTooltip = ({ active, payload, selectedMetric }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const metricPayload = payload.find(p => p.dataKey === selectedMetric.key);
    
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-white shadow-xl min-w-[160px]">
        {/* Header: Teams & Date */}
        <div className="mb-2">
          <p className="font-bold text-sm text-white">
                {data.away} @ {data.home}
            </p>
            <p className="font-bold text-sm text-white">
                {data.dateStr}
            </p>
        </div>

        <hr className="border-slate-700 my-2" />
        
        {/* Core Metrics */}
        <div className="space-y-1 mb-2">
            <p className="text-yellow-500 font-bold text-sm">
                Sentiment: {data.sentiment?.toFixed(2)}
            </p>
            <p className="text-[#38bdf8] font-bold text-sm">
                {selectedMetric.label}: {metricPayload?.value != null ? Number(metricPayload.value).toFixed(1) : 'N/A'}
            </p>
        </div>

        {/* Shooting Splits Context (Conditional) */}
        {(selectedMetric.key === 'fg_pct' || selectedMetric.key === 'efg') && (
            <p className="text-slate-500 text-xs mb-1">
                Shooting: <span className="text-slate-300">{data.fgm}/{data.fga}</span>
            </p>
        )}
        {selectedMetric.key === 'fg3_pct' && (
            <p className="text-slate-500 text-xs mb-1">
                3PT: <span className="text-slate-300">{data.fg3m}/{data.fg3a}</span>
            </p>
        )}

        {/* Footer: Mentions & Minutes (Slate Color) */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800 mt-2">
            <span className="text-slate-400 text-xs">
                {data.minutes} mins
            </span>
            <span className="text-slate-400 text-xs">
                {data.mentions} mentions
            </span>
        </div>
      </div>
    );
  }
  return null;
};


const getStatColor = (key, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "text-slate-400";

    switch (key) {
      case 'ts': return num >= 60.0 ? "text-emerald-400" : num < 54.0 ? "text-rose-400" : "text-slate-400";
      case 'efg': return num >= 56.0 ? "text-emerald-400" : num < 50.0 ? "text-rose-400" : "text-slate-400";
      case 'fg_pct': return num >= 50.0 ? "text-emerald-400" : num < 40.0 ? "text-rose-400" : "text-slate-400";
      case 'fg3_pct': return num >= 38.0 ? "text-emerald-400" : num < 33.0 ? "text-rose-400" : "text-slate-400";
      case 'plusminus': return num > 0 ? "text-emerald-400" : num < 0 ? "text-rose-400" : "text-slate-400";
      default: return "text-white";
    }
  };

const StatRow = ({ label, value, colorClass = "text-white" }) => (
    <div className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 py-2">
        <span className="text-slate-400 font-medium">{label}</span> 
        <span className={`font-mono font-bold ${colorClass}`}>{value}</span>
    </div>
);

const ClickableActiveDot = (props) => {
  const { cx, cy, stroke, payload, onGameSelect } = props;
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={8} 
      fill={stroke} 
      stroke="white"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onGameSelect && payload.PK) {
           onGameSelect(payload.PK);
        }
      }}
    />
  );
};

export default function PlayerView({ onGameSelect, games = [], initialPlayer }) {
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayer || "Nikola Jokic");
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
  const [playerData, setPlayerData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPlayer) {
      setSelectedPlayer(initialPlayer);
    }
  }, [initialPlayer]);

  useEffect(() => {
    async function fetchHistory() {
        setLoading(true);
        try {
            const result = await client.graphql({
                query: getPlayerHistory,
                variables: { player_name: selectedPlayer, limit: 82 }
            });
            
            const rawItems = result.data.getPlayerHistory || [];
            const sortedItems = rawItems.sort((a, b) => new Date(a.date) - new Date(b.date));

            const processed = sortedItems.map(item => {
                const d = { ...item };

                const fga = d.fga || 0;
                const fgm = d.fgm || 0;
                const fg3a = d.fg3a || 0;
                const fg3m = d.fg3m || 0;
                const fta = d.fta || 0;
                const ftm = d.ftm || 0;
                const points = d.points || 0;

                d.fg_pct = fga > 0 ? (fgm / fga) * 100 : 0;
                d.fg3_pct = fg3a > 0 ? (fg3m / fg3a) * 100 : 0;
                d.ft_pct = fta > 0 ? (ftm / fta) * 100 : 0;

                // TS% = Pts / (2 * (FGA + 0.44 * FTA))
                const tsDivisor = 2 * (fga + (0.44 * fta));
                d.ts = tsDivisor > 0 ? (points / tsDivisor) * 100 : 0;

                // eFG% = (FGM + 0.5 * 3PM) / FGA
                d.efg = fga > 0 ? ((fgm + (0.5 * fg3m)) / fga) * 100 : 0;

                d.dateStr = new Date(d.date).toLocaleDateString(undefined, {month:'short', day:'numeric'});

                const meta = games.find(g => g.PK === item.PK);

                if (meta) {
                    d.home = meta.home;
                    d.away = meta.away;
                }
                return d;
            });

            setPlayerData(processed);
        } catch (err) {
            console.error("Error fetching player history:", err);
            setPlayerData([]);
        } finally {
            setLoading(false);
        }
    }
    fetchHistory();
  }, [selectedPlayer, games]);

  // Season Totals & Averages
  const stats = useMemo(() => {
    if (!playerData.length) return null;

    const totals = playerData.reduce((acc, game) => {
        acc.mentions += (game.mentions || 0);
        if (game.sentiment != null) acc.sentiments.push(game.sentiment);

        const minutes = parseFloat(game.minutes || 0);
        
        if (minutes > 0) {
            acc.gamesPlayed += 1; // Only increment games played if minutes > 0
            acc.mins += minutes;
            
            acc.points += (game.points || 0);
            acc.assists += (game.assists || 0);
            acc.rebounds += (game.rebounds || 0);
            acc.steals += (game.steals || 0);
            acc.blocks += (game.blocks || 0);
            acc.plusminus += (game.plusminus || 0);
            
            acc.fga += (game.fga || 0);
            acc.fgm += (game.fgm || 0);
            acc.fg3a += (game.fg3a || 0);
            acc.fg3m += (game.fg3m || 0);
            acc.fta += (game.fta || 0);
            acc.ftm += (game.ftm || 0);
        }
        
        return acc;
    }, { 
        gamesPlayed: 0, mentions: 0, mins: 0, points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, plusminus: 0,
        fga: 0, fgm: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, sentiments: []
    });

    // Prevent divide by zero if a player has 0 games played
    const gp = totals.gamesPlayed || 1;

    const getAvg = (num) => (num / gp).toFixed(1);
    
    const fg_pct = totals.fga > 0 ? (totals.fgm / totals.fga) * 100 : 0;
    const fg3_pct = totals.fg3a > 0 ? (totals.fg3m / totals.fg3a) * 100 : 0;
    
    // eFG% = (FGM + 0.5 * 3PM) / FGA
    const efg_val = totals.fga > 0 ? ((totals.fgm + (0.5 * totals.fg3m)) / totals.fga) * 100 : 0;
    
    // TS% = PTS / (2 * (FGA + 0.44 * FTA))
    const ts_denom = 2 * (totals.fga + (0.44 * totals.fta));
    const ts_val = ts_denom > 0 ? (totals.points / ts_denom) * 100 : 0;

    // Avg Sentiment
    const avgSent = totals.sentiments.length > 0 
        ? (totals.sentiments.reduce((a,b)=>a+b, 0) / totals.sentiments.length).toFixed(2) 
        : "0.00";

    return {
      avgSentiment: avgSent,
      totalMentions: totals.mentions,
      totalMins: Math.round(totals.mins),
      gamesPlayed: totals.gamesPlayed,
      
      points: getAvg(totals.points),
      assists: getAvg(totals.assists),
      rebounds: getAvg(totals.rebounds),
      steals: getAvg(totals.steals),
      blocks: getAvg(totals.blocks),
      plusminus: (totals.plusminus / gp).toFixed(1),

      fg_pct: fg_pct.toFixed(1),
      fg3_pct: fg3_pct.toFixed(1),
      efg: efg_val.toFixed(1),
      ts: ts_val.toFixed(1)
    };
  }, [playerData]);
  
  return (
    <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Roster Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {roster.map(player => (
          <button
            key={player}
            onClick={() => setSelectedPlayer(player)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedPlayer === player 
                ? "bg-yellow-500 text-blue-900 scale-105 shadow-lg" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {player}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SUMMARY CARD */}
        <div className="bg-sky-500/10 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm h-fit">
          <h3 className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Season Summary</h3>
          <h1 className="text-3xl font-black italic text-white uppercase leading-none mb-6">
            {selectedPlayer}
          </h1>
          
          {loading || !stats ? (
             <div className="text-slate-500 italic text-sm">Loading Stats...</div>
          ) : (
            <div className="space-y-6">
               {/* High Level */}
               <div className="grid grid-cols-4 gap-2 pb-4 border-b border-white/5 text-center">
                  <div>
                      <div className="text-slate-500 text-[9px] uppercase font-bold">Avg Sentiment</div>
                      <div className="text-white font-mono font-bold text-xl">{stats.avgSentiment}</div>
                  </div>
                  <div>
                      <div className="text-slate-500 text-[9px] uppercase font-bold">Games</div>
                      <div className="text-white font-mono font-bold text-xl">{stats.gamesPlayed}</div>
                  </div>
                  <div>
                      <div className="text-slate-500 text-[9px] uppercase font-bold">Minutes</div>
                      <div className="text-white font-mono font-bold text-xl">{stats.totalMins}</div>
                  </div>
                  <div>
                      <div className="text-slate-500 text-[9px] uppercase font-bold">Mentions</div>
                      <div className="text-white font-mono font-bold text-xl">{stats.totalMentions}</div>
                  </div>
               </div>

               {/* Average Performance */}
               <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Season Averages</div>
                  <StatRow label="Points" value={stats.points} />
                  <StatRow label="Rebounds" value={stats.rebounds} />
                  <StatRow label="Assists" value={stats.assists} />
                  <StatRow label="Steals" value={stats.steals} />
                  <StatRow label="Blocks" value={stats.blocks} />
                  <StatRow label="Plus/Minus" value={stats.plusminus > 0 ? `+${stats.plusminus}` : stats.plusminus} colorClass={getStatColor('plusminus', stats.plusminus)} />
                  
                  <div className="h-4"></div> {/* spacer */}
                  
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Efficiency</div>
                  <StatRow label="Field Goal %" value={`${stats.fg_pct}%`} colorClass={getStatColor('fg_pct', stats.fg_pct)} />
                  <StatRow label="3-Point %" value={`${stats.fg3_pct}%`} colorClass={getStatColor('fg3_pct', stats.fg3_pct)} />
                  <StatRow label="eFG %" value={`${stats.efg}%`} colorClass={getStatColor('efg', stats.efg)} />
                  <StatRow label="True Shooting %" value={`${stats.ts}%`} colorClass={getStatColor('ts', stats.ts)} />
               </div>
            </div>
          )}
        </div>
        
        {/* CHART AREA */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm flex flex-col min-h-[450px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text font-bold uppercase tracking flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  <span className="flex gap-2 text-sm">
                    <span className="text-yellow-500">Sentiment</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-[#38bdf8]">{selectedMetric.label}</span>
                  </span>
                </h3>
                
                <div className="flex flex-wrap gap-1">
                    {METRICS.map(metric => (
                        <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                selectedMetric.key === metric.key
                                ? "bg-[#38bdf8] text-slate-900 border-[#38bdf8]"
                                : "bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>

          {playerData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" className="flex-1">
              <LineChart
                data={playerData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                style={{ cursor: 'pointer' }}
              >
                
                <XAxis 
                    dataKey="dateStr"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval="preserveStartEnd"
                />
                
                <YAxis 
                    orientation="left"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    domain={['auto', 'auto']}
                />

                <Tooltip 
                  content={<CustomTooltip selectedMetric={selectedMetric} />} 
                  wrapperStyle={{ outline: 'none', pointerEvents: 'none' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric.key}
                  name={selectedMetric.label}
                  stroke="#38bdf8" 
                  strokeWidth={3} 
                  activeDot={<ClickableActiveDot onGameSelect={onGameSelect} />} 
                  dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
              />

                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
                  name="Fan Sentiment"
                  stroke="#eab308" 
                  strokeWidth={3} 
                  activeDot={<ClickableActiveDot onGameSelect={onGameSelect} />}
                  dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 italic">
              {loading ? "Loading data..." : `No games found for ${selectedPlayer}`}
            </div>
          )}
        </div>
      </div>
      <About />
    </div>
  );
}