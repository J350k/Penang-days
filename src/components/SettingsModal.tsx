import { useState } from 'react';
import { pickLang, t } from '../game/i18n';
import type { LanguageCode, QualityLevel, SettingsState } from '../game/types';

interface SettingsModalProps {
  settings: SettingsState;
  onUpdateSettings: (next: SettingsState) => void;
  onRestartGame: () => void;
  onOpenCloud?: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  onRestartGame,
  onOpenCloud,
  onClose,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const lang = settings.language;

  const setQuality = (quality: QualityLevel) => {
    onUpdateSettings({ ...settings, quality });
  };

  const setLanguage = (language: LanguageCode) => {
    onUpdateSettings({ ...settings, language });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(18, 14, 10, 0.6)' }}
      role="dialog"
      aria-modal="true"
      data-testid="settings-modal"
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.2)',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.36)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2b2118]/12">
          <h2 className="font-display text-xl font-bold">{t(lang, 'settings')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>

        <div className="space-y-4 mt-4 text-sm">
          {/* Language Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#6f5744] mb-1.5">
              {t(lang, 'language')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['zh', 'en', 'ms'] as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  className="py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-colors"
                  style={{
                    background: settings.language === code ? '#4b7f78' : '#efe3cd',
                    color: settings.language === code ? '#faf3e6' : '#2b2118',
                    borderColor: 'rgba(43, 33, 24, 0.16)',
                  }}
                >
                  {code === 'zh' ? '中文' : code === 'en' ? 'English' : 'Bahasa Melayu'}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#6f5744] mb-1.5">
              {t(lang, 'quality')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['low', t(lang, 'qualityLow')],
                  ['medium', t(lang, 'qualityMedium')],
                  ['high', t(lang, 'qualityHigh')],
                ] as Array<[QualityLevel, string]>
              ).map(([q, label]) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className="py-2 px-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors"
                  style={{
                    background: settings.quality === q ? '#c86a4e' : '#efe3cd',
                    color: settings.quality === q ? '#faf3e6' : '#2b2118',
                    borderColor: 'rgba(43, 33, 24, 0.16)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#6f5744] mb-1">
              <span>{t(lang, 'volume')}</span>
              <span className="font-mono-num">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) =>
                onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })
              }
              className="w-full accent-[#c86a4e] cursor-pointer"
            />
          </div>

          {/* Look Sensitivity */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#6f5744] mb-1">
              <span>{t(lang, 'sensitivity')}</span>
              <span className="font-mono-num">{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.1}
              value={settings.sensitivity}
              onChange={(e) =>
                onUpdateSettings({ ...settings, sensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#4b7f78] cursor-pointer"
            />
          </div>

          {onOpenCloud && (
            <button
              type="button"
              onClick={onOpenCloud}
              className="w-full py-2.5 rounded-lg bg-[#456990] hover:bg-[#385778] text-[#faf3e6] text-xs font-semibold cursor-pointer"
            >
              ☁️ {t(lang, 'cloudAccount')}
            </button>
          )}

          {/* Restart Game */}
          <div className="pt-3 border-t border-[#2b2118]/12">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 rounded-lg border border-[#c84338]/40 text-[#b0342b] hover:bg-[#c84338]/10 text-xs font-semibold cursor-pointer"
              >
                {t(lang, 'restartGame')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    onRestartGame();
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#c84338] text-[#faf3e6] text-xs font-semibold cursor-pointer"
                >
                  {pickLang(lang, '确认重置存档', 'Confirm Reset', 'Sahkan Set Semula')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 rounded-lg bg-[#e9dcc6] text-xs font-semibold cursor-pointer"
                >
                  {pickLang(lang, '取消', 'Cancel', 'Batal')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
