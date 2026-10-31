/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Rarity = 'R' | 'SR' | 'SSR' | 'UR';

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; glow: string; border: string; bg: string }> = {
  R: {
    label: 'R級·常規',
    color: '#38bdf8', // Blue
    glow: 'rgba(56, 189, 248, 0.4)',
    border: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
  },
  SR: {
    label: 'SR級·高階',
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.4)',
    border: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.14)',
  },
  SSR: {
    label: 'SSR級·傳奇',
    color: '#f59e0b', // Gold
    glow: 'rgba(245, 158, 11, 0.5)',
    border: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.16)',
  },
  UR: {
    label: 'UR級·極限',
    color: '#ec4899', // Rainbow / Neon Pink-Red
    glow: 'rgba(236, 72, 153, 0.6)',
    border: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.20)',
  },
};

export interface SerpentAvatar {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  color: string;
  glowColor: string;
  accentColor: string;
  skinStyle: 'striker' | 'titan' | 'void' | 'fission';
  description: string;
  combatPower: number;
  stats: {
    hpBonus: number;
    speedBonus: number;
    damageMult: number;
    fireRateMult: number;
    critBonus: number;
    specialDesc: string;
  };
}

export interface Talisman {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  color: string;
  icon: string;
  description: string;
  combatPower: number;
  stats: {
    damageMult?: number;
    fireRateMult?: number;
    hpBonus?: number;
    magnetBonus?: number;
    critBonus?: number;
    dashCooldownMult?: number;
    ramDamageMult?: number;
    pierceBonus?: number;
    bossDamageBonus?: number;
    regenHpPerSec?: number;
  };
}

export interface GachaInventory {
  ownedAvatars: string[];     // avatar ids
  equippedAvatar: string;     // current avatar id
  ownedTalismans: string[];   // talisman ids
  talismanLevels: Record<string, number>; // talismanId -> stack level (1, 2, 3...)
  equippedTalismans: string[]; // up to 6 talisman ids (can have duplicates!)
  pityCounter: number;
}
