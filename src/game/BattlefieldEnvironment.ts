/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ARENA_WIDTH, ARENA_HEIGHT, REACTOR_RADIUS } from './constants';

export interface AmbientDustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  parallax: number; // 0.3 (distant) to 1.0 (near)
  color: string;
}

export interface LightStreamer {
  x: number;
  y: number;
  z: number; // 3D depth layer
  vx: number;
  vy: number;
  length: number;
  thickness: number;
  color: string;
  glowColor: string;
  headGlow: string;
  curveAmp: number;
  curveFreq: number;
  phase: number;
  alpha: number;
}

export interface TerrainVent {
  x: number;
  y: number;
  radius: number;
  type: 'plasma_heat' | 'cryo_cold' | 'bio_acid' | 'power_beacon';
  color: string;
  glowPhase: number;
  name: string;
}

export interface PowerConduit {
  points: { x: number; y: number }[];
  color: string;
  pulseSpeed: number;
}

export interface SectorDecal {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'hex_pad' | 'hull_plating' | 'hazard_grate' | 'fissure';
  color: string;
  rotation: number;
  label?: string;
}

export class BattlefieldEnvironment {
  // Dust motes
  private dustParticles: AmbientDustParticle[] = [];

  // Dynamic Flowing Light Streamers & Warp Ribbons (流光系統)
  public streamers: LightStreamer[] = [];
  
  // Dynamic radar scanner state
  public radarAngle: number = 0;
  public radarSpeed: number = 0.55; // rad per second
  public scanlineY: number = 0;
  public scanlineSpeed: number = 85;
  
  // Concentric sonar/radar pulse rings from reactor
  public pulseRings: { radius: number; maxRadius: number; speed: number; alpha: number; color: string }[] = [];
  private pulseTimer: number = 0;
  
  // Environmental terrain features
  public terrainVents: TerrainVent[] = [];
  public powerConduits: PowerConduit[] = [];
  public sectorDecals: SectorDecal[] = [];
  
  // Global atmospheric time
  private time: number = 0;

  constructor() {
    this.initDustParticles();
    this.initFlowingStreamers();
    this.initTerrainFeatures();
    this.initPowerConduits();
  }

  private initFlowingStreamers() {
    this.streamers = [];
    const count = 48; // Dense flowing stream field
    const palette = [
      { color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.45)', head: '#ffffff' },
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)', head: '#e0f2fe' },
      { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.40)', head: '#f3e8ff' },
      { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)', head: '#cffafe' },
      { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.40)', head: '#fce7f3' },
    ];

    for (let i = 0; i < count; i++) {
      const p = palette[i % palette.length];
      const speed = 180 + Math.random() * 260;
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.4; // Diagonal cosmic drift
      this.streamers.push({
        x: Math.random() * (ARENA_WIDTH + 800) - 400,
        y: Math.random() * (ARENA_HEIGHT + 800) - 400,
        z: 0.4 + Math.random() * 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 90 + Math.random() * 180,
        thickness: 1.5 + Math.random() * 2.5,
        color: p.color,
        glowColor: p.glow,
        headGlow: p.head,
        curveAmp: 15 + Math.random() * 35,
        curveFreq: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.45,
      });
    }
  }

  private initDustParticles() {
    this.dustParticles = [];
    const count = 75;
    const colors = [
      'rgba(56, 189, 248, ',  // Sky cyan
      'rgba(14, 165, 233, ',  // Deep sky
      'rgba(168, 85, 247, ',  // Plasma violet
    ];

    for (let i = 0; i < count; i++) {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      this.dustParticles.push({
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        size: 0.8 + Math.random() * 1.4,
        baseAlpha: 0.03 + Math.random() * 0.06, // Significantly subdued
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.8 + Math.random() * 1.2,
        parallax: 0.3 + Math.random() * 0.5,
        color: colorBase,
      });
    }
  }

  private initTerrainFeatures() {
    const rx = ARENA_WIDTH / 2;
    const ry = ARENA_HEIGHT / 2;

    // Strategic Sector Biome Vents
    this.terrainVents = [
      // Sector NW: Cryo Fissures
      { x: rx - 650, y: ry - 450, radius: 90, type: 'cryo_cold', color: '#06b6d4', glowPhase: 0, name: 'SECTOR-01 · CRYO RIDGE' },
      { x: rx - 850, y: ry - 300, radius: 70, type: 'cryo_cold', color: '#38bdf8', glowPhase: 1.2, name: 'STASIS CONDUIT' },
      
      // Sector NE: Overheated Plasma Foundry
      { x: rx + 650, y: ry - 450, radius: 95, type: 'plasma_heat', color: '#f97316', glowPhase: 2.4, name: 'SECTOR-02 · PLASMA FOUNDRY' },
      { x: rx + 800, y: ry - 280, radius: 65, type: 'plasma_heat', color: '#ef4444', glowPhase: 0.8, name: 'THERMAL VENT-B' },
      
      // Sector SW: Bioluminescent Acid Sludge Trench
      { x: rx - 680, y: ry + 460, radius: 100, type: 'bio_acid', color: '#84cc16', glowPhase: 1.8, name: 'SECTOR-03 · ACID TRENCH' },
      { x: rx - 480, y: ry + 580, radius: 75, type: 'bio_acid', color: '#10b981', glowPhase: 3.1, name: 'BIO-SLUDGE BASIN' },
      
      // Sector SE: Derelict Titan Cyber Ruin Outpost
      { x: rx + 720, y: ry + 480, radius: 110, type: 'power_beacon', color: '#eab308', glowPhase: 0.4, name: 'SECTOR-04 · TITAN RUIN' },
      { x: rx + 520, y: ry + 620, radius: 65, type: 'power_beacon', color: '#a855f7', glowPhase: 2.0, name: 'RELIC BEACON-9' },
    ];

    // Sector Ground Decals & Structural Floor Plates
    this.sectorDecals = [
      // Central Hex Bastion Pads
      { x: rx, y: ry, width: 280, height: 280, type: 'hex_pad', color: '#0f1f38', rotation: 0, label: 'REACTOR FORTRESS CORE' },
      { x: rx - 260, y: ry - 160, width: 140, height: 100, type: 'hazard_grate', color: '#1e293b', rotation: 0.1, label: 'VENT-N' },
      { x: rx + 260, y: ry - 160, width: 140, height: 100, type: 'hazard_grate', color: '#1e293b', rotation: -0.1, label: 'VENT-E' },
      { x: rx - 260, y: ry + 160, width: 140, height: 100, type: 'hazard_grate', color: '#1e293b', rotation: -0.1, label: 'VENT-W' },
      { x: rx + 260, y: ry + 160, width: 140, height: 100, type: 'hazard_grate', color: '#1e293b', rotation: 0.1, label: 'VENT-S' },
      
      // Heavy Titan Hull Platings in Outlying Sectors
      { x: rx - 700, y: ry - 400, width: 220, height: 140, type: 'hull_plating', color: '#111827', rotation: 0.25, label: 'HULL FRAGMENT A-7' },
      { x: rx + 750, y: ry - 420, width: 240, height: 160, type: 'hull_plating', color: '#18181b', rotation: -0.2, label: 'SMELTER CHASSIS' },
      { x: rx - 650, y: ry + 500, width: 200, height: 120, type: 'fissure', color: '#142918', rotation: 0.4, label: 'BIO-CORROSION ZONE' },
      { x: rx + 680, y: ry + 520, width: 230, height: 150, type: 'hull_plating', color: '#1e1b2e', rotation: -0.3, label: 'DREADNOUGHT BULKHEAD' },
    ];
  }

  private initPowerConduits() {
    const rx = ARENA_WIDTH / 2;
    const ry = ARENA_HEIGHT / 2;

    // 4 High-tech power lines branching out from Central Reactor to perimeter nodes
    this.powerConduits = [
      // To North-West Cryo Base
      {
        points: [
          { x: rx - 60, y: ry - 40 },
          { x: rx - 240, y: ry - 180 },
          { x: rx - 480, y: ry - 220 },
          { x: rx - 650, y: ry - 450 },
        ],
        color: '#06b6d4',
        pulseSpeed: 1.8,
      },
      // To North-East Plasma Base
      {
        points: [
          { x: rx + 60, y: ry - 40 },
          { x: rx + 240, y: ry - 180 },
          { x: rx + 480, y: ry - 220 },
          { x: rx + 650, y: ry - 450 },
        ],
        color: '#f97316',
        pulseSpeed: 2.1,
      },
      // To South-West Acid Base
      {
        points: [
          { x: rx - 60, y: ry + 40 },
          { x: rx - 240, y: ry + 200 },
          { x: rx - 480, y: ry + 260 },
          { x: rx - 680, y: ry + 460 },
        ],
        color: '#84cc16',
        pulseSpeed: 1.6,
      },
      // To South-East Titan Ruin Base
      {
        points: [
          { x: rx + 60, y: ry + 40 },
          { x: rx + 240, y: ry + 200 },
          { x: rx + 500, y: ry + 280 },
          { x: rx + 720, y: ry + 480 },
        ],
        color: '#eab308',
        pulseSpeed: 2.0,
      },
    ];
  }

  public update(dt: number, isBossWave: boolean) {
    this.time += dt;

    // 1. Radar Rotation (faster during boss warning)
    const currentSpeed = isBossWave ? this.radarSpeed * 1.8 : this.radarSpeed;
    this.radarAngle = (this.radarAngle + currentSpeed * dt) % (Math.PI * 2);

    // 2. Horizontal Cyber Scanline
    this.scanlineY += this.scanlineSpeed * dt;
    if (this.scanlineY > ARENA_HEIGHT + 200) {
      this.scanlineY = -100;
    }

    // 3. Reactor Pulse Waves (radiating sonar pings)
    this.pulseTimer += dt;
    const pulseInterval = isBossWave ? 2.5 : 4.2;
    if (this.pulseTimer >= pulseInterval) {
      this.pulseTimer = 0;
      this.pulseRings.push({
        radius: REACTOR_RADIUS + 10,
        maxRadius: 1100,
        speed: 280,
        alpha: 0.45,
        color: isBossWave ? '#ef4444' : '#38bdf8',
      });
    }

    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const ring = this.pulseRings[i];
      ring.radius += ring.speed * dt;
      ring.alpha -= dt * 0.18;
      if (ring.radius >= ring.maxRadius || ring.alpha <= 0) {
        this.pulseRings.splice(i, 1);
      }
    }

    // 4. Update Dust Particles
    for (const dust of this.dustParticles) {
      dust.x += (dust.vx + Math.sin(this.time * 0.8 + dust.pulsePhase) * 6) * dt;
      dust.y += (dust.vy + Math.cos(this.time * 0.6 + dust.pulsePhase) * 6) * dt;

      // Wrap around arena borders
      if (dust.x < 0) dust.x = ARENA_WIDTH;
      if (dust.x > ARENA_WIDTH) dust.x = 0;
      if (dust.y < 0) dust.y = ARENA_HEIGHT;
      if (dust.y > ARENA_HEIGHT) dust.y = 0;
    }

    // Flowing streamers removed per user request (流光刪除)
  }

  /**
   * Flowing light removed per user request (流光刪除)
   */
  public drawFlowingStreamers(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    screenW: number,
    screenH: number,
    isBossWave: boolean
  ) {
    // Flowing streamers deleted per user request (流光刪除)
  }

  /**
   * Called when giant explosions or dashes occur to ripple nearby dust motes
   */
  public impartImpulse(x: number, y: number, radius: number, force: number) {
    for (const dust of this.dustParticles) {
      const dx = dust.x - x;
      const dy = dust.y - y;
      const d = Math.hypot(dx, dy);
      if (d < radius && d > 1) {
        const push = (1 - d / radius) * force;
        dust.vx += (dx / d) * push;
        dust.vy += (dy / d) * push;
      }
    }
  }

  // --- RENDERING PIPELINE ---

  /**
   * Layer 1: Render Deep Subsurface Biomes & Semi-transparent Glass Floor Platings
   */
  public drawTerrainUnderlay(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, screenW: number, screenH: number, isBossWave: boolean) {
    // 1. Draw Sector Structural Decals & Semi-transparent Glass Floor Plates
    for (const decal of this.sectorDecals) {
      if (
        decal.x + decal.width < cameraX - 100 ||
        decal.x - decal.width > cameraX + screenW + 100 ||
        decal.y + decal.height < cameraY - 100 ||
        decal.y - decal.height > cameraY + screenH + 100
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(decal.x, decal.y);
      ctx.rotate(decal.rotation);

      if (decal.type === 'hex_pad') {
        // Semi-transparent frosted glass hex platform
        ctx.fillStyle = isBossWave ? 'rgba(239, 68, 68, 0.04)' : 'rgba(14, 165, 233, 0.035)';
        ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.10)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * (decal.width / 2);
          const py = Math.sin(a) * (decal.height / 2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner concentric glass ring
        ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 240, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, decal.width * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (decal.type === 'hull_plating') {
        // Semi-transparent dark glass tile
        ctx.fillStyle = isBossWave ? 'rgba(20, 10, 15, 0.35)' : 'rgba(10, 20, 36, 0.30)';
        ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        ctx.fillRect(-decal.width / 2, -decal.height / 2, decal.width, decal.height);
        ctx.strokeRect(-decal.width / 2, -decal.height / 2, decal.width, decal.height);
        
        // Corner bevels
        ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.18)' : 'rgba(0, 240, 255, 0.15)';
        ctx.strokeRect(-decal.width / 2 + 4, -decal.height / 2 + 4, 8, 8);
        ctx.strokeRect(decal.width / 2 - 12, decal.height / 2 - 12, 8, 8);
      } else if (decal.type === 'hazard_grate') {
        // Semi-transparent ventilation grid
        ctx.fillStyle = 'rgba(8, 14, 26, 0.35)';
        ctx.fillRect(-decal.width / 2, -decal.height / 2, decal.width, decal.height);
        ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.10)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-decal.width / 2, -decal.height / 2, decal.width, decal.height);

        // Slotted grates
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
        for (let gx = -decal.width / 2 + 10; gx < decal.width / 2 - 10; gx += 12) {
          ctx.beginPath();
          ctx.moveTo(gx, -decal.height / 2 + 6);
          ctx.lineTo(gx, decal.height / 2 - 6);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // 2. Draw Strategic Sector Vents / Biome Hotspots (Subdued faint ambient)
    for (const vent of this.terrainVents) {
      if (
        vent.x + vent.radius < cameraX - 80 ||
        vent.x - vent.radius > cameraX + screenW + 80 ||
        vent.y + vent.radius < cameraY - 80 ||
        vent.y - vent.radius > cameraY + screenH + 80
      ) {
        continue;
      }

      ctx.save();
      const glow = (Math.sin(this.time * 2.5 + vent.glowPhase) + 1) * 0.5;
      const gradient = ctx.createRadialGradient(vent.x, vent.y, vent.radius * 0.2, vent.x, vent.y, vent.radius);
      
      gradient.addColorStop(0, vent.color + '14');
      gradient.addColorStop(0.6, vent.color + '05');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(vent.x, vent.y, vent.radius * (1 + glow * 0.1), 0, Math.PI * 2);
      ctx.fill();

      // Vent Perimeter Ring (very faint)
      ctx.strokeStyle = vent.color + '1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(vent.x, vent.y, vent.radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Draw Low-profile Energy Conduits
    for (const conduit of this.powerConduits) {
      ctx.save();
      const pts = conduit.points;
      if (pts.length < 2) continue;

      // Conduit Pipe
      ctx.strokeStyle = '#0b1120';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Faint Glowing Inner Core Trace
      ctx.strokeStyle = conduit.color + '18';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Helper to compute position along polyline at percentage t (0..1)
   */
  private interpolateConduitPosition(pts: { x: number; y: number }[], t: number): { x: number; y: number } | null {
    if (pts.length < 2) return null;
    let totalLen = 0;
    const segLens: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segLens.push(l);
      totalLen += l;
    }

    let targetDist = t * totalLen;
    for (let i = 0; i < pts.length - 1; i++) {
      if (targetDist <= segLens[i]) {
        const segT = targetDist / segLens[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * segT,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * segT,
        };
      }
      targetDist -= segLens[i];
    }
    return pts[pts.length - 1];
  }

  /**
   * Layer 2: Render Distant Radar Sweep & Scanlines & Sonar Waves
   */
  public drawRadarAndScanlines(
    ctx: CanvasRenderingContext2D,
    reactorX: number,
    reactorY: number,
    cameraX: number,
    cameraY: number,
    screenW: number,
    screenH: number,
    isBossWave: boolean
  ) {
    ctx.save();

    // 1. Concentric Sonar Energy Pulse Rings (Faint)
    for (const ring of this.pulseRings) {
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, ring.alpha * 0.25);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(reactorX, reactorY, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 2. Rotating Faint Holographic Radar Sweep Wedge from Reactor
    const radarDist = 680;
    const sweepWidth = 0.45;
    const startA = this.radarAngle - sweepWidth;
    const endA = this.radarAngle;

    const radarGrad = ctx.createRadialGradient(reactorX, reactorY, 20, reactorX, reactorY, radarDist);
    if (isBossWave) {
      radarGrad.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
      radarGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.015)');
      radarGrad.addColorStop(1, 'transparent');
    } else {
      radarGrad.addColorStop(0, 'rgba(6, 182, 212, 0.04)');
      radarGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.01)');
      radarGrad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = radarGrad;
    ctx.beginPath();
    ctx.moveTo(reactorX, reactorY);
    ctx.arc(reactorX, reactorY, radarDist, startA, endA);
    ctx.closePath();
    ctx.fill();

    // Leading Sweep Line (Subtle)
    ctx.strokeStyle = isBossWave ? '#ef444433' : '#38bdf825';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(reactorX, reactorY);
    ctx.lineTo(reactorX + Math.cos(endA) * radarDist, reactorY + Math.sin(endA) * radarDist);
    ctx.stroke();

    // Perimeter Radar Sector Rings (Faint)
    [250, 500, 750].forEach((r) => {
      ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.04)' : 'rgba(56, 189, 248, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(reactorX, reactorY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3. Horizontal Cyber Laser Scanline (Subtle)
    if (this.scanlineY >= cameraY - 50 && this.scanlineY <= cameraY + screenH + 50) {
      ctx.strokeStyle = isBossWave ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cameraX, this.scanlineY);
      ctx.lineTo(cameraX + screenW, this.scanlineY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Layer 3: Render Floating Cosmic & Cybernetic Dust Particles (with Parallax & Shimmer)
   */
  public drawAtmosphericDust(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, screenW: number, screenH: number) {
    ctx.save();

    for (const dust of this.dustParticles) {
      // Calculate screen position with depth parallax
      // Closer motes (high parallax) move slightly with camera shift
      const screenPosX = dust.x - (cameraX * (1 - dust.parallax) * 0.15);
      const screenPosY = dust.y - (cameraY * (1 - dust.parallax) * 0.15);

      if (
        screenPosX < cameraX - 20 ||
        screenPosX > cameraX + screenW + 20 ||
        screenPosY < cameraY - 20 ||
        screenPosY > cameraY + screenH + 20
      ) {
        continue;
      }

      // Smooth sine glow pulse
      const alpha = dust.baseAlpha * (0.6 + 0.4 * Math.sin(this.time * dust.pulseSpeed + dust.pulsePhase));
      ctx.fillStyle = dust.color + alpha.toFixed(2) + ')';

      ctx.beginPath();
      ctx.arc(screenPosX, screenPosY, dust.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle soft halo for larger particles
      if (dust.size > 2.0) {
        ctx.strokeStyle = dust.color + (alpha * 0.4).toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenPosX, screenPosY, dust.size * 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Layer 2.5: Render Semi-transparent Glass Floor Under-glow & Snake Refraction
   * Projects a radiant neon glow and reflections onto the translucent floor beneath the snake body
   */
  public drawSnakeGroundReflection(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], headAngle: number) {
    if (points.length < 2) return;

    ctx.save();
    // Glass floor neon specular reflection
    for (let i = 0; i < points.length; i += 2) {
      const p = points[i];
      const isHead = i === 0;
      const radius = isHead ? 46 : 28;
      const grad = ctx.createRadialGradient(p.x, p.y + 2, 4, p.x, p.y + 2, radius);
      
      if (isHead) {
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.14)');
        grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.04)');
        grad.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connective soft luminous specular ribbon along floor
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y + 2);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y + 2);
    }
    ctx.stroke();

    ctx.restore();
  }
}
