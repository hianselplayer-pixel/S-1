/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface VirtualControlsProps {
  onSteer: (dx: number, dy: number) => void;
  onDash: () => void;
  dashReady: boolean;
  dashCooldown: number;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onSteer,
  onDash,
  dashReady,
  dashCooldown,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onSteer(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      onSteer(dx / maxRadius, dy / maxRadius);
    } else {
      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle) * maxRadius;
      const ny = Math.sin(angle) * maxRadius;
      setKnobPos({ x: nx, y: ny });
      onSteer(Math.cos(angle), Math.sin(angle));
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-6 pointer-events-none flex items-end justify-between px-6 z-20 md:hidden select-none">
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-sm border-2 border-slate-700/80 flex items-center justify-center touch-none shadow-xl"
      >
        <div
          className={`w-12 h-12 rounded-full border-2 transition-transform duration-75 ${
            isDragging ? 'bg-cyan-500/80 border-cyan-300 scale-105' : 'bg-slate-700/60 border-slate-500'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Virtual Dash Button */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          if (dashReady) onDash();
        }}
        disabled={!dashReady}
        className={`pointer-events-auto w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xl ${
          dashReady
            ? 'bg-cyan-500/80 border-cyan-300 text-slate-950 font-bold shadow-cyan-500/30'
            : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Zap className="w-6 h-6 mb-0.5" />
        <span className="text-[10px] uppercase font-mono">
          {dashReady ? '衝刺' : `${dashCooldown.toFixed(1)}s`}
        </span>
      </button>
    </div>
  );
};
