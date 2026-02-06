import React, { useState, useEffect } from 'react';

import { generateClient } from 'aws-amplify/api';
import { listGames } from './graphql/queries';

import { LayoutDashboard, ChartBarDecreasing, Users, Calendar } from 'lucide-react';
import Sidebar from './components/GamesSidebar';
import SeasonDashboard from './components/SeasonDashboard';
import PlayerView from './components/PlayerView';
import GameView from './components/GameView';

const client = generateClient();

export default function App() {
  const [view, setView] = useState('games');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);

  const handlePlayerNavigation = (playerName) => {
    setTargetPlayer(playerName);
    setView('players');
  };
  
  const handleGameNavigation = (gamePK) => {
    const targetGame = games.find(g => g.PK === gamePK);
    if (targetGame) {
      setSelectedGame(targetGame);
      setView('games');
    } else {
      console.warn("Game not found in local cache:", gamePK);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await client.graphql({
          query: listGames
        });
        
        const sortedGames = gameData.data.listGames.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
      );
      
      setGames(sortedGames);
      
      // Auto-select most recent game
      if (sortedGames.length > 0) {
        setSelectedGame(sortedGames[0]);
      }
      
    } catch (err) {
      console.error("Critical API Error:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* Navigation Sidebar */}
      <nav className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4">
        <h1 className="hidden lg:block text-2xl font-black italic mb-6 text-yellow-500">
          DENVER NUGGETS
        </h1>
        
        <NavButton active={view === 'season'} onClick={() => setView('season')} icon={<ChartBarDecreasing />} label="Season" />
        <NavButton active={view === 'players'} onClick={() => setView('players')} icon={<Users />} label="Players" />
        <NavButton active={view === 'games'} onClick={() => setView('games')} icon={<Calendar />} label="Games" />
      </nav>

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {view === 'season' && (
          <SeasonDashboard games={games} />
        )}

        {view === 'games' && (
          <div className="flex gap-8 h-full">
            <Sidebar 
                games={games} 
                onSelect={setSelectedGame} 
                activeId={selectedGame?.PK}
            />
            <GameView
              selectedGame={selectedGame}
              onPlayerSelect={handlePlayerNavigation}
            />
          </div>
        )}

        {view === 'players' && (
          <PlayerView
            playerName="Nikola Jokić"
            initialPlayer={targetPlayer}
            onGameSelect={handleGameNavigation}
            games={games}
          />
        )}
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
      active ? 'bg-blue-600 text-yellow-400' : 'hover:bg-slate-800 text-slate-400'
    }`}
  >
    {icon} <span className="hidden lg:block font-bold">{label}</span>
  </button>
);