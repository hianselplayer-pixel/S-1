/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TURRET_CATALOG } from './constants';
import { GameEngine } from './GameEngine';
import { TurretType, UpgradeOption } from '../types/game';

export function generateUpgradeOptions(engine: GameEngine): UpgradeOption[] {
  const allTurretTypes = Object.keys(TURRET_CATALOG) as TurretType[];
  const currentBodyTypes = Array.from(new Set(engine.segments.map((s) => s.turretType)));
  const currentHeadTypes = Array.from(new Set(engine.headWeapons.map((w) => w.type)));
  const combinedTypes = Array.from(new Set([...currentHeadTypes, ...currentBodyTypes]));

  const candidates: UpgradeOption[] = [];

  // 1. Head Battery Heavy Upgrades (蛇頭主砲升級)
  currentHeadTypes.forEach((type) => {
    const def = TURRET_CATALOG[type];
    candidates.push({
      id: `head_upgrade_${type}_${Math.random()}`,
      title: `蛇頭旗艦砲超頻：${def.nameZh}`,
      subtitle: `Head Flagship ${def.name} ++`,
      description: `大幅強化蛇頭搭載的「${def.nameZh}」，傷害提升 40%，彈道速度提升 25%，射程額外延伸。`,
      rarity: 'epic',
      category: 'head_mount',
      icon: 'ChevronsUp',
      targetTurret: type,
      apply: () => {
        engine.upgradeTurretsOfType(type);
      },
    });
  });

  // 2. Mount New Battery on Head
  const unmountedOnHead = allTurretTypes.filter((t) => !currentHeadTypes.includes(t));
  unmountedOnHead.slice(0, 3).forEach((type) => {
    const def = TURRET_CATALOG[type];
    candidates.push({
      id: `head_mount_${type}_${Math.random()}`,
      title: `蛇頭增設副砲：${def.nameZh}`,
      subtitle: `Mount ${def.name} on Head`,
      description: `直接在蛇頭主戰裝甲上擴充安裝「${def.nameZh}」，前方火力傾瀉直接翻倍！`,
      rarity: def.rarity === 'common' ? 'rare' : 'epic',
      category: 'head_mount',
      icon: def.icon,
      targetTurret: type,
      apply: () => {
        engine.addHeadWeapon(type);
      },
    });
  });

  // 3. Body Segment Additions
  allTurretTypes.forEach((type) => {
    const def = TURRET_CATALOG[type];
    candidates.push({
      id: `add_seg_${type}_${Math.random()}`,
      title: `蛇身掛載：${def.nameZh}`,
      subtitle: `${def.name} Segment`,
      description: `在巨蛇身軀後方新增一節防禦裝甲，安裝「${def.nameZh}」，擴大身軀長度與共振力場。`,
      rarity: def.rarity,
      category: 'module_add',
      icon: def.icon,
      targetTurret: type,
      apply: () => {
        engine.addSegment(type);
      },
    });
  });

  // 4. Upgrade All Types
  combinedTypes.forEach((type) => {
    const def = TURRET_CATALOG[type];
    candidates.push({
      id: `upgrade_${type}_${Math.random()}`,
      title: `全軍超頻：${def.nameZh}`,
      subtitle: `${def.name} Fleet Overclock`,
      description: `蛇頭與蛇身所有「${def.nameZh}」等級 +1，射速 +25%，威力全面升級。`,
      rarity: def.rarity === 'common' ? 'rare' : 'epic',
      category: 'module_upgrade',
      icon: 'ChevronsUp',
      targetTurret: type,
      apply: () => {
        engine.upgradeTurretsOfType(type);
      },
    });
  });

  // 5. Head Range & Multi-Target Radar
  candidates.push({
    id: `head_range_${Math.random()}`,
    title: '長程廣域幾何雷達陣列',
    subtitle: 'Ultra-Range Targeting Array',
    description: '蛇頭與所有砲塔射程增加 40%，鎖敵距離大幅延伸至戰場邊緣，極限狙殺敵軍！',
    rarity: 'rare',
    category: 'snake_hull',
    icon: 'Radio',
    apply: () => {
      engine.globalDamageMult += 0.15;
    },
  });

  // 6. Kinetic Ram Blades
  candidates.push({
    id: `ram_upgrade_${Math.random()}`,
    title: '重型動能破城衝角',
    subtitle: 'Kinetic Ram Prow',
    description: '蛇頭撞擊傷害提升 60%，衝刺撞擊將直接粉碎沿途幾何敵軍並爆發衝擊波。',
    rarity: 'rare',
    category: 'snake_hull',
    icon: 'ShieldAlert',
    apply: () => {
      engine.ramDamage = Math.round(engine.ramDamage * 1.6);
    },
  });

  // 7. Turbo Dash
  candidates.push({
    id: `dash_cooldown_${Math.random()}`,
    title: '渦輪推進超頻冷卻',
    subtitle: 'Turbo Dash Supercharger',
    description: '衝刺冷卻時間縮短 30%，並在啟動時向周圍爆射破片。',
    rarity: 'rare',
    category: 'snake_hull',
    icon: 'FastForward',
    apply: () => {
      engine.maxDashCooldown = Math.max(1.0, engine.maxDashCooldown * 0.7);
    },
  });

  // 8. Resonant Loop Overload
  candidates.push({
    id: `resonant_overload_${Math.random()}`,
    title: '烏洛波羅斯幾何共振環爆',
    subtitle: 'Ouroboros Resonance Loop',
    description: '蛇身自繞成環時觸發的「超導幾何共振」威力提升 120%，瞬間秒殺環內密集蟲群！',
    rarity: 'epic',
    category: 'relic',
    icon: 'Zap',
    apply: () => {
      engine.globalDamageMult += 0.25;
    },
  });

  // 9. Reactor Core Restoration
  candidates.push({
    id: `core_repair_${Math.random()}`,
    title: '反應爐緊急奈米修復',
    subtitle: 'Prometheus Core Restoration',
    description: '立即修復中央反應爐 500 點生命值，並在反應爐周圍形成高壓防護電場。',
    rarity: 'rare',
    category: 'core_defense',
    icon: 'Wrench',
    apply: () => {
      engine.reactorHp = Math.min(engine.reactorMaxHp, engine.reactorHp + 500);
    },
  });

  // 10. Nanite Serpent Chassis
  candidates.push({
    id: `hull_armor_${Math.random()}`,
    title: '奈米合金重裝甲',
    subtitle: 'Nanite Serpent Chassis',
    description: '巨蛇最大生命值 +100，護盾上限 +40，並立即完全修復目前受損生命。',
    rarity: 'common',
    category: 'snake_hull',
    icon: 'HeartPulse',
    apply: () => {
      engine.snakeMaxHp += 100;
      engine.snakeHp = engine.snakeMaxHp;
      engine.snakeMaxShield += 40;
      engine.snakeShield = engine.snakeMaxShield;
    },
  });

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
