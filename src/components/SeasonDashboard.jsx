import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listSeasonStats } from '../graphql/queries'; 

import PlayerSentimentByGame from './PlayerSentimentByGame';
import SentimentLadder from './SentimentLadder';
import AvgSentimentOverTime from './AvgSentimentOverTime';
import PerformanceCorrelation from './Correlation';
import About from './About';
// import AIChat from './AIChat';

const client = generateClient();

export default function SeasonDashboard({ games = [] }) {
  const [sentiments, setSentiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        const result = await client.graphql({
          query: listSeasonStats,
          variables: { limit: 2000 }
        });
        
        const rawData = result.data.listSeasonStats;

        const enrichedData = rawData.map(stat => {
            const gameMeta = games.find(g => g.PK === stat.PK);
            return {
                ...stat,
                home: gameMeta?.home,
                away: gameMeta?.away,
                game_date: gameMeta?.date
            };
        });

        enrichedData.sort((a, b) => new Date(a.date) - new Date(b.date));

        setSentiments(enrichedData);
      } catch (err) {
        console.error("Error fetching season stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (games.length > 0) {
        fetchSeasonData();
    }
  }, [games]);

  if (loading || !sentiments.length) {
    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <div className="text-slate-400 animate-pulse font-mono flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                Initializing Dashboard...
            </div>
        </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen p-3 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:grow-[2] lg:min-h-0 lg:basis-0">
        
        {/* Main Scatter/Line Plot */}
        <div className="lg:col-span-2 min-h-[400px] lg:min-h-0 h-full bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative z-0">
          <PlayerSentimentByGame sentiments={sentiments} games={games} />
        </div>
        
        {/* Leaderboard */}
        <div className="lg:col-span-1 min-h-[400px] lg:min-h-0 h-full">
          <SentimentLadder sentiments={sentiments} />
        </div>
      </div>

      {/* BOTTOM ROW: 3/5 + 2/5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:grow lg:min-h-0 lg:basis-0">
        
        {/* Rolling Average Chart */}
        <div className="lg:col-span-3 min-h-[300px] lg:min-h-0 h-full">
            <AvgSentimentOverTime sentiments={sentiments} games={games} />
        </div>

        {/* Scatter Correlation */}
        <div className="lg:col-span-2 min-h-[300px] lg:min-h-0 h-full">
            <PerformanceCorrelation sentiments={sentiments} />
        </div>
      </div>
      
      {/* <AIChat /> */}
      <About/>
    </div>
  );
}