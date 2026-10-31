/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Shield,
  Crosshair,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Box,
  Disc,
  Snowflake,
  Hexagon,
  CheckCircle,
  Plus,
  Radio,
  Star,
} from 'lucide-react';
import { GachaInventory, Rarity, RARITY_CONFIG, SerpentAvatar, Talisman } from '../types/gacha';
import {
  SERPENT_AVATARS,
  TALISMANS,
  calculateCombatPower,
  getCombinedGachaStats,
} from '../game/gachaCatalog';
import { sound } from '../utils/audio';

interface GachaModalProps {
  inventory: GachaInventory;
  scrapCount: number;
  onUpdateInventory: (updater: (prev: GachaInventory) => GachaInventory) => void;
  onDeductScrap: (amount: number) => boolean;
  onAddScrap: (amount: number) => void;
  onClose: () => void;
}

export const GachaModal: React.FC<GachaModalProps> = ({
  inventory,
  scrapCount,
  onUpdateInventory,
  onDeductScrap,
  onAddScrap,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ROLL' | 'ARMORY'>('ROLL');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [reelItems, setReelItems] = useState<Array<{ name: string; rarity: Rarity; isAvatar: boolean }>>([
    { name: 'SV-01 先鋒獵手', rarity: 'SR', isAvatar: true },
    { name: '超立方體共振核心', rarity: 'UR', isAvatar: false },
    { name: '超頻量子線圈', rarity: 'SSR', isAvatar: false },
  ]);
  const [pullResults, setPullResults] = useState<Array<{ item: SerpentAvatar | Talisman; isNew: boolean; level: number }>>([]);

  const rollTimerRef = useRef<number | null>(null);

  const totalCP = calculateCombatPower(inventory);
  const combinedStats = getCombinedGachaStats(inventory);

  const PULL_COST_1X = 50;
  const PULL_COST_10X = 450;
  const MAX_TALISMAN_SLOTS = 6;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) cancelAnimationFrame(rollTimerRef.current);
    };
  }, []);

  const handleRoll = (count: 1 | 10) => {
    const cost = count === 1 ? PULL_COST_1X : PULL_COST_10X;
    if (scrapCount < cost) {
      sound.playHitSound();
      return;
    }
    onDeductScrap(cost);

    setIsRolling(true);
    setPullResults([]);
    sound.playLevelUp();

    const startTime = performance.now();
    const duration = count === 1 ? 2000 : 2800;

    const allAvatars = Object.values(SERPENT_AVATARS);
    const allTalismans = Object.values(TALISMANS);
    const pool = [...allAvatars, ...allTalismans];

    const animateReel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (Math.random() < 0.45) {
        const randItem = pool[Math.floor(Math.random() * pool.length)];
        const isAv = 'skinStyle' in randItem;
        setReelItems((prev) => [
          { name: randItem.name, rarity: randItem.rarity, isAvatar: isAv },
          ...prev.slice(0, 4),
        ]);
      }

      if (progress < 1) {
        rollTimerRef.current = requestAnimationFrame(animateReel);
      } else {
        // Roll drops (UR: 5%, SSR: 20%, SR: 40%, R: 35% -> total 100%)
        const results: Array<{ item: SerpentAvatar | Talisman; isNew: boolean; level: number }> = [];

        onUpdateInventory((prev) => {
          const newOwnedAvatars = new Set(prev.ownedAvatars);
          const newOwnedTalismans = new Set(prev.ownedTalismans);
          const newLevels = { ...prev.talismanLevels };

          for (let i = 0; i < count; i++) {
            const rand = Math.random();
            let chosen: SerpentAvatar | Talisman;

            if (rand < 0.05) {
              // UR (5%)
              const urPool = pool.filter((p) => p.rarity === 'UR');
              chosen = urPool[Math.floor(Math.random() * urPool.length)];
            } else if (rand < 0.25) {
              // SSR (20%)
              const ssrPool = pool.filter((p) => p.rarity === 'SSR');
              chosen = ssrPool[Math.floor(Math.random() * ssrPool.length)];
            } else if (rand < 0.65) {
              // SR (40%)
              const srPool = pool.filter((p) => p.rarity === 'SR');
              chosen = srPool[Math.floor(Math.random() * srPool.length)];
            } else {
              // R (35%)
              const rPool = pool.filter((p) => p.rarity === 'R');
              chosen = rPool[Math.floor(Math.random() * rPool.length)];
            }

            const isAvatar = 'skinStyle' in chosen;
            if (isAvatar) {
              const isNew = !newOwnedAvatars.has(chosen.id);
              newOwnedAvatars.add(chosen.id);
              results.push({ item: chosen, isNew, level: 1 });
            } else {
              const isNew = !newOwnedTalismans.has(chosen.id);
              newOwnedTalismans.add(chosen.id);
              newLevels[chosen.id] = (newLevels[chosen.id] || 0) + 1; // Duplicate upgrade stack!
              results.push({ item: chosen, isNew, level: newLevels[chosen.id] });
            }
          }

          return {
            ...prev,
            ownedAvatars: Array.from(newOwnedAvatars),
            ownedTalismans: Array.from(newOwnedTalismans),
            talismanLevels: newLevels,
            pityCounter: prev.pityCounter + count,
          };
        });

        setIsRolling(false);
        setPullResults(results);
        sound.playBossDeath();
      }
    };

    rollTimerRef.current = requestAnimationFrame(animateReel);
  };

  const handleEquipAvatar = (avatarId: string) => {
    onUpdateInventory((prev) => ({
      ...prev,
      equippedAvatar: avatarId,
    }));
    sound.playPickup();
  };

  const handleToggleTalisman = (talismanId: string) => {
    onUpdateInventory((prev) => {
      const idx = prev.equippedTalismans.indexOf(talismanId);
      if (idx !== -1) {
        // Unequip one instance
        const next = [...prev.equippedTalismans];
        next.splice(idx, 1);
        return { ...prev, equippedTalismans: next };
      }
      if (prev.equippedTalismans.length >= MAX_TALISMAN_SLOTS) {
        // Replace first
        return {
          ...prev,
          equippedTalismans: [...prev.equippedTalismans.slice(1), talismanId],
        };
      }
      return {
        ...prev,
        equippedTalismans: [...prev.equippedTalismans, talismanId],
      };
    });
    sound.playPickup();
  };

  const handleRemoveTalismanAt = (slotIdx: number) => {
    onUpdateInventory((prev) => {
      const next = [...prev.equippedTalismans];
      next.splice(slotIdx, 1);
      return { ...prev, equippedTalismans: next };
    });
    sound.playPickup();
  };

  const currentAvatar = SERPENT_AVATARS[inventory.equippedAvatar] || SERPENT_AVATARS.vanguard_striker;
  const avatarRarityConfig = RARITY_CONFIG[currentAvatar.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border"
              style={{
                borderColor: avatarRarityConfig.border,
                backgroundColor: avatarRarityConfig.bg,
                color: avatarRarityConfig.color,
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>量子軍備庫 · 輪盤召喚</span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold"
                  style={{
                    backgroundColor: avatarRarityConfig.bg,
                    color: avatarRarityConfig.color,
                    border: `1px solid ${avatarRarityConfig.border}`,
                  }}
                >
                  CP: {totalCP}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                抽取高階作戰巨蛇機型與遠古幾何護符，重複抽取直接突破升星，自由換裝大幅強化！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-bold">{scrapCount}</span>
              <span className="text-slate-500 text-[10px]">零件</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800/80 bg-slate-950/20 gap-3">
          <button
            onClick={() => setActiveTab('ROLL')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ROLL'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>量子滾輪抽取</span>
          </button>

          <button
            onClick={() => setActiveTab('ARMORY')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ARMORY'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>裝備與外觀庫 ({inventory.ownedAvatars.length} 機型 · 6 護符欄位)</span>
          </button>
        </div>

        {/* Body View Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {activeTab === 'ROLL' && (
            <div className="flex flex-col items-center">
              {/* Rarity Level Legend Bar */}
              <div className="flex items-center gap-2 sm:gap-4 mb-4 text-[11px] font-mono">
                {(['R', 'SR', 'SSR', 'UR'] as Rarity[]).map((r) => {
                  const cfg = RARITY_CONFIG[r];
                  return (
                    <div
                      key={r}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold"
                      style={{
                        borderColor: cfg.border + '99',
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Spinning Reel Machine Frame */}
              <div className="relative w-full max-w-xl p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.15)] overflow-hidden">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800 text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    QUANTUM REEL MATRIX
                  </span>
                  <span>SSR 保底推進: {inventory.pityCounter % 10}/10</span>
                </div>

                {/* Roller Window */}
                <div className="relative h-44 w-full bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10 pointer-events-none z-10" />
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-16 border-y-2 border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none z-10" />

                  {/* Slot Roller Reels */}
                  <div className="flex items-center justify-around w-full px-4 z-0">
                    {reelItems.slice(0, 3).map((item, idx) => {
                      const cfg = RARITY_CONFIG[item.rarity];
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 w-36 transition-all duration-150 ${
                            isRolling ? 'scale-95 blur-[0.5px] opacity-80' : 'scale-100'
                          }`}
                          style={{
                            borderColor: cfg.border,
                            backgroundColor: cfg.bg,
                            boxShadow: `0 0 15px ${cfg.glow}`,
                          }}
                        >
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded font-mono mb-1.5 text-slate-950"
                            style={{ backgroundColor: cfg.color }}
                          >
                            {item.rarity}
                          </span>
                          <span className="text-xs font-bold text-slate-100 text-center truncate max-w-[120px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono mt-1" style={{ color: cfg.color }}>
                            {item.isAvatar ? '作戰巨蛇機型' : '遠古幾何護符'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Roll Action Buttons */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <button
                    disabled={isRolling}
                    onClick={() => handleRoll(1)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold text-sm text-slate-200 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                  >
                    <span>單次召喚</span>
                    <span className="text-[10px] text-amber-400 font-mono">消耗 {PULL_COST_1X} 零件</span>
                  </button>

                  <button
                    disabled={isRolling}
                    onClick={() => handleRoll(10)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-sm text-slate-950 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      十連召喚 (必得SR以上)
                    </span>
                    <span className="text-[10px] text-slate-900 font-mono font-extrabold">
                      消耗 {PULL_COST_10X} 零件
                    </span>
                  </button>
                </div>
              </div>

              {/* Display Pull Results */}
              {pullResults.length > 0 && (
                <div className="w-full mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 animate-in fade-in duration-300">
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                    <span>本次召喚收穫：</span>
                    <span className="text-xs text-cyan-400 font-mono">重複護符已自動升星突破！</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {pullResults.map((res, idx) => {
                      const cfg = RARITY_CONFIG[res.item.rarity];
                      const isAvatar = 'skinStyle' in res.item;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border-2 flex flex-col items-center text-center relative transition-all hover:scale-105"
                          style={{
                            borderColor: cfg.border,
                            backgroundColor: cfg.bg,
                            boxShadow: `0 0 12px ${cfg.glow}`,
                          }}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono text-slate-950"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {res.item.rarity}
                            </span>
                            {!isAvatar && (
                              <span className="text-[10px] font-mono font-black text-amber-300 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-300" />
                                Lv.{res.level}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-100 line-clamp-1">{res.item.name}</span>
                          <span className="text-[10px] text-slate-400 mt-1 font-mono">CP +{res.item.combatPower}</span>
                          <span className="text-[9px] mt-0.5 font-bold" style={{ color: cfg.color }}>
                            {isAvatar ? '巨蛇機型' : res.isNew ? '✨ 新護符' : '⭐ 升星強化'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ARMORY' && (
            <div className="space-y-6">
              {/* Active Loadout Banner */}
              <div
                className="p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                style={{
                  borderColor: avatarRarityConfig.border,
                  backgroundColor: avatarRarityConfig.bg,
                  boxShadow: `0 0 25px ${avatarRarityConfig.glow}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg"
                    style={{
                      borderColor: currentAvatar.color,
                      backgroundColor: currentAvatar.color + '25',
                    }}
                  >
                    <Hexagon className="w-8 h-8" style={{ color: currentAvatar.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded text-slate-950 font-mono"
                        style={{ backgroundColor: avatarRarityConfig.color }}
                      >
                        {currentAvatar.rarity}
                      </span>
                      <h3 className="text-base font-black text-slate-100">{currentAvatar.name}</h3>
                      <span className="text-xs text-slate-300 font-mono">({currentAvatar.title})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">{currentAvatar.description}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: currentAvatar.color }}>
                      戰場蛇身造型：{currentAvatar.skinStyle === 'titan' ? '黃金泰坦重甲' : currentAvatar.skinStyle === 'void' ? '紫晶虛空折疊' : currentAvatar.skinStyle === 'fission' ? '緋紅星蝕巨神' : '青藍先鋒滑軌'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end px-5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    TOTAL COMBAT POWER
                  </span>
                  <span className="text-3xl font-black font-mono tracking-tight" style={{ color: avatarRarityConfig.color }}>
                    {totalCP}
                  </span>
                  <div className="text-[10px] text-slate-300 mt-0.5 flex gap-2 font-mono">
                    <span>血量 +{combinedStats.hpBonus}</span>
                    <span>火力 x{combinedStats.damageMult.toFixed(2)}</span>
                    <span>暴擊 +{Math.round(combinedStats.critBonus * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* 1. 6 Talisman Equipment Slots (增加欄位至6格) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>遠古幾何護符槽位 (共 6 大裝備欄 · 支援重複配戴與星級倍率)</span>
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">
                    已配戴: {inventory.equippedTalismans.length}/6
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: MAX_TALISMAN_SLOTS }).map((_, slotIdx) => {
                    const tid = inventory.equippedTalismans[slotIdx];
                    const talisman = tid ? TALISMANS[tid] : null;
                    const level = tid ? inventory.talismanLevels[tid] || 1 : 0;
                    const cfg = talisman ? RARITY_CONFIG[talisman.rarity] : null;

                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-between min-h-[140px] text-center transition-all ${
                          talisman && cfg
                            ? 'border-2 shadow-md relative'
                            : 'bg-slate-950/50 border-dashed border-slate-800'
                        }`}
                        style={
                          talisman && cfg
                            ? {
                                borderColor: cfg.border,
                                backgroundColor: cfg.bg,
                                boxShadow: `0 0 12px ${cfg.glow}`,
                              }
                            : {}
                        }
                      >
                        {talisman && cfg ? (
                          <>
                            <div className="w-full flex items-center justify-between">
                              <span
                                className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono text-slate-950"
                                style={{ backgroundColor: cfg.color }}
                              >
                                {talisman.rarity}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-300" />
                                Lv.{level}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-100 my-1 line-clamp-2">
                              {talisman.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300">
                              CP +{Math.round(talisman.combatPower * (1 + (level - 1) * 0.3))}
                            </span>
                            <button
                              onClick={() => handleRemoveTalismanAt(slotIdx)}
                              className="mt-2 text-[10px] text-red-300 hover:text-red-100 px-2 py-0.5 bg-red-500/20 rounded cursor-pointer transition-colors"
                            >
                              卸除
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1">
                            <Plus className="w-5 h-5" />
                            <span className="text-[10px] font-mono">槽位 {slotIdx + 1} (空)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Character Model / Avatar Selection (切換造型) */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>巨蛇機型原型 (切換出擊機體與戰場蛇身造型)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(SERPENT_AVATARS).map((avatar) => {
                    const isOwned = inventory.ownedAvatars.includes(avatar.id);
                    const isEquipped = inventory.equippedAvatar === avatar.id;
                    const cfg = RARITY_CONFIG[avatar.rarity];

                    return (
                      <div
                        key={avatar.id}
                        className={`p-3.5 rounded-xl border-2 transition-all ${
                          isEquipped
                            ? 'shadow-lg'
                            : isOwned
                            ? 'hover:border-slate-500'
                            : 'opacity-40'
                        }`}
                        style={{
                          borderColor: isEquipped ? cfg.border : '#334155',
                          backgroundColor: isEquipped ? cfg.bg : 'rgba(15, 23, 42, 0.6)',
                          boxShadow: isEquipped ? `0 0 16px ${cfg.glow}` : 'none',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded font-mono text-slate-950"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {avatar.rarity}
                            </span>
                            <span className="font-bold text-sm text-slate-100">{avatar.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: cfg.color }}>
                            CP {avatar.combatPower}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{avatar.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] text-amber-300 font-mono">
                            血量 +{avatar.stats.hpBonus} · 速度 +{avatar.stats.speedBonus} · 火力 x{avatar.stats.damageMult}
                          </span>
                          {isEquipped ? (
                            <span className="text-xs font-bold flex items-center gap-1 font-mono" style={{ color: cfg.color }}>
                              <CheckCircle className="w-3.5 h-3.5" /> 已裝備出擊
                            </span>
                          ) : isOwned ? (
                            <button
                              onClick={() => handleEquipAvatar(avatar.id)}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              更換機型造型
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">未解鎖 (抽獎獲取)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. All Owned Talismans (更多護符與星級顯示) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Hexagon className="w-4 h-4 text-purple-400" />
                    <span>全部遠古幾何護符庫 ({Object.keys(TALISMANS).length} 款護符 · 點擊直接裝備至空槽)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(TALISMANS).map((talisman) => {
                    const isOwned = inventory.ownedTalismans.includes(talisman.id);
                    const level = inventory.talismanLevels[talisman.id] || 0;
                    const equippedCount = inventory.equippedTalismans.filter((id) => id === talisman.id).length;
                    const cfg = RARITY_CONFIG[talisman.rarity];

                    return (
                      <div
                        key={talisman.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isOwned
                            ? 'border-2 hover:scale-[1.01]'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-40'
                        }`}
                        style={
                          isOwned
                            ? {
                                borderColor: cfg.border + (equippedCount > 0 ? 'ff' : '77'),
                                backgroundColor: cfg.bg,
                              }
                            : {}
                        }
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono text-slate-950"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {talisman.rarity}
                            </span>
                            {isOwned && (
                              <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-300" />
                                ★ Lv.{level} (x{level})
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 flex items-center justify-between">
                            <span>{talisman.name}</span>
                            <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
                              CP +{Math.round(talisman.combatPower * (1 + (Math.max(1, level) - 1) * 0.3))}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                            {talisman.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-300">
                            已配戴 {equippedCount} 件
                          </span>
                          {isOwned ? (
                            <button
                              onClick={() => handleToggleTalisman(talisman.id)}
                              className="py-1 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold transition-all cursor-pointer"
                            >
                              {equippedCount > 0 ? '額外配戴' : '配戴入槽'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">未獲得</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
