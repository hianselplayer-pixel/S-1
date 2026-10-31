/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Crosshair, Bug, Lightbulb, Zap, Swords } from 'lucide-react';
import { TURRET_CATALOG } from '../game/constants';
import { TurretType } from '../types/game';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'enemies' | 'tactics'>('modules');

  const enemyData = [
    {
      name: '銳角三角追獵者 (Triangle Rusher)',
      shape: '正三角形 ▲',
      threat: '高移速穿刺',
      hp: '中等',
      speed: '極高 (155 px/s)',
      color: '#ef4444',
      desc: '由高銳度紅色幾何三角面構成的極速單位。常以楔形突擊隊形從邊界衝鋒，以尖端直刺蛇體。',
    },
    {
      name: '重方甲重裝堡壘 (Square Bastion)',
      shape: '重裝正方形 ■',
      threat: '重型衝撞坦克',
      hp: '極高 (130+ HP)',
      speed: '緩慢 (75 px/s)',
      color: '#f59e0b',
      desc: '厚重晶體方塊，內嵌旋轉防護菱形，無視一般撞擊硬直，直線碾壓中央普羅米修斯反應爐。',
    },
    {
      name: '五角散彈晶體 (Pentagon Sharder)',
      shape: '正五邊形 ⬟',
      threat: '遠程三向彈幕',
      hp: '中高',
      speed: '中等 (90 px/s)',
      color: '#a855f7',
      desc: '在安全距離外懸浮旋轉，週期性向前方發射 3 道分裂幾何晶片彈丸，阻礙巨蛇遊走。',
    },
    {
      name: '六角晶簇蜂群 (Hexagon Swarmer)',
      shape: '六角蜂巢晶體 ⬢',
      threat: '超密集集群淹沒',
      hp: '低',
      speed: '高速 (120 px/s)',
      color: '#06b6d4',
      desc: '成群結隊湧現的青色幾何蜂群，數量可達數十隻。利用蛇頭噴火器或電漿迫擊砲可瞬間成片收割！',
    },
    {
      name: '菱形相位幽影 (Diamond Infiltrator)',
      shape: '銳利菱形 ◆',
      threat: '閃避暗殺刺客',
      hp: '中等',
      speed: '高速 (140 px/s)',
      color: '#10b981',
      desc: '具備頻率相位轉移能力，移動飄忽，擅長穿插至蛇身盲區發動啃咬。',
    },
    {
      name: '八角暴君巨怪 (Octagon Juggernaut)',
      shape: '八邊形暴君 ⯃',
      threat: '精英怪 (巨額血量)',
      hp: '超厚 (220+ HP)',
      speed: '沉穩 (70 px/s)',
      color: '#f97316',
      desc: '擁有外環圍繞力場的重裝幾何霸主，擊殺必掉落多枚零件與海量經驗核心！',
    },
    {
      name: '十二芒自爆星核 (Star Supernova)',
      shape: '十二芒尖刺星 ✹',
      threat: '自爆高額 AOE',
      hp: '脆弱',
      speed: '超高速 (180 px/s)',
      color: '#eab308',
      desc: '金色高速旋轉星核，靠近目標後引發強烈幾何連鎖超新星大爆炸！務必優先長程狙殺。',
    },
    {
      name: '旋風三稜旋刃 (Vortex Tri-Blades)',
      shape: '弧刃三芒旋輪 🌀',
      threat: '螺旋軌跡 + 雙重弧線飛鏢',
      hp: '中等 (65+ HP)',
      speed: '變速迴旋 (130 px/s)',
      color: '#06b6d4',
      desc: '以向內收縮的阿基米德螺旋軌跡移動，邊旋轉邊射出兩道向外弧線彎曲的雙子飛鏢，難以單純直線預判。',
    },
    {
      name: '脈衝光環·星環幾何 (Pulsar Torus Ring)',
      shape: '懸浮同心光環 🔘',
      threat: '環狀擴散衝擊波 + 軌道巡遊',
      hp: '高 (95+ HP)',
      speed: '環形遊弋 (85 px/s)',
      color: '#ec4899',
      desc: '保持在外圍 360px 圓周軌道繞行，定期釋放由內向外擴散的環形能量光圈，需要蛇身精確阻擋或穿透。',
    },
    {
      name: '晶棱疾刺·雙角刃 (Prism Dive-Dart)',
      shape: '雙角裂晶尖棱 ⚔️',
      threat: '超音速俯衝 + 加速晶片',
      hp: '中等 (75+ HP)',
      speed: '蓄力暴衝 (420 px/s)',
      color: '#38bdf8',
      desc: '先短暫懸停鎖定目標，隨後噴射高能藍焰進行超音速直線穿刺，並發射初速慢但迅速二段加速的高能晶片。',
    },
    {
      name: '雙螺旋共振體 (Twin Helix Swarm)',
      shape: '雙絞DNA共振晶格 🧬',
      threat: '正弦正交波浪走位 + 弧形電漿',
      hp: '中等 (80+ HP)',
      speed: '正弦蛇行 (115 px/s)',
      color: '#a855f7',
      desc: '雙晶核心以正弦 S 形波動前進，左右輪流發射波浪式擺動的雙向電漿球，封鎖大面積空域。',
    },
    {
      name: '懸浮聖方·禁衛方碑 (Monolith Sentinel Cube)',
      shape: '重空心超立方體 ◫',
      threat: '方陣聯防 + 4向十字重砲',
      hp: '極高 (180+ HP)',
      speed: '緩慢沉穩 (65 px/s)',
      color: '#10b981',
      desc: '成橫列方陣推進的禁衛重方，周身有旋轉折射護甲，每隔數秒同時向四個正交方向發射十字光束或方菱破片。',
    },
    {
      name: '超維超正方體·泰坦 (Boss Tesseract)',
      shape: '四維超立方投影',
      threat: '第 3 波超級首領',
      hp: '6,800+ HP',
      speed: '穩固行進',
      color: '#ec4899',
      desc: '將四維空間摺疊投射於二維平面的終極幾何體！內外方塊反向旋轉，發射十字激光陣列並召喚三角突擊群。',
    },
    {
      name: '虛空湮滅星核·主宰 (Boss Void Star)',
      shape: '十六芒雙環星核',
      threat: '第 4 波災難首領',
      hp: '15,000+ HP',
      speed: '全場遊弋',
      color: '#8b5cf6',
      desc: '釋放螺旋幾何彈幕風暴與雙向貫穿死光，擁有外層幾何能量護盾，考驗蛇身共振與走位技巧。',
    },
    {
      name: '萬象幾何母體·原初 (Boss World Eater)',
      shape: '十邊母體多面體',
      threat: '第 5 波終極天災',
      hp: '24,000+ HP',
      speed: '壓迫式行進',
      color: '#dc2626',
      desc: '幾何蟲潮的起源母體！全螢幕 20 向高能電漿齊射，並源源不絕分裂孵化各類幾何衛兵。',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-53px)] bg-slate-950 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-1">
              TACTICAL INTEL & CODEX
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
              戰術情報庫 · 幾何敵軍與主砲圖鑑
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              查閱蛇頭戰艦旗艦火網、各幾何怪物行為模式與超級泰坦首領應對策略。
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 my-5 p-1 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'modules' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>蛇頭主砲與身軀武裝</span>
          </button>
          <button
            onClick={() => setActiveTab('enemies')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'enemies' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>幾何怪與超強Boss</span>
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tactics' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>超導環形共振戰術</span>
          </button>
        </div>

        {/* Tab 1: Modules */}
        {activeTab === 'modules' && (
          <div className="space-y-4 pb-8">
            <div className="p-4 bg-cyan-950/20 border border-cyan-500/40 rounded-xl flex items-center gap-3">
              <Swords className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-bold text-cyan-300">蛇頭重型艦載架構：</span>
                戰艦蛇頭集結了大部分核心重型火砲（雙聯火神機砲、高能雷射、重型電漿迫擊砲），射程高達 500~720px！
                蛇身各節段則負責側翼壓制（泰斯拉閃電、火焰、急凍、尾部地雷與共振力場）。
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(TURRET_CATALOG) as TurretType[]).map((type) => {
                const def = TURRET_CATALOG[type];
                return (
                  <div
                    key={type}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: def.color }} />
                          <h3 className="text-sm font-bold text-slate-100">{def.nameZh}</h3>
                        </div>
                        <span className="text-[11px] font-mono uppercase text-slate-500">{def.name}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{def.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <div>基礎傷害: <span className="text-slate-200 font-semibold">{def.baseDamage}</span></div>
                      <div>射擊間隔: <span className="text-slate-200 font-semibold">{def.fireInterval}s</span></div>
                      <div>超長射程: <span className="text-cyan-400 font-semibold">{def.range}px</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Enemies */}
        {activeTab === 'enemies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {enemyData.map((e) => (
              <div
                key={e.name}
                className={`bg-slate-900/60 border rounded-xl p-4 ${
                  e.threat.includes('首領') || e.threat.includes('終極')
                    ? 'border-red-500/60 bg-red-950/15'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                    <h3 className="text-sm font-bold text-slate-100">{e.name}</h3>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono font-semibold">{e.shape}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">{e.desc}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <div>生命: <span className="text-slate-200">{e.hp}</span></div>
                  <div>移速: <span className="text-slate-200">{e.speed}</span></div>
                  <div>特徵: <span className="text-amber-400">{e.threat}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Tactics */}
        {activeTab === 'tactics' && (
          <div className="space-y-4 pb-8">
            <div className="bg-slate-900/70 border border-cyan-500/40 rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-2 text-cyan-400">
                <Crosshair className="w-5 h-5" />
                <h3 className="text-base font-bold">核心錨定守衛 · 蛇身格擋彈幕 (Core Sentinel & Bullet Deflector)</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                蛇尾牢固錨定於普羅米修斯反應爐外環，蛇頭以反向動力自由巡航！
                蛇身各節均包覆高壓霓虹偏折力場，敵方子彈擊中蛇身任何部位時將觸發 <span className="text-cyan-400 font-bold">🛡️ 彈幕格擋 (DEFLECT)</span>，將子彈偏折蒸發並大幅減免傷害，完美替中央反應爐擋下致命射擊！
              </p>
              <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                💡 戰術提示：每吞噬能量核心升級或加裝一節蛇身，巨蛇的最大守衛半徑將向外擴展 +34m，讓您能在大半個戰場範圍內自由巡邏阻擊！
              </div>
            </div>

            <div className="bg-slate-900/70 border border-purple-500/40 rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-2 text-purple-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-base font-bold">多軌幾何霓虹線條外骨骼 (Multi-Rail Neon Exoskeleton)</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                巨蛇外殼由雙軌高壓雷射主樑、橫向肋骨、對角交叉桁架以及動態電漿脊髓構成，砲塔節點以線框旋轉六角形與雙聯裝發射軌道呈現，在黑暗戰場上綻放純粹向量霓虹美學！
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-100 mb-2">蛇頭超長程重砲狙殺</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                蛇頭主戰武裝射程達到 520~720px，您只需將蛇頭對準敵潮最密集的方位，雙聯機砲與貫穿雷射將直接在遠處把大群幾何三角形與自爆星核蒸發。
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-100 mb-2">戰場地貌與全息雷達導引</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                戰場劃分為四大戰術地貌區塊（西北極凍冷脊、東北高熱電漿工廠、西南強酸深塹、東南泰坦廢墟殘骸），中央反應爐延伸出 4 條高壓電纜能量通道，並持續進行 360 度全息雷達掃描與聲納脈衝擴散。
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li>觀察旋轉雷達波與聲納光環，可快速定位自身相對於中央核心的方向與距離。</li>
                <li>漂浮的奈米微塵會因蛇頭高速衝刺或重型爆破產生擴散氣流漣漪。</li>
                <li>首領波次降臨時，全場雷達將轉入緊急紅光警戒，提示泰坦巨獸進逼！</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
