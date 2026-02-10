import React from 'react';
import { Stratagem } from '../types';
import { THEME } from '../constants';

interface Props {
  allStratagems: Stratagem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isRandomMode: boolean;
  onToggleRandomMode: () => void;
}

export const StratagemList: React.FC<Props> = ({ 
  allStratagems, 
  selectedIds, 
  onToggle, 
  isRandomMode, 
  onToggleRandomMode 
}) => {
  return (
    <div className="h-full flex flex-col bg-opacity-80 bg-black border-r-2 border-yellow-500/30">
      <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
        <h2 className="text-xl font-bold text-yellow-400 tracking-widest uppercase">支援指令协议</h2>
        <p className="text-xs text-yellow-600 mt-1">选择激活的战略配备</p>
      </div>

      {/* Random Mode Toggle */}
      <div className="p-3 border-b border-yellow-500/30 bg-yellow-900/10">
        <button
          onClick={onToggleRandomMode}
          className={`w-full flex items-center justify-between p-2 rounded border transition-all ${
            isRandomMode 
              ? 'border-red-500 bg-red-900/30 text-red-400' 
              : 'border-gray-700 bg-black/50 text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="font-bold text-sm uppercase">随机终端模式</span>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${isRandomMode ? 'bg-red-500' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all ${isRandomMode ? 'left-4.5' : 'left-0.5'}`} style={{left: isRandomMode ? 'calc(100% - 14px)' : '2px'}} />
          </div>
        </button>
        {isRandomMode && (
          <p className="text-[10px] text-red-400 mt-1 px-1">
            *警告*：生成完全随机的输入序列。模拟终端黑客入侵。
          </p>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto p-2 space-y-1 transition-opacity duration-300 ${isRandomMode ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
        {allStratagems.map((strat) => {
          const isSelected = selectedIds.includes(strat.id);
          return (
            <button
              key={strat.id}
              onClick={() => onToggle(strat.id)}
              className={`w-full text-left p-3 border transition-all duration-150 group relative overflow-hidden
                ${isSelected 
                  ? 'border-yellow-400 bg-yellow-900/20 text-yellow-400' 
                  : 'border-white/10 text-gray-500 hover:border-yellow-400/50 hover:text-yellow-200'}
              `}
            >
              {/* Selection Indicator */}
              <div className={`absolute top-0 left-0 bottom-0 w-1 transition-colors ${isSelected ? 'bg-yellow-400' : 'bg-transparent'}`} />

              <div className="flex justify-between items-center pl-2">
                <span className="font-mono font-bold uppercase truncate text-sm sm:text-base">{strat.name}</span>
                <span className="text-[10px] opacity-50 border border-current px-1 rounded ml-2 whitespace-nowrap">{strat.type === 'Mission' ? '任务' : strat.type === 'Offensive' ? '攻击' : strat.type === 'Defensive' ? '防御' : '补给'}</span>
              </div>
              
              {/* Code Preview (Mini) */}
              <div className="flex gap-1 mt-1 pl-2 opacity-50 group-hover:opacity-100 transition-opacity">
                 {strat.code.map((d, i) => (
                   <div key={i} className={`w-2 h-2 ${isSelected ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                        style={{
                          clipPath: d === 'UP' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                                    d === 'DOWN' ? 'polygon(0% 0%, 100% 0%, 50% 100%)' :
                                    d === 'LEFT' ? 'polygon(100% 0, 100% 100%, 0 50%)' :
                                    'polygon(0 0, 0 100%, 100% 50%)'
                        }}
                   />
                 ))}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-yellow-500/30 text-center">
         <span className="text-yellow-400 font-bold text-lg">{selectedIds.length}</span>
         <span className="text-gray-500 text-xs ml-2">已选定</span>
      </div>
    </div>
  );
};
