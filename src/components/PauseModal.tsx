import { pickLang, t } from '../game/i18n';
import type { HudSnapshot, LanguageCode } from '../game/types';

interface PauseModalProps {
  hud: HudSnapshot;
  lang: LanguageCode;
  onResume: () => void;
  onOpenSettings: () => void;
  onReturnHome: () => void;
  onBackToTitle: () => void;
}

export function PauseModal({
  hud,
  lang,
  onResume,
  onOpenSettings,
  onReturnHome,
  onBackToTitle,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 16, 12, 0.56)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.18)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)',
        }}
      >
        <h2 id="pause-title" className="font-display text-2xl font-bold text-[#2b2118]">
          {t(lang, 'pause')}
        </h2>
        <p className="text-xs text-[#6f5744] mt-1 mb-5">
          {pickLang(
            lang,
            '游戏进度会自动保存至本地浏览器',
            'Progress autosaves to browser localStorage',
            'Kemajuan disimpan secara automatik'
          )}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center rounded-xl p-3 bg-[#f1e6d2]">
          <div>
            <div className="text-[11px] text-[#78614e]">
              {pickLang(lang, '时间', 'Time', 'Masa')}
            </div>
            <div className="font-mono-num text-base font-semibold mt-0.5">
              {hud.timeInfo.formattedTime}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#78614e]">
              {pickLang(lang, '金钱', 'Money', 'Wang')}
            </div>
            <div className="font-mono-num text-base font-semibold mt-0.5">
              RM {hud.stats.moneyRM.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#78614e]">
              {pickLang(lang, '位置', 'Area', 'Kawasan')}
            </div>
            <div className="text-xs font-semibold mt-1 truncate">{hud.locationName}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-lg bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6] font-semibold text-sm transition-colors cursor-pointer"
          >
            {t(lang, 'resume')}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-lg bg-[#4b7f78] hover:bg-[#3d6963] text-[#faf3e6] font-medium text-sm transition-colors cursor-pointer"
          >
            {t(lang, 'settings')}
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-2.5 px-4 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-[#2b2118] font-medium text-sm transition-colors cursor-pointer"
          >
            {t(lang, 'returnHome')}
          </button>
          <button
            type="button"
            onClick={onBackToTitle}
            className="w-full py-2.5 px-4 rounded-lg border border-[#2b2118]/20 hover:bg-[#f1e6d2] text-[#5c4838] font-medium text-sm transition-colors cursor-pointer"
          >
            {t(lang, 'backToTitle')}
          </button>
        </div>
      </div>
    </div>
  );
}
