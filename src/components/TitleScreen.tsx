import { useEffect } from 'react';
import { pickLang, t } from '../game/i18n';
import type { LanguageCode } from '../game/types';

interface TitleScreenProps {
  hasSavedGame: boolean;
  lang: LanguageCode;
  onStartContinue: () => void;
  onStartFresh: () => void;
}

export function TitleScreen({
  hasSavedGame,
  lang,
  onStartContinue,
  onStartFresh,
}: TitleScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartContinue]);

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none"
      style={{
        background:
          'linear-gradient(95deg, rgba(24, 21, 18, 0.72) 0%, rgba(24, 21, 18, 0.36) 44%, rgba(24, 21, 18, 0.05) 100%)',
      }}
    >
      <div className="max-w-md pt-4 sm:pt-8 pointer-events-auto">
        <div className="flex items-center gap-3 mb-4">
          <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
            <rect x="4" y="18" width="40" height="26" rx="2" fill="#95c6da" stroke="#faf3e6" strokeWidth="2" />
            <path d="M2 18 L24 5 L46 18 Z" fill="#b85c40" stroke="#faf3e6" strokeWidth="2" strokeLinejoin="round" />
            <rect x="12" y="23" width="8" height="9" fill="#2f5f4e" />
            <rect x="28" y="23" width="8" height="9" fill="#2f5f4e" />
            <path d="M19 44 V34 A5 5 0 0 1 29 34 V44 Z" fill="#56351f" stroke="#faf3e6" strokeWidth="1.5" />
            <circle cx="10" cy="21" r="2.2" fill="#e6533c" />
            <circle cx="38" cy="21" r="2.2" fill="#e6533c" />
          </svg>
          <div>
            <p className="text-xs tracking-wider text-[#f3d98b] font-medium">
              George Town · Penang
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#faf3e6] tracking-tight leading-none">
              {t(lang, 'gameTitle')}
            </h1>
          </div>
        </div>

        <p className="text-xl sm:text-2xl font-semibold text-[#f5e9d4] mb-2">
          {t(lang, 'gameSubtitle')}
        </p>
        <p className="text-sm sm:text-base text-[#e5d9c5] leading-relaxed max-w-sm mb-7">
          {pickLang(
            lang,
            '刚搬进乔治市的两层老店屋。在老街美食香气、霓虹夜市、升旗山与海风之间，开启属于你的槟城日常。',
            'Move into your two-story George Town shophouse. Explore hawker stalls, night markets, Penang Hill, and seaside piers.',
            'Tinggal di rumah kedai warisan George Town. Terokai gerai makanan, pasar malam, Bukit Bendera, dan tepi laut.'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStartContinue}
            className="px-6 py-3 rounded-lg bg-[#c86a4e] hover:bg-[#b55a3f] active:scale-[0.99] text-[#faf3e6] font-semibold text-base shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {hasSavedGame ? t(lang, 'startContinue') : t(lang, 'startNew')}
          </button>

          {hasSavedGame && (
            <button
              type="button"
              onClick={onStartFresh}
              className="px-5 py-3 rounded-lg bg-[#faf3e6]/90 hover:bg-[#faf3e6] text-[#2b2118] font-medium text-sm shadow transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {t(lang, 'restartGame')}
            </button>
          )}
        </div>
      </div>

      <div className="text-xs sm:text-sm text-[#efe5d5]/90 tracking-wide">
        <span>{t(lang, 'controlsDesktop')}</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>{t(lang, 'controlsMobile')}</span>
      </div>
    </div>
  );
}
