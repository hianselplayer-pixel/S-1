/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Radio, AlertTriangle } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { ARENA_RADIUS } from '../game/constants';

interface MinimapProps {
  engine: GameEngine | null;
}

export const Minimap: React.FC<MinimapProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    let sweepAngle = 0;

    const renderMinimap = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engine) {
        animId = requestAnimationFrame(renderMinimap);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radarRadius = center - 8;
      const scale = radarRadius / ARENA_RADIUS;

      // Clear
      ctx.clearRect(0, 0, size, size);

      // Radar Background (Circular dark sci-fi glass)
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 13, 26, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.clip();

      // Range Concentric Rings
      [0.33, 0.66, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(center, center, radarRadius * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = ratio === 1.0 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(center - radarRadius, center);
      ctx.lineTo(center + radarRadius, center);
      ctx.moveTo(center, center - radarRadius);
      ctx.lineTo(center, center + radarRadius);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating Radar Sweep
      sweepAngle = (sweepAngle + 0.04) % (Math.PI * 2);
      const sweepGrad = ctx.createConicGradient(sweepAngle, center, center);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      sweepGrad.addColorStop(0.12, 'rgba(6, 182, 212, 0.0)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
      ctx.fill();

      const rx = engine.reactorX;
      const ry = engine.reactorY;

      const toRadarX = (wx: number) => center + (wx - rx) * scale;
      const toRadarY = (wy: number) => center + (wy - ry) * scale;

      // 1. Items / Energy Cores (tiny golden blips)
      if (engine.items && engine.items.length > 0) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
        for (const it of engine.items) {
          const ix = toRadarX(it.x);
          const iy = toRadarY(it.y);
          ctx.fillRect(ix - 1, iy - 1, 2, 2);
        }
      }

      // 2. Normal Enemies (red blips)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      for (const e of engine.enemies) {
        if (e.isBoss) continue;
        const ex = toRadarX(e.x);
        const ey = toRadarY(e.y);
        ctx.fillRect(ex - 1.2, ey - 1.2, 2.4, 2.4);
      }

      // 3. Bosses (pulsing big red/yellow blips)
      for (const b of engine.enemies) {
        if (!b.isBoss) continue;
        const bx = toRadarX(b.x);
        const by = toRadarY(b.y);
        const pulse = 4 + Math.sin(Date.now() / 150) * 1.5;

        // Outer danger aura
        ctx.beginPath();
        ctx.arc(bx, by, pulse + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fill();

        // Inner solid
        ctx.beginPath();
        ctx.arc(bx, by, pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();
        ctx.strokeStyle = '#fee2e2';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 4. Snake Body
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const hx = toRadarX(engine.snakeX);
      const hy = toRadarY(engine.snakeY);
      ctx.moveTo(hx, hy);
      for (const seg of engine.segments) {
        ctx.lineTo(toRadarX(seg.x), toRadarY(seg.y));
      }
      ctx.stroke();

      // Snake Head (Bright Emerald Triangle / Point)
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(engine.snakeAngle);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -3);
      ctx.lineTo(-1.5, 0);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.restore();

      // 5. Reactor Core (Center cyan beacon)
      const rPulse = 3.5 + Math.sin(Date.now() / 250) * 1;
      ctx.beginPath();
      ctx.arc(center, center, rPulse + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(center, center, rPulse, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Outer bezel tick marks
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        const x1 = center + Math.cos(rad) * (radarRadius - 1);
        const y1 = center + Math.sin(rad) * (radarRadius - 1);
        const x2 = center + Math.cos(rad) * (radarRadius + 3);
        const y2 = center + Math.sin(rad) * (radarRadius + 3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderMinimap);
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  if (!engine) return null;

  const hasBoss = engine.enemies.some((e) => e.isBoss);
  const enemyCount = engine.enemies.length;
  const distToCore = Math.round(
    Math.hypot(engine.snakeX - engine.reactorX, engine.snakeY - engine.reactorY)
  );

  return (
    <div className="bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-cyan-500/40 shadow-lg flex flex-col items-center gap-1.5 w-48 sm:w-56 pointer-events-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-400 px-1">
        <span className="flex items-center gap-1 font-bold">
          <Radio className="w-3 h-3 animate-pulse" />
          戰術全息雷達
        </span>
        <span className="text-slate-400">R: 1100m</span>
      </div>

      {/* Radar Canvas */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          className="rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        />
        {hasBoss && (
          <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-950/90 text-red-300 border border-red-500/80 px-1 py-0.5 rounded text-[9px] font-mono font-bold animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            BOSS
          </div>
        )}
      </div>

      {/* Telemetry info */}
      <div className="w-full grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300 pt-0.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-1 bg-slate-900/60 rounded py-0.5">
          <span className="text-slate-400">敵機群</span>
          <span className="text-red-400 font-bold">{enemyCount}</span>
        </div>
        <div className="flex items-center justify-between px-1 bg-slate-900/60 rounded py-0.5">
          <span className="text-slate-400">核心距</span>
          <span className="text-cyan-400 font-bold">{distToCore}m</span>
        </div>
      </div>
    </div>
  );
};
