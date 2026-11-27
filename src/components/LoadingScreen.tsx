import { useMemo } from 'react';
import { PENANG_TRIVIA_TIPS, pickLang } from '../game/i18n';
import type { LanguageCode } from '../game/types';

interface LoadingScreenProps {
  lang: LanguageCode;
}

export function LoadingScreen({ lang }: LoadingScreenProps) {
  const tip = useMemo(() => {
    const idx = Math.floor(Math.random() * PENANG_TRIVIA_TIPS.length);
    return PENANG_TRIVIA_TIPS[idx];
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center"
      style={{ background: '#2b2118', color: '#faf3e6' }}
      data-testid="loading-screen"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#c86a4e] flex items-center justify-center text-2xl mb-4 animate-bounce">
        🏮
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight">Penang Days</h2>
      <p className="text-xs text-[#f4e3b8] mt-1">
        {pickLang(lang, '正在铺开乔治市老街画卷…', 'Preparing George Town streets…', 'Menyediakan jalan George Town…')}
      </p>
      <p className="max-w-md text-xs sm:text-sm text-[#dfd1b8] mt-5 leading-relaxed">
        {pickLang(lang, tip.zh, tip.en, tip.ms)}
      </p>
    </div>
  );
}
