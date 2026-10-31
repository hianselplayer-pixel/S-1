/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { generateUpgradeOptions } from './game/upgrades';
import { sound } from './utils/audio';
import { GameState, GameStats, MetaUpgrades, UpgradeOption } from './types/game';
import { TopBar } from './components/TopBar';
import { HUD } from './components/HUD';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { HangarModal } from './components/HangarModal';
import { CodexModal } from './components/CodexModal';
import { TitleMenu } from './components/TitleMenu';
import { VirtualControls } from './components/VirtualControls';
import { GachaModal } from './components/GachaModal';
import { GachaInventory } from './types/gacha';
import {
  DEFAULT_INVENTORY,
  calculateCombatPower,
  getCombinedGachaStats,
  SERPENT_AVATARS,
} from './game/gachaCatalog';

const STORAGE_KEY_META = 'serpent_vanguard_meta_v1';
const STORAGE_KEY_SCRAP = 'serpent_vanguard_scrap_v1';
const STORAGE_KEY_GACHA = 'serpent_vanguard_gacha_v1';

const DEFAULT_META: MetaUpgrades = {
  maxHpLevel: 0,
  startingLength: 0,
  magnetLevel: 0,
  ramDamageLevel: 0,
  dashCooldownLevel: 0,
  scrapMultiplierLevel: 0,
  unlockedTurrets: ['GATLING', 'CRYO', 'FLAME', 'TESLA', 'MINE_LAYER'],
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scrapCount, setScrapCount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCRAP);
    return saved ? parseInt(saved, 10) : 100; // Starter scraps for quick summon!
  });

  const [metaUpgrades, setMetaUpgrades] = useState<MetaUpgrades>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_META);
    if (saved) {
      try {
        return { ...DEFAULT_META, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_META;
      }
    }
    return DEFAULT_META;
  });

  const [gachaInventory, setGachaInventory] = useState<GachaInventory>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GACHA);
    if (saved) {
      try {
        return { ...DEFAULT_INVENTORY, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_INVENTORY;
      }
    }
    return DEFAULT_INVENTORY;
  });

  // Calculate live gear bonuses & CP
  const combatPower = calculateCombatPower(gachaInventory);
  const combinedGachaStats = getCombinedGachaStats(gachaInventory);
  const currentAvatar = SERPENT_AVATARS[gachaInventory.equippedAvatar] || SERPENT_AVATARS.vanguard_striker;

  // Upgrade drafting
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [rerollsAvailable, setRerollsAvailable] = useState<number>(2);

  // Game End stats
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [scrapsEarnedInRun, setScrapsEarnedInRun] = useState<number>(0);

  // Engine & Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [, setTick] = useState<number>(0); // For HUD re-renders

  // Persist Meta & Scrap & Gacha
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(metaUpgrades));
  }, [metaUpgrades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCRAP, scrapCount.toString());
  }, [scrapCount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GACHA, JSON.stringify(gachaInventory));
  }, [gachaInventory]);

  // Sync canvas size
  const updateCanvasSize = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 53; // minus TopBar height
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Handle Level Up
  const handleLevelUp = useCallback(() => {
    if (!engineRef.current) return;
    const options = generateUpgradeOptions(engineRef.current);
    setUpgradeOptions(options);
    setGameState('UPGRADING');
  }, []);

  // Handle Game Over
  const handleGameOver = useCallback((victory: boolean) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const stats = { ...engine.stats };
    const earned = engine.scrap;

    setFinalStats(stats);
    setIsVictory(victory);
    setScrapsEarnedInRun(earned);
    setScrapCount((prev) => prev + earned);
    setGameState('GAME_OVER');
  }, []);

  // Start / Restart Run
  const startRun = useCallback(() => {
    if (!canvasRef.current) return;
    updateCanvasSize();

    if (engineRef.current) {
      engineRef.current.stop();
    }

    const engine = new GameEngine(canvasRef.current, metaUpgrades, combinedGachaStats);
    engine.onLevelUp = handleLevelUp;
    engine.onGameOver = handleGameOver;
    engineRef.current = engine;

    setRerollsAvailable(2);
    setGameState('PLAYING');
    setIsPaused(false);
    engine.start();
  }, [metaUpgrades, combinedGachaStats, handleLevelUp, handleGameOver, updateCanvasSize]);

  // Upgrade Selection
  const handleSelectUpgrade = (option: UpgradeOption) => {
    option.apply();
    if (engineRef.current) {
      engineRef.current.isPaused = false;
    }
    setGameState('PLAYING');
  };

  // Reroll Options
  const handleReroll = () => {
    if (rerollsAvailable <= 0 || !engineRef.current) return;
    setRerollsAvailable((prev) => prev - 1);
    sound.playPickup();
    const options = generateUpgradeOptions(engineRef.current);
    setUpgradeOptions(options);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Toggle Pause
  const handleTogglePause = () => {
    if (!engineRef.current || gameState !== 'PLAYING') return;
    const nextPaused = !engineRef.current.isPaused;
    engineRef.current.isPaused = nextPaused;
    setIsPaused(nextPaused);
  };

  // TopBar navigation
  const handleNavigate = (dest: GameState) => {
    if (engineRef.current && engineRef.current.isRunning) {
      engineRef.current.stop();
    }
    setGameState(dest);
  };

  // Meta upgrade purchasing
  const handleHangarUpgrade = (key: keyof MetaUpgrades, cost: number) => {
    if (scrapCount < cost) return;
    setScrapCount((prev) => prev - cost);
    setMetaUpgrades((prev) => ({
      ...prev,
      [key]: (prev[key] as number) + 1,
    }));
    sound.playPickup();
  };

  const handleResetHangar = () => {
    setMetaUpgrades(DEFAULT_META);
    sound.playPickup();
  };

  // HUD timer loop to force lightweight re-renders of metrics
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 150);
    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Universal TopBar conforming to 3-zone contract */}
      <TopBar
        gameState={gameState}
        onNavigate={handleNavigate}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        scrapCount={scrapCount}
      />

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-[calc(100vh-53px)] overflow-hidden">
        {/* Canvas is always mounted so sizing and WebGL/2D contexts are ready */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 block w-full h-full cursor-crosshair ${
            gameState === 'PLAYING' || gameState === 'UPGRADING' ? 'z-0' : '-z-10 opacity-0 pointer-events-none'
          }`}
        />

        {/* In-Game HUD */}
        {(gameState === 'PLAYING' || gameState === 'UPGRADING') && (
          <HUD
            engine={engineRef.current}
            onDash={() => engineRef.current?.triggerDash()}
          />
        )}

        {/* Mobile Virtual Controls */}
        {gameState === 'PLAYING' && engineRef.current && (
          <VirtualControls
            onSteer={(dx, dy) => engineRef.current?.setTouchSteering(dx, dy)}
            onDash={() => engineRef.current?.triggerDash()}
            dashReady={engineRef.current.dashCooldown <= 0}
            dashCooldown={engineRef.current.dashCooldown}
          />
        )}

        {/* Title Menu */}
        {gameState === 'TITLE_MENU' && (
          <TitleMenu
            onStartGame={startRun}
            onOpenGacha={() => setGameState('GACHA')}
            onOpenHangar={() => setGameState('HANGAR')}
            onOpenCodex={() => setGameState('CODEX')}
            scrapCount={scrapCount}
            combatPower={combatPower}
            equippedAvatarName={currentAvatar.name}
            equippedAvatarColor={currentAvatar.color}
            equippedTalismansCount={gachaInventory.equippedTalismans.length}
            meta={metaUpgrades}
          />
        )}

        {/* Gacha & Armory View */}
        {gameState === 'GACHA' && (
          <GachaModal
            inventory={gachaInventory}
            scrapCount={scrapCount}
            onUpdateInventory={setGachaInventory}
            onDeductScrap={(amt) => {
              setScrapCount((prev) => Math.max(0, prev - amt));
              return true;
            }}
            onAddScrap={(amt) => setScrapCount((prev) => prev + amt)}
            onClose={() => setGameState('TITLE_MENU')}
          />
        )}

        {/* Hangar View */}
        {gameState === 'HANGAR' && (
          <HangarModal
            meta={metaUpgrades}
            scrapCount={scrapCount}
            onUpgrade={handleHangarUpgrade}
            onReset={handleResetHangar}
            onStartGame={startRun}
            onBackToMenu={() => setGameState('TITLE_MENU')}
          />
        )}

        {/* Codex View */}
        {gameState === 'CODEX' && (
          <CodexModal onClose={() => setGameState('TITLE_MENU')} />
        )}

        {/* Level Up Draft Modal */}
        {gameState === 'UPGRADING' && (
          <UpgradeModal
            options={upgradeOptions}
            onSelect={handleSelectUpgrade}
            onReroll={handleReroll}
            rerollsAvailable={rerollsAvailable}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && finalStats && (
          <GameOverModal
            victory={isVictory}
            stats={finalStats}
            scrapsEarned={scrapsEarnedInRun}
            onRestart={startRun}
            onOpenHangar={() => setGameState('HANGAR')}
          />
        )}

        {/* Pause Overlay */}
        {isPaused && gameState === 'PLAYING' && (
          <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-2">作戰暫停中</h2>
            <p className="text-xs text-slate-400 mb-6">點擊下方按鈕或頂部圖示繼續防衛戰局</p>
            <button
              onClick={handleTogglePause}
              className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              繼續作戰
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
