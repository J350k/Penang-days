import { useEffect, useRef } from 'react';
import type { MinimapMarker, PlayerState } from '../game/types';

interface MinimapProps {
  playerPos: PlayerState;
  markers: MinimapMarker[];
}

const MAP_SIZE = 122;
const MAP_SCALE = 0.92; // px per meter (~66m radius visible)

export function Minimap({ playerPos, markers }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetPx = Math.round(MAP_SIZE * dpr);
    if (canvas.width !== targetPx || canvas.height !== targetPx) {
      canvas.width = targetPx;
      canvas.height = targetPx;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const r = MAP_SIZE / 2;

    // Clear & clip circle
    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
    ctx.beginPath();
    ctx.arc(r, r, r - 2, 0, Math.PI * 2);
    ctx.clip();

    // Warm parchment base
    ctx.fillStyle = '#e7dcc5';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    const cosY = Math.cos(playerPos.yaw);
    const sinY = Math.sin(playerPos.yaw);
    const toScreen = (wx: number, wz: number): [number, number] => {
      const dx = wx - playerPos.x;
      const dz = wz - playerPos.z;
      const sx = r + (dx * cosY - dz * sinY) * MAP_SCALE;
      const sy = r + (dx * sinY + dz * cosY) * MAP_SCALE;
      return [sx, sy];
    };

    const drawWorldPoly = (pts: Array<[number, number]>, fill: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      pts.forEach(([wx, wz], idx) => {
        const [sx, sy] = toScreen(wx, wz);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fill();
    };

    // Esplanade & Penang Strait Sea (Z > 74, plus East channel to Mainland)
    drawWorldPoly(
      [
        [-195, 74],
        [135, 74],
        [135, 175],
        [-195, 175],
      ],
      '#6aaec2'
    );
    // East Penang Strait channel
    drawWorldPoly(
      [
        [96, -175],
        [135, -175],
        [135, 175],
        [96, 175],
      ],
      '#6aaec2'
    );

    // Batu Ferringhi Sandy Beach
    drawWorldPoly(
      [
        [-165, 72],
        [-88, 72],
        [-88, 128],
        [-165, 128],
      ],
      '#f0dfb4'
    );

    // Penang Hill Highland
    drawWorldPoly(
      [
        [-180, -155],
        [-115, -155],
        [-115, -85],
        [-180, -85],
      ],
      '#6aa66a'
    );

    // Kek Lok Temple Precinct
    drawWorldPoly(
      [
        [-160, -68],
        [-112, -68],
        [-112, -24],
        [-160, -24],
      ],
      '#e2b58e'
    );

    // Heritage Park (X [-74, -42], Z [18, 34])
    drawWorldPoly(
      [
        [-74, 18],
        [-42, 18],
        [-42, 34],
        [-74, 34],
      ],
      '#84b878'
    );

    // Mainland Butterworth Pier Land
    drawWorldPoly(
      [
        [135, 58],
        [185, 58],
        [185, 122],
        [135, 122],
      ],
      '#d8cbb0'
    );

    // George Town & Expanded Avenues
    const roads: Array<[number, number, number, number]> = [
      [-140, 4.2, 125, 12.6], // Armenian St + East Connector
      [-140, 38.2, 125, 45.8], // Komtar Blvd + Mall Ave
      [-115, -44.0, 90, -36.4], // Market St + Kek Lok Link
      [-135, 62.2, 96, 69.8], // Esplanade Rd + Gurney Promenade
      [-31.8, -64, -24.2, 70], // Mural Lane
      [24.2, -64, 31.8, 70], // Jalan Kapitan
      [46.2, -44, 53.8, 70], // Komtar East Ave
      [-100, -60, -92, 92], // West Coast & Beach Link
    ];
    for (const [x1, z1, x2, z2] of roads) {
      drawWorldPoly(
        [
          [x1, z1],
          [x2, z1],
          [x2, z2],
          [x1, z2],
        ],
        '#696b70'
      );
    }

    // Esplanade Pier deck
    drawWorldPoly(
      [
        [6, 74],
        [14, 74],
        [14, 92],
        [6, 92],
      ],
      '#a6784e'
    );

    // Markers (clamped near rim if tracked quest is far away)
    for (const m of markers) {
      const [rawX, rawY] = toScreen(m.x, m.z);
      const vx = rawX - r;
      const vy = rawY - r;
      const distPx = Math.hypot(vx, vy);
      const maxRim = r - 8;

      if (m.type !== 'quest' && distPx > maxRim + 6) continue;

      let px = rawX;
      let py = rawY;
      if (m.type === 'quest' && distPx > maxRim) {
        px = r + (vx / distPx) * maxRim;
        py = r + (vy / distPx) * maxRim;
      }

      if (m.type === 'quest') {
        ctx.fillStyle = '#e6a817';
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (m.type === 'food') {
        ctx.fillStyle = '#d95d47';
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'shop') {
        ctx.fillStyle = '#2c8c85';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      } else if (m.type === 'gas') {
        ctx.fillStyle = '#d98c2b';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      } else if (m.type === 'bus') {
        ctx.fillStyle = '#3d5a80';
        ctx.fillRect(px - 2.8, py - 2.8, 5.6, 5.6);
      } else if (m.type === 'ferry') {
        ctx.fillStyle = '#2a9d8f';
        ctx.beginPath();
        ctx.arc(px, py, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.type === 'landmark') {
        ctx.fillStyle = '#9b5de5';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#456990';
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Center Player Triangle pointing UP (forward heading)
    ctx.fillStyle = '#c8553d';
    ctx.strokeStyle = '#faf3e6';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(r, r - 6.5);
    ctx.lineTo(r + 4.8, r + 5);
    ctx.lineTo(r, r + 2.6);
    ctx.lineTo(r - 4.8, r + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle North indicator
    const [nx, ny] = toScreen(playerPos.x, playerPos.z - 55);
    const nvx = nx - r;
    const nvy = ny - r;
    const nd = Math.hypot(nvx, nvy) || 1;
    const nRimX = r + (nvx / nd) * (r - 9);
    const nRimY = r + (nvy / nd) * (r - 9);
    ctx.fillStyle = 'rgba(43, 33, 24, 0.78)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nRimX, nRimY);

    ctx.restore();
  }, [playerPos.x, playerPos.z, playerPos.yaw, markers]);

  return (
    <div
      data-testid="minimap"
      className="relative rounded-full shrink-0 overflow-hidden w-[100px] h-[100px] sm:w-[122px] sm:h-[122px]"
      style={{
        border: '3px solid rgba(250, 243, 230, 0.92)',
        boxShadow: '0 8px 24px rgba(24, 18, 12, 0.24)',
        background: '#e7dcc5',
      }}
      aria-label="圆形小地图"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
