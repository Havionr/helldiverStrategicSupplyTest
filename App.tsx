import React, { useState, useMemo, useCallback } from 'react';
import { StratagemList } from './components/StratagemList';
import { PracticeArea } from './components/PracticeArea';
import { GeminiEvaluation } from './components/GeminiEvaluation';
import { STRATAGEMS } from './constants';
import { GameStats } from './types';

export default function App() {
  const [selectedStratagemIds, setSelectedStratagemIds] = useState<string[]>(
    STRATAGEMS.slice(0, 5).map(s => s.id) // Default select first 5
  );
  
  const [gameActive, setGameActive] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  
  // Track best time (ms) for each stratagem ID
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});

  const [stats, setStats] = useState<GameStats>({
    correctInputs: 0,
    totalInputs: 0,
    completedStratagems: 0,
    failedStratagems: 0,
    startTime: null,
    endTime: null
  });
  
  const [showEvaluation, setShowEvaluation] = useState(false);

  const toggleStratagem = useCallback((id: string) => {
    setSelectedStratagemIds(prev => {
      if (prev.includes(id)) {
        // Prevent deselecting all
        if (prev.length === 1) return prev;
        return prev.filter(pid => pid !== id);
      }
      return [...prev, id];
    });
  }, []);

  const toggleRandomMode = useCallback(() => {
    setIsRandomMode(prev => !prev);
    // If we switch modes, maybe stop game? simpler to just keep going or let user stop.
    // But stopping makes sense to reset state.
    setGameActive(false); 
    setStats(prev => ({ ...prev, startTime: null, endTime: null, completedStratagems: 0 }));
  }, []);

  const handleStartStop = () => {
    if (gameActive) {
      // Stopping
      setGameActive(false);
      setShowEvaluation(true);
    } else {
      // Starting
      setGameActive(true);
      setShowEvaluation(false);
      // Stats reset is handled in PracticeArea effect
    }
  };

  // Memoize this callback so it doesn't trigger re-renders in children when passed down
  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleUpdateBestTime = useCallback((id: string, time: number) => {
    setBestTimes(prev => {
      const currentBest = prev[id];
      if (!currentBest || time < currentBest) {
        return { ...prev, [id]: time };
      }
      return prev;
    });
  }, []);

  const closeEvaluation = () => {
    setShowEvaluation(false);
    // Reset stats visual for cleanliness
    setStats({
      correctInputs: 0,
      totalInputs: 0,
      completedStratagems: 0,
      failedStratagems: 0,
      startTime: null,
      endTime: null
    });
  };

  // Memoize activeStratagems. 
  // CRITICAL FIX: Without useMemo, this creates a new array every render (every keypress updating stats).
  // This new array forces PracticeArea to re-initialize the current stratagem, causing the "skip/reset" bug.
  const activeStratagems = useMemo(() => 
    STRATAGEMS.filter(s => selectedStratagemIds.includes(s.id)),
    [selectedStratagemIds]
  );

  // Calculate live WPM/SPM if game is active
  const elapsed = stats.startTime ? (Date.now() - stats.startTime) / 1000 : 0;
  const spm = elapsed > 0 ? (stats.completedStratagems / (elapsed / 60)).toFixed(1) : "0.0";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F0F0F] text-white overflow-hidden crt font-mono">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-yellow-500/30 bg-black z-20">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
             <span className="text-black font-black text-xl">S</span>
           </div>
           <h1 className="text-yellow-400 font-bold tracking-widest text-xl hidden sm:block">超级地球训练终端</h1>
        </div>
        
        {/* Live Stats Display */}
        <div className="flex gap-6 text-sm">
           <div className="flex flex-col items-end">
             <span className="text-gray-500 text-xs uppercase">完成指令</span>
             <span className="text-yellow-400 font-bold text-xl">{stats.completedStratagems}</span>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-gray-500 text-xs uppercase">速度 (SPM)</span>
             <span className="text-yellow-400 font-bold text-xl">{gameActive ? spm : '--'}</span>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className="w-64 sm:w-80 flex-shrink-0 h-full hidden md:block">
          <StratagemList 
            allStratagems={STRATAGEMS} 
            selectedIds={selectedStratagemIds}
            onToggle={toggleStratagem}
            isRandomMode={isRandomMode}
            onToggleRandomMode={toggleRandomMode}
          />
        </aside>

        {/* Mobile Sidebar Toggle? (Skipping for cleaner desktop focus based on request, but responsive classes added in Main Area) */}
        
        {/* Game Area */}
        <main className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {/* Overlay grid */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black opacity-80 pointer-events-none"></div>
          
          <PracticeArea 
            activeStratagems={activeStratagems}
            onStatsUpdate={handleStatsUpdate}
            gameActive={gameActive}
            isRandomMode={isRandomMode}
            bestTimes={bestTimes}
            onUpdateBestTime={handleUpdateBestTime}
          />

          {/* Action Button Container */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-30">
             <button
                onClick={handleStartStop}
                className={`
                  relative px-12 py-4 font-black text-xl uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95
                  clip-path-button shadow-lg
                  ${gameActive 
                    ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50' 
                    : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-yellow-500/50'}
                `}
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
             >
                {gameActive ? '中止训练' : '启动模拟'}
             </button>
          </div>
        </main>
      </div>

      <GeminiEvaluation 
        stats={stats}
        isOpen={showEvaluation}
        onClose={closeEvaluation}
      />
    </div>
  );
}
