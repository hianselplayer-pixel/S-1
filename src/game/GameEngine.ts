/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  ARENA_RADIUS,
  BASE_CAMERA_ZOOM,
  BASE_EXP_REQUIREMENT,
  BASE_SNAKE_SPEED,
  BOSS_CAMERA_ZOOM,
  DASH_SPEED_MULTIPLIER,
  REACTOR_MAX_HP,
  REACTOR_RADIUS,
  SEGMENT_DISTANCE,
  SNAKE_BODY_RADIUS,
  SNAKE_HEAD_RADIUS,
  TOTAL_GAME_DURATION,
  TOTAL_WAVES,
  TURRET_CATALOG,
  WAVE_DURATION,
} from './constants';
import {
  BodySegment,
  DamageNumber,
  Drone,
  Enemy,
  EnemyType,
  EnergyCoreItem,
  GameStats,
  HeadWeapon,
  MetaUpgrades,
  Mine,
  MovementPattern,
  Particle,
  Projectile,
  TurretType,
  VenomPuddle,
} from '../types/game';
import { sound } from '../utils/audio';
import { BattlefieldEnvironment } from './BattlefieldEnvironment';
import { CombinedGachaStats } from './gachaCatalog';

export interface MuzzleFlash {
  x: number;
  y: number;
  angle: number;
  turretType: TurretType;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  // Environmental Atmospheric System
  public environment: BattlefieldEnvironment = new BattlefieldEnvironment();

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public wave: number = 1;
  public waveTimer: number = WAVE_DURATION;
  public level: number = 1;
  public exp: number = 0;
  public maxExp: number = BASE_EXP_REQUIREMENT;
  public scrap: number = 0;
  public score: number = 0;

  // Reactor Core
  public reactorX: number = ARENA_WIDTH / 2;
  public reactorY: number = ARENA_HEIGHT / 2;
  public reactorHp: number = REACTOR_MAX_HP;
  public reactorMaxHp: number = REACTOR_MAX_HP;

  // Snake
  public snakeX: number = ARENA_WIDTH / 2;
  public snakeY: number = ARENA_HEIGHT / 2 + 180;
  public snakeAngle: number = -Math.PI / 2;
  public targetAngle: number = -Math.PI / 2;
  public snakeHp: number = 320;
  public snakeMaxHp: number = 320;
  public snakeShield: number = 80;
  public snakeMaxShield: number = 80;
  public snakeSpeed: number = BASE_SNAKE_SPEED;

  // Head Heavy Weaponry (Command Arsenal)
  public headWeapons: HeadWeapon[] = [];

  // Body Segments (Auxiliary & Support Turrets)
  public segments: BodySegment[] = [];

  // Dash
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldown: number = 0;
  public maxDashCooldown: number = 3.6;
  public dashDuration: number = 0.5;

  // Upgrades & Modifiers
  public magnetRadius: number = 240;
  public ramDamage: number = 65;
  public critChance: number = 0.15;
  public globalDamageMult: number = 1.0;
  public fireRateMult: number = 1.0;

  // Entities
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public mines: Mine[] = [];
  public venomPuddles: VenomPuddle[] = [];
  public items: EnergyCoreItem[] = [];
  public drones: Drone[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public muzzleFlashes: MuzzleFlash[] = [];

  // Boss Health HUD tracking (10 layers)
  public currentBoss: Enemy | null = null;
  public lastBossLayer: number = 10;
  public bossLayerBreakTimer: number = 0;

  // Gacha & Gear modifiers
  public gachaStats?: CombinedGachaStats;

  // Input
  public keys: Record<string, boolean> = {};
  public mousePos: { x: number; y: number } | null = null;
  public touchDirection: { x: number; y: number } | null = null;
  public useMouseSteering: boolean = false;

  // Camera & Visual FX
  public cameraX: number = ARENA_WIDTH / 2;
  public cameraY: number = ARENA_HEIGHT / 2;
  public screenShake: number = 0;
  public cameraZoom: number = BASE_CAMERA_ZOOM;
  public targetZoom: number = BASE_CAMERA_ZOOM;
  public baseZoom: number = BASE_CAMERA_ZOOM;
  public bossZoom: number = BOSS_CAMERA_ZOOM;

  // Stats
  public stats: GameStats = {
    kills: 0,
    damageDealt: 0,
    wavesCleared: 0,
    timeSurvived: 0,
    scrapsGained: 0,
    coresCollected: 0,
    resonantLoopsTriggered: 0,
    weaponDamage: {},
  };

  // Callbacks
  public onLevelUp?: () => void;
  public onGameOver?: (victory: boolean) => void;
  public onWaveChange?: (wave: number) => void;

  private lastTime: number = 0;
  private enemySpawnTimer: number = 0;
  private loopCheckTimer: number = 0;
  private meta: MetaUpgrades;

  constructor(canvas: HTMLCanvasElement, meta: MetaUpgrades, gachaStats?: CombinedGachaStats) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.meta = meta;
    this.gachaStats = gachaStats;

    this.applyMetaUpgrades();
    this.initSnake();
    this.setupInputs();
  }

  private applyMetaUpgrades() {
    let baseHp = 250 + this.meta.maxHpLevel * 45;
    let baseMag = 220 + this.meta.magnetLevel * 50;
    let baseRam = 60 + this.meta.ramDamageLevel * 22;
    let baseDashCd = Math.max(1.5, 3.6 - this.meta.dashCooldownLevel * 0.4);

    if (this.gachaStats) {
      baseHp += this.gachaStats.hpBonus;
      baseMag += this.gachaStats.magnetBonus;
      baseRam *= this.gachaStats.ramDamageMult;
      baseDashCd *= this.gachaStats.dashCooldownMult;
      this.snakeSpeed += this.gachaStats.speedBonus;
      this.globalDamageMult *= this.gachaStats.damageMult;
      this.fireRateMult *= this.gachaStats.fireRateMult;
      this.critChance += this.gachaStats.critBonus;
    }

    this.snakeMaxHp = baseHp;
    this.snakeHp = this.snakeMaxHp;
    this.magnetRadius = baseMag;
    this.ramDamage = baseRam;
    this.maxDashCooldown = baseDashCd;
  }

  public addMuzzleFlash(x: number, y: number, angle: number, turretType: TurretType, color: string = '#00f0ff') {
    this.muzzleFlashes.push({
      x,
      y,
      angle,
      turretType,
      life: 0.12,
      maxLife: 0.12,
      size: turretType === 'PLASMA' ? 24 : turretType === 'LASER' ? 20 : 15,
      color,
    });
  }

  public getMaxReach(): number {
    return REACTOR_RADIUS + (this.segments.length + 1) * SEGMENT_DISTANCE;
  }

  public getMinReach(): number {
    return REACTOR_RADIUS + SNAKE_HEAD_RADIUS + 12;
  }

  public getCoreAnchorPoint(): { x: number; y: number; angle: number } {
    if (this.segments.length === 0) {
      const angle = Math.atan2(this.snakeY - this.reactorY, this.snakeX - this.reactorX);
      return {
        x: this.reactorX + Math.cos(angle) * (REACTOR_RADIUS + 4),
        y: this.reactorY + Math.sin(angle) * (REACTOR_RADIUS + 4),
        angle,
      };
    }
    const tail = this.segments[this.segments.length - 1];
    const angle = Math.atan2(tail.y - this.reactorY, tail.x - this.reactorX);
    return {
      x: this.reactorX + Math.cos(angle) * (REACTOR_RADIUS + 4),
      y: this.reactorY + Math.sin(angle) * (REACTOR_RADIUS + 4),
      angle,
    };
  }

  private initSnake() {
    // 1. Equip Snake Head with heavy command weaponry
    this.headWeapons = [
      { type: 'GATLING', level: 1, lastFireTime: 0 },
      { type: 'LASER', level: 1, lastFireTime: 0 },
      { type: 'PLASMA', level: 1, lastFireTime: 0 },
    ];

    // 2. Initialize Body Segments tethered to central core
    this.segments = [];
    const count = Math.max(7, 7 + this.meta.startingLength * 2);
    const startTypes: TurretType[] = ['TESLA', 'CRYO', 'FLAME', 'MINE_LAYER', 'DRONE', 'SHIELD_GEN', 'VENOM_TRAIL'];

    // Start with snake head offset above the reactor
    const initialRadius = REACTOR_RADIUS + count * SEGMENT_DISTANCE * 0.8;
    this.snakeX = this.reactorX;
    this.snakeY = this.reactorY - initialRadius;
    this.snakeAngle = 0;
    this.targetAngle = 0;

    for (let i = 0; i < count; i++) {
      const type = startTypes[i % startTypes.length];
      const t = (i + 1) / (count + 1);
      const anchorY = this.reactorY - (REACTOR_RADIUS + 4);
      const segX = this.reactorX;
      const segY = this.snakeY + (anchorY - this.snakeY) * t;

      this.segments.push({
        x: segX,
        y: segY,
        angle: -Math.PI / 2,
        turretType: type,
        turretLevel: 1,
        lastFireTime: 0,
        targetAngle: -Math.PI / 2,
      });

      if (type === 'DRONE') {
        this.drones.push({
          id: Math.random().toString(),
          angle: Math.random() * Math.PI * 2,
          distance: 100 + Math.random() * 50,
          damage: 28,
          lastShot: 0,
        });
      }
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        this.triggerDash();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      this.mousePos = {
        x: (screenX - this.canvas.width / 2) / this.cameraZoom + this.cameraX,
        y: (screenY - this.canvas.height / 2) / this.cameraZoom + this.cameraY,
      };
    });

    this.canvas.addEventListener('mousedown', () => {
      this.useMouseSteering = true;
    });
  }

  public setTouchSteering(dx: number, dy: number) {
    if (Math.hypot(dx, dy) > 0.1) {
      this.touchDirection = { x: dx, y: dy };
      this.useMouseSteering = false;
    } else {
      this.touchDirection = null;
    }
  }

  public triggerDash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = this.maxDashCooldown;
      sound.playDash();

      this.screenShake = 8;
      this.environment.impartImpulse(this.snakeX, this.snakeY, 280, 60);
      for (let i = 0; i < 20; i++) {
        this.addParticle(
          this.snakeX - Math.cos(this.snakeAngle) * 22 + (Math.random() - 0.5) * 15,
          this.snakeY - Math.sin(this.snakeAngle) * 22 + (Math.random() - 0.5) * 15,
          -Math.cos(this.snakeAngle) * (180 + Math.random() * 240),
          -Math.sin(this.snakeAngle) * (180 + Math.random() * 240),
          '#38bdf8',
          0.35 + Math.random() * 0.25,
          6 + Math.random() * 4,
          'square'
        );
      }
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sound.startBgm();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop() {
    this.isRunning = false;
    sound.stopBgm();
  }

  public addHeadWeapon(type: TurretType) {
    const existing = this.headWeapons.find((w) => w.type === type);
    if (existing) {
      existing.level += 1;
    } else {
      this.headWeapons.push({
        type,
        level: 1,
        lastFireTime: 0,
      });
    }
    sound.playPickup();
  }

  public addSegment(type: TurretType) {
    const last = this.segments[this.segments.length - 1];
    const prevX = last ? last.x : this.snakeX;
    const prevY = last ? last.y : this.snakeY;
    const prevAngle = last ? last.angle : this.snakeAngle;

    this.segments.push({
      x: prevX - Math.cos(prevAngle) * SEGMENT_DISTANCE,
      y: prevY - Math.sin(prevAngle) * SEGMENT_DISTANCE,
      angle: prevAngle,
      turretType: type,
      turretLevel: 1,
      lastFireTime: 0,
      targetAngle: prevAngle,
    });

    if (type === 'DRONE') {
      this.drones.push({
        id: Math.random().toString(),
        angle: Math.random() * Math.PI * 2,
        distance: 100 + Math.random() * 50,
        damage: 26 * this.globalDamageMult,
        lastShot: 0,
      });
    }

    sound.playPickup();
    this.addDamageNumber(this.snakeX, this.snakeY - 32, `🛡️ 蛇身延長！守衛半徑 +${SEGMENT_DISTANCE}m`, '#00f0ff');
  }

  public upgradeTurretsOfType(type: TurretType) {
    // Upgrade both head weapons and body segments of this type
    this.headWeapons.forEach((hw) => {
      if (hw.type === type) hw.level += 1;
    });
    this.segments.forEach((seg) => {
      if (seg.turretType === type) seg.turretLevel += 1;
    });
    sound.playPickup();
  }

  private loop(now: number) {
    if (!this.isRunning) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    this.stats.timeSurvived += dt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 20);
    }

    // Update dynamic atmospheric battlefield environment
    this.environment.update(dt, this.wave % 5 === 0);

    // Shield passive regeneration
    if (this.snakeShield < this.snakeMaxShield) {
      this.snakeShield = Math.min(this.snakeMaxShield, this.snakeShield + dt * 6);
    }

    // Dash timer
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Wave Progression & Massive Spawning
    this.updateWave(dt);

    // Controls & Snake Movement
    this.updateSnakeInput(dt);
    this.updateSnakeBody(dt);

    // Primary Head Heavy Cannons & Body Auxiliary Turrets
    this.updateHeadWeapons(dt);
    this.updateBodyTurrets(dt);

    // Drones
    this.updateDrones(dt);

    // Projectiles, Mines, Puddles
    this.updateProjectiles(dt);
    this.updateMines(dt);
    this.updateVenomPuddles(dt);

    // Enemies (Enhanced AI & Formations)
    this.updateEnemies(dt);

    // Items & Magnet
    this.updateItems(dt);

    // Check Resonant Loop
    this.loopCheckTimer += dt;
    if (this.loopCheckTimer > 0.35) {
      this.loopCheckTimer = 0;
      this.checkResonantLoop();
    }

    // Particles & Damage numbers
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);
    this.updateMuzzleFlashes(dt);

    // Camera follow snake
    this.updateCamera();

    // Check game over
    if (this.snakeHp <= 0 || this.reactorHp <= 0) {
      this.gameOver(false);
    }
  }

  private updateMuzzleFlashes(dt: number) {
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.life -= dt;
      if (mf.life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  public waveKills: number = 0;

  private updateWave(dt: number) {
    // Check stage clear: must clear current wave enemies before advancing to next wave!
    const hasBoss = this.enemies.some((e) => e.isBoss);
    const waveQuotaMet = this.wave === 3 || this.wave === 5
      ? !hasBoss && this.enemies.length === 0
      : this.waveKills >= 22 && this.enemies.length === 0;

    if (waveQuotaMet) {
      if (this.wave < TOTAL_WAVES) {
        this.wave += 1;
        this.waveKills = 0;
        this.stats.wavesCleared += 1;
        sound.playLevelUp();
        this.addDamageNumber(this.snakeX, this.snakeY - 50, `✨ 第 ${this.wave - 1} 關突破！進入第 ${this.wave} 關`, '#38bdf8');

        if (this.onWaveChange) {
          this.onWaveChange(this.wave);
        }

        if (this.wave === 3 || this.wave === 5 || this.wave % 5 === 0) {
          sound.playBossAlarm();
          this.spawnBoss();
        }
      } else {
        this.gameOver(true);
        return;
      }
    }

    // Massive swarm spawning
    this.enemySpawnTimer += dt;
    // Spawn frequency: spawns batches of enemies frequently
    const spawnInterval = Math.max(0.35, 1.1 - this.wave * 0.1);
    if (this.enemySpawnTimer >= spawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemyPack();
    }
  }

  /**
   * Spawns dense formations of geometric monsters!
   */
  /**
   * Spawns structured tactical formations/arrays of geometric enemies!
   * Formations: V_FORMATION, PHALANX_WALL, SURROUND_RING, PINCER_FLANK, CONVOY_COLUMN
   */
  private spawnEnemyPack() {
    if (this.enemies.length > 200) return;

    const candidateTypes: EnemyType[] = ['geo_triangle', 'geo_vortex_triangle'];
    if (this.wave >= 2) candidateTypes.push('geo_hexagon', 'geo_square', 'geo_prism_dart');
    if (this.wave >= 3) candidateTypes.push('geo_pentagon', 'geo_helix_spiral', 'geo_pulsar_ring');
    if (this.wave >= 4) candidateTypes.push('geo_star', 'geo_cube_sentinel');
    if (this.wave >= 5) candidateTypes.push('geo_diamond', 'geo_octagon');

    const primaryType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];
    const supportType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];

    // 出場要同一個環 陣列進攻
    const count = Math.min(20, 10 + Math.floor(this.wave * 2));
    const spawnRingRadius = ARENA_RADIUS + 80;
    const startAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i / count) * Math.PI * 2;
      const x = this.reactorX + Math.cos(angle) * spawnRingRadius;
      const y = this.reactorY + Math.sin(angle) * spawnRingRadius;
      const enemyType = i % 3 === 0 ? supportType : primaryType;
      const e = this.createGeometricEnemy(enemyType, x, y);
      e.formationName = '同心環陣列進攻';
      e.movePattern = 'direct';
    }
  }

  private createGeometricEnemy(type: EnemyType, x: number, y: number): Enemy {
    const hpScale = 1 + (this.wave - 1) * 0.28;
    const dmgScale = 1 + (this.wave - 1) * 0.2;

    let baseHp = 45;
    let speed = 110;
    let radius = 16;
    let color = '#f87171';
    let damage = 14;
    let rotSpeed = 0.05;
    let isElite = Math.random() < 0.12 && this.wave >= 3;
    let movePattern: MovementPattern = 'direct';
    let orbitDistance = 320;

    switch (type) {
      case 'geo_triangle':
        baseHp = 40 * hpScale;
        speed = 155; // Fast darting
        radius = 15;
        color = '#ef4444'; // Red
        damage = 12 * dmgScale;
        rotSpeed = 0.08;
        movePattern = 'direct';
        break;

      case 'geo_square':
        baseHp = 130 * hpScale; // Heavy armor
        speed = 75;
        radius = 20;
        color = '#f59e0b'; // Amber
        damage = 26 * dmgScale;
        rotSpeed = 0.03;
        movePattern = 'direct';
        break;

      case 'geo_pentagon':
        baseHp = 70 * hpScale;
        speed = 90;
        radius = 18;
        color = '#a855f7'; // Purple
        damage = 18 * dmgScale;
        rotSpeed = 0.04;
        movePattern = 'direct';
        break;

      case 'geo_hexagon':
        baseHp = 45 * hpScale;
        speed = 120;
        radius = 14;
        color = '#06b6d4'; // Cyan
        damage = 12 * dmgScale;
        rotSpeed = 0.06;
        movePattern = 'direct';
        break;

      case 'geo_diamond':
        baseHp = 60 * hpScale;
        speed = 140;
        radius = 16;
        color = '#10b981'; // Emerald
        damage = 22 * dmgScale;
        rotSpeed = 0.07;
        movePattern = 'flank';
        break;

      case 'geo_octagon':
        baseHp = 220 * hpScale; // Heavy juggernaut
        speed = 70;
        radius = 26;
        color = '#f97316'; // Orange
        damage = 36 * dmgScale;
        rotSpeed = 0.02;
        isElite = true;
        movePattern = 'direct';
        break;

      case 'geo_star':
        baseHp = 35 * hpScale;
        speed = 180; // High speed kamikaze
        radius = 16;
        color = '#eab308'; // Bright yellow
        damage = 55 * dmgScale;
        rotSpeed = 0.14;
        movePattern = 'direct';
        break;

      // --- 5 NEW GEOMETRIC FOES ---
      case 'geo_vortex_triangle':
        baseHp = 65 * hpScale;
        speed = 135;
        radius = 17;
        color = '#00f0ff'; // Electric Cyan
        damage = 18 * dmgScale;
        rotSpeed = 0.12;
        movePattern = 'direct';
        break;

      case 'geo_pulsar_ring':
        baseHp = 95 * hpScale;
        speed = 85;
        radius = 21;
        color = '#ec4899'; // Hot Neon Pink
        damage = 24 * dmgScale;
        rotSpeed = 0.05;
        movePattern = 'direct';
        break;

      case 'geo_prism_dart':
        baseHp = 75 * hpScale;
        speed = 160;
        radius = 16;
        color = '#38bdf8'; // Sky Blue
        damage = 20 * dmgScale;
        rotSpeed = 0.04;
        movePattern = 'dive_dash';
        break;

      case 'geo_helix_spiral':
        baseHp = 80 * hpScale;
        speed = 115;
        radius = 18;
        color = '#c084fc'; // Light Violet
        damage = 16 * dmgScale;
        rotSpeed = 0.06;
        movePattern = 'sine';
        break;

      case 'geo_cube_sentinel':
        baseHp = 180 * hpScale;
        speed = 65;
        radius = 22;
        color = '#34d399'; // Mint Green
        damage = 30 * dmgScale;
        rotSpeed = 0.025;
        movePattern = 'phalanx';
        break;
    }

    // 怪物血量調整為 1/10 (即 100 倍基礎)
    baseHp *= 100;

    if (isElite) {
      baseHp *= 2.2;
      damage *= 1.4;
      radius *= 1.25;
    }

    // Increased EXP reward significantly per prompt request!
    const expValue = Math.round((28 + baseHp * 0.45) * (isElite ? 2.5 : 1.0));
    const scrapVal = isElite ? 3 : Math.random() < 0.4 ? 1 : 0;

    const enemy: Enemy = {
      id: Math.random().toString(),
      type,
      x,
      y,
      angle: 0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: rotSpeed,
      hp: baseHp,
      maxHp: baseHp,
      speed,
      damage,
      radius,
      color,
      scoreValue: Math.round(baseHp * 3),
      scrapValue: scrapVal,
      expValue,
      isBoss: false,
      isElite,
      slowTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      lastAttackTime: 0,
      attackInterval: 0.9,
      shootTimer: Math.random() * 2,
      movePattern,
      moveTimer: Math.random() * 5,
      orbitDistance,
      orbitDirection: Math.random() < 0.5 ? 1 : -1,
      dashPhase: 'aim',
      dashCooldown: 1.0 + Math.random() * 0.8,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  private spawnBoss() {
    let bossType: EnemyType = 'boss_tesseract';
    let bossHp = 6800000; // Reduced to 1/10th
    let bossRadius = 110;
    let bossColor = '#ec4899';
    let bossName = '超維泰坦·幾何巨擘';

    if (this.wave === 3) {
      bossType = 'boss_tesseract';
      bossHp = 6800000;
      bossRadius = 110; // Big Tesseract
      bossColor = '#ec4899'; // Neon pink
      bossName = '超維泰坦·幾何巨擘';
    } else if (this.wave === 5) {
      bossType = 'boss_world_eater';
      bossHp = 24000000; // Reduced to 1/10th
      bossRadius = 155; // Colossal 310px diameter!
      bossColor = '#dc2626'; // Blood red
      bossName = '終焉星蝕·萬象幾何原初巨神';
    } else {
      bossType = 'boss_void_star';
      bossHp = (15000 + this.wave * 1200) * 100; // Reduced to 1/10th
      bossRadius = 130;
      bossColor = '#8b5cf6'; // Violet
      bossName = '虛空湮滅星核·主宰';
    }

    const boss: Enemy = {
      id: 'boss_' + this.wave + '_' + Date.now(),
      type: bossType,
      x: ARENA_WIDTH / 2,
      y: -140,
      angle: Math.PI / 2,
      rotation: 0,
      rotationSpeed: 0.025,
      hp: bossHp,
      maxHp: bossHp,
      speed: 55,
      damage: 70,
      radius: bossRadius,
      color: bossColor,
      scoreValue: 35000,
      scrapValue: 80 + this.wave * 12,
      expValue: 1800, // Massive EXP reward
      isBoss: true,
      slowTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      lastAttackTime: 0,
      attackInterval: 0.8,
      shootTimer: 1.2,
      bossPhase: 1,
      shieldRadius: bossRadius + 36,
    };

    this.enemies.push(boss);
    this.screenShake = 18;
    this.addDamageNumber(ARENA_WIDTH / 2, 220, `⚠️ 巨型首領降臨：${bossName}`, '#ef4444');
  }

  private updateSnakeInput(dt: number) {
    let moveX = 0;
    let moveY = 0;

    // Keyboard
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      this.targetAngle = Math.atan2(moveY, moveX);
      this.useMouseSteering = false;
    } else if (this.touchDirection) {
      this.targetAngle = Math.atan2(this.touchDirection.y, this.touchDirection.x);
    } else if (this.useMouseSteering && this.mousePos) {
      const dx = this.mousePos.x - this.snakeX;
      const dy = this.mousePos.y - this.snakeY;
      if (Math.hypot(dx, dy) > 25) {
        this.targetAngle = Math.atan2(dy, dx);
      }
    }

    // Smooth angle turning
    let diff = this.targetAngle - this.snakeAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turnSpeed = this.isDashing ? 8.5 : 6.2;
    this.snakeAngle += diff * Math.min(1, turnSpeed * dt);

    // Current speed
    const currentSpeed = this.snakeSpeed * (this.isDashing ? DASH_SPEED_MULTIPLIER : 1.0);
    this.snakeX += Math.cos(this.snakeAngle) * currentSpeed * dt;
    this.snakeY += Math.sin(this.snakeAngle) * currentSpeed * dt;

    // Core-tethered distance constraints:
    // Tail is anchored to Prometheus Core; head cannot exceed total reach or crash inside core
    const minReach = this.getMinReach();
    const maxReach = this.getMaxReach();
    const coreDx = this.snakeX - this.reactorX;
    const coreDy = this.snakeY - this.reactorY;
    const coreDist = Math.hypot(coreDx, coreDy);

    if (coreDist > maxReach) {
      this.snakeX = this.reactorX + (coreDx / coreDist) * maxReach;
      this.snakeY = this.reactorY + (coreDy / coreDist) * maxReach;
    } else if (coreDist < minReach && coreDist > 0.001) {
      this.snakeX = this.reactorX + (coreDx / coreDist) * minReach;
      this.snakeY = this.reactorY + (coreDy / coreDist) * minReach;
    }

    // Circular Arena Boundary Clamp (邊界為圓形)
    const arenaDist = Math.hypot(this.snakeX - this.reactorX, this.snakeY - this.reactorY);
    if (arenaDist > ARENA_RADIUS - SNAKE_HEAD_RADIUS) {
      const aAng = Math.atan2(this.snakeY - this.reactorY, this.snakeX - this.reactorX);
      this.snakeX = this.reactorX + Math.cos(aAng) * (ARENA_RADIUS - SNAKE_HEAD_RADIUS);
      this.snakeY = this.reactorY + Math.sin(aAng) * (ARENA_RADIUS - SNAKE_HEAD_RADIUS);
    }
  }

  private updateSnakeBody(dt: number) {
    if (this.segments.length === 0) return;

    const anchor = this.getCoreAnchorPoint();
    const N = this.segments.length;

    // Pass 1: Forward following from head to tail
    let leaderX = this.snakeX;
    let leaderY = this.snakeY;

    for (let i = 0; i < N; i++) {
      const seg = this.segments[i];
      const dx = leaderX - seg.x;
      const dy = leaderY - seg.y;
      const dist = Math.hypot(dx, dy);

      if (dist > SEGMENT_DISTANCE) {
        const angle = Math.atan2(dy, dx);
        seg.angle = angle;
        seg.x = leaderX - Math.cos(angle) * SEGMENT_DISTANCE;
        seg.y = leaderY - Math.sin(angle) * SEGMENT_DISTANCE;
      }

      leaderX = seg.x;
      leaderY = seg.y;
    }

    // Pass 2: Anchor tail segment directly to reactor core perimeter socket
    const tail = this.segments[N - 1];
    const tailAnchorDist = Math.hypot(tail.x - anchor.x, tail.y - anchor.y);
    if (tailAnchorDist > SEGMENT_DISTANCE) {
      const ang = Math.atan2(tail.y - anchor.y, tail.x - anchor.x);
      tail.x = anchor.x + Math.cos(ang) * SEGMENT_DISTANCE;
      tail.y = anchor.y + Math.sin(ang) * SEGMENT_DISTANCE;
    }

    // Pass 3: Backward relaxation from tail up to head to avoid overstretching
    for (let i = N - 2; i >= 0; i--) {
      const curr = this.segments[i];
      const next = this.segments[i + 1];
      const dx = curr.x - next.x;
      const dy = curr.y - next.y;
      const dist = Math.hypot(dx, dy);

      if (dist > SEGMENT_DISTANCE) {
        const ang = Math.atan2(dy, dx);
        curr.x = next.x + Math.cos(ang) * SEGMENT_DISTANCE;
        curr.y = next.y + Math.sin(ang) * SEGMENT_DISTANCE;
      }

      // Prevent any segment from collapsing into reactor core interior
      const rDist = Math.hypot(curr.x - this.reactorX, curr.y - this.reactorY);
      if (rDist < REACTOR_RADIUS + SNAKE_BODY_RADIUS + 4) {
        const rAng = Math.atan2(curr.y - this.reactorY, curr.x - this.reactorX);
        curr.x = this.reactorX + Math.cos(rAng) * (REACTOR_RADIUS + SNAKE_BODY_RADIUS + 4);
        curr.y = this.reactorY + Math.sin(rAng) * (REACTOR_RADIUS + SNAKE_BODY_RADIUS + 4);
      }
    }

    // Pass 4: Final forward alignment and angle recalculation
    leaderX = this.snakeX;
    leaderY = this.snakeY;
    for (let i = 0; i < N; i++) {
      const seg = this.segments[i];
      const dx = leaderX - seg.x;
      const dy = leaderY - seg.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        seg.angle = Math.atan2(dy, dx);
        if (dist > SEGMENT_DISTANCE) {
          seg.x = leaderX - Math.cos(seg.angle) * SEGMENT_DISTANCE;
          seg.y = leaderY - Math.sin(seg.angle) * SEGMENT_DISTANCE;
        }
      }

      // Drop venom puddles if equipped
      if (seg.turretType === 'VENOM_TRAIL') {
        if (Math.random() < dt * 8) {
          this.venomPuddles.push({
            id: Math.random().toString(),
            x: seg.x + (Math.random() - 0.5) * 12,
            y: seg.y + (Math.random() - 0.5) * 12,
            radius: 32 + seg.turretLevel * 5,
            damagePerSec: (28 + seg.turretLevel * 9) * this.globalDamageMult,
            duration: 5.0,
          });
        }
      }

      leaderX = seg.x;
      leaderY = seg.y;
    }
  }

  public getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const halfW = (this.canvas.width / 2) / this.cameraZoom;
    const halfH = (this.canvas.height / 2) / this.cameraZoom;
    return {
      minX: this.cameraX - halfW,
      maxX: this.cameraX + halfW,
      minY: this.cameraY - halfH,
      maxY: this.cameraY + halfH,
    };
  }

  public isEnemyOnScreen(enemy: { x: number; y: number; radius?: number }): boolean {
    const r = enemy.radius || 0;
    const b = this.getVisibleBounds();
    return (
      enemy.x + r >= b.minX &&
      enemy.x - r <= b.maxX &&
      enemy.y + r >= b.minY &&
      enemy.y - r <= b.maxY
    );
  }

  public isItemOnScreen(item: { x: number; y: number; radius?: number }): boolean {
    const r = item.radius || 0;
    const b = this.getVisibleBounds();
    return (
      item.x + r >= b.minX &&
      item.x - r <= b.maxX &&
      item.y + r >= b.minY &&
      item.y - r <= b.maxY
    );
  }

  /**
   * Primary Head Arsenal:
   * Snake Head mounts the heaviest artillery with expanded attack range (500~720px)
   * Firing multiple forward projectile cones and auto-aiming lasers!
   * Targets strictly enemies visible on the screen!
   */
  private updateHeadWeapons(dt: number) {
    const now = performance.now() / 1000;

    for (const hw of this.headWeapons) {
      const def = TURRET_CATALOG[hw.type];
      if (!def) continue;

      const effectiveInterval = (def.fireInterval * 1.4) / (this.fireRateMult * (1 + hw.level * 0.15));
      if (now - hw.lastFireTime < effectiveInterval) continue;

      // Find targets in extended head range - ONLY ON-SCREEN ENEMIES!
      const headRange = def.range * 1.25;
      let targetEnemy: Enemy | null = null;
      let closestDist = headRange;

      for (const e of this.enemies) {
        if (!this.isEnemyOnScreen(e)) continue;

        const d = Math.hypot(e.x - this.snakeX, e.y - this.snakeY);
        if (d < closestDist) {
          closestDist = d;
          targetEnemy = e;
        }
      }

      if (!targetEnemy) continue;

      hw.lastFireTime = now;
      const damage = (def.baseDamage * 1.5 + hw.level * 10) * this.globalDamageMult;
      const aimAngle = Math.atan2(targetEnemy.y - this.snakeY, targetEnemy.x - this.snakeX);

      // Fire weapon from Snake Head prow
      sound.playTurretShot(hw.type);

      switch (hw.type) {
        case 'GATLING': {
          // Multi-barrel burst from head with intense muzzle flash
          this.addMuzzleFlash(this.snakeX + Math.cos(this.snakeAngle) * 22, this.snakeY + Math.sin(this.snakeAngle) * 22, aimAngle, 'GATLING', '#38bdf8');
          const barrels = 1 + Math.floor(hw.level / 2);
          for (let b = 0; b < barrels; b++) {
            const spread = (Math.random() - 0.5) * 0.18;
            this.projectiles.push({
              id: Math.random().toString(),
              x: this.snakeX + Math.cos(this.snakeAngle) * 20,
              y: this.snakeY + Math.sin(this.snakeAngle) * 20,
              vx: Math.cos(aimAngle + spread) * 720,
              vy: Math.sin(aimAngle + spread) * 720,
              radius: 5,
              damage,
              color: '#38bdf8',
              source: 'player',
              duration: 1.5,
              pierceLeft: Math.floor(hw.level / 3),
            });
          }
          break;
        }

        case 'LASER': {
          // Twin forward laser lance array with high-energy lens bloom
          this.addMuzzleFlash(this.snakeX + Math.cos(this.snakeAngle) * 24, this.snakeY + Math.sin(this.snakeAngle) * 24, aimAngle, 'LASER', '#ef4444');
          const laserRange = headRange * 1.2;
          const endX = this.snakeX + Math.cos(aimAngle) * laserRange;
          const endY = this.snakeY + Math.sin(aimAngle) * laserRange;

          this.projectiles.push({
            id: Math.random().toString(),
            x: this.snakeX,
            y: this.snakeY,
            vx: 0,
            vy: 0,
            radius: 5,
            damage,
            color: '#ef4444',
            source: 'player',
            duration: 0.15,
            isLaser: true,
            laserEndX: endX,
            laserEndY: endY,
          });

          // Pierce all enemies in beam (strictly on screen)
          for (const enemy of this.enemies) {
            if (!this.isEnemyOnScreen(enemy)) continue;
            if (this.distToSegment(enemy.x, enemy.y, this.snakeX, this.snakeY, endX, endY) < enemy.radius + 15) {
              this.applyDamageToEnemy(enemy, damage, 'Head Laser Lance');
            }
          }
          break;
        }

        case 'PLASMA': {
          // Heavy plasma mortar from head with shockwave ring
          this.addMuzzleFlash(this.snakeX + Math.cos(this.snakeAngle) * 20, this.snakeY + Math.sin(this.snakeAngle) * 20, aimAngle, 'PLASMA', '#a855f7');
          this.projectiles.push({
            id: Math.random().toString(),
            x: this.snakeX,
            y: this.snakeY,
            vx: Math.cos(aimAngle) * 440,
            vy: Math.sin(aimAngle) * 440,
            radius: 11,
            damage: damage * 1.3,
            color: '#a855f7',
            source: 'player',
            duration: 1.6,
            aoeRadius: 110 + hw.level * 15,
          });
          break;
        }

        case 'TESLA': {
          // Chain lightning from snake horn
          this.addMuzzleFlash(this.snakeX, this.snakeY, aimAngle, 'TESLA', '#06b6d4');
          this.triggerTeslaArc(this.snakeX, this.snakeY, targetEnemy, damage, 4 + hw.level);
          break;
        }

        default: {
          this.addMuzzleFlash(this.snakeX, this.snakeY, aimAngle, hw.type, def.color);
          this.projectiles.push({
            id: Math.random().toString(),
            x: this.snakeX,
            y: this.snakeY,
            vx: Math.cos(aimAngle) * 550,
            vy: Math.sin(aimAngle) * 550,
            radius: 6,
            damage,
            color: def.color,
            source: 'player',
            duration: 1.2,
          });
        }
      }
    }
  }

  private updateBodyTurrets(dt: number) {
    const now = performance.now() / 1000;

    for (const seg of this.segments) {
      const def = TURRET_CATALOG[seg.turretType];
      if (!def) continue;

      const effectiveInterval = (def.fireInterval * 1.4) / (this.fireRateMult * (1 + seg.turretLevel * 0.12));
      if (now - seg.lastFireTime < effectiveInterval) continue;

      if (seg.turretType === 'MINE_LAYER') {
        seg.lastFireTime = now;
        sound.playTurretShot('MINE_LAYER');
        this.mines.push({
          id: Math.random().toString(),
          x: seg.x,
          y: seg.y,
          radius: 22,
          damage: (def.baseDamage + seg.turretLevel * 20) * this.globalDamageMult,
          timer: 0.2,
          duration: 20,
          color: def.color,
        });
        continue;
      }

      if (seg.turretType === 'SHIELD_GEN') {
        seg.lastFireTime = now;
        this.triggerShieldPulse(seg.x, seg.y, def.range, (def.baseDamage + seg.turretLevel * 12) * this.globalDamageMult);
        continue;
      }

      if (seg.turretType === 'VENOM_TRAIL') continue;

      // Auxiliary targeting - ONLY ON-SCREEN ENEMIES!
      let closestEnemy: Enemy | null = null;
      let closestDist = def.range;

      for (const enemy of this.enemies) {
        if (!this.isEnemyOnScreen(enemy)) continue;

        const dist = Math.hypot(enemy.x - seg.x, enemy.y - seg.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (!closestEnemy) continue;

      seg.lastFireTime = now;
      seg.targetAngle = Math.atan2(closestEnemy.y - seg.y, closestEnemy.x - seg.x);
      const damage = (def.baseDamage + seg.turretLevel * 7) * this.globalDamageMult;

      sound.playTurretShot(seg.turretType);
      this.addMuzzleFlash(seg.x, seg.y, seg.targetAngle, seg.turretType, def.color);

      if (seg.turretType === 'TESLA') {
        this.triggerTeslaArc(seg.x, seg.y, closestEnemy, damage, 3 + seg.turretLevel);
      } else if (seg.turretType === 'FLAME') {
        for (let f = 0; f < 3; f++) {
          const coneAngle = seg.targetAngle + (Math.random() - 0.5) * 0.5;
          this.projectiles.push({
            id: Math.random().toString(),
            x: seg.x,
            y: seg.y,
            vx: Math.cos(coneAngle) * (300 + Math.random() * 80),
            vy: Math.sin(coneAngle) * (300 + Math.random() * 80),
            radius: 8,
            damage: damage * 0.7,
            color: def.color,
            source: 'player',
            duration: 0.5,
            burnDamage: damage * 0.45,
            pierceLeft: 4,
          });
        }
      } else if (seg.turretType === 'CRYO') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: seg.x,
          y: seg.y,
          vx: Math.cos(seg.targetAngle) * 480,
          vy: Math.sin(seg.targetAngle) * 480,
          radius: 7,
          damage,
          color: def.color,
          source: 'player',
          duration: 1.2,
          slowAmount: 0.5,
          pierceLeft: 3 + seg.turretLevel,
        });
      } else {
        this.projectiles.push({
          id: Math.random().toString(),
          x: seg.x,
          y: seg.y,
          vx: Math.cos(seg.targetAngle) * 600,
          vy: Math.sin(seg.targetAngle) * 600,
          radius: 5,
          damage,
          color: def.color,
          source: 'player',
          duration: 1.3,
        });
      }
    }
  }

  private triggerTeslaArc(startX: number, startY: number, initialTarget: Enemy, damage: number, maxChains: number) {
    let currentTarget: Enemy | null = initialTarget;
    const hitSet = new Set<string>();

    let prevX = startX;
    let prevY = startY;

    for (let c = 0; c < maxChains && currentTarget; c++) {
      hitSet.add(currentTarget.id);
      this.applyDamageToEnemy(currentTarget, damage * Math.pow(0.88, c), 'Tesla Spire');
      this.addLightningEffect(prevX, prevY, currentTarget.x, currentTarget.y, '#06b6d4');

      prevX = currentTarget.x;
      prevY = currentTarget.y;

      let nextEnemy: Enemy | null = null;
      let nextDist = 200;
      for (const e of this.enemies) {
        if (!hitSet.has(e.id) && this.isEnemyOnScreen(e)) {
          const d = Math.hypot(e.x - prevX, e.y - prevY);
          if (d < nextDist) {
            nextDist = d;
            nextEnemy = e;
          }
        }
      }
      currentTarget = nextEnemy;
    }
  }

  private triggerShieldPulse(x: number, y: number, radius: number, damage: number) {
    this.screenShake = 5;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < radius) {
        const pushAngle = Math.atan2(enemy.y - y, enemy.x - x);
        enemy.x += Math.cos(pushAngle) * 75;
        enemy.y += Math.sin(pushAngle) * 75;
        this.applyDamageToEnemy(enemy, damage, 'Aegis Field');
      }
    }
  }

  private updateDrones(dt: number) {
    const now = performance.now() / 1000;
    for (const drone of this.drones) {
      drone.angle += dt * 2.4;
      const dx = this.snakeX + Math.cos(drone.angle) * drone.distance;
      const dy = this.snakeY + Math.sin(drone.angle) * drone.distance;

      if (now - drone.lastShot > 0.35) {
        let closest: Enemy | null = null;
        let cDist = 260;
        for (const e of this.enemies) {
          if (!this.isEnemyOnScreen(e)) continue;

          const d = Math.hypot(e.x - dx, e.y - dy);
          if (d < cDist) {
            cDist = d;
            closest = e;
          }
        }

        if (closest) {
          drone.lastShot = now;
          const shotAngle = Math.atan2(closest.y - dy, closest.x - dx);
          this.projectiles.push({
            id: Math.random().toString(),
            x: dx,
            y: dy,
            vx: Math.cos(shotAngle) * 600,
            vy: Math.sin(shotAngle) * 600,
            radius: 4,
            damage: drone.damage,
            color: '#4ade80',
            source: 'player',
            duration: 1.0,
          });
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.duration -= dt;

      if (p.duration <= 0) {
        if (p.aoeRadius) {
          this.detonateExplosion(p.x, p.y, p.aoeRadius, p.damage, 'Plasma Mortar');
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isLaser) continue;

      // --- ADVANCED BALLISTIC TRAJECTORY SYSTEM ---
      if (p.bulletPattern === 'sine') {
        p.patternTimer = (p.patternTimer || 0) + dt;
        const baseVx = p.baseVx ?? p.vx;
        const baseVy = p.baseVy ?? p.vy;
        const spd = Math.hypot(baseVx, baseVy) || 1;
        const nx = -baseVy / spd;
        const ny = baseVx / spd;
        const freq = p.frequency || 7.5;
        const amp = p.amplitude || 160;
        const waveOffset = Math.sin(p.patternTimer * freq) * amp;

        p.x += baseVx * dt + nx * Math.cos(p.patternTimer * freq) * amp * dt;
        p.y += baseVy * dt + ny * Math.cos(p.patternTimer * freq) * amp * dt;
      } else if (p.bulletPattern === 'spiral') {
        p.patternTimer = (p.patternTimer || 0) + dt;
        const spd = Math.hypot(p.vx, p.vy) || 200;
        const currentAngle = Math.atan2(p.vy, p.vx) + (p.curveSpeed || 2.2) * dt;
        p.vx = Math.cos(currentAngle) * spd;
        p.vy = Math.sin(currentAngle) * spd;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.bulletPattern === 'accel') {
        // Accelerates rapidly forward
        const spd = Math.hypot(p.vx, p.vy) + 380 * dt;
        const dir = Math.atan2(p.vy, p.vx);
        p.vx = Math.cos(dir) * spd;
        p.vy = Math.sin(dir) * spd;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (Math.random() < 0.45) {
          this.addParticle(p.x, p.y, -p.vx * 0.15, -p.vy * 0.15, p.color, 0.15, 3, 'circle');
        }
      } else if (p.bulletPattern === 'ring') {
        // Expanding circular shockwave ripple
        p.radius = Math.min(85, p.radius + 60 * dt);
        p.x += p.vx * dt * 0.5;
        p.y += p.vy * dt * 0.5;
      } else if (p.bulletPattern === 'cluster_split') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.splitTimer = (p.splitTimer || 0.75) - dt;

        if (p.splitTimer <= 0 && !p.hasSplit) {
          p.hasSplit = true;
          // Split into 3 sharp sub-shards spreading outward!
          const curA = Math.atan2(p.vy, p.vx);
          const angles = [curA - 0.45, curA, curA + 0.45];
          for (const sa of angles) {
            this.projectiles.push({
              id: Math.random().toString(),
              x: p.x,
              y: p.y,
              vx: Math.cos(sa) * 260,
              vy: Math.sin(sa) * 260,
              radius: 5,
              damage: p.damage * 0.6,
              color: p.color,
              source: p.source,
              duration: 1.8,
              shape: 'diamond',
              bulletPattern: 'linear',
            });
          }
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Linear trajectory
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      if (p.source === 'player') {
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = this.enemies[eIdx];
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);

          if (dist < enemy.radius + p.radius) {
            if (p.aoeRadius) {
              this.detonateExplosion(p.x, p.y, p.aoeRadius, p.damage, 'Plasma Mortar');
              this.projectiles.splice(i, 1);
              break;
            } else {
              this.applyDamageToEnemy(enemy, p.damage, 'Kinetic Battery');
              if (p.slowAmount) enemy.slowTimer = 2.0;
              if (p.burnDamage) {
                enemy.burnTimer = 3.0;
                enemy.burnDps = p.burnDamage;
              }

              if (p.pierceLeft && p.pierceLeft > 0) {
                p.pierceLeft -= 1;
              } else {
                this.projectiles.splice(i, 1);
                break;
              }
            }
          }
        }
      } else if (p.source === 'enemy') {
        const distSnake = Math.hypot(this.snakeX - p.x, this.snakeY - p.y);
        const distReactor = Math.hypot(this.reactorX - p.x, this.reactorY - p.y);

        // 1. Direct hit on snake head
        if (distSnake < SNAKE_HEAD_RADIUS + p.radius) {
          this.damageSnake(p.damage);
          this.projectiles.splice(i, 1);
          continue;
        }

        // 2. Snake body intercepting and blocking enemy bullets!
        let blockedByBody = false;
        for (const seg of this.segments) {
          const segDist = Math.hypot(seg.x - p.x, seg.y - p.y);
          if (segDist < SNAKE_BODY_RADIUS + p.radius + 10) {
            blockedByBody = true;
            sound.playHitSound();

            // Serpent body deflects bullet; takes 20% chip damage (shield absorbs first)
            this.damageSnake(p.damage * 0.2);
            this.screenShake = Math.max(this.screenShake, 3);

            // Neon deflection sparks & energetic shockwave
            for (let k = 0; k < 8; k++) {
              const sparkAngle = Math.atan2(p.y - seg.y, p.x - seg.x) + (Math.random() - 0.5) * 1.5;
              const spd = 140 + Math.random() * 200;
              this.addParticle(
                p.x,
                p.y,
                Math.cos(sparkAngle) * spd,
                Math.sin(sparkAngle) * spd,
                '#00f0ff',
                0.3,
                4 + Math.random() * 3,
                'square'
              );
            }

            this.addDamageNumber(p.x, p.y - 12, '🛡️ DEFLECT', '#00f0ff');
            break;
          }
        }

        if (blockedByBody) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // 3. Bullet penetrates to Prometheus Core
        if (distReactor < REACTOR_RADIUS + p.radius) {
          this.damageReactor(p.damage);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  private updateMines(dt: number) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      mine.timer -= dt;
      mine.duration -= dt;

      if (mine.duration <= 0) {
        this.mines.splice(i, 1);
        continue;
      }

      if (mine.timer <= 0) {
        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - mine.x, enemy.y - mine.y);
          if (dist < enemy.radius + mine.radius) {
            this.detonateExplosion(mine.x, mine.y, 110, mine.damage, 'Tail Mine Layer');
            this.mines.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private updateVenomPuddles(dt: number) {
    for (let i = this.venomPuddles.length - 1; i >= 0; i--) {
      const puddle = this.venomPuddles[i];
      puddle.duration -= dt;
      if (puddle.duration <= 0) {
        this.venomPuddles.splice(i, 1);
        continue;
      }

      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - puddle.x, enemy.y - puddle.y);
        if (dist < enemy.radius + puddle.radius) {
          this.applyDamageToEnemy(enemy, puddle.damagePerSec * dt, 'Venom Sprayer', false);
          enemy.slowTimer = Math.max(enemy.slowTimer, 0.5);
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    const now = performance.now() / 1000;

    // Boss detection & 10 layers health tracking
    this.currentBoss = this.enemies.find((e) => e.isBoss) || null;
    if (this.currentBoss) {
      const singleLayer = this.currentBoss.maxHp / 10;
      const currentLayer = Math.min(10, Math.max(1, Math.ceil(this.currentBoss.hp / singleLayer)));
      if (currentLayer < this.lastBossLayer) {
        this.bossLayerBreakTimer = 0.6;
        this.screenShake = 18;
        sound.playBossDeath();
        this.addDamageNumber(
          this.currentBoss.x,
          this.currentBoss.y - 75,
          `💥 泰坦護盾第 ${this.lastBossLayer} 層擊破！剩餘 x${currentLayer} 層`,
          '#f59e0b'
        );
      }
      this.lastBossLayer = currentLayer;
    } else {
      this.lastBossLayer = 10;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Geometric rotation
      enemy.rotation += enemy.rotationSpeed;

      // Status effects
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        this.applyDamageToEnemy(enemy, enemy.burnDps * dt, 'Burn DOT', false);
      }
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
      }

      const speedFactor = enemy.slowTimer > 0 ? 0.5 : 1.0;
      const globalTime = performance.now() / 1000;
      const cycleTime = globalTime % 2.3;
      const rhythmMultiplier = (cycleTime < 1.5 || enemy.isBoss) ? 1.0 : 0.0;
      const currentSpeed = enemy.speed * speedFactor * rhythmMultiplier;

      // Target selection
      const distToSnake = Math.hypot(this.snakeX - enemy.x, this.snakeY - enemy.y);
      let targetX = this.reactorX;
      let targetY = this.reactorY;

      if (enemy.type === 'geo_star' || enemy.type === 'geo_diamond' || distToSnake < 260) {
        targetX = this.snakeX;
        targetY = this.snakeY;
      }

      const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
      enemy.angle = angle;
      enemy.moveTimer = (enemy.moveTimer || 0) + dt;

      // --- DISTINCT ATTACK STYLES PER ENEMY TYPE ---
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;

      // 1. Pentagon: 3-way geometric dart shotgun spread
      if (enemy.type === 'geo_pentagon' && enemy.shootTimer >= 2.2) {
        enemy.shootTimer = 0;
        for (let s = -1; s <= 1; s++) {
          const shotA = angle + s * 0.28;
          this.projectiles.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(shotA) * 240,
            vy: Math.sin(shotA) * 240,
            radius: 6,
            damage: enemy.damage,
            color: '#c084fc',
            source: 'enemy',
            duration: 2.6,
            shape: 'shard',
            bulletPattern: 'linear',
          });
        }
      }
      // 2. Vortex Triangle: Shoots twin spiraling crescent shuriken darts
      else if (enemy.type === 'geo_vortex_triangle' && enemy.shootTimer >= 2.1) {
        enemy.shootTimer = 0;
        for (const dir of [-1, 1]) {
          const shotA = angle + dir * 0.4;
          this.projectiles.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(shotA) * 210,
            vy: Math.sin(shotA) * 210,
            radius: 8,
            damage: enemy.damage * 0.9,
            color: '#00f0ff',
            source: 'enemy',
            duration: 3.0,
            shape: 'crescent',
            bulletPattern: 'spiral',
            curveSpeed: dir * 2.8,
          });
        }
      }
      // 3. Pulsar Ring: Emits expanding ring shockwave wave
      else if (enemy.type === 'geo_pulsar_ring' && enemy.shootTimer >= 3.0) {
        enemy.shootTimer = 0;
        this.projectiles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 70,
          vy: Math.sin(angle) * 70,
          radius: 14,
          damage: enemy.damage * 1.3,
          color: '#ec4899',
          source: 'enemy',
          duration: 3.2,
          shape: 'ring',
          bulletPattern: 'ring',
        });
      }
      // 4. Prism Dart: Fires supersonic twin accelerating rail-shards
      else if (enemy.type === 'geo_prism_dart' && enemy.shootTimer >= 1.9) {
        enemy.shootTimer = 0;
        for (const off of [-7, 7]) {
          const perpA = angle + Math.PI / 2;
          const sx = enemy.x + Math.cos(perpA) * off;
          const sy = enemy.y + Math.sin(perpA) * off;
          this.projectiles.push({
            id: Math.random().toString(),
            x: sx,
            y: sy,
            vx: Math.cos(angle) * 120,
            vy: Math.sin(angle) * 120,
            radius: 6,
            damage: enemy.damage * 1.1,
            color: '#38bdf8',
            source: 'enemy',
            duration: 2.2,
            shape: 'shard',
            bulletPattern: 'accel',
          });
        }
      }
      // 5. Helix Spiral: Fires dual sine-wave undulating plasma orbs
      else if (enemy.type === 'geo_helix_spiral' && enemy.shootTimer >= 2.0) {
        enemy.shootTimer = 0;
        for (const freqMult of [-1, 1]) {
          this.projectiles.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 190,
            vy: Math.sin(angle) * 190,
            baseVx: Math.cos(angle) * 190,
            baseVy: Math.sin(angle) * 190,
            radius: 7,
            damage: enemy.damage,
            color: '#a855f7',
            source: 'enemy',
            duration: 3.2,
            shape: 'helix_orb',
            bulletPattern: 'sine',
            amplitude: 140 * freqMult,
            frequency: 7.0,
          });
        }
      }
      // 6. Monolith Sentinel Cube: Fires 4-point rotating crossfire burst
      else if (enemy.type === 'geo_cube_sentinel' && enemy.shootTimer >= 2.6) {
        enemy.shootTimer = 0;
        for (let c = 0; c < 4; c++) {
          const crossA = enemy.rotation + (c / 4) * Math.PI * 2;
          this.projectiles.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(crossA) * 180,
            vy: Math.sin(crossA) * 180,
            radius: 8,
            damage: enemy.damage * 0.9,
            color: '#34d399',
            source: 'enemy',
            duration: 2.8,
            shape: 'cross',
            bulletPattern: 'linear',
          });
        }
      }
      // 7. Octagon Juggernaut: Fires cluster split mortar shell
      else if (enemy.type === 'geo_octagon' && enemy.shootTimer >= 2.8) {
        enemy.shootTimer = 0;
        this.projectiles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 160,
          vy: Math.sin(angle) * 160,
          radius: 11,
          damage: enemy.damage * 1.5,
          color: '#f97316',
          source: 'enemy',
          duration: 3.0,
          shape: 'diamond',
          bulletPattern: 'cluster_split',
          splitTimer: 0.85,
        });
      }
      // 8. Triangle: Fast razor needle
      else if (enemy.type === 'geo_triangle' && enemy.shootTimer >= 2.6) {
        enemy.shootTimer = 0;
        this.projectiles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 280,
          vy: Math.sin(angle) * 280,
          radius: 5,
          damage: enemy.damage * 0.8,
          color: '#ef4444',
          source: 'enemy',
          duration: 2.0,
          shape: 'shard',
          bulletPattern: 'linear',
        });
      }

      // Boss Special Super-Attacks
      if (enemy.isBoss) {
        if (enemy.type === 'boss_tesseract' && enemy.shootTimer >= 2.2) {
          enemy.shootTimer = 0;
          for (let b = 0; b < 12; b++) {
            const bAngle = enemy.rotation + (b / 12) * Math.PI * 2;
            this.projectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(bAngle) * 210,
              vy: Math.sin(bAngle) * 210,
              radius: 8,
              damage: enemy.damage * 0.8,
              color: '#f43f5e',
              source: 'enemy',
              duration: 3.5,
              shape: 'diamond',
              bulletPattern: 'linear',
            });
          }
        } else if (enemy.type === 'boss_void_star' && enemy.shootTimer >= 1.6) {
          enemy.shootTimer = 0;
          for (let s = 0; s < 16; s++) {
            const bAngle = enemy.rotation * 2 + (s / 16) * Math.PI * 2;
            this.projectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(bAngle) * 240,
              vy: Math.sin(bAngle) * 240,
              radius: 9,
              damage: enemy.damage,
              color: '#a855f7',
              source: 'enemy',
              duration: 3.8,
              shape: 'helix_orb',
              bulletPattern: 'spiral',
              curveSpeed: 0.8,
            });
          }
        } else if (enemy.type === 'boss_world_eater' && enemy.shootTimer >= 1.4) {
          enemy.shootTimer = 0;
          for (let s = 0; s < 20; s++) {
            const bAngle = (s / 20) * Math.PI * 2;
            this.projectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(bAngle) * 230,
              vy: Math.sin(bAngle) * 230,
              radius: 10,
              damage: enemy.damage,
              color: '#ef4444',
              source: 'enemy',
              duration: 4.0,
              shape: 'shard',
              bulletPattern: 'linear',
            });
          }
          this.createGeometricEnemy('geo_triangle', enemy.x + (Math.random() - 0.5) * 80, enemy.y + (Math.random() - 0.5) * 80);
        }
      }

      // --- DISTINCT MOVEMENT PATH TRAJECTORIES ---
      const pattern = enemy.movePattern || 'direct';

      if (pattern === 'vortex') {
        // Corkscrew inward vortex: revolves around target while contracting radius
        const curDist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
        let curAngle = Math.atan2(enemy.y - targetY, enemy.x - targetX);
        curAngle += (1.6 * dt) * (enemy.orbitDirection || 1);
        const newDist = Math.max(80, curDist - currentSpeed * 0.7 * dt);
        enemy.x = targetX + Math.cos(curAngle) * newDist;
        enemy.y = targetY + Math.sin(curAngle) * newDist;
      } else if (pattern === 'orbit') {
        // Orbital trajectory: circles at orbitDistance
        const desiredDist = enemy.orbitDistance || 340;
        const curDist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
        let curAngle = Math.atan2(enemy.y - targetY, enemy.x - targetX);
        const angSpeed = (currentSpeed / desiredDist) * (enemy.orbitDirection || 1);
        curAngle += angSpeed * dt;
        const radialShift = (desiredDist - curDist) * 1.5 * dt;
        const newDist = curDist + radialShift;
        enemy.x = targetX + Math.cos(curAngle) * newDist;
        enemy.y = targetY + Math.sin(curAngle) * newDist;
      } else if (pattern === 'sine') {
        // Sine wave harmonic undulation
        const perpA = angle + Math.PI / 2;
        const sineWave = Math.sin(enemy.moveTimer * 5.2) * 130;
        enemy.x += (Math.cos(angle) * currentSpeed + Math.cos(perpA) * sineWave) * dt;
        enemy.y += (Math.sin(angle) * currentSpeed + Math.sin(perpA) * sineWave) * dt;
      } else if (pattern === 'dive_dash') {
        // Dive-Dash: aim phase then supersonic dash burst
        enemy.dashCooldown = (enemy.dashCooldown || 1.4) - dt;
        if (enemy.dashPhase === 'aim') {
          // Slow hovering while aiming
          enemy.x += Math.cos(angle) * currentSpeed * 0.4 * dt;
          enemy.y += Math.sin(angle) * currentSpeed * 0.4 * dt;
          if (enemy.dashCooldown <= 0) {
            enemy.dashPhase = 'charge';
            enemy.dashCooldown = 0.65;
            enemy.dashTargetX = Math.cos(angle) * 380;
            enemy.dashTargetY = Math.sin(angle) * 380;
          }
        } else {
          // Supersonic kinetic dash
          enemy.x += (enemy.dashTargetX || 0) * dt;
          enemy.y += (enemy.dashTargetY || 0) * dt;
          if (Math.random() < 0.6) {
            this.addParticle(enemy.x, enemy.y, -(enemy.dashTargetX || 0) * 0.1, -(enemy.dashTargetY || 0) * 0.1, '#38bdf8', 0.2, 4, 'triangle');
          }
          if (enemy.dashCooldown <= 0) {
            enemy.dashPhase = 'aim';
            enemy.dashCooldown = 1.3 + Math.random() * 0.6;
          }
        }
      } else if (pattern === 'flank') {
        // Flanking pincer trajectory: arcs around lateral sides
        const flankOffset = Math.sin(enemy.moveTimer * 2.2) * 0.6;
        const flankA = angle + flankOffset;
        enemy.x += Math.cos(flankA) * currentSpeed * dt;
        enemy.y += Math.sin(flankA) * currentSpeed * dt;
      } else {
        // Direct / Phalanx advance
        enemy.x += Math.cos(angle) * currentSpeed * dt;
        enemy.y += Math.sin(angle) * currentSpeed * dt;
      }

      // Ramming check with Snake Head
      const headDist = Math.hypot(this.snakeX - enemy.x, this.snakeY - enemy.y);
      if (headDist < SNAKE_HEAD_RADIUS + enemy.radius) {
        const ramDmg = this.ramDamage * (this.isDashing ? 3.0 : 1.0) * this.globalDamageMult;
        this.applyDamageToEnemy(enemy, ramDmg, 'Head Kinetic Ram');
        sound.playHitSound();

        enemy.x -= Math.cos(angle) * 55;
        enemy.y -= Math.sin(angle) * 55;

        if (!this.isDashing) {
          this.damageSnake(enemy.damage * 0.4);
        }

        if (enemy.type === 'geo_star') {
          this.detonateExplosion(enemy.x, enemy.y, 90, enemy.damage * 1.6, 'Star Supernova', false);
          this.killEnemy(enemy, i);
          continue;
        }
      }

      // Check collision with Snake Body Segments (Neon Electric Barrier Block)
      for (const seg of this.segments) {
        const segDist = Math.hypot(seg.x - enemy.x, seg.y - enemy.y);
        if (segDist < SNAKE_BODY_RADIUS + enemy.radius + 8) {
          const repelAngle = Math.atan2(enemy.y - seg.y, enemy.x - seg.x);
          enemy.x += Math.cos(repelAngle) * 32;
          enemy.y += Math.sin(repelAngle) * 32;

          // Electric neon body shock damage
          this.applyDamageToEnemy(enemy, this.ramDamage * 0.45 * this.globalDamageMult, 'Neon Serpent Hull');

          if (now - enemy.lastAttackTime > enemy.attackInterval) {
            enemy.lastAttackTime = now;
            this.damageSnake(enemy.damage * 0.25);
            sound.playHitSound();
            this.addDamageNumber(enemy.x, enemy.y - 10, '⚡ BODY BLOCK', '#00f0ff');
          }
          break;
        }
      }

      // Check collision with Reactor Core
      const reactorDist = Math.hypot(this.reactorX - enemy.x, this.reactorY - enemy.y);
      if (reactorDist < REACTOR_RADIUS + enemy.radius) {
        if (now - enemy.lastAttackTime > enemy.attackInterval) {
          enemy.lastAttackTime = now;
          this.damageReactor(enemy.damage);
          if (enemy.type === 'geo_star') {
            this.detonateExplosion(enemy.x, enemy.y, 90, enemy.damage * 1.6, 'Star Supernova', false);
            this.killEnemy(enemy, i);
            continue;
          }
        }
      }
    }
  }

  private updateItems(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const dist = Math.hypot(this.snakeX - item.x, this.snakeY - item.y);

      // Automatically suck all items (especially EXP) within screen bounds or magnet radius!
      const onScreen = this.isItemOnScreen(item);
      if (onScreen || dist < this.magnetRadius) {
        const angle = Math.atan2(this.snakeY - item.y, this.snakeX - item.x);
        // Faster magnetic pull for distant on-screen items
        const magnetSpeed = Math.max(560, dist * 2.4);
        item.x += Math.cos(angle) * magnetSpeed * dt;
        item.y += Math.sin(angle) * magnetSpeed * dt;
      }

      // Collect when reaching snake head or any body segment!
      let collected = false;
      if (dist < SNAKE_HEAD_RADIUS + item.radius + 4) {
        collected = true;
      } else {
        for (const seg of this.segments) {
          if (Math.hypot(seg.x - item.x, seg.y - item.y) < SNAKE_BODY_RADIUS + item.radius + 6) {
            collected = true;
            break;
          }
        }
      }

      if (collected) {
        this.collectItem(item);
        this.items.splice(i, 1);
      }
    }
  }

  private collectItem(item: EnergyCoreItem) {
    sound.playPickup();
    this.stats.coresCollected += 1;

    switch (item.type) {
      case 'exp':
        this.addExp(item.value);
        break;
      case 'scrap':
        this.scrap += item.value;
        this.stats.scrapsGained += item.value;
        this.addDamageNumber(item.x, item.y, `+${item.value} 零件`, '#eab308');
        break;
      case 'repair':
        this.snakeHp = Math.min(this.snakeMaxHp, this.snakeHp + item.value);
        this.reactorHp = Math.min(this.reactorMaxHp, this.reactorHp + item.value * 2.5);
        this.addDamageNumber(item.x, item.y, `+${item.value} 修復`, '#22c55e');
        break;
      case 'nuke':
        sound.playExplosion();
        this.screenShake = 14;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (!e.isBoss) {
            this.killEnemy(e, i);
          } else {
            this.applyDamageToEnemy(e, 500, 'EMP Shockwave');
          }
        }
        this.addDamageNumber(this.snakeX, this.snakeY, 'EMP 幾何超載清除！', '#38bdf8');
        break;
    }
  }

  private checkLevelProgression() {
    const totalEnemies = 2000;
    const killPercent = (this.stats.kills / totalEnemies) * 100;

    const thresholds = [
      0, 0.05, 0.10, 1.0, 3.0, 8.0, 15.0, 22.0, 30.0, 38.0, 46.0,
      54.0, 62.0, 70.0, 76.0, 82.0, 88.0, 93.0, 96.0, 99.0, 100.0
    ];

    let targetLevel = 1;
    for (let lvl = 20; lvl >= 1; lvl--) {
      if (killPercent >= thresholds[lvl]) {
        targetLevel = lvl;
        break;
      }
    }

    const curLvl = Math.min(20, Math.max(1, this.level));
    const nextLvl = Math.min(20, curLvl + 1);
    const curThresh = thresholds[curLvl];
    const nextThresh = thresholds[nextLvl];

    this.maxExp = Math.max(1, Math.round((nextThresh - curThresh) * 100));
    this.exp = Math.max(0, Math.min(this.maxExp, Math.round((killPercent - curThresh) * 100)));

    if (targetLevel > this.level && this.level < 20) {
      this.level = targetLevel;
      sound.playLevelUp();
      this.growSnakeOnLevelUp();
      if (this.onLevelUp) {
        this.isPaused = true;
        this.onLevelUp();
      }
    }
  }

  private addExp(amount: number) {
    this.score += amount * 12;
    this.checkLevelProgression();
  }

  public growSnakeOnLevelUp() {
    const candidateTypes: TurretType[] = [
      'TESLA', 'CRYO', 'FLAME', 'MINE_LAYER', 'DRONE', 'SHIELD_GEN', 'VENOM_TRAIL', 'GATLING', 'PLASMA'
    ];
    const chosenType = candidateTypes[this.segments.length % candidateTypes.length];

    const last = this.segments[this.segments.length - 1];
    const prevX = last ? last.x : this.snakeX;
    const prevY = last ? last.y : this.snakeY;
    const prevAngle = last ? last.angle : this.snakeAngle;

    this.segments.push({
      x: prevX - Math.cos(prevAngle) * SEGMENT_DISTANCE,
      y: prevY - Math.sin(prevAngle) * SEGMENT_DISTANCE,
      angle: prevAngle,
      turretType: chosenType,
      turretLevel: 1,
      lastFireTime: 0,
      targetAngle: prevAngle,
    });

    if (chosenType === 'DRONE') {
      this.drones.push({
        id: Math.random().toString(),
        angle: Math.random() * Math.PI * 2,
        distance: 100 + Math.random() * 50,
        damage: 28 * this.globalDamageMult,
        lastShot: 0,
      });
    }

    this.addDamageNumber(
      this.snakeX,
      this.snakeY - 36,
      `🛡️ 蛇身重裝延長！總長: ${this.segments.length + 1}節 (守護半徑 ${Math.round(this.getMaxReach())}m)`,
      '#00f0ff'
    );
  }

  public applyDamageToEnemy(enemy: Enemy, amount: number, weaponName: string = 'Unknown', showNumber: boolean = true) {
    if (enemy.hp <= 0) return;

    const isCrit = Math.random() < this.critChance;
    let finalDamage = Math.round(amount * (isCrit ? 1.85 : 1.0));

    // Boss damage reduction & heavy armor protection (boss敵人會減傷 不要如此快就死)
    if (enemy.isBoss) {
      // 55% base damage reduction
      finalDamage = Math.max(1, Math.round(finalDamage * 0.45));
      // Talisman boss damage modifier
      if (this.gachaStats?.bossDamageBonus) {
        finalDamage = Math.round(finalDamage * (1 + this.gachaStats.bossDamageBonus));
      }
      // Single hit damage ceiling: cap to 1.8% of boss max HP so boss layers require persistent tactical attack
      finalDamage = Math.min(finalDamage, Math.round(enemy.maxHp * 0.018));
    }

    enemy.hp -= finalDamage;
    this.stats.damageDealt += finalDamage;
    this.stats.weaponDamage[weaponName] = (this.stats.weaponDamage[weaponName] || 0) + finalDamage;

    if (showNumber) {
      this.addDamageNumber(
        enemy.x + (Math.random() - 0.5) * 16,
        enemy.y - 12 + (Math.random() - 0.5) * 10,
        enemy.isBoss ? `🛡️${finalDamage}` : `${finalDamage}`,
        isCrit ? '#f59e0b' : enemy.isBoss ? '#fca5a5' : '#ffffff'
      );
    }

    this.addParticle(
      enemy.x,
      enemy.y,
      (Math.random() - 0.5) * 90,
      (Math.random() - 0.5) * 90,
      enemy.color,
      0.2,
      4,
      'triangle'
    );

    if (enemy.hp <= 0) {
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.killEnemy(enemy, idx);
      }
    }
  }

  private killEnemy(enemy: Enemy, index: number) {
    this.stats.kills += 1;
    this.waveKills += 1;
    this.score += enemy.scoreValue;
    this.enemies.splice(index, 1);
    sound.playExplosion();

    // 依擊殺數 / 預期整場敵人總數比例進行升級判定
    this.checkLevelProgression();

    // Geometric burst particles
    const pCount = enemy.isBoss ? 60 : 16;
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 200;
      this.addParticle(
        enemy.x,
        enemy.y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        enemy.color,
        0.4 + Math.random() * 0.3,
        4 + Math.random() * 4,
        'square'
      );
    }

    // Increased EXP drop
    this.items.push({
      id: Math.random().toString(),
      x: enemy.x,
      y: enemy.y,
      type: 'exp',
      value: enemy.expValue,
      radius: 9,
    });

    if (enemy.scrapValue > 0) {
      this.items.push({
        id: Math.random().toString(),
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y + (Math.random() - 0.5) * 20,
        type: 'scrap',
        value: enemy.scrapValue,
        radius: 8,
      });
    }

    if (Math.random() < 0.05) {
      this.items.push({
        id: Math.random().toString(),
        x: enemy.x,
        y: enemy.y,
        type: 'repair',
        value: 50,
        radius: 10,
      });
    }

    if (enemy.isBoss) {
      this.screenShake = 22;
      this.addDamageNumber(enemy.x, enemy.y - 45, '⚡ 幾何泰坦討伐成功！', '#22c55e');
      if (this.wave >= TOTAL_WAVES || this.stats.timeSurvived >= TOTAL_GAME_DURATION) {
        setTimeout(() => {
          this.gameOver(true);
        }, 1200);
      }
    }
  }

  private detonateExplosion(x: number, y: number, radius: number, damage: number, weaponName: string, soundEffect: boolean = true) {
    if (soundEffect) sound.playExplosion();
    this.screenShake = 7;
    this.environment.impartImpulse(x, y, radius * 2.2, 75);

    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < radius + enemy.radius) {
        const falloff = 1 - (dist / (radius + enemy.radius)) * 0.3;
        this.applyDamageToEnemy(enemy, damage * falloff, weaponName);
      }
    }

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.addParticle(
        x,
        y,
        Math.cos(a) * (radius * 2.0),
        Math.sin(a) * (radius * 2.0),
        '#f59e0b',
        0.35,
        5,
        'triangle'
      );
    }
  }

  private damageSnake(amount: number) {
    let remaining = amount;
    if (this.snakeShield > 0) {
      const absorbed = Math.min(this.snakeShield, remaining);
      this.snakeShield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.snakeHp = Math.max(0, this.snakeHp - remaining);
    }
    this.screenShake = 4;
  }

  private damageReactor(amount: number) {
    this.reactorHp = Math.max(0, this.reactorHp - amount);
    this.screenShake = 6;
    this.addDamageNumber(this.reactorX, this.reactorY - 30, `-${Math.round(amount)}`, '#ef4444');
  }

  private checkResonantLoop() {
    if (this.segments.length < 8) return;

    for (let i = 7; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const dist = Math.hypot(this.snakeX - seg.x, this.snakeY - seg.y);

      if (dist < 55) {
        this.stats.resonantLoopsTriggered += 1;
        sound.playLoopResonance();
        this.screenShake = 10;

        let sumX = this.snakeX;
        let sumY = this.snakeY;
        for (let j = 0; j <= i; j++) {
          sumX += this.segments[j].x;
          sumY += this.segments[j].y;
        }
        const centroidX = sumX / (i + 2);
        const centroidY = sumY / (i + 2);
        const loopRadius = Math.max(90, Math.hypot(this.snakeX - centroidX, this.snakeY - centroidY) * 1.4);
        this.environment.impartImpulse(centroidX, centroidY, loopRadius * 1.6, 95);

        for (const enemy of this.enemies) {
          const d = Math.hypot(enemy.x - centroidX, enemy.y - centroidY);
          if (d < loopRadius) {
            this.applyDamageToEnemy(enemy, 220 * this.globalDamageMult, 'Resonant Loop Nova');
            this.addLightningEffect(centroidX, centroidY, enemy.x, enemy.y, '#38bdf8');
          }
        }

        for (let a = 0; a < Math.PI * 2; a += 0.25) {
          this.addParticle(
            centroidX + Math.cos(a) * loopRadius * 0.7,
            centroidY + Math.sin(a) * loopRadius * 0.7,
            Math.cos(a) * 140,
            Math.sin(a) * 140,
            '#06b6d4',
            0.4,
            6,
            'square'
          );
        }

        this.addDamageNumber(centroidX, centroidY, '⚡ 超導幾何共振環爆！', '#38bdf8');
        break;
      }
    }
  }

  private addLightningEffect(x1: number, y1: number, x2: number, y2: number, color: string) {
    const steps = 6;
    let prevX = x1;
    let prevY = y1;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const targetX = x1 + (x2 - x1) * t + (i < steps ? (Math.random() - 0.5) * 25 : 0);
      const targetY = y1 + (y2 - y1) * t + (i < steps ? (Math.random() - 0.5) * 25 : 0);

      this.addParticle(
        (prevX + targetX) / 2,
        (prevY + targetY) / 2,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        color,
        0.18,
        4,
        'triangle'
      );

      prevX = targetX;
      prevY = targetY;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private addParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    life: number,
    size: number,
    shape: 'square' | 'triangle' | 'circle' = 'circle'
  ) {
    if (this.particles.length > 350) return;
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      color,
      size,
      shape,
    });
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      dn.y -= dt * 38;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private addDamageNumber(x: number, y: number, text: string, color: string) {
    this.damageNumbers.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 16,
      vy: -38,
      text,
      color,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  private updateCamera() {
    const hasBoss = this.enemies.some((e) => e.isBoss);
    this.targetZoom = hasBoss ? this.bossZoom : this.baseZoom;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.05;

    let targetCamX = this.snakeX;
    let targetCamY = this.snakeY;

    const boss = this.enemies.find((e) => e.isBoss);
    if (boss) {
      // Blend slightly towards boss for cinematic panoramic confrontation
      targetCamX = this.snakeX * 0.62 + boss.x * 0.38;
      targetCamY = this.snakeY * 0.62 + boss.y * 0.38;
    }

    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    const halfVisW = (this.canvas.width / 2) / this.cameraZoom;
    const halfVisH = (this.canvas.height / 2) / this.cameraZoom;

    if (halfVisW * 2 >= ARENA_WIDTH) {
      this.cameraX = ARENA_WIDTH / 2;
    } else {
      this.cameraX = Math.max(halfVisW, Math.min(ARENA_WIDTH - halfVisW, this.cameraX));
    }

    if (halfVisH * 2 >= ARENA_HEIGHT) {
      this.cameraY = ARENA_HEIGHT / 2;
    } else {
      this.cameraY = Math.max(halfVisH, Math.min(ARENA_HEIGHT - halfVisH, this.cameraY));
    }
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private gameOver(victory: boolean) {
    this.stop();
    if (this.onGameOver) {
      this.onGameOver(victory);
    }
  }

  // --- RENDERING ---

  public render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const isBossWave = this.wave === 3 || this.wave === 5 || this.enemies.some((e) => e.isBoss);

    ctx.save();
    // Ethereal deep space gradient backdrop
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.85);
    if (isBossWave) {
      bgGrad.addColorStop(0, '#150912');
      bgGrad.addColorStop(0.5, '#0a0408');
      bgGrad.addColorStop(1, '#050204');
    } else {
      bgGrad.addColorStop(0, '#091528');
      bgGrad.addColorStop(0.4, '#060d1a');
      bgGrad.addColorStop(1, '#02050b');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const shakeX = (Math.random() - 0.5) * this.screenShake;
    const shakeY = (Math.random() - 0.5) * this.screenShake;

    // Apply Camera Zoom centered on screen canvas (蛇身比例 1:1 不被壓扁)
    ctx.save();
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    const bounds = this.getVisibleBounds();
    const visW = bounds.maxX - bounds.minX;
    const visH = bounds.maxY - bounds.minY;

    // 1. Dynamic Subsurface Terrain Sectors & Semi-transparent Glass Plates
    this.environment.drawTerrainUnderlay(ctx, bounds.minX, bounds.minY, visW, visH, isBossWave);

    // 2. Circular Cybernetic Perimeter Defense Bounds (邊界為圓形)
    this.drawArena(ctx, isBossWave);

    // 4. Radiant Glass Floor Reflection & Under-Glow Beneath Serpent Body
    const anchor = this.getCoreAnchorPoint();
    const snakePoints = [
      { x: this.snakeX, y: this.snakeY },
      ...this.segments.map((s) => ({ x: s.x, y: s.y })),
      { x: anchor.x, y: anchor.y },
    ];
    this.environment.drawSnakeGroundReflection(ctx, snakePoints, this.snakeAngle);

    // 5. Radar Holographic Sweep, Sonar Waves & Laser Scanline
    this.environment.drawRadarAndScanlines(ctx, this.reactorX, this.reactorY, bounds.minX, bounds.minY, visW, visH, isBossWave);

    // 6. Floating Atmospheric Dust Motes & Cosmic Shimmer
    this.environment.drawAtmosphericDust(ctx, bounds.minX, bounds.minY, visW, visH);

    // 7. Active High-Contrast Entities (Hazards, Reactor, Snake, Enemies, Projectiles, Particles)
    this.drawFloorHazards(ctx);
    this.drawReactor(ctx);
    this.drawItems(ctx);
    this.drawSnake(ctx);
    this.drawDrones(ctx);
    this.drawGeometricEnemies(ctx);
    this.drawProjectiles(ctx);
    this.drawMuzzleFlashes(ctx);
    this.drawParticles(ctx);
    this.drawDamageNumbers(ctx);

    ctx.restore(); // Restore camera transform

    // 8. Screen Space Top HUD: 10-Layer Boss Health Bar (螢幕頂部10層血量血條)
    this.drawBossScreenHealthBar(ctx, width, height);

    ctx.restore(); // Restore root canvas state
  }

  private drawBossScreenHealthBar(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.currentBoss || this.currentBoss.hp <= 0) return;

    const boss = this.currentBoss;
    const maxHp = boss.maxHp;
    const currentHp = Math.max(0, boss.hp);
    const singleLayer = maxHp / 10;
    const layer = Math.min(10, Math.max(1, Math.ceil(currentHp / singleLayer)));
    const layerHp = currentHp - (layer - 1) * singleLayer;
    const layerPercent = Math.max(0, Math.min(1, layerHp / singleLayer));

    // 10 distinct layer colors (10 layers stacked)
    const LAYER_COLORS = [
      '#991b1b', // Layer 1: Dark Red
      '#ef4444', // Layer 2: Crimson
      '#f97316', // Layer 3: Orange
      '#eab308', // Layer 4: Yellow
      '#84cc16', // Layer 5: Lime
      '#10b981', // Layer 6: Emerald
      '#38bdf8', // Layer 7: Sky Blue
      '#06b6d4', // Layer 8: Cyan
      '#a855f7', // Layer 9: Purple
      '#f59e0b', // Layer 10: Radiant Aurora Gold
    ];

    const curColor = LAYER_COLORS[layer - 1];
    const underColor = layer > 1 ? LAYER_COLORS[layer - 2] : '#1e293b';

    const barW = Math.min(680, width * 0.82);
    const barH = 18;
    const barX = (width - barW) / 2;
    const barY = 22;

    ctx.save();

    // Subtle dark backdrop box
    ctx.fillStyle = 'rgba(6, 11, 24, 0.90)';
    ctx.fillRect(barX - 8, barY - 24, barW + 80, barH + 34);
    ctx.strokeStyle = curColor + '88';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(barX - 8, barY - 24, barW + 80, barH + 34);

    // Boss Name & Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    const bossTitle = boss.type === 'boss_tesseract'
      ? '⚠️ BOSS: 超維泰坦·幾何巨擘'
      : boss.type === 'boss_world_eater'
      ? '⚠️ BOSS: 終焉星蝕·萬象幾何原初巨神'
      : '⚠️ BOSS: 虛空湮滅星核·主宰';
    ctx.fillText(`${bossTitle} [10層超維防護壁]`, barX, barY - 8);

    // Right side: Remaining Total HP
    ctx.textAlign = 'right';
    ctx.fillStyle = curColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.round(currentHp)} / ${maxHp}`, barX + barW, barY - 8);

    // Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    // Underlying next-layer bar (shows what's underneath as current drains)
    ctx.fillStyle = underColor;
    ctx.fillRect(barX + 2, barY + 2, barW - 4, barH - 4);

    // Current layer bar
    ctx.fillStyle = curColor;
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * layerPercent, barH - 4);

    // White leading edge spark
    if (layerPercent > 0.01) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + 2 + (barW - 4) * layerPercent - 3, barY + 1, 3, barH - 2);
    }

    // 10 Layer Tick Division Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.2;
    for (let t = 1; t < 10; t++) {
      const tx = barX + (barW / 10) * t;
      ctx.beginPath();
      ctx.moveTo(tx, barY);
      ctx.lineTo(tx, barY + barH);
      ctx.stroke();
    }

    // Layer Count Badge (e.g., x10 ~ x1)
    const badgeW = 56;
    const badgeH = 26;
    const badgeX = barX + barW + 10;
    const badgeY = barY - 4;

    ctx.fillStyle = curColor;
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    // Animated glow pulse on layer break
    if (this.bossLayerBreakTimer > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x${layer}`, badgeX + badgeW / 2, badgeY + badgeH / 2);

    ctx.restore();
  }

  private drawMuzzleFlashes(ctx: CanvasRenderingContext2D) {
    for (const mf of this.muzzleFlashes) {
      const progress = mf.life / mf.maxLife; // 1 down to 0
      ctx.save();
      ctx.translate(mf.x, mf.y);
      ctx.rotate(mf.angle);

      const r = mf.size * progress;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = mf.color;
      ctx.shadowBlur = 16;

      switch (mf.turretType) {
        case 'GATLING': {
          // Sharp dynamic 6-ray starburst
          ctx.strokeStyle = mf.color;
          ctx.lineWidth = 2.5 * progress;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const ang = (a / 6) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * r * 1.5, Math.sin(ang) * r * 1.5);
          }
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'LASER': {
          // Intense blooming lens flare & cross diffraction
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * progress;
          ctx.beginPath();
          ctx.moveTo(-r * 2, 0);
          ctx.lineTo(r * 2.5, 0);
          ctx.moveTo(0, -r * 0.8);
          ctx.lineTo(0, r * 0.8);
          ctx.stroke();

          ctx.fillStyle = mf.color;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'FLAME': {
          // Billowing fiery plasma flare
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(r * 0.8, 0, r * 1.2, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(r * 0.3, 0, r * 0.6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'PLASMA': {
          // Concentric shockwave ring + core blast
          ctx.strokeStyle = mf.color;
          ctx.lineWidth = 3.5 * progress;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#f3e8ff';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'TESLA': {
          // High-voltage electric corona sparks
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2 * progress;
          ctx.beginPath();
          for (let s = 0; s < 4; s++) {
            const sang = (s / 4) * Math.PI * 2 + Math.random() * 0.3;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sang) * r * 1.6, Math.sin(sang) * r * 1.6);
          }
          ctx.stroke();
          break;
        }

        default: {
          ctx.fillStyle = mf.color;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private drawArena(ctx: CanvasRenderingContext2D, isBossWave: boolean = false) {
    ctx.save();

    // 1. Primary Circular Perimeter Defense Forcefield (邊界為圓形)
    ctx.strokeStyle = isBossWave ? '#ef4444' : '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = isBossWave ? '#ef4444' : '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.reactorX, this.reactorY, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Circular Hazard Warning Strip Barrier
    ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.22)' : 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(this.reactorX, this.reactorY, ARENA_RADIUS - 9, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Inner Concentric Defense Field Ring
    ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.arc(this.reactorX, this.reactorY, ARENA_RADIUS - 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Perimeter Circular Security Pylons & Radial Defense Teeth
    const pylonCount = 24;
    for (let i = 0; i < pylonCount; i++) {
      const a = (i / pylonCount) * Math.PI * 2;
      const px = this.reactorX + Math.cos(a) * ARENA_RADIUS;
      const py = this.reactorY + Math.sin(a) * ARENA_RADIUS;

      // Pylon node
      ctx.fillStyle = isBossWave ? '#ef4444' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer radial tooth brace
      ctx.strokeStyle = isBossWave ? '#ef444488' : '#38bdf888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * 16, py + Math.sin(a) * 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawFloorHazards(ctx: CanvasRenderingContext2D) {
    for (const p of this.venomPuddles) {
      ctx.save();
      ctx.fillStyle = '#84cc1633';
      ctx.strokeStyle = '#84cc1688';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    for (const m of this.mines) {
      ctx.save();
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawReactor(ctx: CanvasRenderingContext2D) {
    const rx = this.reactorX;
    const ry = this.reactorY;
    const time = performance.now() / 1000;

    ctx.save();

    // 1. Faint dashed neon holographic perimeter circle representing maximum defense reach
    const maxReach = this.getMaxReach();
    ctx.save();
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = '#00f0ff2e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, maxReach, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal tick marks on the defense perimeter circle
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00f0ff55';
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const cx1 = rx + Math.cos(a) * (maxReach - 8);
      const cy1 = ry + Math.sin(a) * (maxReach - 8);
      const cx2 = rx + Math.cos(a) * (maxReach + 8);
      const cy2 = ry + Math.sin(a) * (maxReach + 8);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Pulsing energy rings around reactor core
    const pulse = (Math.sin(time * 3) + 1) * 8;
    ctx.strokeStyle = '#06b6d444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rx, ry, REACTOR_RADIUS + 14 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Reactor Core outer ring
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(rx, ry, REACTOR_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Swivel mooring collar ring on reactor rim where serpent anchors
    const anchor = this.getCoreAnchorPoint();
    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(anchor.angle);

    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Central pulsing reactor polyhedron
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(rx, ry, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HP Bar
    const barWidth = 120;
    const barHeight = 8;
    const hpRatio = Math.max(0, this.reactorHp / this.reactorMaxHp);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx - barWidth / 2, ry - REACTOR_RADIUS - 24, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(rx - barWidth / 2, ry - REACTOR_RADIUS - 24, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx - barWidth / 2, ry - REACTOR_RADIUS - 24, barWidth, barHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PROMETHEUS CORE · 核心錨點', rx, ry - REACTOR_RADIUS - 30);
    ctx.restore();
  }

  private drawSnake(ctx: CanvasRenderingContext2D) {
    const time = performance.now() / 1000;
    const anchor = this.getCoreAnchorPoint();

    // 1. Build ordered chain of nodes: [Head, Segment 0, ..., Segment N-1, Anchor]
    const chainPoints: { x: number; y: number }[] = [
      { x: this.snakeX, y: this.snakeY },
      ...this.segments.map((s) => ({ x: s.x, y: s.y })),
      { x: anchor.x, y: anchor.y },
    ];

    const M = chainPoints.length;
    if (M < 2) return;

    // 2. Compute normal vectors and multi-rail coordinates along the spine
    const leftRails: { x: number; y: number }[] = [];
    const rightRails: { x: number; y: number }[] = [];
    const innerLeftRails: { x: number; y: number }[] = [];
    const innerRightRails: { x: number; y: number }[] = [];

    for (let i = 0; i < M; i++) {
      let tx: number, ty: number;
      if (i === 0) {
        tx = chainPoints[1].x - chainPoints[0].x;
        ty = chainPoints[1].y - chainPoints[0].y;
      } else if (i === M - 1) {
        tx = chainPoints[M - 1].x - chainPoints[M - 2].x;
        ty = chainPoints[M - 1].y - chainPoints[M - 2].y;
      } else {
        tx = chainPoints[i + 1].x - chainPoints[i - 1].x;
        ty = chainPoints[i + 1].y - chainPoints[i - 1].y;
      }

      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;

      // Width tapers smoothly from 23px near head down to 13px at core mooring
      const t = i / (M - 1);
      const w = 23 * (1 - t) + 13 * t;

      leftRails.push({ x: chainPoints[i].x + nx * w, y: chainPoints[i].y + ny * w });
      rightRails.push({ x: chainPoints[i].x - nx * w, y: chainPoints[i].y - ny * w });
      innerLeftRails.push({ x: chainPoints[i].x + nx * (w * 0.45), y: chainPoints[i].y + ny * (w * 0.45) });
      innerRightRails.push({ x: chainPoints[i].x - nx * (w * 0.45), y: chainPoints[i].y - ny * (w * 0.45) });
    }

    // --- NEON LAYER 1: Transverse Exoskeleton Cross-Truss (Chevron Space-Frame) ---
    ctx.save();
    ctx.strokeStyle = '#00f0ff40';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < M - 1; i++) {
      // Diagonal cross-bracing
      ctx.moveTo(leftRails[i].x, leftRails[i].y);
      ctx.lineTo(rightRails[i + 1].x, rightRails[i + 1].y);
      ctx.moveTo(rightRails[i].x, rightRails[i].y);
      ctx.lineTo(leftRails[i + 1].x, leftRails[i + 1].y);
    }
    ctx.stroke();

    // --- NEON LAYER 2: Transverse Rib Rungs with Diamond Terminals ---
    for (let i = 0; i < M; i++) {
      ctx.strokeStyle = '#38bdf888';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(leftRails[i].x, leftRails[i].y);
      ctx.lineTo(rightRails[i].x, rightRails[i].y);
      ctx.stroke();

      // Diamond joint terminals on outer rails
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(leftRails[i].x, leftRails[i].y, 2.5, 0, Math.PI * 2);
      ctx.arc(rightRails[i].x, rightRails[i].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- NEON LAYER 3: Dual Outer Glowing Structural Rails (3-pass bloom + line) ---
    // Pass A: Soft Neon Bloom
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#00f0ff66';
    ctx.lineWidth = 6;

    // Left outer bloom
    ctx.beginPath();
    ctx.moveTo(leftRails[0].x, leftRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(leftRails[i].x, leftRails[i].y);
    ctx.stroke();

    // Right outer bloom
    ctx.beginPath();
    ctx.moveTo(rightRails[0].x, rightRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(rightRails[i].x, rightRails[i].y);
    ctx.stroke();

    // Pass B: Vibrant Laser Rail
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(leftRails[0].x, leftRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(leftRails[i].x, leftRails[i].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightRails[0].x, rightRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(rightRails[i].x, rightRails[i].y);
    ctx.stroke();

    // Pass C: Superconducting White-hot Core Rail Filament
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffffcc';
    ctx.lineWidth = 1.0;

    ctx.beginPath();
    ctx.moveTo(leftRails[0].x, leftRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(leftRails[i].x, leftRails[i].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightRails[0].x, rightRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(rightRails[i].x, rightRails[i].y);
    ctx.stroke();

    // --- NEON LAYER 4: Dual Inner Pulsing Data/Energy Conduits ---
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -time * 50;
    ctx.strokeStyle = '#67e8f9b8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(innerLeftRails[0].x, innerLeftRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(innerLeftRails[i].x, innerLeftRails[i].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(innerRightRails[0].x, innerRightRails[0].y);
    for (let i = 1; i < M; i++) ctx.lineTo(innerRightRails[i].x, innerRightRails[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- NEON LAYER 5: Central Crackling Electric Plasma Spine ---
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(chainPoints[0].x, chainPoints[0].y);
    for (let i = 1; i < M; i++) {
      const jitter = (Math.sin(i * 4 + time * 18) + Math.cos(i * 7 - time * 12)) * 1.8;
      const len = Math.hypot(chainPoints[i].x - chainPoints[i - 1].x, chainPoints[i].y - chainPoints[i - 1].y) || 1;
      const nx = -(chainPoints[i].y - chainPoints[i - 1].y) / len;
      const ny = (chainPoints[i].x - chainPoints[i - 1].x) / len;
      ctx.lineTo(chainPoints[i].x + nx * jitter, chainPoints[i].y + ny * jitter);
    }
    ctx.stroke();
    ctx.restore();

    // --- NEON LAYER 6: Wireframe Turret Hardpoints along segments ---
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const def = TURRET_CATALOG[seg.turretType];
      const turretColor = def ? def.color : '#00f0ff';

      ctx.save();
      ctx.translate(seg.x, seg.y);

      // Wireframe rotating hexagon node
      ctx.rotate(seg.angle);
      ctx.shadowColor = turretColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = turretColor;
      ctx.lineWidth = 2.0;

      const hexR = 14;
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const hAngle = (h * Math.PI) / 3;
        const hx = Math.cos(hAngle) * hexR;
        const hy = Math.sin(hAngle) * hexR;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner wireframe reticle
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate to turret target angle for dual-rail laser barrels
      ctx.rotate(seg.targetAngle - seg.angle);

      // Dual-line neon turret cannon barrels
      ctx.strokeStyle = turretColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(3, -4);
      ctx.lineTo(19, -4);
      ctx.moveTo(3, 4);
      ctx.lineTo(19, 4);
      // Accelerator coil rungs
      ctx.moveTo(8, -6);
      ctx.lineTo(8, 6);
      ctx.moveTo(14, -6);
      ctx.lineTo(14, 6);
      ctx.stroke();

      // White-hot muzzle tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(19, -4, 1.5, 0, Math.PI * 2);
      ctx.arc(19, 4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle holographic targeting laser sight line
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = turretColor + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(75, 0);
      ctx.stroke();

      ctx.restore();
    }

    // --- NEON LAYER 7: Anchor Mooring Clamps at Core ---
    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(anchor.angle);

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    // Dual hydraulic clamping claws gripping reactor rim
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(4, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(4, 10);
    ctx.lineTo(-10, 12);
    ctx.stroke();

    // Central umbilical energy swivel core
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- NEON LAYER 8: Snake Head (Neon Cyber Dreadnought Dragon Warhead) ---
    ctx.save();
    ctx.translate(this.snakeX, this.snakeY);
    ctx.rotate(this.snakeAngle);

    // Head wireframe outer bloom
    ctx.shadowColor = this.isDashing ? '#38bdf8' : '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.8;

    // Angular dragon/warhead prow geometry
    ctx.beginPath();
    ctx.moveTo(SNAKE_HEAD_RADIUS + 16, 0); // Extended prow beak
    ctx.lineTo(SNAKE_HEAD_RADIUS - 4, -SNAKE_HEAD_RADIUS - 2);
    ctx.lineTo(-SNAKE_HEAD_RADIUS + 8, -SNAKE_HEAD_RADIUS + 4);
    ctx.lineTo(-SNAKE_HEAD_RADIUS - 2, 0);
    ctx.lineTo(-SNAKE_HEAD_RADIUS + 8, SNAKE_HEAD_RADIUS - 4);
    ctx.lineTo(SNAKE_HEAD_RADIUS - 4, SNAKE_HEAD_RADIUS + 2);
    ctx.closePath();
    ctx.stroke();

    // Inner faceted wireframe armor lines
    ctx.strokeStyle = '#38bdf8aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(SNAKE_HEAD_RADIUS + 16, 0);
    ctx.lineTo(2, -8);
    ctx.lineTo(-SNAKE_HEAD_RADIUS + 8, -SNAKE_HEAD_RADIUS + 4);

    ctx.moveTo(SNAKE_HEAD_RADIUS + 16, 0);
    ctx.lineTo(2, 8);
    ctx.lineTo(-SNAKE_HEAD_RADIUS + 8, SNAKE_HEAD_RADIUS - 4);

    ctx.moveTo(2, -8);
    ctx.lineTo(-SNAKE_HEAD_RADIUS - 2, 0);
    ctx.lineTo(2, 8);
    ctx.stroke();

    // Twin Heavy Forward Railgun Cannons (Head Arsenal)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    // Left Railgun
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.lineTo(28, -12);
    ctx.moveTo(12, -15);
    ctx.lineTo(12, -9);
    ctx.moveTo(20, -15);
    ctx.lineTo(20, -9);
    // Right Railgun
    ctx.moveTo(6, 12);
    ctx.lineTo(28, 12);
    ctx.moveTo(12, 9);
    ctx.lineTo(12, 15);
    ctx.moveTo(20, 9);
    ctx.lineTo(20, 15);
    ctx.stroke();

    // Center Heavy Plasma Mortar Chamber (Pulsing Diamond)
    const plasmaPulse = (Math.sin(time * 8) + 1) * 2;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(16 + plasmaPulse, 0);
    ctx.lineTo(8, -5);
    ctx.lineTo(0, 0);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.stroke();

    // Glowing Neon Visor Eyes
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(10, -9);
    ctx.lineTo(15, -7);
    ctx.lineTo(9, -6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, 9);
    ctx.lineTo(15, 7);
    ctx.lineTo(9, 6);
    ctx.closePath();
    ctx.fill();

    // Active Resonant Energy Shield Mesh Aura
    if (this.snakeShield > 0) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#00f0ff88';
      ctx.lineWidth = 2.0;

      // Angular forward deflector chevron
      ctx.beginPath();
      ctx.arc(0, 0, SNAKE_HEAD_RADIUS + 16, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Honeycomb hex ticks on shield
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, SNAKE_HEAD_RADIUS + 20, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private drawDrones(ctx: CanvasRenderingContext2D) {
    for (const drone of this.drones) {
      const dx = this.snakeX + Math.cos(drone.angle) * drone.distance;
      const dy = this.snakeY + Math.sin(drone.angle) * drone.distance;

      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#22c55e66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(dx, dy, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Procedural rendering of geometric enemies:
   * Triangle, Square, Pentagon, Hexagon, Diamond, Octagon, Star, and Super-Bosses!
   */
  private drawGeometricEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.rotation);

      if (enemy.isBoss) {
        this.renderBossGeometry(ctx, enemy);
      } else {
        this.renderRegularGeometry(ctx, enemy);
      }

      ctx.restore();

      // Enemy HP Bar
      if (enemy.hp < enemy.maxHp || enemy.isBoss || enemy.isElite) {
        const barW = enemy.isBoss ? Math.max(180, enemy.radius * 1.5) : enemy.isElite ? 42 : 28;
        const barH = enemy.isBoss ? 8 : 4;
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        const yOffset = enemy.isBoss ? enemy.radius + 20 : enemy.radius + 12;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(enemy.x - barW / 2, enemy.y - yOffset, barW, barH);
        ctx.fillStyle = enemy.isBoss ? '#ef4444' : enemy.isElite ? '#f59e0b' : '#38bdf8';
        ctx.fillRect(enemy.x - barW / 2, enemy.y - yOffset, barW * ratio, barH);

        if (enemy.isBoss) {
          ctx.strokeStyle = '#ffffff66';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(enemy.x - barW / 2, enemy.y - yOffset, barW, barH);

          // Boss Title text above HP bar
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`TITAN · ${Math.round(enemy.hp)}/${enemy.maxHp}`, enemy.x, enemy.y - yOffset - 4);
        }
      }
    }
  }

  private renderRegularGeometry(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const r = enemy.radius;

    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = enemy.isElite ? 3 : 2;

    switch (enemy.type) {
      case 'geo_triangle': {
        // Equilateral triangle
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'geo_square': {
        // Heavy square
        ctx.beginPath();
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fill();
        ctx.stroke();

        // Inset rotated diamond armor
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'geo_pentagon': {
        // Pentagon (5-sided)
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'geo_hexagon': {
        // Hexagon (6-sided)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'geo_diamond': {
        // Diamond / Rhombus
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.3);
        ctx.lineTo(r * 0.8, 0);
        ctx.lineTo(0, r * 1.3);
        ctx.lineTo(-r * 0.8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'geo_octagon': {
        // Octagon (8-sided) with outer revolving shield
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Orbiting shield facets
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'geo_star': {
        // 12-pointed spiky star
        ctx.beginPath();
        const points = 12;
        for (let i = 0; i < points * 2; i++) {
          const a = (i / (points * 2)) * Math.PI * 2;
          const rad = i % 2 === 0 ? r : r * 0.45;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'geo_vortex_triangle': {
        // 3-blade curved shuriken turbine
        ctx.beginPath();
        for (let b = 0; b < 3; b++) {
          const baseA = (b / 3) * Math.PI * 2;
          const tipX = Math.cos(baseA) * (r * 1.35);
          const tipY = Math.sin(baseA) * (r * 1.35);
          const midA = baseA + 0.45;
          const midX = Math.cos(midA) * (r * 0.5);
          const midY = Math.sin(midA) * (r * 0.5);
          if (b === 0) ctx.moveTo(tipX, tipY);
          else ctx.lineTo(tipX, tipY);
          ctx.quadraticCurveTo(0, 0, midX, midY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Central vortex core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'geo_pulsar_ring': {
        // Double concentric neon torus rings with 3 orbiting micro-satellites
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        // 3 Orbiting energy satellites
        ctx.fillStyle = '#ffffff';
        for (let s = 0; s < 3; s++) {
          const sa = enemy.rotation * 2.5 + (s / 3) * Math.PI * 2;
          const sx = Math.cos(sa) * (r * 0.8);
          const sy = Math.sin(sa) * (r * 0.8);
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'geo_prism_dart': {
        // Bifurcated dual-prong chevron crystal dart with cyan rear thruster glow
        ctx.beginPath();
        ctx.moveTo(r * 1.4, 0); // Apex point
        ctx.lineTo(-r * 0.8, -r * 0.9); // Left prong
        ctx.lineTo(-r * 0.3, 0); // Center notch
        ctx.lineTo(-r * 0.8, r * 0.9); // Right prong
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Internal neon power conduit
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r * 1.1, 0);
        ctx.lineTo(-r * 0.2, 0);
        ctx.stroke();
        break;
      }

      case 'geo_helix_spiral': {
        // Twin intertwined glowing geometric lattice nodes
        const sep = r * 0.65;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(-sep, 0, r * 0.55, 0, Math.PI * 2);
        ctx.arc(sep, 0, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Energy tether line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-sep, 0);
        ctx.lineTo(sep, 0);
        ctx.stroke();

        // Orbiting electron rings
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.1, r * 0.45, enemy.rotation * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'geo_cube_sentinel': {
        // Heavy floating hollow hypercube with rotated diamond core and outer protective shield plates
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.strokeRect(-r, -r, r * 2, r * 2);

        // Hollow inner window
        ctx.fillStyle = '#060a12';
        ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-r * 0.5, -r * 0.5, r, r);

        // Rotating core crystal
        ctx.save();
        ctx.rotate(enemy.rotation * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3.5, -3.5, 7, 7);
        ctx.restore();
        break;
      }
    }
  }

  private renderBossGeometry(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const r = enemy.radius;
    const time = performance.now() / 1000;

    // Colossal Outer Glow
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 28;

    if (enemy.type === 'boss_tesseract') {
      // 4-Dimensional Hypercube projection (Outer square + Inset rotating hyper-cube)
      ctx.fillStyle = enemy.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;

      // Outer Square Citadel
      ctx.beginPath();
      ctx.rect(-r, -r, r * 2, r * 2);
      ctx.stroke();

      // Middle Counter-rotating square
      const midR = r * 0.75;
      ctx.save();
      ctx.rotate(-enemy.rotation * 1.5);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(-midR, -midR, midR * 2, midR * 2);
      ctx.restore();

      // Inner Core Hypercube
      const innerR = r * 0.48;
      ctx.save();
      ctx.rotate(enemy.rotation * 2.2);
      ctx.fillStyle = '#ec489966';
      ctx.fillRect(-innerR, -innerR, innerR * 2, innerR * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-innerR, -innerR, innerR * 2, innerR * 2);
      ctx.restore();

      // Connecting Hypercube diagonal struts
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r, -r);
      ctx.lineTo(-innerR, -innerR);
      ctx.moveTo(r, -r);
      ctx.lineTo(innerR, -innerR);
      ctx.moveTo(r, r);
      ctx.lineTo(innerR, innerR);
      ctx.moveTo(-r, r);
      ctx.lineTo(-innerR, innerR);
      ctx.stroke();

      // Orbiting Sub-Diamonds
      for (let i = 0; i < 4; i++) {
        const orbitA = enemy.rotation * 1.8 + (i / 4) * Math.PI * 2;
        const ox = Math.cos(orbitA) * (r + 26);
        const oy = Math.sin(orbitA) * (r + 26);
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(ox, oy, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer Aegis Defense Ring
      ctx.strokeStyle = '#ec489988';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, r + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (enemy.type === 'boss_void_star') {
      // 16-point Void Star with concentric pulsating rings
      ctx.fillStyle = enemy.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;

      ctx.beginPath();
      const pts = 16;
      for (let i = 0; i < pts * 2; i++) {
        const a = (i / (pts * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? r : r * 0.52;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Outer revolving geometric runic ring
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r + 22, 0, Math.PI * 2);
      ctx.stroke();

      // Inner pulsating void singularity
      ctx.fillStyle = '#0f071a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      // Colossal World Eater / Primordial Doom Polygon (Wave 5 Final Titan)
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;

      // 12-sided colossal dreadnought hull
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner faceted octagon armor
      const midR = r * 0.65;
      ctx.save();
      ctx.rotate(-time * 0.8);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = Math.cos(a) * midR;
        const py = Math.sin(a) * midR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Triple concentric rotating outer shield barriers
      ctx.strokeStyle = '#ef4444aa';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b88';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, r + 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Central apocalyptic singularity
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    const time = performance.now() / 1000;

    ctx.save();
    ctx.globalAlpha = 0.60; // 子彈半透明，增加視野清晰度

    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.isLaser && p.laserEndX !== undefined && p.laserEndY !== undefined) {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.laserEndX, p.laserEndY);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const pAngle = Math.atan2(p.vy, p.vx);
      ctx.rotate(pAngle);

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      switch (p.shape) {
        case 'shard': {
          // Elongated supersonic piercing razor needle
          ctx.beginPath();
          ctx.moveTo(p.radius * 2.0, 0);
          ctx.lineTo(-p.radius, -p.radius * 0.55);
          ctx.lineTo(-p.radius * 0.4, 0);
          ctx.lineTo(-p.radius, p.radius * 0.55);
          ctx.closePath();
          ctx.fill();

          // White center energy streak
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-p.radius * 0.5, -1, p.radius * 1.8, 2);
          break;
        }

        case 'ring': {
          // Hollow expanding circular shockwave pulse ring
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(2, p.radius - 3), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'cross': {
          // 4-point rotating cross star
          ctx.rotate(time * 6);
          const r = p.radius;
          ctx.beginPath();
          ctx.moveTo(0, -r * 1.5);
          ctx.lineTo(r * 0.4, -r * 0.4);
          ctx.lineTo(r * 1.5, 0);
          ctx.lineTo(r * 0.4, r * 0.4);
          ctx.lineTo(0, r * 1.5);
          ctx.lineTo(-r * 0.4, r * 0.4);
          ctx.lineTo(-r * 1.5, 0);
          ctx.lineTo(-r * 0.4, -r * 0.4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'helix_orb': {
          // Double rotating orbital plasma orbs
          ctx.rotate(time * 8);
          const orbR = p.radius * 0.5;
          const dist = p.radius * 0.7;
          ctx.beginPath();
          ctx.arc(-dist, 0, orbR, 0, Math.PI * 2);
          ctx.arc(dist, 0, orbR, 0, Math.PI * 2);
          ctx.fill();

          // Connective plasma filament
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-dist, 0);
          ctx.lineTo(dist, 0);
          ctx.stroke();
          break;
        }

        case 'crescent': {
          // Curved rotating crescent scythe blade
          ctx.rotate(time * 9);
          const r = p.radius * 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI * 0.7, Math.PI * 0.7);
          ctx.quadraticCurveTo(r * 0.2, 0, Math.cos(-Math.PI * 0.7) * r, Math.sin(-Math.PI * 0.7) * r);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'diamond': {
          // Refractive geometric diamond
          const r = p.radius;
          ctx.beginPath();
          ctx.moveTo(r * 1.3, 0);
          ctx.lineTo(0, -r * 0.75);
          ctx.lineTo(-r * 1.1, 0);
          ctx.lineTo(0, r * 0.75);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          break;
        }

        case 'circle':
        default: {
          if (p.burnDamage) {
            // Flame: Billowing turbulent plasma fireball with flickering fire tongues
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * (1.1 + Math.sin(time * 16) * 0.2), 0, Math.PI * 2);
            ctx.fill();

            // White hot core
            ctx.fillStyle = '#ffedd5';
            ctx.beginPath();
            ctx.arc(p.radius * 0.25, 0, p.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Flickering plasma trail sparks
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(-p.radius * 0.8, (Math.sin(time * 24) - 0.5) * p.radius, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.slowAmount) {
            // Cryo: 6-pointed spinning ice snowflake crystal needle
            ctx.rotate(time * 7);
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1.8;
            for (let a = 0; a < 6; a++) {
              const ang = (a / 6) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(ang) * p.radius * 1.3, Math.sin(ang) * p.radius * 1.3);
              ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.aoeRadius) {
            // Plasma Mortar: Heavy swirling ion vortex with satellite spark ring
            ctx.rotate(time * 8);
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Orbiting high-energy ion spark
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(Math.cos(time * 14) * (p.radius + 3), Math.sin(time * 14) * (p.radius + 3), 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.color === '#38bdf8' || p.color === '#00f0ff') {
            // Gatling: Supersonic kinetic tracer dart with white-hot core & speed streak
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(p.radius * 1.8, 0);
            ctx.lineTo(-p.radius * 2.8, 0);
            ctx.stroke();

            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(p.radius * 0.4, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.radius * 0.4, 0, p.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Classic projectile
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }

      ctx.restore();
    }
    ctx.restore();
  }

  private drawItems(ctx: CanvasRenderingContext2D) {
    for (const item of this.items) {
      ctx.save();
      if (item.type === 'exp') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - item.radius);
        ctx.lineTo(item.x + item.radius, item.y);
        ctx.lineTo(item.x, item.y + item.radius);
        ctx.lineTo(item.x - item.radius, item.y);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'scrap') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(item.x - item.radius, item.y - item.radius, item.radius * 2, item.radius * 2);
      } else if (item.type === 'repair') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x - 2, item.y - 6, 4, 12);
        ctx.fillRect(item.x - 6, item.y - 2, 12, 4);
      } else if (item.type === 'nuke') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y + p.size);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawDamageNumbers(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    for (const dn of this.damageNumbers) {
      const alpha = Math.max(0, dn.life / dn.maxLife);
      ctx.fillStyle = dn.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(dn.text, dn.x, dn.y);
    }
    ctx.restore();
  }
}
