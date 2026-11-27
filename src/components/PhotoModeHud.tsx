import { useState } from 'react';
import { pickLang, t } from '../game/i18n';
import type { LanguageCode, PhotoFilterId } from '../game/types';

interface PhotoModeHudProps {
  lang: LanguageCode;
  onAdjustCamera: (dx: number, dy: number, fov: number) => void;
  onShutter: (filter: PhotoFilterId) => void;
  onExit: () => void;
}

const FILTERS: Array<{ id: PhotoFilterId; zh: string; en: string; ms: string }> = [
  { id: 'none', zh: '原色', en: 'Natural', ms: 'Asli' },
  { id: 'warm', zh: '暖阳', en: 'Warm', ms: 'Hangat' },
  { id: 'vintage', zh: '胶片', en: 'Vintage', ms: 'Vintaj' },
  { id: 'neon', zh: '霓虹', en: 'Neon', ms: 'Neon' },
  { id: 'bw', zh: '黑白', en: 'B&W', ms: 'Hitam Putih' },
];

export function PhotoModeHud({
  lang,
  onAdjustCamera,
  onShutter,
  onExit,
}: PhotoModeHudProps) {
  const [fov, setFov] = useState(50);
  const [filter, setFilter] = useState<PhotoFilterId>('none');

  const cssFilter =
    filter === 'warm'
      ? 'sepia(0.22) saturate(1.22)'
      : filter === 'vintage'
      ? 'sepia(0.5) contrast(0.94)'
      : filter === 'neon'
      ? 'saturate(1.55) contrast(1.12)'
      : filter === 'bw'
      ? 'grayscale(1) contrast(1.12)'
      : 'none';

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4"
      style={{ backdropFilter: cssFilter === 'none' ? undefined : undefined }}
      data-testid="photo-mode-hud"
    >
      {/* Subtle viewfinder corner frame */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#faf3e6]"
          style={{ background: 'rgba(29, 24, 19, 0.8)' }}
        >
          📷 {t(lang, 'photoMode')} · {pickLang(lang, '拖拽旋转视角', 'Drag to Frame Shot', 'Seret untuk Sudut')}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="px-3.5 py-2 rounded-xl bg-[#faf3e6] text-[#2b2118] text-xs font-bold cursor-pointer shadow"
        >
          {t(lang, 'close')} (C)
        </button>
      </div>

      <div
        className="self-center w-full max-w-md rounded-2xl p-3.5 pointer-events-auto text-[#2b2118] space-y-2.5"
        style={{
          background: 'rgba(250, 243, 230, 0.94)',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
        }}
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold shrink-0">
            {pickLang(lang, '焦距', 'Zoom', 'Zum')}
          </span>
          <input
            type="range"
            min={28}
            max={74}
            value={fov}
            onChange={(e) => {
              const next = Number(e.target.value);
              setFov(next);
              onAdjustCamera(0, 0, next);
            }}
            className="flex-1 accent-[#c86a4e] cursor-pointer"
          />
          <span className="font-mono-num w-10 text-right">{fov}°</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                style={{
                  background: filter === f.id ? '#4b7f78' : '#efe3cd',
                  color: filter === f.id ? '#faf3e6' : '#2b2118',
                }}
              >
                {pickLang(lang, f.zh, f.en, f.ms)}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="photo-shutter-btn"
            onClick={() => onShutter(filter)}
            className="px-4 py-2 rounded-xl bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6] text-xs font-bold cursor-pointer"
          >
            📸 {pickLang(lang, '快门拍照', 'Snap Photo', 'Tangkap')}
          </button>
        </div>
      </div>
    </div>
  );
}
