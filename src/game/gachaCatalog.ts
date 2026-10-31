/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SerpentAvatar, Talisman, GachaInventory, RARITY_CONFIG } from '../types/gacha';

export const SERPENT_AVATARS: Record<string, SerpentAvatar> = {
  vanguard_striker: {
    id: 'vanguard_striker',
    name: 'SV-01 先鋒獵手',
    title: '超導巡航先鋒機體',
    rarity: 'SR',
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    accentColor: '#38bdf8',
    skinStyle: 'striker',
    description: '巡航型高速截擊巨蛇。雙軌超導雷射滑軌，身軀輕盈靈動，破空疾馳。',
    combatPower: 880,
    stats: {
      hpBonus: 60,
      speedBonus: 30,
      damageMult: 1.15,
      fireRateMult: 1.12,
      critBonus: 0.08,
      specialDesc: '機關槍初始射速 +20%，巡航速度提高。',
    },
  },
  titan_aegis: {
    id: 'titan_aegis',
    name: 'SV-02 泰坦重盾',
    title: '奈米超密重裝堡壘',
    rarity: 'SSR',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    accentColor: '#fbbf24',
    skinStyle: 'titan',
    description: '黃金重甲厚重戰艦。六角加厚裝甲板與重型護盾格柵，肉身阻攔極限減傷。',
    combatPower: 1720,
    stats: {
      hpBonus: 380,
      speedBonus: 0,
      damageMult: 1.25,
      fireRateMult: 1.0,
      critBonus: 0.05,
      specialDesc: '肉身擋彈減傷 40%，衝撞傷害 +80%。',
    },
  },
  void_conductor: {
    id: 'void_conductor',
    name: 'SV-03 虛空超導',
    title: '量子引力暴風原型機',
    rarity: 'SSR',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    accentColor: '#c084fc',
    skinStyle: 'void',
    description: '紫晶空間折疊機型。搭載暗物質奇異點核心，特斯拉電弧與連鎖反應威能激增。',
    combatPower: 1850,
    stats: {
      hpBonus: 140,
      speedBonus: 35,
      damageMult: 1.35,
      fireRateMult: 1.25,
      critBonus: 0.16,
      specialDesc: '特斯拉跳躍數 +2，暴擊傷害額外提升。',
    },
  },
  fission_archon: {
    id: 'fission_archon',
    name: 'SV-04 裂變巨神',
    title: '原初終焉殲滅帝王',
    rarity: 'UR',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    accentColor: '#ef4444',
    skinStyle: 'fission',
    description: '緋紅星蝕原初巨神。覆蓋鋸齒毀滅晶核外殼，全武器附帶星蝕毀滅烈焰。',
    combatPower: 3400,
    stats: {
      hpBonus: 550,
      speedBonus: 55,
      damageMult: 1.75,
      fireRateMult: 1.4,
      critBonus: 0.28,
      specialDesc: '全武器射程 +30%，電漿與雷射附帶星蝕毀滅爆炸。',
    },
  },
};

// 18 Diverse Talismans across R, SR, SSR, and UR
export const TALISMANS: Record<string, Talisman> = {
  // --- UR TIER (Pink/Red Neon Rainbow, #ec4899) ---
  tesseract_core: {
    id: 'tesseract_core',
    name: '超立方體共振核心',
    title: '四維高壓樞紐',
    rarity: 'UR',
    color: '#ec4899',
    icon: 'Box',
    description: '四維空間能量共振，全武器攻擊力大幅暴增 45%！',
    combatPower: 960,
    stats: { damageMult: 0.45, critBonus: 0.15 },
  },
  primal_geometry_jewel: {
    id: 'primal_geometry_jewel',
    name: '萬象幾何原石',
    title: '太初晶體基質',
    rarity: 'UR',
    color: '#ec4899',
    icon: 'Hexagon',
    description: '遠古幾何巨擘體內的太初晶核，提供全面的高額戰力提升！',
    combatPower: 1150,
    stats: { damageMult: 0.35, hpBonus: 400, critBonus: 0.18, fireRateMult: 0.22 },
  },
  void_singularity_eye: {
    id: 'void_singularity_eye',
    name: '虛空奇點之眼',
    title: '重力坍縮核心',
    rarity: 'UR',
    color: '#ec4899',
    icon: 'Disc',
    description: '引力奇點撕裂空間，對首領造成 +40% 額外崩解重傷！',
    combatPower: 1020,
    stats: { bossDamageBonus: 0.40, magnetBonus: 200, damageMult: 0.25 },
  },
  quantum_chronos_gear: {
    id: 'quantum_chronos_gear',
    name: '量子時之齒輪',
    title: '時空相位閥門',
    rarity: 'UR',
    color: '#ec4899',
    icon: 'Zap',
    description: '扭曲局部時間流速，衝刺冷卻大幅縮減 40%，射速暴增！',
    combatPower: 980,
    stats: { dashCooldownMult: 0.60, fireRateMult: 0.35, damageMult: 0.2 },
  },

  // --- SSR TIER (Gold / Amber, #f59e0b) ---
  singularity_lens: {
    id: 'singularity_lens',
    name: '奇異重力透鏡',
    title: '微型黑洞磁吸器',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Disc',
    description: '全螢幕範圍內經驗核心與零件產生極限重力牽引，磁吸半徑激增！',
    combatPower: 620,
    stats: { magnetBonus: 180, damageMult: 0.18 },
  },
  quantum_flux_coil: {
    id: 'quantum_flux_coil',
    name: '超頻量子線圈',
    title: '光速激發電樞',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Zap',
    description: '突破熱能發射極限，巨幅加速全砲塔射擊頻率與衝刺冷卻！',
    combatPower: 680,
    stats: { fireRateMult: 0.32, dashCooldownMult: 0.75 },
  },
  aurora_prism: {
    id: 'aurora_prism',
    name: '極光高能棱鏡',
    title: '相干光學分束鏡',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Sparkles',
    description: '折射所有動能與雷射光束，全彈藥貫穿能力 +2，暴擊率激增！',
    combatPower: 720,
    stats: { pierceBonus: 2, critBonus: 0.2 },
  },
  hyperdrive_resonator: {
    id: 'hyperdrive_resonator',
    name: '超空間共振腔',
    title: '曲率激波發電機',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Flame',
    description: '蛇身衝撞與肉身掃擊威力提高 150%，附帶巨大擊退衝擊波！',
    combatPower: 650,
    stats: { ramDamageMult: 1.5, damageMult: 0.2 },
  },
  plasma_overdrive_cell: {
    id: 'plasma_overdrive_cell',
    name: '電漿過載電池',
    title: '高密聚變儲能罐',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Radio',
    description: '所有爆炸與迫擊砲範圍擴大 50%，威力提升 25%！',
    combatPower: 660,
    stats: { damageMult: 0.25, fireRateMult: 0.15 },
  },
  aegis_bulwark_rune: {
    id: 'aegis_bulwark_rune',
    name: '神盾壁壘符文',
    title: '絕對防禦銘文',
    rarity: 'SSR',
    color: '#f59e0b',
    icon: 'Shield',
    description: '蛇體防護耐久增加 300 點，肉身擋彈阻截效率大幅提升！',
    combatPower: 640,
    stats: { hpBonus: 300, regenHpPerSec: 6 },
  },

  // --- SR TIER (Neon Purple, #a855f7) ---
  nanite_hull_matrix: {
    id: 'nanite_hull_matrix',
    name: '奈米重構甲片',
    title: '自我修復骨架',
    rarity: 'SR',
    color: '#a855f7',
    icon: 'Shield',
    description: '活體奈米蟲持續流動於蛇身與核心，巨幅強化耐久防禦。',
    combatPower: 460,
    stats: { hpBonus: 280, regenHpPerSec: 4 },
  },
  absolute_zero_shard: {
    id: 'absolute_zero_shard',
    name: '零點低溫晶簇',
    title: '絕對零度碎屑',
    rarity: 'SR',
    color: '#a855f7',
    icon: 'Snowflake',
    description: '冰凍光束遲緩效果翻倍，所有受凍敵軍額外承受 +25% 傷害。',
    combatPower: 450,
    stats: { damageMult: 0.22 },
  },
  antimatter_thruster: {
    id: 'antimatter_thruster',
    name: '反物質推進噴口',
    title: '強衝量定向引擎',
    rarity: 'SR',
    color: '#a855f7',
    icon: 'Flame',
    description: '蛇身衝撞與肉身掃擊威力提高 100%，衝刺速度大幅增加。',
    combatPower: 480,
    stats: { ramDamageMult: 1.0, damageMult: 0.16 },
  },
  vampiric_siphon_node: {
    id: 'vampiric_siphon_node',
    name: '奈米汲能節點',
    title: '生物電汲取電極',
    rarity: 'SR',
    color: '#a855f7',
    icon: 'Zap',
    description: '每擊潰一組幾何敵人即時轉換微量生命，並提供 4 HP/s 自動修復！',
    combatPower: 490,
    stats: { regenHpPerSec: 8, hpBonus: 160 },
  },
  kinetic_accelerator: {
    id: 'kinetic_accelerator',
    name: '動能彈道加速器',
    title: '電磁軌道激發管',
    rarity: 'SR',
    color: '#a855f7',
    icon: 'Crosshair',
    description: '全彈藥射速與飛行速度提高，機砲貫穿數 +1。',
    combatPower: 470,
    stats: { pierceBonus: 1, fireRateMult: 0.18, damageMult: 0.14 },
  },

  // --- R TIER (Sky Blue, #38bdf8) ---
  reactive_armor_plate: {
    id: 'reactive_armor_plate',
    name: '反應裝甲護板',
    title: '外掛複合鋼板',
    rarity: 'R',
    color: '#38bdf8',
    icon: 'Shield',
    description: '抵擋幾何衝擊，巨蛇血量上限 +150。',
    combatPower: 260,
    stats: { hpBonus: 150 },
  },
  energy_recycler: {
    id: 'energy_recycler',
    name: '能量回收線圈',
    title: '磁場集能環',
    rarity: 'R',
    color: '#38bdf8',
    icon: 'Disc',
    description: '提高戰場能量利用率，經驗吸附範圍 +80。',
    combatPower: 250,
    stats: { magnetBonus: 80, damageMult: 0.08 },
  },
  overcharged_capacitor: {
    id: 'overcharged_capacitor',
    name: '過載電容組',
    title: '高頻放電器',
    rarity: 'R',
    color: '#38bdf8',
    icon: 'Zap',
    description: '提升放電頻率，暴擊率 +10%，傷害 +10%。',
    combatPower: 280,
    stats: { critBonus: 0.10, damageMult: 0.10 },
  },
};

export const DEFAULT_INVENTORY: GachaInventory = {
  ownedAvatars: ['vanguard_striker'],
  equippedAvatar: 'vanguard_striker',
  ownedTalismans: ['reactive_armor_plate', 'nanite_hull_matrix'],
  talismanLevels: {
    reactive_armor_plate: 1,
    nanite_hull_matrix: 1,
  },
  equippedTalismans: ['reactive_armor_plate', 'nanite_hull_matrix'],
  pityCounter: 0,
};

export function calculateCombatPower(inventory: GachaInventory): number {
  const avatar = SERPENT_AVATARS[inventory.equippedAvatar] || SERPENT_AVATARS.vanguard_striker;
  let cp = avatar.combatPower;

  for (const tid of inventory.equippedTalismans) {
    const t = TALISMANS[tid];
    if (t) {
      const lvl = inventory.talismanLevels[tid] || 1;
      // Multiplied by duplicate level stack
      cp += Math.round(t.combatPower * (1 + (lvl - 1) * 0.3));
    }
  }

  return cp;
}

export interface CombinedGachaStats {
  avatarId: string;
  avatarColor: string;
  avatarAccent: string;
  skinStyle: 'striker' | 'titan' | 'void' | 'fission';
  hpBonus: number;
  speedBonus: number;
  damageMult: number;
  fireRateMult: number;
  critBonus: number;
  magnetBonus: number;
  dashCooldownMult: number;
  ramDamageMult: number;
  pierceBonus: number;
  bossDamageBonus: number;
  regenHpPerSec: number;
  specialDesc: string;
}

export function getCombinedGachaStats(inventory: GachaInventory): CombinedGachaStats {
  const avatar = SERPENT_AVATARS[inventory.equippedAvatar] || SERPENT_AVATARS.vanguard_striker;
  
  let hpBonus = avatar.stats.hpBonus;
  let speedBonus = avatar.stats.speedBonus;
  let damageMult = avatar.stats.damageMult;
  let fireRateMult = avatar.stats.fireRateMult;
  let critBonus = avatar.stats.critBonus;
  let magnetBonus = 0;
  let dashCooldownMult = 1.0;
  let ramDamageMult = 1.0;
  let pierceBonus = 0;
  let bossDamageBonus = 0;
  let regenHpPerSec = 0;

  for (const tid of inventory.equippedTalismans) {
    const t = TALISMANS[tid];
    if (!t) continue;
    const lvl = inventory.talismanLevels[tid] || 1;
    const stackFactor = 1 + (lvl - 1) * 0.25;

    if (t.stats.damageMult) damageMult += t.stats.damageMult * stackFactor;
    if (t.stats.fireRateMult) fireRateMult += t.stats.fireRateMult * stackFactor;
    if (t.stats.hpBonus) hpBonus += Math.round(t.stats.hpBonus * stackFactor);
    if (t.stats.magnetBonus) magnetBonus += Math.round(t.stats.magnetBonus * stackFactor);
    if (t.stats.critBonus) critBonus += t.stats.critBonus * stackFactor;
    if (t.stats.dashCooldownMult) dashCooldownMult *= Math.pow(t.stats.dashCooldownMult, 1 + (lvl - 1) * 0.1);
    if (t.stats.ramDamageMult) ramDamageMult += t.stats.ramDamageMult * stackFactor;
    if (t.stats.pierceBonus) pierceBonus += t.stats.pierceBonus;
    if (t.stats.bossDamageBonus) bossDamageBonus += t.stats.bossDamageBonus * stackFactor;
    if (t.stats.regenHpPerSec) regenHpPerSec += t.stats.regenHpPerSec * stackFactor;
  }

  return {
    avatarId: avatar.id,
    avatarColor: avatar.color,
    avatarAccent: avatar.accentColor,
    skinStyle: avatar.skinStyle,
    hpBonus,
    speedBonus,
    damageMult,
    fireRateMult,
    critBonus,
    magnetBonus,
    dashCooldownMult,
    ramDamageMult,
    pierceBonus,
    bossDamageBonus,
    regenHpPerSec,
    specialDesc: avatar.stats.specialDesc,
  };
}
