import { useState } from 'react';
import { pickLang, t } from '../game/i18n';
import {
  FURNITURE_CATALOG,
  HOME_GRID_X_MAX,
  HOME_GRID_X_MIN,
  HOME_GRID_Z_MAX,
  HOME_GRID_Z_MIN,
  canPlaceFurniture,
  computeDecorScore,
} from '../game/systems/homeDecoration';
import type { LanguageCode, PlacedFurnitureItem } from '../game/types';

interface HomeDecorModalProps {
  lang: LanguageCode;
  moneyRM: number;
  ownedFurnitureIds: string[];
  placedFurniture: PlacedFurnitureItem[];
  onBuyFurniture: (itemId: string) => void;
  onPlaceFurniture: (itemId: string, floor: 1 | 2, gx: number, gz: number) => void;
  onRotateOrReclaim: (instanceId: string, action: 'rotate' | 'reclaim') => void;
  onClose: () => void;
}

export function HomeDecorModal({
  lang,
  moneyRM,
  ownedFurnitureIds,
  placedFurniture,
  onBuyFurniture,
  onPlaceFurniture,
  onRotateOrReclaim,
  onClose,
}: HomeDecorModalProps) {
  const [floor, setFloor] = useState<1 | 2>(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    ownedFurnitureIds[0] ?? null
  );
  const decorScore = computeDecorScore(placedFurniture);

  const cols: number[] = [];
  for (let x = HOME_GRID_X_MIN; x <= HOME_GRID_X_MAX; x++) cols.push(x);
  const rows: number[] = [];
  for (let z = HOME_GRID_Z_MIN; z <= HOME_GRID_Z_MAX; z++) rows.push(z);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(18, 14, 10, 0.58)' }}
      role="dialog"
      aria-modal="true"
      data-testid="decor-modal"
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl p-4 sm:p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.34)',
        }}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2b2118]/12">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold">{t(lang, 'decor')}</h2>
            <p className="text-xs text-[#6f5744] font-mono-num">
              RM {moneyRM.toFixed(0)} ·{' '}
              {pickLang(lang, `装潢评分 ${decorScore}`, `Decor Score ${decorScore}`, `Skor Hiasan ${decorScore}`)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {/* Left: 1F/2F Grid Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {([1, 2] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFloor(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{
                      background: floor === f ? '#4b7f78' : '#efe3cd',
                      color: floor === f ? '#faf3e6' : '#2b2118',
                    }}
                  >
                    {f === 1
                      ? pickLang(lang, '一楼客厅', '1F Living', 'Tingkat 1')
                      : pickLang(lang, '二楼卧室', '2F Bedroom', 'Tingkat 2')}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[#6f5744]">
                {selectedItemId
                  ? pickLang(lang, '点击空格摆放', 'Tap empty tile', 'Ketik petak kosong')
                  : pickLang(lang, '先在右侧选家具', 'Pick item on right', 'Pilih perabot')}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 p-2.5 rounded-xl bg-[#efe3cd] border border-[#2b2118]/12">
              {rows.map((gz) =>
                cols.map((gx) => {
                  const placed = placedFurniture.find(
                    (p) => p.floor === floor && p.gridX === gx && p.gridZ === gz
                  );
                  const stairBlocked = gx === 2 && gz >= 2;
                  const canPlace = Boolean(
                    selectedItemId &&
                      ownedFurnitureIds.includes(selectedItemId) &&
                      canPlaceFurniture(placedFurniture, floor, gx, gz)
                  );
                  const placedDef = placed
                    ? FURNITURE_CATALOG.find((c) => c.id === placed.itemId)
                    : null;

                  return (
                    <div
                      key={`${gx}-${gz}`}
                      className="h-12 rounded-lg flex flex-col items-center justify-center text-[10px] border relative"
                      style={{
                        background: stairBlocked
                          ? 'rgba(43,33,24,0.12)'
                          : placed
                          ? '#d9eadf'
                          : canPlace
                          ? '#fff7e2'
                          : '#f8f0df',
                        borderColor: canPlace ? '#c86a4e' : 'rgba(43,33,24,0.14)',
                      }}
                    >
                      {stairBlocked ? (
                        <span className="opacity-50">{pickLang(lang, '楼梯', 'Stair', 'Tangga')}</span>
                      ) : placed && placedDef ? (
                        <div className="flex flex-col items-center gap-0.5 w-full px-1">
                          <span className="truncate w-full text-center font-semibold">
                            {pickLang(lang, placedDef.nameZh, placedDef.nameEn, placedDef.nameMs)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => onRotateOrReclaim(placed.instanceId, 'rotate')}
                              title="Rotate 90°"
                              className="px-1 rounded bg-[#4b7f78] text-[#faf3e6] text-[9px] cursor-pointer"
                            >
                              ↻
                            </button>
                            <button
                              type="button"
                              onClick={() => onRotateOrReclaim(placed.instanceId, 'reclaim')}
                              title="Store back"
                              className="px-1 rounded bg-[#c86a4e] text-[#faf3e6] text-[9px] cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canPlace}
                          onClick={() => {
                            if (selectedItemId) {
                              onPlaceFurniture(selectedItemId, floor, gx, gz);
                            }
                          }}
                          aria-label={`Place at ${gx},${gz}`}
                          className="w-full h-full flex items-center justify-center cursor-pointer disabled:cursor-default text-[#8b6d55]"
                        >
                          {canPlace ? '+' : '·'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Furniture Catalog & Inventory */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {FURNITURE_CATALOG.map((item) => {
              const countOwned = ownedFurnitureIds.filter((id) => id === item.id).length;
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                  style={{
                    background: isSelected ? '#e8dfd0' : '#f3e9d4',
                    borderColor: isSelected ? '#c86a4e' : 'rgba(43,33,24,0.12)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate">
                        {pickLang(lang, item.nameZh, item.nameEn, item.nameMs)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4b7f78]/15 text-[#2f5f58] font-mono-num">
                        +{item.decorPoints}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6f5744] truncate">
                      {pickLang(lang, item.descZh, item.descEn, item.descMs)}
                    </p>
                    <p className="text-[10px] text-[#8b6d55] font-mono-num mt-0.5">
                      {pickLang(lang, `库存 ${countOwned}`, `Owned ${countOwned}`, `Stok ${countOwned}`)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={moneyRM < item.priceRM}
                      onClick={() => {
                        onBuyFurniture(item.id);
                        setSelectedItemId(item.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6] text-[11px] font-semibold cursor-pointer disabled:opacity-45"
                    >
                      {t(lang, 'buy')} RM {item.priceRM}
                    </button>
                    {countOwned > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#4b7f78] text-[#faf3e6] text-[11px] font-semibold cursor-pointer"
                      >
                        {isSelected
                          ? pickLang(lang, '摆放中', 'Placing', 'Memilih')
                          : pickLang(lang, '选择摆放', 'Place', 'Letak')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
