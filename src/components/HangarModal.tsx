/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Play, Shield, Compass, Zap, Sparkles, Plus, FastForward, HeartPulse } from 'lucide-react';
import { MetaUpgrades } from '../types/game';

interface HangarModalProps {
  meta: MetaUpgrades;
  scrapCount: number;
  onUpgrade: (key: keyof MetaUpgrades, cost: number) => void;
  onReset: () => void;
  onStartGame: () => void;
  onBackToMenu: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  meta,
  scrapCount,
  onUpgrade,
  onReset,
  onStartGame,
  onBackToMenu,
}) => {
  const getCost = (level: number, baseCost: number = 10, mult: number = 1.4) => {
    return Math.round(baseCost * Math.pow(mult, level));
  };

  const items = [
    {
      key: 'maxHpLevel' as const,
      name: '巨蛇裝甲合金',
      desc: '永久提升巨蛇初始最大生命值 (+35 HP / 級)',
      level: meta.maxHpLevel,
      maxLevel: 10,
      cost: getCost(meta.maxHpLevel, 10, 1.35),
      icon: <HeartPulse className="w-5 h-5 text-emerald-400" />,
      benefit: `當前生命 +${meta.maxHpLevel * 35} HP`,
    },
    {
      key: 'startingLength' as const,
      name: '初始身軀節段',
      desc: '每局遊戲開始時即獲得更多武裝節段 (+1 節 / 級)',
      level: meta.startingLength,
      maxLevel: 5,
      cost: getCost(meta.startingLength, 25, 1.6),
      icon: <Plus className="w-5 h-5 text-cyan-400" />,
      benefit: `初始擁有 ${3 + meta.startingLength} 節武裝`,
    },
    {
      key: 'magnetLevel' as const,
      name: '高導磁場增幅器',
      desc: '永久擴大吸引能量核心與零件的磁吸半徑 (+45 px / 級)',
      level: meta.magnetLevel,
      maxLevel: 8,
      cost: getCost(meta.magnetLevel, 12, 1.3),
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      benefit: `磁吸半徑 +${meta.magnetLevel * 45} px`,
    },
    {
      key: 'ramDamageLevel' as const,
      name: '重型動能破城角',
      desc: '提升蛇頭衝撞敵人的撞擊破壞力 (+18 傷害 / 級)',
      level: meta.ramDamageLevel,
      maxLevel: 10,
      cost: getCost(meta.ramDamageLevel, 15, 1.35),
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      benefit: `撞擊傷害 +${meta.ramDamageLevel * 18}`,
    },
    {
      key: 'dashCooldownLevel' as const,
      name: '渦輪推進閥減壓',
      desc: '縮減渦輪衝刺技能冷卻時間 (-0.45 秒 / 級)',
      level: meta.dashCooldownLevel,
      maxLevel: 5,
      cost: getCost(meta.dashCooldownLevel, 20, 1.5),
      icon: <FastForward className="w-5 h-5 text-sky-400" />,
      benefit: `冷卻縮短 -${(meta.dashCooldownLevel * 0.45).toFixed(2)} 秒`,
    },
    {
      key: 'scrapMultiplierLevel' as const,
      name: '資源高效採集協議',
      desc: '敵軍掉落回收零件的機率與數量額外提升',
      level: meta.scrapMultiplierLevel,
      maxLevel: 5,
      cost: getCost(meta.scrapMultiplierLevel, 30, 1.6),
      icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
      benefit: `採集加成 +${meta.scrapMultiplierLevel * 20}%`,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-53px)] bg-slate-950 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-1">
              HANGAR SPECIFICATION & ENHANCEMENT
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
              機械蛇機庫 · 永久科技天賦
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              消耗在作戰中回收的核心零件，永久升級巨蛇戰鬥機體與作戰參數。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold tabular-nums text-base">{scrapCount}</span>
              <span className="text-slate-400 text-xs">可用零件</span>
            </div>

            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              重置天賦
            </button>
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {items.map((item) => {
            const isMax = item.level >= item.maxLevel;
            const canAfford = scrapCount >= item.cost && !isMax;

            return (
              <div
                key={item.key}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{item.name}</h3>
                        <div className="text-[11px] text-cyan-400 font-mono">{item.benefit}</div>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      Lv. <span className="text-slate-200 font-bold">{item.level}</span> / {item.maxLevel}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono">
                    {isMax ? (
                      <span className="text-emerald-400 font-semibold">已研發至上限</span>
                    ) : (
                      <span className="text-slate-400">
                        消耗：
                        <span className={`font-bold tabular-nums ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                          {item.cost} 零件
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onUpgrade(item.key, item.cost)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                    }`}
                  >
                    <span>研發升級</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主選單</span>
          </button>

          <button
            onClick={onStartGame}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>機體就緒 · 投入戰場</span>
          </button>
        </div>
      </div>
    </div>
  );
};
