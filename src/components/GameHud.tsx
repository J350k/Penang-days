import { useState } from 'react';
import { t } from '../game/i18n';
import type { HudSnapshot, LanguageCode } from '../game/types';
import { Minimap } from './Minimap';

interface GameHudProps {
  hud: HudSnapshot;
  lang: LanguageCode;
  showTouchControls: boolean;
  toastMessage: string | null;
  onToggleTouchControls: () => void;
  onSelectQuest: (questId: string) => void;
  onInteractPrompt: () => void;
  onOpenPassport: () => void;
  onOpenPhone: () => void;
  onOpenPhoto: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
}

export function GameHud({
  hud,
  lang,
  showTouchControls,
  toastMessage,
  onToggleTouchControls,
  onSelectQuest,
  onInteractPrompt,
  onOpenPassport,
  onOpenPhone,
  onOpenPhoto,
  onOpenSettings,
  onPause,
}: GameHudProps) {
  const [tasksCollapsed, setTasksCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const trackedTask =
    hud.tasks.find((tk) => tk.id === hud.trackedQuestId && !tk.completed) ??
    hud.tasks.find((tk) => tk.accepted && !tk.completed) ??
    null;

  const hpPct = Math.max(0, Math.min(100, (hud.stats.hp / hud.stats.maxHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stats.stamina / hud.stats.maxStamina) * 100));
  const xpPct = Math.max(0, Math.min(100, (hud.stats.xp / hud.stats.xpToNext) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none p-2.5 sm:p-4 flex flex-col justify-between">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Character Stats + Expandable Quest Panel */}
        <div className="flex flex-col gap-2 max-w-[152px] sm:max-w-[260px] pointer-events-auto">
          {/* Character Stats Card */}
          <section
            data-testid="stats-hud"
            aria-label="角色状态"
            className="rounded-xl px-3 py-2 text-[#2b2118]"
            style={{
              background: 'rgba(250, 243, 230, 0.93)',
              border: '1px solid rgba(43, 33, 24, 0.16)',
              boxShadow: '0 8px 22px rgba(24, 18, 12, 0.14)',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#c86a4e] text-[#faf3e6] text-[11px] font-bold font-mono-num">
                {t(lang, 'level')}{hud.stats.level}
              </span>
              <span
                data-testid="money-rm"
                className="font-mono-num text-xs sm:text-sm font-bold text-[#2b2118]"
              >
                RM {hud.stats.moneyRM.toFixed(0)}
              </span>
            </div>

            <div className="space-y-1">
              <div>
                <div className="flex justify-between text-[10px] font-medium text-[#6f5744]">
                  <span>{t(lang, 'hp')}</span>
                  <span className="font-mono-num">
                    {Math.round(hud.stats.hp)}/{hud.stats.maxHp}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#2b2118]/12 overflow-hidden">
                  <div className="h-full bg-[#d9534f]" style={{ width: `${hpPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-medium text-[#6f5744]">
                  <span>{t(lang, 'stamina')}</span>
                  <span className="font-mono-num">
                    {Math.round(hud.stats.stamina)}/{hud.stats.maxStamina}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#2b2118]/12 overflow-hidden">
                  <div className="h-full bg-[#4b7f78]" style={{ width: `${stamPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-medium text-[#6f5744]">
                  <span>{t(lang, 'xp')}</span>
                  <span className="font-mono-num">
                    {hud.stats.xp}/{hud.stats.xpToNext}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#2b2118]/12 overflow-hidden">
                  <div className="h-full bg-[#e6a817]" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* Expandable Quest Panel */}
          <section
            data-testid="quest-panel"
            aria-label="任务面板"
            className="rounded-xl text-[#2b2118]"
            style={{
              background: 'rgba(250, 243, 230, 0.93)',
              border: '1px solid rgba(43, 33, 24, 0.16)',
              boxShadow: '0 8px 22px rgba(24, 18, 12, 0.14)',
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#2b2118]/10">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">
                {t(lang, 'tasks')}
              </h2>
              <button
                type="button"
                data-testid="toggle-quests-btn"
                onClick={() => setTasksCollapsed((v) => !v)}
                aria-expanded={!tasksCollapsed}
                className="text-[11px] font-semibold text-[#6f5744] hover:text-[#2b2118] px-1.5 py-0.5 rounded cursor-pointer whitespace-nowrap"
              >
                {tasksCollapsed ? t(lang, 'expand') : t(lang, 'collapse')}
              </button>
            </div>

            {tasksCollapsed && trackedTask && (
              <button
                type="button"
                onClick={() => onSelectQuest(trackedTask.id)}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-[#efe3cd]/60 cursor-pointer rounded-b-xl"
              >
                <div className="font-semibold truncate">{trackedTask.title}</div>
                {trackedTask.distanceMeters !== null && (
                  <div className="text-[10px] text-[#c8553d] font-mono-num mt-0.5">
                    {hud.trackedQuestId === trackedTask.id ? `${t(lang, 'tracking')} · ` : ''}
                    {trackedTask.distanceMeters}m
                  </div>
                )}
              </button>
            )}

            {!tasksCollapsed && (
              <ul className="px-2.5 py-2 space-y-1.5 max-h-[210px] sm:max-h-[260px] overflow-y-auto text-[11px]">
                {hud.tasks.map((task) => {
                  const isTracked = hud.trackedQuestId === task.id && !task.completed;
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        disabled={task.completed}
                        onClick={() => onSelectQuest(task.id)}
                        className="w-full text-left p-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-default"
                        style={{
                          background: isTracked
                            ? 'rgba(200, 106, 78, 0.16)'
                            : 'rgba(235, 223, 200, 0.45)',
                          opacity: task.completed ? 0.58 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold leading-snug">{task.title}</span>
                          {task.completed ? (
                            <span className="shrink-0 text-[10px] text-[#4b7f78] font-semibold">
                              ✓
                            </span>
                          ) : (
                            task.distanceMeters !== null && (
                              <span className="shrink-0 font-mono-num text-[10px] text-[#c8553d]">
                                {task.distanceMeters}m
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-[10px] text-[#6f5744] mt-0.5 line-clamp-2">
                          {task.description}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Top-Center Timed Delivery or Toast */}
        <div className="hidden md:flex flex-col items-center gap-1.5 max-w-xs">
          {hud.timedDeliveryRemaining !== null && (
            <div
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#faf3e6] font-mono-num"
              style={{ background: '#c8553d', boxShadow: '0 6px 18px rgba(0,0,0,0.22)' }}
            >
              {t(lang, 'deliveryTimer')}: {hud.timedDeliveryRemaining}s
            </div>
          )}
          {toastMessage && (
            <div
              data-testid="hud-toast"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#faf3e6] text-center"
              style={{
                background: 'rgba(29, 24, 19, 0.9)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
            >
              {toastMessage}
            </div>
          )}
        </div>

        {/* Top-Right: Time/Weather + Quick Menu Buttons + Circular Minimap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
          <div className="flex flex-col items-end sm:flex-row sm:items-start gap-1.5">
            <div
              data-testid="time-hud"
              className="rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-right text-[#2b2118]"
              style={{
                background: 'rgba(250, 243, 230, 0.93)',
                border: '1px solid rgba(43, 33, 24, 0.16)',
                boxShadow: '0 8px 22px rgba(24, 18, 12, 0.14)',
              }}
            >
              <div className="flex items-center justify-end gap-1.5">
                {hud.weather.isRaining ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#456990]" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M7 16a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.3 7a3.5 3.5 0 0 1 .2 6.99L7 16Z"
                    />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
                  </svg>
                ) : hud.timeInfo.isNight ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#456990]" aria-hidden="true">
                    <path fill="currentColor" d="M20.2 14.9A8.5 8.5 0 0 1 9.1 3.8a8.5 8.5 0 1 0 11.1 11.1Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#d98c2b]" aria-hidden="true">
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                  </svg>
                )}
                <span className="font-mono-num text-base sm:text-lg font-semibold leading-none">
                  {hud.timeInfo.formattedTime}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#6f5744] mt-1 whitespace-nowrap">
                <span>
                  {t(lang, 'dayPrefix')}
                  {hud.timeInfo.dayCount}
                  {t(lang, 'daySuffix')}
                </span>
                <span className="mx-1">·</span>
                <span>{hud.weather.isRaining ? t(lang, 'rainy') : t(lang, 'sunny')}</span>
              </div>
              <div className="text-[10px] font-medium text-[#4b7f78] max-w-[130px] sm:max-w-none truncate">
                {hud.locationName}
              </div>
            </div>

            <div className="grid grid-cols-[auto_36px_36px] gap-1 justify-items-stretch">
              <button
                type="button"
                data-testid="passport-btn"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPassport();
                }}
                title={t(lang, 'passport')}
                aria-label={t(lang, 'passport')}
                className="h-9 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap"
                style={{
                  background: 'rgba(250, 243, 230, 0.93)',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                  color: '#2b2118',
                }}
              >
                <span>🍲</span>
                <span className="font-mono-num">{hud.foodPassportCount}/12</span>
              </button>

              <button
                type="button"
                data-testid="phone-btn"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPhone();
                }}
                title={`${t(lang, 'phone')} (M)`}
                aria-label={t(lang, 'phone')}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm cursor-pointer"
                style={{
                  background: 'rgba(250, 243, 230, 0.93)',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                  color: '#2b2118',
                }}
              >
                📱
              </button>

              <button
                type="button"
                data-testid="photo-btn"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPhoto();
                }}
                title={`${t(lang, 'photoMode')} (C)`}
                aria-label={t(lang, 'photoMode')}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm cursor-pointer"
                style={{
                  background: 'rgba(250, 243, 230, 0.93)',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                  color: '#2b2118',
                }}
              >
                📷
              </button>

              <button
                type="button"
                data-testid="settings-btn"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenSettings();
                }}
                title={t(lang, 'settings')}
                aria-label={t(lang, 'settings')}
                className="min-w-[36px] w-full h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{
                  background: 'rgba(250, 243, 230, 0.93)',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                  color: '#2b2118',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleTouchControls();
                }}
                aria-pressed={showTouchControls}
                aria-label="Touch Controls"
                title="Touch Controls"
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{
                  background: showTouchControls
                    ? 'rgba(76, 140, 136, 0.92)'
                    : 'rgba(250, 243, 230, 0.93)',
                  color: showTouchControls ? '#faf3e6' : '#2b2118',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="10" rx="5" />
                  <path d="M8 10v4M6 12h4" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                aria-label={t(lang, 'pause')}
                title={t(lang, 'pause')}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{
                  background: 'rgba(250, 243, 230, 0.93)',
                  border: '1px solid rgba(43, 33, 24, 0.16)',
                  color: '#2b2118',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <rect x="6.5" y="5" width="4" height="14" rx="1" />
                  <rect x="13.5" y="5" width="4" height="14" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Circular Rotating Minimap */}
          <Minimap playerPos={hud.playerPos} markers={hud.minimapMarkers} />
        </div>
      </div>

      {/* Mobile Toast & Delivery Banner */}
      {(toastMessage || hud.timedDeliveryRemaining !== null) && (
        <div className="md:hidden self-center flex flex-col items-center gap-1 max-w-[260px]">
          {hud.timedDeliveryRemaining !== null && (
            <div className="px-3 py-1 rounded-lg text-[11px] font-bold text-[#faf3e6] bg-[#c8553d] font-mono-num">
              {t(lang, 'deliveryTimer')}: {hud.timedDeliveryRemaining}s
            </div>
          )}
          {toastMessage && (
            <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#faf3e6] bg-[#1d1813]/90 text-center">
              {toastMessage}
            </div>
          )}
        </div>
      )}

      {/* Bottom Area: Nearby Interaction Prompt + Desktop Hint */}
      <div className="flex flex-col items-center gap-2 mb-1">
        {hud.nearbyPrompt && (
          <button
            type="button"
            data-testid="interact-prompt-btn"
            onClick={onInteractPrompt}
            className="pointer-events-auto px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-[#faf3e6] flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            style={{
              background: '#c86a4e',
              border: '1.5px solid rgba(250, 243, 230, 0.75)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            }}
          >
            <span className="px-1.5 py-0.5 rounded bg-[#2b2118]/35 font-mono-num text-[11px]">
              F
            </span>
            <span>{hud.nearbyPrompt.label}</span>
            <span className="opacity-85">· {hud.nearbyPrompt.actionText}</span>
          </button>
        )}

        {!showTouchControls && !hud.activeVehicle.mounted && (
          <div
            className="hidden sm:flex items-center gap-2 text-xs text-[#faf3e6] px-3.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(29, 24, 19, 0.65)' }}
          >
            <span>{t(lang, 'controlsDesktop')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
