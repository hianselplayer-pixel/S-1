/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'UPGRADING' | 'PAUSED' | 'GAME_OVER' | 'HANGAR' | 'CODEX' | 'GACHA';

export type TurretType = 
  | 'GATLING'      // Rapid kinetic fire
  | 'PLASMA'       // Explosive AOE projectile
  | 'TESLA'        // Chain lightning
  | 'CRYO'         // Slowing ice rays
  | 'FLAME'        // Close-range burning cone
  | 'LASER'        // Penetrating line beam
  | 'DRONE'        // Escort guardian drones
  | 'MINE_LAYER'   // Drops mines from tail
  | 'VENOM_TRAIL'  // Leaves toxic slipstream
  | 'SHIELD_GEN';  // Absorbs hits & pulses

export interface TurretDefinition {
  type: TurretType;
  name: string;
  nameZh: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  baseDamage: number;
  fireInterval: number; // in seconds
  color: string;
  range: number;
  icon: string;
}

export interface HeadWeapon {
  type: TurretType;
  level: number;
  lastFireTime: number;
}

export interface BodySegment {
  x: number;
  y: number;
  angle: number;
  turretType: TurretType;
  turretLevel: number;
  lastFireTime: number;
  targetAngle: number;
}

export type EnemyType =
  | 'geo_triangle'          // 銳角三角追獵者 (Fast speed, darting)
  | 'geo_square'            // 重方甲重裝堡壘 (High HP, tanky)
  | 'geo_pentagon'          // 五角散彈晶體 (Shoots 3-way darts)
  | 'geo_hexagon'           // 六角晶簇蜂群 (Mass swarms)
  | 'geo_diamond'           // 菱形相位幽影 (Fast stealthy dasher)
  | 'geo_octagon'           // 八角暴君巨怪 (Elite juggernaut)
  | 'geo_star'              // 十二芒自爆星核 (Kamikaze exploding star)
  | 'geo_vortex_triangle'   // 旋風三稜旋刃 (Corkscrew spiral raider)
  | 'geo_pulsar_ring'       // 脈衝光環·星環幾何 (Pulsing ring emitter)
  | 'geo_prism_dart'        // 晶棱疾刺·雙角刃 (High-velocity dive-dasher)
  | 'geo_helix_spiral'      // 雙螺旋共振體 (Sinusoidal weaving node)
  | 'geo_cube_sentinel'     // 懸浮聖方·禁衛方碑 (Shielded monolith phalanx)
  | 'boss_tesseract'        // 超維超正方體·泰坦 (Wave 3 Boss)
  | 'boss_void_star'        // 虛空湮滅星核·主宰 (Wave 4 Boss)
  | 'boss_world_eater';     // 萬象幾何母體·原初 (Wave 5 Final Boss)

export type MovementPattern =
  | 'direct'
  | 'sine'
  | 'orbit'
  | 'dive_dash'
  | 'vortex'
  | 'flank'
  | 'phalanx';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  angle: number;
  rotation: number;
  rotationSpeed: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  scoreValue: number;
  scrapValue: number;
  expValue: number;
  isBoss: boolean;
  isElite?: boolean;
  slowTimer: number;
  burnTimer: number;
  burnDps: number;
  lastAttackTime: number;
  attackInterval: number;
  shootTimer?: number;
  bossPhase?: number;
  shieldRadius?: number;

  // Distinct Movement AI & Tactical Formations
  movePattern?: MovementPattern;
  moveTimer?: number;
  orbitDistance?: number;
  orbitDirection?: number; // 1 or -1
  dashPhase?: 'aim' | 'charge' | 'recover';
  dashCooldown?: number;
  dashTargetX?: number;
  dashTargetY?: number;
  formationName?: string;
  formationOffset?: { x: number; y: number };
}

export type BulletPattern =
  | 'linear'
  | 'sine'
  | 'spiral'
  | 'accel'
  | 'homing'
  | 'ring'
  | 'cluster_split'
  | 'crescent_curve';

export type BulletShape =
  | 'circle'
  | 'diamond'
  | 'shard'
  | 'ring'
  | 'cross'
  | 'helix_orb'
  | 'crescent';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  source: 'player' | 'enemy';
  duration: number; // lifetime left in seconds
  isLaser?: boolean;
  laserEndX?: number;
  laserEndY?: number;
  pierceLeft?: number;
  aoeRadius?: number;
  slowAmount?: number;
  burnDamage?: number;
  isChain?: boolean;
  chainsLeft?: number;
  shape?: BulletShape;

  // Ballistics & Trajectory Patterns
  bulletPattern?: BulletPattern;
  baseVx?: number;
  baseVy?: number;
  baseSpeed?: number;
  baseAngle?: number;
  patternTimer?: number;
  curveSpeed?: number;
  amplitude?: number;
  frequency?: number;
  splitTimer?: number;
  hasSplit?: boolean;
}

export interface Mine {
  id: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
  color: string;
}

export interface VenomPuddle {
  id: string;
  x: number;
  y: number;
  radius: number;
  damagePerSec: number;
  duration: number;
}

export interface EnergyCoreItem {
  id: string;
  x: number;
  y: number;
  type: 'exp' | 'scrap' | 'repair' | 'nuke';
  value: number;
  radius: number;
}

export interface Drone {
  id: string;
  angle: number;
  distance: number;
  damage: number;
  lastShot: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'square' | 'triangle' | 'circle';
}

export interface DamageNumber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit?: boolean;
  scale?: number;
  fontSize?: number;
  weaponType?: string;
}

export interface UpgradeOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'head_mount' | 'module_add' | 'module_upgrade' | 'snake_hull' | 'core_defense' | 'relic';
  icon: string;
  targetTurret?: TurretType;
  apply: () => void;
}

export interface MetaUpgrades {
  maxHpLevel: number;
  startingLength: number;
  magnetLevel: number;
  ramDamageLevel: number;
  dashCooldownLevel: number;
  scrapMultiplierLevel: number;
  unlockedTurrets: TurretType[];
}

export interface GameStats {
  kills: number;
  damageDealt: number;
  wavesCleared: number;
  timeSurvived: number;
  scrapsGained: number;
  coresCollected: number;
  resonantLoopsTriggered: number;
  weaponDamage: Record<string, number>;
}
