import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pickLang, t } from '../game/i18n';
import type { LanguageCode } from '../game/types';

export type MinigameId = 'ckt-rhythm' | 'mural-puzzle' | 'jetski-slalom';

interface MinigameModalProps {
  minigameId: MinigameId;
  lang: LanguageCode;
  onPlayWokSizzle: () => void;
  onComplete: (won: boolean, rewardRM: number, rewardXP: number) => void;
  onClose: () => void;
}

const TILE_COLORS = ['#E8A598', '#A8D5BA', '#F4E3B8', '#4B7F78'];

function makeTargetPattern(): number[] {
  // Deterministic friendly Peranakan tile mosaic with variety
  const seed = Math.floor(Math.random() * 4);
  return [0, 1, 2, 1, 3, 1, 2, 0, 3].map((v) => (v + seed) % TILE_COLORS.length);
}

export function MinigameModal({
  minigameId,
  lang,
  onPlayWokSizzle,
  onComplete,
  onClose,
}: MinigameModalProps) {
  // 1. Char Kway Teow Wok Rhythm state
  const [cursorPos, setCursorPos] = useState(50);
  const [beatsLeft, setBeatsLeft] = useState(12);
  const [wokScore, setWokScore] = useState(0);
  const [wokFeedback, setWokFeedback] = useState('');
  const dirRef = useRef(1);
  const posRef = useRef(50);

  // 2. Mural Puzzle state
  const targetPattern = useMemo(() => makeTargetPattern(), []);
  const [playerPattern, setPlayerPattern] = useState<number[]>(() => Array(9).fill(0));
  const [muralSeconds, setMuralSeconds] = useState(45);

  // 3. Jet Ski Slalom canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [skiScore, setSkiScore] = useState(0);
  const [skiTimeLeft, setSkiTimeLeft] = useState(22);
  const skiSteerRef = useRef(0);

  const [finished, setFinished] = useState<{ won: boolean; rm: number; xp: number } | null>(null);

  // Wok Rhythm Loop
  useEffect(() => {
    if (minigameId !== 'ckt-rhythm' || finished) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      posRef.current += dirRef.current * 125 * dt;
      if (posRef.current >= 96) {
        posRef.current = 96;
        dirRef.current = -1;
      } else if (posRef.current <= 4) {
        posRef.current = 4;
        dirRef.current = 1;
      }
      setCursorPos(posRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [minigameId, finished]);

  const handleWokHit = useCallback(() => {
    if (finished || beatsLeft <= 0) return;
    const p = posRef.current;
    const good = p >= 35 && p <= 65;
    if (good) {
      onPlayWokSizzle();
    }
    const nextScore = wokScore + (good ? 1 : 0);
    const nextBeats = beatsLeft - 1;
    setWokScore(nextScore);
    setBeatsLeft(nextBeats);
    setWokFeedback(
      good
        ? pickLang(lang, '镬气十足！+1', 'Perfect Wok Hei! +1', 'Mantap! +1')
        : pickLang(lang, '火候偏了！', 'Missed flame zone!', 'Tersasar!')
    );

    if (nextBeats <= 0) {
      const won = nextScore >= 7;
      setFinished({ won, rm: won ? 55 : 0, xp: won ? 65 : 0 });
      onComplete(won, won ? 55 : 0, won ? 65 : 0);
    }
  }, [beatsLeft, finished, lang, onComplete, onPlayWokSizzle, wokScore]);

  useEffect(() => {
    if (minigameId !== 'ckt-rhythm' || finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleWokHit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleWokHit, minigameId, finished]);

  // Mural Puzzle Timer & Match Check
  useEffect(() => {
    if (minigameId !== 'mural-puzzle' || finished) return;
    const isMatched = targetPattern.every((v, i) => playerPattern[i] === v);
    if (isMatched) {
      setFinished({ won: true, rm: 60, xp: 70 });
      onComplete(true, 60, 70);
      return;
    }
    const id = window.setInterval(() => {
      setMuralSeconds((s) => {
        if (s <= 1) {
          setFinished({ won: false, rm: 0, xp: 0 });
          onComplete(false, 0, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished, minigameId, onComplete, playerPattern, targetPattern]);

  // Jet Ski Wave Slalom Loop
  useEffect(() => {
    if (minigameId !== 'jetski-slalom' || finished) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') skiSteerRef.current = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') skiSteerRef.current = 1;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyA' ||
        e.code === 'ArrowLeft' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowRight'
      ) {
        skiSteerRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let playerX = 180;
    let score = 0;
    let timeLeft = 22;
    const objs: Array<{ x: number; y: number; kind: 'buoy' | 'rock'; hit: boolean }> = [];
    let spawnTimer = 0;
    let secAccum = 0;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      playerX = Math.max(24, Math.min(336, playerX + skiSteerRef.current * 210 * dt));
      spawnTimer += dt;
      if (spawnTimer >= 0.72) {
        spawnTimer = 0;
        objs.push({
          x: 34 + Math.random() * 292,
          y: -18,
          kind: Math.random() < 0.7 ? 'buoy' : 'rock',
          hit: false,
        });
      }

      for (const o of objs) {
        o.y += 165 * dt;
        if (!o.hit && Math.abs(o.x - playerX) < 22 && Math.abs(o.y - 220) < 20) {
          o.hit = true;
          if (o.kind === 'buoy') {
            score += 1;
            onPlayWokSizzle();
          } else {
            score = Math.max(0, score - 1);
          }
          setSkiScore(score);
        }
      }

      secAccum += dt;
      if (secAccum >= 1) {
        secAccum -= 1;
        timeLeft -= 1;
        setSkiTimeLeft(timeLeft);
        if (timeLeft <= 0) {
          const won = score >= 6;
          setFinished({ won, rm: won ? 85 : 0, xp: won ? 95 : 0 });
          onComplete(won, won ? 85 : 0, won ? 95 : 0);
          return;
        }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#47a8bd';
        ctx.fillRect(0, 0, 360, 260);
        // Sea wave stripes
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        const offset = (now * 0.08) % 40;
        for (let y = offset; y < 260; y += 40) {
          ctx.fillRect(0, y, 360, 3);
        }

        for (const o of objs) {
          if (o.hit || o.y > 280) continue;
          if (o.kind === 'buoy') {
            ctx.fillStyle = '#ffd84d';
            ctx.beginPath();
            ctx.arc(o.x, o.y, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5a3e36';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.fillStyle = '#5a3e36';
            ctx.fillRect(o.x - 11, o.y - 9, 22, 18);
          }
        }

        // Jet Ski boat triangle
        ctx.fillStyle = '#ff5a5f';
        ctx.beginPath();
        ctx.moveTo(playerX, 202);
        ctx.lineTo(playerX + 14, 232);
        ctx.lineTo(playerX - 14, 232);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#faf3e6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [finished, minigameId, onComplete, onPlayWokSizzle]);

  const title =
    minigameId === 'ckt-rhythm'
      ? pickLang(lang, '炒粿条镬气节奏挑战', 'Char Kway Teow Wok Rhythm', 'Rentak Kuali Char Kway Teow')
      : minigameId === 'mural-puzzle'
      ? pickLang(lang, '壁画花砖拼色挑战', 'Peranakan Tile Color Match', 'Padanan Jubin Mural')
      : pickLang(lang, '峇都丁宜水上摩托竞速', 'Ferringhi Jet Ski Slalom', 'Lumba Jet Ski Ferringhi');

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(18, 14, 10, 0.68)' }}
      role="dialog"
      aria-modal="true"
      data-testid="minigame-modal"
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 text-[#2b2118] space-y-4"
        style={{
          background: '#faf3e6',
          border: '2px solid #2b2118',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#2b2118]/12">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#e9dcc6] text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>

        {finished ? (
          <div className="py-5 text-center space-y-3">
            <div className="text-3xl">{finished.won ? '🎉' : '😅'}</div>
            <p className="font-display text-xl font-bold">
              {finished.won
                ? pickLang(lang, '挑战成功！', 'Challenge Won!', 'Menang!')
                : pickLang(lang, '差一点点，下次再来！', 'Close! Try again anytime!', 'Hampir berjaya!')}
            </p>
            {finished.won && (
              <p className="text-sm font-mono-num text-[#4b7f78] font-bold">
                +RM {finished.rm} · +{finished.xp} XP
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#c86a4e] text-[#faf3e6] text-sm font-bold cursor-pointer"
            >
              {t(lang, 'close')}
            </button>
          </div>
        ) : (
          <>
            {minigameId === 'ckt-rhythm' && (
              <div className="space-y-4">
                <p className="text-xs text-[#6f5744]">
                  {pickLang(
                    lang,
                    '当炭火指针滑入中间绿色区域时，按空格或点击「猛火翻炒」！需命中至少 7/12 次。',
                    'Hit Space or tap Toss Wok when the flame marker enters the green center zone! Goal: 7/12 hits.',
                    'Tekan Space atau ketik apabila penanda di zon hijau! Sasaran: 7/12.'
                  )}
                </p>
                <div className="flex justify-between text-xs font-mono-num font-bold">
                  <span>
                    {pickLang(lang, '命中', 'Score', 'Skor')}: {wokScore}
                  </span>
                  <span>
                    {pickLang(lang, '剩余节拍', 'Beats Left', 'Baki')}: {beatsLeft}
                  </span>
                </div>
                <div className="relative h-9 rounded-full bg-[#e5d6ba] border border-[#2b2118]/20 overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 bg-[#6baa8e]/45 border-x-2 border-[#4b7f78]"
                    style={{ left: '35%', width: '30%' }}
                  />
                  <div
                    className="absolute top-1 bottom-1 w-3 -ml-1.5 rounded-full bg-[#ff5a5f] border border-[#2b2118]"
                    style={{ left: `${cursorPos}%` }}
                  />
                </div>
                {wokFeedback && (
                  <p className="text-center text-xs font-bold text-[#c8553d]">{wokFeedback}</p>
                )}
                <button
                  type="button"
                  data-testid="wok-hit-btn"
                  onClick={handleWokHit}
                  className="w-full py-3 rounded-xl bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6] font-bold text-sm cursor-pointer"
                >
                  🔥 {pickLang(lang, '猛火翻炒 (Space)', 'Toss Wok! (Space)', 'Goreng! (Space)')}
                </button>
              </div>
            )}

            {minigameId === 'mural-puzzle' && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono-num font-bold">
                  <span>
                    {pickLang(lang, '点击右侧砖块对齐左侧样板', 'Match right tiles to sample', 'Padankan jubin')}
                  </span>
                  <span className="text-[#c8553d]">{muralSeconds}s</span>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <div className="text-[11px] font-semibold text-center mb-1.5">
                      {pickLang(lang, 'Mei 的设计图', 'Target Mural', 'Sasaran')}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#e9dcc6]">
                      {targetPattern.map((cIdx, idx) => (
                        <div
                          key={idx}
                          className="h-10 rounded-md border border-[#2b2118]/20"
                          style={{ backgroundColor: TILE_COLORS[cIdx] }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-center mb-1.5">
                      {pickLang(lang, '你的花砖墙', 'Your Wall', 'Dinding Anda')}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#e9dcc6]">
                      {playerPattern.map((cIdx, idx) => (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`Tile ${idx + 1}`}
                          onClick={() => {
                            setPlayerPattern((prev) => {
                              const next = [...prev];
                              next[idx] = (next[idx] + 1) % TILE_COLORS.length;
                              return next;
                            });
                          }}
                          className="h-10 rounded-md border-2 border-[#2b2118]/30 cursor-pointer"
                          style={{ backgroundColor: TILE_COLORS[cIdx] }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {minigameId === 'jetski-slalom' && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono-num font-bold">
                  <span>
                    {pickLang(lang, '浮标得分', 'Buoys', 'Pelampung')}: {skiScore}/6
                  </span>
                  <span className="text-[#c8553d]">{skiTimeLeft}s</span>
                </div>
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={260}
                  className="w-full rounded-xl border-2 border-[#2b2118]/25"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onMouseDown={() => (skiSteerRef.current = -1)}
                    onMouseUp={() => (skiSteerRef.current = 0)}
                    onMouseLeave={() => (skiSteerRef.current = 0)}
                    onTouchStart={() => (skiSteerRef.current = -1)}
                    onTouchEnd={() => (skiSteerRef.current = 0)}
                    className="py-2.5 rounded-xl bg-[#e9dcc6] font-bold text-xs cursor-pointer"
                  >
                    ◀ {pickLang(lang, '左转 (A)', 'Left (A)', 'Kiri (A)')}
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => (skiSteerRef.current = 1)}
                    onMouseUp={() => (skiSteerRef.current = 0)}
                    onMouseLeave={() => (skiSteerRef.current = 0)}
                    onTouchStart={() => (skiSteerRef.current = 1)}
                    onTouchEnd={() => (skiSteerRef.current = 0)}
                    className="py-2.5 rounded-xl bg-[#e9dcc6] font-bold text-xs cursor-pointer"
                  >
                    {pickLang(lang, '右转 (D)', 'Right (D)', 'Kanan (D)')} ▶
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
