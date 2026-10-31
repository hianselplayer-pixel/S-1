/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Wrench, Sparkles, RefreshCw, Zap, Shield, ChevronRight } from 'lucide-react';
import { MetaUpgrades } from '../types/game';

interface TitleMenuProps {
  onStartGame: () => void;
  onOpenGacha: () => void;
  onOpenHangar: () => void;
  onOpenCodex: () => void;
  scrapCount: number;
  combatPower: number;
  equippedAvatarName: string;
  equippedAvatarColor: string;
  equippedTalismansCount: number;
  meta: MetaUpgrades;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onStartGame,
  onOpenGacha,
  onOpenHangar,
  onOpenCodex,
  scrapCount,
  combatPower,
  equippedAvatarName,
  equippedAvatarColor,
  equippedTalismansCount,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-53px)] flex flex-col items-center justify-center p-6 bg-slate-950 overflow-hidden select-none">
      {/* Dynamic cosmic glow backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/25 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Streamlined Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-xs font-mono text-cyan-400 mb-4 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>CYBER SERPENT · 3D ROGUE DEFENSE</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-2">
          貪食蛇防衛者
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          蛇尾錨定於中央反應爐，化身守護衛士！肉身阻攔敵軍彈幕，全螢幕吸取經驗，迎戰 10 層血量幾何巨型首領！
        </p>

        {/* Streamlined Live Combat Loadout Card */}
        <div className="w-full p-4 mb-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3.5 text-left">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-md"
              style={{
                borderColor: equippedAvatarColor,
                backgroundColor: equippedAvatarColor + '20',
              }}
            >
              <Zap className="w-6 h-6" style={{ color: equippedAvatarColor }} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                當前出擊裝甲
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{equippedAvatarName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  {equippedTalismansCount}/3 護符
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase">綜合戰力 CP</span>
            <span className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
              {combatPower}
            </span>
          </div>
        </div>

        {/* 3 Core Streamlined Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-md">
          {/* 1. Primary Play Button */}
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>啟動出擊 · 守衛反應爐</span>
          </button>

          {/* 2. Gacha & Armory */}
          <button
            onClick={onOpenGacha}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>量子軍備庫 · 輪盤抽獎</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{scrapCount} 零件</span>
              <ChevronRight className="w-4 h-4 text-slate-500 ml-1" />
            </div>
          </button>

          {/* 3. Tech Tree & Hangar */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenHangar}
              className="py-3 px-4 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>機庫科技</span>
            </button>

            <button
              onClick={onOpenCodex}
              className="py-3 px-4 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>幾何情報</span>
            </button>
          </div>
        </div>

        {/* Streamlined Controls Footer */}
        <div className="mt-8 text-xs text-slate-500 flex items-center gap-2 font-mono">
          <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">WASD</kbd> 轉向</span>
          <span>·</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">空白鍵</kbd> 衝刺</span>
          <span>·</span>
          <span>觸控虛擬搖桿</span>
        </div>
      </div>
    </div>
  );
};
