import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stratagem, Direction, GameStats } from '../types';
import { Icons, THEME } from '../constants';
import { audioService } from '../services/audioService';

interface Props {
  activeStratagems: Stratagem[];
  onStatsUpdate: (stats: GameStats) => void;
  gameActive: boolean;
  isRandomMode: boolean;
  bestTimes: Record<string, number>;
  onUpdateBestTime: (id: string, time: number) => void;
}

export const PracticeArea: React.FC<Props> = ({ 
  activeStratagems, 
  onStatsUpdate, 
  gameActive, 
  isRandomMode,
  bestTimes,
  onUpdateBestTime
}) => {
  const [currentStratagem, setCurrentStratagem] = useState<Stratagem | null>(null);
  
  // State for rendering the UI
  const [inputSequence, setInputSequence] = useState<Direction[]>([]);
  
  // Ref for logic handling (solves stale closure issues with rapid input)
  const inputSequenceRef = useRef<Direction[]>([]);
  
  // Tracking time for the specific stratagem
  const stratagemStartTimeRef = useRef<number | null>(null);
  const [lastTimeTaken, setLastTimeTaken] = useState<number | null>(null);

  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'none' | 'success' | 'fail'>('none');
  
  // Stats refs to avoid re-render loops on rapid updates
  const statsRef = useRef<GameStats>({
    correctInputs: 0,
    totalInputs: 0,
    completedStratagems: 0,
    failedStratagems: 0,
    startTime: null,
    endTime: null,
  });

  const generateRandomStratagem = () => {
    const length = Math.floor(Math.random() * 5) + 6; // 6 to 10 length
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const code: Direction[] = [];
    for (let i = 0; i < length; i++) {
      code.push(directions[Math.floor(Math.random() * directions.length)]);
    }
    return {
      id: 'random_' + Date.now(),
      name: '加密上传序列', // Encrypted Upload Sequence
      type: 'Mission' as const,
      code: code
    };
  };

  const pickNewStratagem = useCallback(() => {
    if (!isRandomMode && activeStratagems.length === 0) {
      setCurrentStratagem(null);
      return;
    }

    let nextStrat: Stratagem;
    if (isRandomMode) {
      nextStrat = generateRandomStratagem();
    } else {
      const randomIndex = Math.floor(Math.random() * activeStratagems.length);
      nextStrat = activeStratagems[randomIndex];
    }
    
    setCurrentStratagem(nextStrat);
    
    // Reset sequence in both State and Ref
    setInputSequence([]);
    inputSequenceRef.current = [];
    
    // Start timing for this specific stratagem
    stratagemStartTimeRef.current = Date.now();
    setLastTimeTaken(null);
  }, [activeStratagems, isRandomMode]);

  // Game Start/Stop Logic
  useEffect(() => {
    if (gameActive) {
      // Reset Stats
      statsRef.current = {
        correctInputs: 0,
        totalInputs: 0,
        completedStratagems: 0,
        failedStratagems: 0,
        startTime: Date.now(),
        endTime: null,
      };
      // Reset Ref
      inputSequenceRef.current = [];
      pickNewStratagem();
    } else {
      setCurrentStratagem(null);
      setInputSequence([]);
      inputSequenceRef.current = [];
      setLastTimeTaken(null);
      // Final stats push
      if (statsRef.current.startTime) {
        statsRef.current.endTime = Date.now();
        onStatsUpdate({ ...statsRef.current });
      }
    }
  }, [gameActive, pickNewStratagem, onStatsUpdate]);

  const handleInput = useCallback((dir: Direction) => {
    // Block input if game inactive, no stratagem, or during success animation
    if (!gameActive || !currentStratagem || flash === 'success') return;

    // Use REF for logic to ensure we always have the latest sequence
    const currentSeq = inputSequenceRef.current;
    const targetDir = currentStratagem.code[currentSeq.length];

    statsRef.current.totalInputs++;

    if (dir === targetDir) {
      // Correct Input
      audioService.playInput();
      
      currentSeq.push(dir);
      // Update Ref immediately for next input
      inputSequenceRef.current = currentSeq;
      // Update State for UI
      setInputSequence([...currentSeq]);
      
      statsRef.current.correctInputs++;

      // Check Completion
      if (currentSeq.length === currentStratagem.code.length) {
        setFlash('success');
        audioService.playSuccess();
        statsRef.current.completedStratagems++;
        
        // Calculate Time
        if (stratagemStartTimeRef.current) {
          const timeTaken = Date.now() - stratagemStartTimeRef.current;
          setLastTimeTaken(timeTaken);
          
          // Update Best Time if not random mode (Random mode isn't consistent enough for high scores)
          if (!isRandomMode) {
             onUpdateBestTime(currentStratagem.id, timeTaken);
          }
        }

        // Small delay before next one
        setTimeout(() => {
          setFlash('none');
          pickNewStratagem();
        }, 200);
      }
    } else {
      // Wrong Input
      statsRef.current.failedStratagems++;
      setShake(true);
      setFlash('fail');
      audioService.playError();
      
      // Reset Sequence
      inputSequenceRef.current = [];
      setInputSequence([]); 
      
      setTimeout(() => {
        setShake(false);
        setFlash('none');
      }, 400);
    }
    
    // Update live stats for UI
    onStatsUpdate({ ...statsRef.current });

  }, [gameActive, currentStratagem, flash, pickNewStratagem, onStatsUpdate, isRandomMode, onUpdateBestTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive) return;
      if (e.repeat) return; // Prevent holding down key triggering multiple inputs
      
      let dir: Direction | null = null;
      
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          dir = 'UP';
          break;
        case 'KeyS':
        case 'ArrowDown':
          dir = 'DOWN';
          break;
        case 'KeyA':
        case 'ArrowLeft':
          dir = 'LEFT';
          break;
        case 'KeyD':
        case 'ArrowRight':
          dir = 'RIGHT';
          break;
      }

      if (dir) {
        e.preventDefault(); // Prevent scrolling for arrow keys
        handleInput(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, handleInput]);

  if (!gameActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
        <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-2 border-yellow-400 flex items-center justify-center animate-pulse">
          <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />
          </svg>
        </div>
        <div>
           <h1 className="text-4xl font-black text-yellow-400 uppercase tracking-widest mb-2">Stratagem Hero</h1>
           <p className="text-gray-400 max-w-md mx-auto">
             从左侧选择支援指令。<br/>按 <span className="text-yellow-400 font-bold">START</span> 开始模拟。<br/>
             使用 WASD 或方向键输入代码。
           </p>
        </div>
      </div>
    );
  }

  const bestTime = currentStratagem && !isRandomMode ? bestTimes[currentStratagem.id] : null;

  return (
    <div className={`relative flex flex-col items-center justify-center h-full w-full overflow-hidden transition-colors duration-100
      ${flash === 'success' ? 'bg-green-900/20' : flash === 'fail' ? 'bg-red-900/20' : ''}
    `}>
      {/* Target Reticle / HUD */}
      <div className={`relative z-10 p-12 border-4 border-yellow-500/50 bg-black/80 backdrop-blur-sm rounded-lg shadow-[0_0_50px_rgba(255,230,0,0.1)]
         transition-transform duration-100 flex flex-col items-center
         ${shake ? 'translate-x-[-5px] rotate-[-1deg]' : ''}
      `}>
        {/* Stratagem Name */}
        <div className="absolute -top-6 left-0 right-0 text-center">
          <span className={`px-4 py-1 text-lg uppercase tracking-wider transform -skew-x-12 inline-block font-bold
             ${isRandomMode ? 'bg-red-500 text-black' : 'bg-yellow-400 text-black'}
          `}>
            {currentStratagem?.name || "准备中..."}
          </span>
        </div>

        {/* Time Stats Overlay */}
        <div className="absolute top-2 right-4 text-xs font-mono text-right opacity-80">
          {bestTime && (
            <div className="text-yellow-200">
               BEST: {(bestTime / 1000).toFixed(2)}s
            </div>
          )}
          {lastTimeTaken && (
            <div className="text-green-400 animate-pulse">
               LAST: {(lastTimeTaken / 1000).toFixed(2)}s
            </div>
          )}
        </div>

        {/* The Arrow Sequence */}
        <div className="flex items-center space-x-4 mt-6">
          {currentStratagem?.code.map((dir, idx) => {
            const isCompleted = idx < inputSequence.length;
            const isCurrent = idx === inputSequence.length;
            
            let IconComp = Icons.ArrowUp;
            if (dir === 'DOWN') IconComp = Icons.ArrowDown;
            if (dir === 'LEFT') IconComp = Icons.ArrowLeft;
            if (dir === 'RIGHT') IconComp = Icons.ArrowRight;

            return (
              <div 
                key={idx}
                className={`
                  relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-all duration-75
                  ${isCompleted ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(255,230,0,0.8)]' : 'text-gray-600'}
                  ${isCurrent && !shake ? 'scale-125 text-white animate-pulse' : ''}
                  ${shake && isCurrent ? 'text-red-500' : ''}
                `}
              >
                <IconComp className="w-full h-full" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructional / Flavor text */}
      <div className="absolute bottom-10 text-yellow-500/40 font-mono text-sm tracking-[0.5em] uppercase">
        {isRandomMode ? "破解加密序列" : "等待输入指令"}
      </div>
    </div>
  );
};
