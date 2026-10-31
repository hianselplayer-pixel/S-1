/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RefreshCw, Zap, Shield, Crosshair, Sparkles, HeartPulse, Target } from 'lucide-react';
import { UpgradeOption } from '../types/game';

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
  onReroll: () => void;
  rerollsAvailable: number;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  options,
  onSelect,
  onReroll,
  rerollsAvailable,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && options[0]) onSelect(options[0]);
      if (e.key === '2' && options[1]) onSelect(options[1]);
      if (e.key === '3' && options[2]) onSelect(options[2]);
      if (e.key === 'r' && rerollsAvailable > 0) onReroll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onSelect, onReroll, rerollsAvailable]);

  const getRarityBadge = (rarity: UpgradeOption['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return <span className="text-amber-400 font-bold">傳奇超載 (LEGENDARY)</span>;
      case 'epic':
        return <span className="text-purple-400 font-bold">史詩改造 (EPIC)</span>;
      case 'rare':
        return <span className="text-cyan-400 font-semibold">稀有擴充 (RARE)</span>;
      default:
        return <span className="text-slate-400 font-medium">常規組裝 (COMMON)</span>;
    }
  };

  const getRarityBorder = (rarity: UpgradeOption['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-500/80 bg-amber-950/20 hover:border-amber-400 hover:bg-amber-950/30';
      case 'epic':
        return 'border-purple-500/80 bg-purple-950/20 hover:border-purple-400 hover:bg-purple-950/30';
      case 'rare':
        return 'border-cyan-500/80 bg-cyan-950/20 hover:border-cyan-400 hover:bg-cyan-950/30';
      default:
        return 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800/80';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-indigo-400" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Target': return <Target className="w-5 h-5 text-amber-400" />;
      default: return <Crosshair className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-1">
            REACTOR OVERDRIVE LEVEL UP
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            核心矩陣升級 · 選擇戰術模組
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            吞噬能量核心解鎖武裝改裝。選擇一項擴充巨蛇防禦體系或強化既有砲台。
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`flex flex-col text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer group shadow-xl ${getRarityBorder(
                opt.rarity
              )}`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                {getRarityBadge(opt.rarity)}
                <span className="font-mono text-slate-500 text-xs">[{idx + 1}]</span>
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  {getIcon(opt.icon)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {opt.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">{opt.subtitle}</div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2 flex-grow">
                {opt.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] text-slate-500 font-mono">
                  {opt.category === 'module_add'
                    ? '身軀新增節段'
                    : opt.category === 'module_upgrade'
                    ? '既有模組全強化'
                    : '巨蛇本體改造'}
                </span>
                <span className="text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  選定安裝 →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer actions: Reroll */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={onReroll}
            disabled={rerollsAvailable <= 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
              rerollsAvailable > 0
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重置抽牌卡組</span>
            <span className="font-mono text-slate-400">
              ({rerollsAvailable > 0 ? `剩餘 ${rerollsAvailable} 次` : '耗盡'})
            </span>
            <kbd className="hidden sm:inline px-1 py-0.2 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">[R]</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
