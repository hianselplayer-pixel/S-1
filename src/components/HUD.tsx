/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Zap, Flame, Disc, Bomb, Droplets, Crosshair, Radio, Activity, Snowflake, Swords } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { TurretType } from '../types/game';
import { TURRET_CATALOG } from '../game/constants';

interface HUDProps {
  engine: GameEngine | null;
  onDash: () => void;
}

export const HUD: React.FC<HUDProps> = ({ engine, onDash }) => {
  if (!engine) return null;

  const totalSurvived = Math.floor(engine.stats.timeSurvived);
  const survivedMins = Math.floor(totalSurvived / 60);
  const survivedSecs = totalSurvived % 60;
  const survivedString = `${survivedMins.toString().padStart(2, '0')}:${survivedSecs.toString().padStart(2, '0')}`;

  const waveSeconds = Math.max(0, Math.ceil(engine.waveTimer));
  const hasBoss = engine.enemies.some((e) => e.isBoss);

  const expPercent = Math.min(100, Math.round((engine.exp / engine.maxExp) * 100));
  const snakeHpPercent = Math.max(0, Math.min(100, Math.round((engine.snakeHp / engine.snakeMaxHp) * 100)));
  const snakeShieldPercent = Math.max(0, Math.min(100, Math.round((engine.snakeShield / engine.snakeMaxShield) * 100)));
  const reactorHpPercent = Math.max(0, Math.min(100, Math.round((engine.reactorHp / engine.reactorMaxHp) * 100)));

  // Body module counts
  const moduleCounts: Record<TurretType, number> = {} as Record<TurretType, number>;
  engine.segments.forEach((s) => {
    moduleCounts[s.turretType] = (moduleCounts[s.turretType] || 0) + 1;
  });

  const getTurretIcon = (type: TurretType) => {
    switch (type) {
      case 'GATLING': return <Crosshair className="w-3.5 h-3.5" />;
      case 'PLASMA': return <Radio className="w-3.5 h-3.5" />;
      case 'TESLA': return <Zap className="w-3.5 h-3.5" />;
      case 'CRYO': return <Snowflake className="w-3.5 h-3.5" />;
      case 'FLAME': return <Flame className="w-3.5 h-3.5" />;
      case 'LASER': return <Activity className="w-3.5 h-3.5" />;
      case 'DRONE': return <Disc className="w-3.5 h-3.5" />;
      case 'MINE_LAYER': return <Bomb className="w-3.5 h-3.5" />;
      case 'VENOM_TRAIL': return <Droplets className="w-3.5 h-3.5" />;
      case 'SHIELD_GEN': return <Shield className="w-3.5 h-3.5" />;
    }
  };

  const dashReady = engine.dashCooldown <= 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Health & Status Gauges */}
        <div className="flex flex-col gap-2 w-52 sm:w-64">
          {/* Reactor Health */}
          <div className="bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                反應爐核心
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {Math.round(engine.reactorHp)} / {engine.reactorMaxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  reactorHpPercent > 50 ? 'bg-cyan-500' : reactorHpPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${reactorHpPercent}%` }}
              />
            </div>
          </div>

          {/* Snake Hull & Shield */}
          <div className="bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-300">蛇頭戰艦機體</span>
              <span className="font-mono tabular-nums text-slate-400">
                {Math.round(engine.snakeHp)} / {engine.snakeMaxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full transition-all duration-200 ${
                  snakeHpPercent > 50 ? 'bg-emerald-500' : snakeHpPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${snakeHpPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
              <span>共振護盾</span>
              <span className="font-mono tabular-nums">
                {Math.round(engine.snakeShield)} / {engine.snakeMaxShield}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-200"
                style={{ width: `${snakeShieldPercent}%` }}
              />
            </div>
          </div>

          {/* Core Anchor & Body Deflector Telemetry */}
          <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-cyan-500/30 text-[10px] flex items-center justify-between font-mono">
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              蛇身節數: {engine.segments.length + 1} 節
            </span>
            <span className="text-slate-300 font-bold tabular-nums">
              半徑 {Math.round(engine.getMaxReach())}m · 阻擋彈幕
            </span>
          </div>
        </div>

        {/* Center: Wave Timer, 5-Minute Session Progression & Boss Alert */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-slate-950/85 backdrop-blur-md px-5 py-2.5 rounded-xl border border-slate-800 flex flex-col items-center shadow-lg">
            <div className="text-[11px] font-medium tracking-wider uppercase flex items-center gap-2">
              <span className="text-cyan-400 font-mono font-bold">波次 {engine.wave}/5</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                {engine.wave === 3 ? '幾何巨擘中繼戰' : engine.wave === 5 ? '終焉原初決戰' : '狂潮防禦戰'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-100 tracking-tight flex items-center gap-2">
              <span>{survivedString}</span>
              <span className="text-xs text-slate-500 font-normal">/ 05:00</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span>波次倒數: <b className="text-cyan-300">{waveSeconds}s</b></span>
              <span className="text-slate-600">|</span>
              <span>擊潰: <b className="text-cyan-400">{engine.stats.kills}</b></span>
            </div>
          </div>

          {/* Wide FOV & Boss Arrival Banner */}
          {hasBoss && (
            <div className="bg-red-950/90 border border-red-500/80 text-red-200 px-3.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>⚠️ 幾何泰坦降臨 · 廣角戰術視野展開 (FOV +35%)</span>
            </div>
          )}
        </div>

        {/* Right: Level & EXP + Dash */}
        <div className="flex flex-col items-end gap-2 w-48 sm:w-56">
          <div className="bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 w-full">
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-cyan-400 font-bold font-mono">LV. {engine.level}</span>
              <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                {engine.exp} / {engine.maxExp} EXP
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-200"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={onDash}
            disabled={!dashReady}
            className={`pointer-events-auto w-full py-2 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all ${
              dashReady
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 hover:bg-cyan-900/80 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>渦輪衝刺</span>
            </span>
            <span className="font-mono text-[11px]">
              {dashReady ? '[空白鍵]' : `${engine.dashCooldown.toFixed(1)}s`}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom HUD: Snake Head Heavy Batteries & Body Loadout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Head Battery Display */}
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/50 flex items-center gap-2 shadow-md">
            <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
              <Swords className="w-3.5 h-3.5" />
              蛇頭主戰武裝：
            </span>
            <div className="flex items-center gap-1.5">
              {engine.headWeapons.map((hw) => {
                const def = TURRET_CATALOG[hw.type];
                if (!def) return null;
                return (
                  <div
                    key={hw.type}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-500/40 text-xs"
                    title={`蛇頭主砲：${def.nameZh}`}
                  >
                    <span style={{ color: def.color }}>{getTurretIcon(hw.type)}</span>
                    <span className="text-slate-200 text-[11px] font-medium">{def.nameZh}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Lv.{hw.level}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Segments Support Display */}
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              身軀支援 ({engine.segments.length})：
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.keys(moduleCounts) as TurretType[]).map((type) => {
                const def = TURRET_CATALOG[type];
                if (!def) return null;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/60 text-xs"
                    title={`${def.nameZh}`}
                  >
                    <span style={{ color: def.color }}>{getTurretIcon(type)}</span>
                    <span className="text-slate-300 text-[11px] font-medium hidden md:inline">{def.nameZh}</span>
                    <span className="text-slate-400 font-mono text-[10px]">x{moduleCounts[type]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <span>蛇頭火力全開</span>
          <span>·</span>
          <span>自繞成環引爆超導電弧</span>
        </div>
      </div>
    </div>
  );
};
