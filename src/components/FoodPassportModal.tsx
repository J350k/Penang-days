import { pickLang, t } from '../game/i18n';
import { FOOD_CATALOG } from '../game/systems/progression';
import type { LanguageCode } from '../game/types';

interface FoodPassportModalProps {
  foodPassport: string[];
  lang: LanguageCode;
  onClose: () => void;
}

export function FoodPassportModal({
  foodPassport,
  lang,
  onClose,
}: FoodPassportModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(18, 14, 10, 0.56)' }}
      role="dialog"
      aria-modal="true"
      data-testid="passport-modal"
    >
      <div
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.34)',
        }}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2b2118]/12">
          <div>
            <h2 className="font-display text-xl font-bold">
              {t(lang, 'passport')}
            </h2>
            <p className="text-xs text-[#6f5744] font-mono-num mt-0.5">
              {foodPassport.length} / {FOOD_CATALOG.length}{' '}
              {pickLang(
                lang,
                '（主线目标：品尝 5 道菜 · 全收集 12 道）',
                '(Main Goal: 5 · Full Collection: 12)',
                '(Sasaran Utama: 5 · Koleksi Penuh: 12)'
              )}
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

        <div className="mt-3 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
          {FOOD_CATALOG.map((item) => {
            const eaten = foodPassport.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border transition-colors"
                style={{
                  background: eaten ? '#f1e6cf' : '#ede4d2',
                  borderColor: eaten ? 'rgba(75, 127, 120, 0.45)' : 'rgba(43, 33, 24, 0.12)',
                  opacity: eaten ? 1 : 0.72,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm">
                    {pickLang(lang, item.nameZh, item.nameEn, item.nameMs)}
                  </h3>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: eaten ? '#4b7f78' : 'rgba(43, 33, 24, 0.14)',
                      color: eaten ? '#faf3e6' : '#5e4b3c',
                    }}
                  >
                    {eaten ? t(lang, 'discovered') : t(lang, 'undiscovered')}
                  </span>
                </div>
                <p className="text-xs text-[#6f5744] mt-1.5 leading-relaxed">
                  {pickLang(lang, item.descZh, item.descEn, item.descMs)}
                </p>
                <p className="text-[11px] font-mono-num text-[#8b6d55] mt-1.5">
                  RM {item.priceRM} · +{item.hpRestore} {t(lang, 'hp')} · +{item.staminaRestore}{' '}
                  {t(lang, 'stamina')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
