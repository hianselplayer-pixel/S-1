/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Wrench, Trophy, Skull } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  victory: boolean;
  stats: GameStats;
  scrapsEarned: number;
  onRestart: () => void;
  onOpenHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  stats,
  scrapsEarned,
  onRestart,
  onOpenHangar,
}) => {
  useEffect(() => {
    if (victory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if not supported
      }
    }
  }, [victory]);

  const mins = Math.floor(stats.timeSurvived / 60);
  const secs = Math.floor(stats.timeSurvived % 60);
  const timeFormatted = `${mins} 分 ${secs} 秒`;

  // Sort weapons by damage
  const weaponEntries = Object.entries(stats.weaponDamage).sort((a, b) => b[1] - a[1]);
  const totalDmg = Math.max(1, stats.damageDealt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`p-3.5 rounded-2xl mb-3 ${
              victory
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {victory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {victory ? '防衛作戰大捷 · 泰坦母體覆滅' : '反應爐核心淪陷 · 作戰終止'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {victory
              ? '巨蛇成功抵禦所有入侵蟲潮，普羅米修斯反應爐運行穩定！'
              : '機體或中央核心受損過度，殘存零件已回收至機庫整備系統。'}
          </p>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-500 font-medium">防守波次</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
              {stats.wavesCleared} 波
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-500 font-medium">殲滅敵軍</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
              {stats.kills} 隻
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-500 font-medium">存活時間</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
              {timeFormatted}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
            <div className="text-[11px] text-slate-500 font-medium">環形共振</div>
            <div className="text-lg font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
              {stats.resonantLoopsTriggered} 次
            </div>
          </div>
        </div>

        {/* Weapon Performance Breakdown */}
        {weaponEntries.length > 0 && (
          <div className="mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>戰術武裝輸出統計 (Damage Breakdown)</span>
              <span className="font-mono text-[11px] text-slate-500">
                總傷害: {stats.damageDealt.toLocaleString()}
              </span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {weaponEntries.slice(0, 5).map(([wName, dmg]) => {
                const pct = Math.round((dmg / totalDmg) * 100);
                return (
                  <div key={wName} className="text-xs">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="truncate pr-2 font-medium">{wName}</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {dmg.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scraps Collected Notification */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-300 mb-6 font-mono">
          <span>本局回收可用核心零件：</span>
          <span className="text-sm font-bold text-amber-400 tabular-nums">+{scrapsEarned} 零件</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>立即重啟出擊</span>
          </button>

          <button
            onClick={onOpenHangar}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>前往機庫改裝</span>
          </button>
        </div>
      </div>
    </div>
  );
};
