import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listGames } from './graphql/queries';

// 1. Import the Menu icon for the toggle button
import { LayoutDashboard, ChartBarDecreasing, Users, Calendar, Menu } from 'lucide-react';

import Sidebar from './components/GamesSidebar';
import SeasonDashboard from './components/SeasonDashboard';
import PlayerView from './components/PlayerView';
import GameView from './components/GameView';

const client = generateClient();

export default function App() {
  const [view, setView] = useState('players');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  
  // 2. Add state to control sidebar expansion (defaulting to true)
  const [isExpanded, setIsExpanded] = useState(true);

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
        const gameData = await client.graphql({ query: listGames });
        const sortedGames = gameData.data.listGames.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        setGames(sortedGames);
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

      {/* Side Bar */}
      <nav className={`
          bg-slate-900 border-r border-slate-800 flex flex-col gap-4 
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-20'} /* Controls the width */
      `}>
          <div className="flex items-center p-4 h-20 overflow-hidden">
              <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors min-w-[40px]"
              >
                  <Menu size={24} />
              </button>

              <div className={`
                  whitespace-nowrap overflow-hidden transition-all duration-300
                  ${isExpanded ? 'w-40 opacity-100 ml-3' : 'w-0 opacity-0 ml-0'} 
              `}>
                  <h1 className="text-xl font-black italic text-yellow-500 leading-none">
                      DENVER
                  </h1>
                  <h1 className="text-xl font-black italic text-white leading-none">
                      NUGGETS
                  </h1>
              </div>
          </div>
          
          {/* Navigation Items */}
          <div className="px-2 flex flex-col gap-2">
              <NavButton 
                  active={view === 'season'} 
                  onClick={() => setView('season')} 
                  icon={<ChartBarDecreasing />} 
                  label="Season" 
                  expanded={isExpanded}
              />
              <NavButton 
                  active={view === 'players'} 
                  onClick={() => setView('players')} 
                  icon={<Users />} 
                  label="Players" 
                  expanded={isExpanded}
              />
              <NavButton 
                  active={view === 'games'} 
                  onClick={() => setView('games')} 
                  icon={<Calendar />} 
                  label="Games" 
                  expanded={isExpanded}
              />
          </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-8">
        {view === 'season' && <SeasonDashboard games={games} />}

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
            playerName="Nikola Jokic"
            initialPlayer={targetPlayer}
            onGameSelect={handleGameNavigation}
            games={games}
          />
        )}
      </main>
    </div>
  );
}

// 5. Update NavButton to handle expanded state
const NavButton = ({ active, onClick, icon, label, expanded }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-xl transition-all overflow-hidden whitespace-nowrap ${
      active ? 'bg-blue-600 text-yellow-400' : 'hover:bg-slate-800 text-slate-400'
    }`}
    title={!expanded ? label : ''} // Show tooltip when collapsed
  >
    <div className="min-w-[24px]">{icon}</div> {/* Ensure icon doesn't shrink */}
    
    <span className={`font-bold transition-all duration-300 ${
        expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
    }`}>
        {label}
    </span>
  </button>
);