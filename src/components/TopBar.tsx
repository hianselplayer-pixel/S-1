/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Pause, Play, Sparkles } from 'lucide-react';
import { GameState } from '../types/game';

interface TopBarProps {
  gameState: GameState;
  onNavigate: (state: GameState) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  scrapCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  gameState,
  onNavigate,
  isMuted,
  onToggleMute,
  isPaused,
  onTogglePause,
  scrapCount,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 select-none z-30">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onNavigate('TITLE_MENU')}
        className="text-left group cursor-pointer"
      >
        <span className="text-base sm:text-lg font-bold tracking-wider text-slate-100 group-hover:text-cyan-400 transition-colors uppercase font-mono">
          SERPENT VANGUARD
        </span>
      </button>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavigate(gameState === 'TITLE_MENU' ? 'TITLE_MENU' : 'PLAYING')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            gameState === 'PLAYING' || gameState === 'TITLE_MENU' ? 'text-cyan-400' : ''
          }`}
        >
          戰場防衛
        </button>
        <button
          onClick={() => onNavigate('GACHA')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            gameState === 'GACHA' ? 'text-cyan-400' : ''
          }`}
        >
          輪盤軍備
        </button>
        <button
          onClick={() => onNavigate('HANGAR')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            gameState === 'HANGAR' ? 'text-cyan-400' : ''
          }`}
        >
          機庫整備
        </button>
        <button
          onClick={() => onNavigate('CODEX')}
          className={`hover:text-slate-100 transition-colors cursor-pointer ${
            gameState === 'CODEX' ? 'text-cyan-400' : ''
          }`}
        >
          戰術情報庫
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="tabular-nums font-semibold">{scrapCount}</span>
          <span className="text-slate-500 text-[10px]">零件</span>
        </div>

        {gameState === 'PLAYING' && (
          <button
            onClick={onTogglePause}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
            title={isPaused ? '繼續遊戲' : '暫停遊戲'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={onToggleMute}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
          title={isMuted ? '開啟音效' : '靜音'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
