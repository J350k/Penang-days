import { useEffect, useState } from 'react';
import { pickLang, t } from '../game/i18n';
import type { DialogueChoice, DialogueNode, LanguageCode } from '../game/types';

interface DialogueModalProps {
  node: DialogueNode;
  roleLabel: string;
  affinity: number;
  lang: LanguageCode;
  onChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export function DialogueModal({
  node,
  roleLabel,
  affinity,
  lang,
  onChoice,
  onClose,
}: DialogueModalProps) {
  const fullText = pickLang(lang, node.textZh, node.textEn, node.textMs);
  const speaker = pickLang(lang, node.speakerZh, node.speakerEn, node.speakerMs);

  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    const id = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= fullText.length) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [fullText]);

  const isTyping = visibleChars < fullText.length;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center p-3 sm:p-6"
      style={{ background: 'rgba(18, 14, 10, 0.42)' }}
      role="dialog"
      aria-modal="true"
      data-testid="dialogue-modal"
    >
      <div
        className="w-full max-w-xl rounded-2xl p-4 sm:p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '1px solid rgba(43, 33, 24, 0.22)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.34)',
        }}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#2b2118]/10">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold leading-tight">
              {speaker}
            </h2>
            <p className="text-xs text-[#6f5744]">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#f0e3cb] text-[#6f482b] font-mono-num">
              {t(lang, 'affinity')} {affinity}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#2b2118]/20 hover:bg-[#efe3cd] cursor-pointer"
            >
              {t(lang, 'close')}
            </button>
          </div>
        </div>

        <div
          onClick={() => setVisibleChars(fullText.length)}
          className="py-3.5 text-sm sm:text-base leading-relaxed min-h-[68px] cursor-pointer"
        >
          {fullText.slice(0, visibleChars)}
          {isTyping && <span className="inline-block w-1.5 h-4 bg-[#c86a4e] ml-1 align-middle" />}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {node.choices.map((choice, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChoice(choice)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer bg-[#efe3cd] hover:bg-[#e4d3b4] border border-[#2b2118]/12"
            >
              {pickLang(lang, choice.labelZh, choice.labelEn, choice.labelMs)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
