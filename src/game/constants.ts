/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TurretDefinition, TurretType } from '../types/game';

export const TURRET_CATALOG: Record<TurretType, TurretDefinition> = {
  GATLING: {
    type: 'GATLING',
    name: 'Gatling Cannon',
    nameZh: '雙聯裝火神機砲',
    description: '極速傾瀉高速實體彈幕，射程大增，強力壓制前方大群幾何敵軍。',
    rarity: 'common',
    baseDamage: 22,
    fireInterval: 0.12,
    color: '#38bdf8', // Sky cyan
    range: 520, // Extended range
    icon: 'Crosshair',
  },
  PLASMA: {
    type: 'PLASMA',
    name: 'Plasma Mortar',
    nameZh: '重型電漿迫擊砲',
    description: '發射超大範圍高爆電漿球，遠程轟炸密集幾何群體。',
    rarity: 'rare',
    baseDamage: 65,
    fireInterval: 0.95,
    color: '#a855f7', // Purple
    range: 580,
    icon: 'Radio',
  },
  TESLA: {
    type: 'TESLA',
    name: 'Tesla Spire',
    nameZh: '高壓泰斯拉電弧',
    description: '超長程跳躍連鎖高壓閃電，穿梭於 5~8 個幾何敵人之間並麻痺目標。',
    rarity: 'rare',
    baseDamage: 40,
    fireInterval: 0.75,
    color: '#06b6d4', // Cyan
    range: 500,
    icon: 'Zap',
  },
  CRYO: {
    type: 'CRYO',
    name: 'Cryo Emitter',
    nameZh: '絕對零度急凍射線',
    description: '長程寒霜冰束貫穿敵人，造成 50% 冰凍減速與持續低溫崩解。',
    rarity: 'common',
    baseDamage: 20,
    fireInterval: 0.45,
    color: '#67e8f9', // Ice blue
    range: 540,
    icon: 'Snowflake',
  },
  FLAME: {
    type: 'FLAME',
    name: 'Flame Projector',
    nameZh: '熾熱地獄火發射器',
    description: '大幅擴展的扇形超高溫烈焰，令整片扇區敵人陷入持續灼燒。',
    rarity: 'common',
    baseDamage: 32,
    fireInterval: 0.35,
    color: '#f97316', // Orange
    range: 380,
    icon: 'Flame',
  },
  LASER: {
    type: 'LASER',
    name: 'Laser Lance',
    nameZh: '超載貫穿雷射軸',
    description: '超長距離直達戰場邊緣的毀滅光束，瞬間蒸發路徑上所有幾何單位。',
    rarity: 'epic',
    baseDamage: 60,
    fireInterval: 1.0,
    color: '#ef4444', // Red
    range: 720,
    icon: 'Activity',
  },
  DRONE: {
    type: 'DRONE',
    name: 'Orbital Drone Hub',
    nameZh: '守護者蜂群無人機',
    description: '放出伴隨蛇身巡邏的智慧無人機，超遠程自主狙擊進犯敵軍。',
    rarity: 'epic',
    baseDamage: 26,
    fireInterval: 0.4,
    color: '#22c55e', // Emerald
    range: 480,
    icon: 'Disc',
  },
  MINE_LAYER: {
    type: 'MINE_LAYER',
    name: 'Tail Mine Layer',
    nameZh: '尾部烈性地雷散佈艙',
    description: '隨遊走在蛇尾留下一排感應地雷，任何追尾的怪物踩中立即引爆。',
    rarity: 'rare',
    baseDamage: 85,
    fireInterval: 1.1,
    color: '#eab308', // Yellow
    range: 120,
    icon: 'Bomb',
  },
  VENOM_TRAIL: {
    type: 'VENOM_TRAIL',
    name: 'Venom Sprayer',
    nameZh: '強酸腐蝕尾流閥',
    description: '在移動軌跡上留下大範圍強酸泥淖，敵軍踏入防禦瓦解並劇烈失血。',
    rarity: 'common',
    baseDamage: 25,
    fireInterval: 0.3,
    color: '#84cc16', // Lime
    range: 100,
    icon: 'Droplets',
  },
  SHIELD_GEN: {
    type: 'SHIELD_GEN',
    name: 'Aegis Field',
    nameZh: '神盾共振力場儀',
    description: '展開大範圍衝擊波力場，抵擋幾何彈幕並大距離擊退逼近敵潮。',
    rarity: 'legendary',
    baseDamage: 45,
    fireInterval: 2.8,
    color: '#6366f1', // Indigo
    range: 350,
    icon: 'Shield',
  },
};

export const ARENA_WIDTH = 2600;
export const ARENA_HEIGHT = 2600;
export const ARENA_RADIUS = 1100; // Circular arena boundary radius
export const BASE_SNAKE_SPEED = 230;
export const DASH_SPEED_MULTIPLIER = 2.2;
export const SEGMENT_DISTANCE = 34;
export const SNAKE_HEAD_RADIUS = 26; // Bigger head for command warhead
export const SNAKE_BODY_RADIUS = 16;
export const REACTOR_RADIUS = 65;
export const REACTOR_MAX_HP = 1200;
export const BASE_EXP_REQUIREMENT = 24; // Faster initial level ups

export const TOTAL_GAME_DURATION = 300; // 5 minutes total survival loop
export const TOTAL_WAVES = 5;
export const WAVE_DURATION = 60; // 60 seconds per wave (5 waves = 5 minutes)

// Dynamic Tactical Camera Zoom constants
export const BASE_CAMERA_ZOOM = 0.78; // Expanded baseline FOV
export const BOSS_CAMERA_ZOOM = 0.58; // Panoramic arena FOV when boss emerges
