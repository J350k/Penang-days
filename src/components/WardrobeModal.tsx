import { pickLang, t } from '../game/i18n';
import { OUTFIT_CATALOG } from '../game/systems/progression';
import type {
  HairStyleId,
  HatStyleId,
  LanguageCode,
  OutfitId,
  WardrobeState,
} from '../game/types';

interface WardrobeModalProps {
  lang: LanguageCode;
  moneyRM: number;
  ownedOutfits: OutfitId[];
  equippedOutfit: OutfitId;
  wardrobe: WardrobeState;
  onBuyOrEquipOutfit: (id: OutfitId) => void;
  onUpdateWardrobe: (next: WardrobeState) => void;
  onClose: () => void;
}

const HAIR_OPTIONS: Array<{ id: HairStyleId; zh: string; en: string; ms: string }> = [
  { id: 'short', zh: '清爽短发', en: 'Classic Short', ms: 'Pendek Klasik' },
  { id: 'bob', zh: '俏皮波波头', en: 'Bob Cut', ms: 'Potongan Bob' },
  { id: 'ponytail', zh: '活力马尾', en: 'Ponytail', ms: 'Ekor Kuda' },
  { id: 'curly', zh: '蓬松卷发', en: 'Curly Afro', ms: 'Keriting' },
];

const HAT_OPTIONS: Array<{ id: HatStyleId; zh: string; en: string; ms: string }> = [
  { id: 'none', zh: '无帽子', en: 'No Hat', ms: 'Tiada Topi' },
  { id: 'straw', zh: '南洋草帽', en: 'Straw Hat', ms: 'Topi Jerami' },
  { id: 'cap', zh: '街头鸭舌帽', en: 'Street Cap', ms: 'Topi Sukan' },
  { id: 'beanie', zh: '暖色毛线帽', en: 'Cozy Beanie', ms: 'Topi Kait' },
];

const HAIR_COLORS = [0x2c221e, 0x5a3e36, 0xb87333, 0x8d8d8d, 0xe8a598];
const UMBRELLA_COLORS = [0xe8a598, 0x6baa8e, 0xbfd8e8, 0xf4e3b8, 0xff5a5f];

export function WardrobeModal({
  lang,
  moneyRM,
  ownedOutfits,
  equippedOutfit,
  wardrobe,
  onBuyOrEquipOutfit,
  onUpdateWardrobe,
  onClose,
}: WardrobeModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(18, 14, 10, 0.58)' }}
      role="dialog"
      aria-modal="true"
      data-testid="wardrobe-modal"
    >
      <div
        className="w-full max-w-lg max-h-[86vh] flex flex-col rounded-2xl p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.34)',
        }}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2b2118]/12">
          <div>
            <h2 className="font-display text-xl font-bold">{t(lang, 'wardrobe')}</h2>
            <p className="text-xs text-[#6f5744] font-mono-num">RM {moneyRM.toFixed(0)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>

        <div className="mt-3 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Hair Style */}
          <div>
            <p className="font-semibold text-[#6f5744] mb-1.5">
              {pickLang(lang, '发型选择', 'Hairstyle', 'Gaya Rambut')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {HAIR_OPTIONS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onUpdateWardrobe({ ...wardrobe, hairStyle: h.id })}
                  className="py-2 px-2 rounded-lg font-semibold cursor-pointer border"
                  style={{
                    background: wardrobe.hairStyle === h.id ? '#4b7f78' : '#efe3cd',
                    color: wardrobe.hairStyle === h.id ? '#faf3e6' : '#2b2118',
                    borderColor: 'rgba(43,33,24,0.14)',
                  }}
                >
                  {pickLang(lang, h.zh, h.en, h.ms)}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color & Umbrella Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-semibold text-[#6f5744] mb-1.5">
                {pickLang(lang, '发色', 'Hair Color', 'Warna Rambut')}
              </p>
              <div className="flex gap-2">
                {HAIR_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Hair color ${hex.toString(16)}`}
                    onClick={() => onUpdateWardrobe({ ...wardrobe, hairColorHex: hex })}
                    className="w-7 h-7 rounded-full cursor-pointer border-2"
                    style={{
                      backgroundColor: `#${hex.toString(16).padStart(6, '0')}`,
                      borderColor: wardrobe.hairColorHex === hex ? '#c86a4e' : 'rgba(43,33,24,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#6f5744] mb-1.5">
                {pickLang(lang, '雨伞配色', 'Umbrella', 'Payung')}
              </p>
              <div className="flex gap-2">
                {UMBRELLA_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Umbrella color ${hex.toString(16)}`}
                    onClick={() => onUpdateWardrobe({ ...wardrobe, umbrellaColorHex: hex })}
                    className="w-7 h-7 rounded-full cursor-pointer border-2"
                    style={{
                      backgroundColor: `#${hex.toString(16).padStart(6, '0')}`,
                      borderColor:
                        wardrobe.umbrellaColorHex === hex ? '#c86a4e' : 'rgba(43,33,24,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hats */}
          <div>
            <p className="font-semibold text-[#6f5744] mb-1.5">
              {pickLang(lang, '帽子配饰', 'Hats', 'Topi')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {HAT_OPTIONS.map((hat) => (
                <button
                  key={hat.id}
                  type="button"
                  onClick={() => onUpdateWardrobe({ ...wardrobe, hatStyle: hat.id })}
                  className="py-2 px-2 rounded-lg font-semibold cursor-pointer border"
                  style={{
                    background: wardrobe.hatStyle === hat.id ? '#c86a4e' : '#efe3cd',
                    color: wardrobe.hatStyle === hat.id ? '#faf3e6' : '#2b2118',
                    borderColor: 'rgba(43,33,24,0.14)',
                  }}
                >
                  {pickLang(lang, hat.zh, hat.en, hat.ms)}
                </button>
              ))}
            </div>
          </div>

          {/* Outfits */}
          <div>
            <p className="font-semibold text-[#6f5744] mb-1.5">
              {pickLang(lang, '服装穿搭', 'Outfits', 'Pakaian')}
            </p>
            <div className="space-y-2">
              {OUTFIT_CATALOG.map((o) => {
                const isOwned = ownedOutfits.includes(o.id);
                const isEquipped = equippedOutfit === o.id;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#f3e9d4] border border-[#2b2118]/10"
                  >
                    <span className="font-semibold">
                      {pickLang(lang, o.nameZh, o.nameEn, o.nameMs)}
                    </span>
                    <button
                      type="button"
                      disabled={!isOwned && moneyRM < o.priceRM}
                      onClick={() => onBuyOrEquipOutfit(o.id)}
                      className="px-3 py-1.5 rounded-lg font-semibold cursor-pointer disabled:opacity-45 bg-[#4b7f78] text-[#faf3e6]"
                    >
                      {isEquipped
                        ? t(lang, 'equipped')
                        : isOwned
                        ? t(lang, 'equip')
                        : `${t(lang, 'buy')} RM ${o.priceRM}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
