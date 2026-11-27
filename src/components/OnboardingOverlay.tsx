import { useState } from 'react';
import { pickLang } from '../game/i18n';
import type { LanguageCode } from '../game/types';

interface OnboardingOverlayProps {
  lang: LanguageCode;
  onComplete: () => void;
}

const STEPS = [
  {
    zh: '第 1 步：移动与探索 — 电脑使用 WASD 移动 + 鼠标拖拽转视角；手机用左下摇杆 + 右滑转视角。',
    en: 'Step 1: Move & Look — WASD + drag on desktop, or Left Stick + Right Swipe on mobile.',
    ms: 'Langkah 1: Gerak & Lihat — WASD + seret di komputer, atau kayu bedik di telefon.',
  },
  {
    zh: '第 2 步：靠近交互 — 走近邻居、美食摊、巴士站、三轮车或渡轮时，按 F 键或点击底部橙色气泡互动。',
    en: 'Step 2: Interact — Walk near locals, food stalls, bus stops, trishaw, or ferry and press F.',
    ms: 'Langkah 2: Interaksi — Dekati jiran, gerai, bas, beca, atau feri dan tekan F.',
  },
  {
    zh: '第 3 步：任务追踪 — 点击左上角任务列表即可点亮 3D 导航箭头，跟着箭头认识新邻居 Ah Kow！',
    en: 'Step 3: Quest Nav — Click any quest in the top-left panel to light up the 3D guide arrow.',
    ms: 'Langkah 3: Misi — Ketik misi di kiri atas untuk menghidupkan anak panah panduan 3D.',
  },
  {
    zh: '第 4 步：随身手机 — 按 M 键或点击右上角「手机」按钮，打开地图传送、每日挑战、相册与成就！',
    en: 'Step 4: Smartphone — Press M or tap Phone for Bus Fast Travel, Daily Goals, Album & Achievements!',
    ms: 'Langkah 4: Telefon — Tekan M untuk Peta Bas, Cabaran Harian, Album & Pencapaian!',
  },
];

export function OnboardingOverlay({ lang, onComplete }: OnboardingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const current = STEPS[stepIndex];

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md rounded-2xl p-4 text-[#2b2118] pointer-events-auto"
      style={{
        background: 'rgba(250, 243, 230, 0.96)',
        border: '2px solid #c86a4e',
        boxShadow: '0 14px 36px rgba(0,0,0,0.28)',
      }}
      data-testid="onboarding-guide"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#c86a4e] text-[#faf3e6]">
          {pickLang(lang, `新手引导 ${stepIndex + 1}/4`, `Guide ${stepIndex + 1}/4`, `Panduan ${stepIndex + 1}/4`)}
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="text-[11px] font-semibold text-[#6f5744] hover:text-[#2b2118] cursor-pointer"
        >
          {pickLang(lang, '跳过引导', 'Skip', 'Langkau')}
        </button>
      </div>
      <p className="text-xs sm:text-sm leading-relaxed font-medium">
        {pickLang(lang, current.zh, current.en, current.ms)}
      </p>
      <div className="mt-3 flex justify-end">
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i + 1)}
            className="px-3.5 py-1.5 rounded-lg bg-[#4b7f78] text-[#faf3e6] text-xs font-semibold cursor-pointer"
          >
            {pickLang(lang, '下一步', 'Next', 'Seterusnya')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="px-3.5 py-1.5 rounded-lg bg-[#c86a4e] text-[#faf3e6] text-xs font-semibold cursor-pointer"
          >
            {pickLang(lang, '开始槟城生活！', 'Start Exploring!', 'Mula Meneroka!')}
          </button>
        )}
      </div>
    </div>
  );
}
