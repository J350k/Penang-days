import { pickLang, t } from '../game/i18n';
import {
  CAR_PRICE_RM,
  FOOD_CATALOG,
  MOTORCYCLE_PRICE_RM,
  OUTFIT_CATALOG,
} from '../game/systems/progression';
import type { LanguageCode, OutfitId } from '../game/types';

export type ShopMode =
  | { kind: 'food'; stallId: string; title: string }
  | { kind: 'outfit'; title: string }
  | { kind: 'motorcycle'; title: string };

interface ShopModalProps {
  shop: ShopMode;
  moneyRM: number;
  lang: LanguageCode;
  foodPassport: string[];
  ownedOutfits: OutfitId[];
  equippedOutfit: OutfitId;
  motorcycleOwned: boolean;
  carOwned: boolean;
  onBuyFood: (foodId: string) => void;
  onBuyOrEquipOutfit: (outfitId: OutfitId) => void;
  onBuyMotorcycle: () => void;
  onBuyCar: () => void;
  onClose: () => void;
}

export function ShopModal({
  shop,
  moneyRM,
  lang,
  foodPassport,
  ownedOutfits,
  equippedOutfit,
  motorcycleOwned,
  carOwned,
  onBuyFood,
  onBuyOrEquipOutfit,
  onBuyMotorcycle,
  onBuyCar,
  onClose,
}: ShopModalProps) {
  const foods =
    shop.kind === 'food'
      ? [
          ...FOOD_CATALOG.filter((f) => f.stallId === shop.stallId),
          ...FOOD_CATALOG.filter((f) => f.stallId !== shop.stallId),
        ]
      : [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(18, 14, 10, 0.56)' }}
      role="dialog"
      aria-modal="true"
      data-testid="shop-modal"
    >
      <div
        className="w-full max-w-lg max-h-[84vh] flex flex-col rounded-2xl p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.34)',
        }}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2b2118]/12">
          <div>
            <h2 className="font-display text-xl font-bold">{shop.title}</h2>
            <p className="text-xs text-[#6f5744] font-mono-num mt-0.5">
              RM {moneyRM.toFixed(0)}
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

        <div className="mt-3 overflow-y-auto space-y-2.5 pr-1">
          {shop.kind === 'food' &&
            foods.map((item) => {
              const tasted = foodPassport.includes(item.id);
              const isStallMain = item.stallId === shop.stallId;
              const canAfford = moneyRM >= item.priceRM;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#2b2118]/10 bg-[#f3e9d4]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {pickLang(lang, item.nameZh, item.nameEn, item.nameMs)}
                      </span>
                      {isStallMain && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c86a4e]/20 text-[#9c4026] font-semibold">
                          {pickLang(lang, '招牌', 'Signature', 'Istimewa')}
                        </span>
                      )}
                      {tasted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4b7f78]/20 text-[#2f5f58] font-semibold">
                          {t(lang, 'discovered')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6f5744] mt-0.5 line-clamp-2">
                      {pickLang(lang, item.descZh, item.descEn, item.descMs)}
                    </p>
                    <p className="text-[11px] text-[#4b7f78] font-mono-num mt-1">
                      +{item.hpRestore} {t(lang, 'hp')} · +{item.staminaRestore} {t(lang, 'stamina')}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyFood(item.id)}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6]"
                  >
                    <div>RM {item.priceRM}</div>
                    <div className="text-[10px] opacity-90">{t(lang, 'eatNow')}</div>
                  </button>
                </div>
              );
            })}

          {shop.kind === 'outfit' &&
            OUTFIT_CATALOG.map((outfit) => {
              const isOwned = ownedOutfits.includes(outfit.id);
              const isEquipped = equippedOutfit === outfit.id;
              const canAfford = moneyRM >= outfit.priceRM;
              return (
                <div
                  key={outfit.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#2b2118]/10 bg-[#f3e9d4]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="w-6 h-4 rounded-sm border border-[#2b2118]/20"
                        style={{ backgroundColor: `#${outfit.vestHex.toString(16).padStart(6, '0')}` }}
                      />
                      <span
                        className="w-6 h-3 rounded-sm border border-[#2b2118]/20"
                        style={{ backgroundColor: `#${outfit.pantsHex.toString(16).padStart(6, '0')}` }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {pickLang(lang, outfit.nameZh, outfit.nameEn, outfit.nameMs)}
                      </p>
                      <p className="text-xs text-[#6f5744] font-mono-num">
                        {isOwned ? t(lang, 'owned') : `RM ${outfit.priceRM}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isOwned && !canAfford}
                    onClick={() => onBuyOrEquipOutfit(outfit.id)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-45 bg-[#4b7f78] hover:bg-[#3c6963] text-[#faf3e6]"
                  >
                    {isEquipped
                      ? t(lang, 'equipped')
                      : isOwned
                      ? t(lang, 'equip')
                      : `${t(lang, 'buy')} RM ${outfit.priceRM}`}
                  </button>
                </div>
              );
            })}

          {shop.kind === 'motorcycle' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#2b2118]/12 bg-[#f3e9d4] space-y-3">
                <div>
                  <h3 className="font-display text-lg font-bold">
                    {pickLang(lang, '槟城经典 Kapchai 小摩托', 'Penang Classic Kapchai Scooter', 'Skuter Kapchai Klasik')}
                  </h3>
                  <p className="text-xs text-[#6f5744] mt-1 leading-relaxed">
                    {pickLang(
                      lang,
                      '灵活穿梭乔治市老街与光大商圈的最佳座驾！购买后停放在你家门口，支持加油站加油与检修。',
                      'Zip smoothly through George Town alleys and Komtar! Parked outside your shophouse after purchase.',
                      'Lancar menelusuri lorong George Town dan Komtar! Diparkir di luar rumah anda.'
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2b2118]/10">
                  <span className="font-mono-num font-bold text-base">
                    RM {MOTORCYCLE_PRICE_RM}
                  </span>
                  <button
                    type="button"
                    disabled={motorcycleOwned || moneyRM < MOTORCYCLE_PRICE_RM}
                    onClick={onBuyMotorcycle}
                    className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6]"
                  >
                    {motorcycleOwned ? t(lang, 'owned') : `${t(lang, 'buy')} (RM ${MOTORCYCLE_PRICE_RM})`}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#2b2118]/12 bg-[#f3e9d4] space-y-3">
                <div>
                  <h3 className="font-display text-lg font-bold">
                    {pickLang(lang, '明珠城市轿车 Pearl Sedan', 'Pearl City Sedan', 'Kereta Sedan Pearl')}
                  </h3>
                  <p className="text-xs text-[#6f5744] mt-1 leading-relaxed">
                    {pickLang(
                      lang,
                      '四轮街机驾驶体验！配备 5 档位与转速表，鸣笛浑厚，可遮风挡雨畅游升旗山、极乐寺与海滨。',
                      'Four-wheel arcade cruising with 5-speed transmission & tachometer! Parked at your shophouse doorstep.',
                      'Kereta bandar dengan 5 gear dan meter RPM! Selesa untuk meneroka seluruh Pulau Pinang.'
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2b2118]/10">
                  <span className="font-mono-num font-bold text-base">
                    RM {CAR_PRICE_RM}
                  </span>
                  <button
                    type="button"
                    disabled={carOwned || moneyRM < CAR_PRICE_RM}
                    onClick={onBuyCar}
                    className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 bg-[#4b7f78] hover:bg-[#3d6b65] text-[#faf3e6]"
                  >
                    {carOwned ? t(lang, 'owned') : `${t(lang, 'buy')} (RM ${CAR_PRICE_RM})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
