import { useState } from 'react';
import { pickLang, t } from '../game/i18n';
import { NAMED_NPCS, getScheduledSlotForHour } from '../game/npc/npcData';
import { ACHIEVEMENT_CATALOG, getDailyChallenges } from '../game/systems/progression';
import type {
  BankTransaction,
  DailyChallengeProgress,
  HudSnapshot,
  LanguageCode,
  PhotoAlbumItem,
} from '../game/types';
import { BUS_STOPS, LANDMARK_ZONES } from '../game/world/expandedRegions';

type PhoneTab = 'map' | 'quests' | 'contacts' | 'album' | 'bank' | 'achievements';

interface PhoneModalProps {
  lang: LanguageCode;
  hud: HudSnapshot;
  npcAffinities: Record<string, number>;
  discoveredLandmarks: string[];
  unlockedAchievements: string[];
  dailyChallenge: DailyChallengeProgress;
  bankLedger: BankTransaction[];
  photoAlbum: PhotoAlbumItem[];
  onSelectQuest: (questId: string) => void;
  onRideBus: (stopId: string) => void;
  onClaimDaily: (challengeId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onOpenPhotoMode: () => void;
  onOpenPassport: () => void;
  onOpenDecor: () => void;
  onOpenWardrobe: () => void;
  onOpenCloud?: () => void;
  onClose: () => void;
}

export function PhoneModal({
  lang,
  hud,
  npcAffinities,
  discoveredLandmarks,
  unlockedAchievements,
  dailyChallenge,
  bankLedger,
  photoAlbum,
  onSelectQuest,
  onRideBus,
  onClaimDaily,
  onDeletePhoto,
  onOpenPhotoMode,
  onOpenPassport,
  onOpenDecor,
  onOpenWardrobe,
  onOpenCloud,
  onClose,
}: PhoneModalProps) {
  const [tab, setTab] = useState<PhoneTab>('map');
  const todaysChallenges = getDailyChallenges(hud.timeInfo.dayCount);

  const tabs: Array<{ id: PhoneTab; icon: string; label: string }> = [
    { id: 'map', icon: '🗺️', label: t(lang, 'mapApp') },
    { id: 'quests', icon: '📋', label: t(lang, 'dailyChallenges') },
    { id: 'contacts', icon: '👥', label: t(lang, 'contacts') },
    { id: 'album', icon: '📸', label: pickLang(lang, '相册', 'Album', 'Album') },
    { id: 'bank', icon: '💳', label: t(lang, 'bank') },
    { id: 'achievements', icon: '🏆', label: t(lang, 'achievements') },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-5"
      style={{ background: 'rgba(18, 14, 10, 0.6)' }}
      role="dialog"
      aria-modal="true"
      data-testid="phone-modal"
    >
      <div
        className="w-full max-w-2xl max-h-[89vh] flex flex-col rounded-[26px] p-4 sm:p-5 text-[#2b2118]"
        style={{
          background: '#faf3e6',
          border: '3px solid #2b2118',
          boxShadow: '0 24px 58px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Top Smartphone Status Bar */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#2b2118]/12">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-[#2b2118] text-[#faf3e6] text-xs font-bold font-mono-num">
              {hud.timeInfo.formattedTime}
            </span>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight">
                {t(lang, 'phone')} · PenangOS
              </h2>
              <p className="text-[11px] text-[#6f5744] font-mono-num">
                RM {hud.stats.moneyRM.toFixed(0)} · {hud.locationName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>

        {/* App Dock Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`phone-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className="py-2 px-1.5 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-0.5 cursor-pointer border transition-colors"
                style={{
                  background: active ? '#c86a4e' : '#f1e6d2',
                  color: active ? '#faf3e6' : '#2b2118',
                  borderColor: active ? '#a54e34' : 'rgba(43,33,24,0.12)',
                }}
              >
                <span className="text-sm leading-none">{item.icon}</span>
                <span className="truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick App Launchers */}
        <div className="flex flex-wrap gap-1.5 mt-2.5 pb-2.5 border-b border-[#2b2118]/10 text-[11px]">
          <button
            type="button"
            onClick={onOpenPassport}
            className="px-2.5 py-1 rounded-lg bg-[#e8dfd0] hover:bg-[#ded2be] font-semibold cursor-pointer"
          >
            🍲 {t(lang, 'passport')} ({hud.foodPassportCount}/12)
          </button>
          <button
            type="button"
            onClick={onOpenPhotoMode}
            className="px-2.5 py-1 rounded-lg bg-[#e8dfd0] hover:bg-[#ded2be] font-semibold cursor-pointer"
          >
            📷 {t(lang, 'photoMode')}
          </button>
          <button
            type="button"
            onClick={onOpenWardrobe}
            className="px-2.5 py-1 rounded-lg bg-[#e8dfd0] hover:bg-[#ded2be] font-semibold cursor-pointer"
          >
            👔 {t(lang, 'wardrobe')}
          </button>
          {hud.isIndoors && (
            <button
              type="button"
              onClick={onOpenDecor}
              className="px-2.5 py-1 rounded-lg bg-[#4b7f78] text-[#faf3e6] font-semibold cursor-pointer"
            >
              🛋️ {t(lang, 'decor')}
            </button>
          )}
          {onOpenCloud && (
            <button
              type="button"
              onClick={onOpenCloud}
              className="px-2.5 py-1 rounded-lg bg-[#456990] text-[#faf3e6] font-semibold cursor-pointer"
            >
              ☁️ {t(lang, 'cloudAccount')}
            </button>
          )}
        </div>

        {/* Active App Content */}
        <div className="mt-3 overflow-y-auto flex-1 pr-1 space-y-3 text-xs">
          {tab === 'map' && (
            <>
              <div>
                <h3 className="font-bold text-sm mb-1.5">
                  🚌 {pickLang(lang, '珍珠巴士快速传送', 'Pearl Transit Bus Fast Travel', 'Bas Pantas Mutiara')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BUS_STOPS.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => {
                        onRideBus(stop.id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#f3e9d4] hover:bg-[#e8dac0] border border-[#2b2118]/12 text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold">
                          {pickLang(lang, stop.nameZh, stop.nameEn, stop.nameMs)}
                        </div>
                        <div className="text-[10px] text-[#6f5744] font-mono-num">
                          ({stop.x}, {stop.z})
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-[#4b7f78] text-[#faf3e6] text-[10px] font-bold">
                        {pickLang(lang, '前往', 'Go', 'Pergi')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-1.5">
                  📍 {pickLang(lang, `槟城地标探索 (${discoveredLandmarks.length}/9)`, `Penang Landmarks (${discoveredLandmarks.length}/9)`, `Mercu Tanda (${discoveredLandmarks.length}/9)`)}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {LANDMARK_ZONES.map((lm) => {
                    const found = discoveredLandmarks.includes(lm.id);
                    return (
                      <div
                        key={lm.id}
                        className="p-2 rounded-lg border"
                        style={{
                          background: found ? '#dcebe2' : '#efe6d5',
                          borderColor: found ? '#4b7f78' : 'rgba(43,33,24,0.12)',
                        }}
                      >
                        <div className="font-semibold truncate">
                          {found ? '✓ ' : '· '}
                          {pickLang(lang, lm.nameZh, lm.nameEn, lm.nameMs)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'quests' && (
            <>
              <div>
                <h3 className="font-bold text-sm mb-1.5">
                  ☀️ {t(lang, 'dailyChallenges')} ({t(lang, 'dayPrefix')}
                  {hud.timeInfo.dayCount}
                  {t(lang, 'daySuffix')})
                </h3>
                <div className="space-y-2">
                  {todaysChallenges.map((dc) => {
                    const cur = dailyChallenge.progressById[dc.id] ?? 0;
                    const claimed = dailyChallenge.claimedIds.includes(dc.id);
                    const done = cur >= dc.target;
                    return (
                      <div
                        key={dc.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#f3e9d4] border border-[#2b2118]/12"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold">
                            {pickLang(lang, dc.titleZh, dc.titleEn, dc.titleMs)}
                          </div>
                          <div className="text-[11px] text-[#6f5744] font-mono-num mt-0.5">
                            {cur}/{dc.target} · +RM {dc.rewardRM} · +{dc.rewardXP} XP
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!done || claimed}
                          onClick={() => onClaimDaily(dc.id)}
                          className="px-3 py-1.5 rounded-lg font-semibold cursor-pointer disabled:opacity-45 bg-[#c86a4e] text-[#faf3e6] shrink-0"
                        >
                          {claimed
                            ? pickLang(lang, '已领取', 'Claimed', 'Dituntut')
                            : done
                            ? pickLang(lang, '领取奖励', 'Claim', 'Tuntut')
                            : `${cur}/${dc.target}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-1.5">{t(lang, 'tasks')}</h3>
                <div className="space-y-1.5">
                  {hud.tasks.map((tk) => {
                    const tracked = hud.trackedQuestId === tk.id && !tk.completed;
                    return (
                      <button
                        key={tk.id}
                        type="button"
                        disabled={tk.completed}
                        onClick={() => onSelectQuest(tk.id)}
                        className="w-full text-left p-2.5 rounded-xl border cursor-pointer disabled:cursor-default"
                        style={{
                          background: tracked ? 'rgba(200, 106, 78, 0.16)' : '#f3e9d4',
                          borderColor: tracked ? '#c86a4e' : 'rgba(43,33,24,0.1)',
                          opacity: tk.completed ? 0.6 : 1,
                        }}
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{tk.title}</span>
                          <span className="font-mono-num text-[#c8553d]">
                            {tk.completed
                              ? t(lang, 'completed')
                              : tk.distanceMeters !== null
                              ? `${tk.distanceMeters}m`
                              : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6f5744] mt-0.5">{tk.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'contacts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NAMED_NPCS.map((npc) => {
                const aff = npcAffinities[npc.id] ?? 0;
                const slot = getScheduledSlotForHour(npc, hud.timeInfo.hours);
                return (
                  <div
                    key={npc.id}
                    className="p-3 rounded-xl bg-[#f3e9d4] border border-[#2b2118]/12"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">
                        {pickLang(lang, npc.nameZh, npc.nameEn, npc.nameMs)}
                      </span>
                      <span className="font-mono-num text-[11px] px-2 py-0.5 rounded bg-[#c86a4e]/15 text-[#9c4026] font-semibold">
                        ♥ {aff}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6f5744]">
                      {pickLang(lang, npc.roleZh, npc.roleEn, npc.roleMs)}
                    </p>
                    <p className="text-[11px] text-[#4b7f78] mt-1 font-medium">
                      📍 {pickLang(lang, slot.activityZh, slot.activityEn, slot.activityMs)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'album' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#6f5744]">
                  {pickLang(
                    lang,
                    `已拍摄 ${photoAlbum.length} 张纪念照片`,
                    `${photoAlbum.length} Photos Saved`,
                    `${photoAlbum.length} Foto Disimpan`
                  )}
                </span>
                <button
                  type="button"
                  onClick={onOpenPhotoMode}
                  className="px-3 py-1.5 rounded-lg bg-[#c86a4e] text-[#faf3e6] font-semibold cursor-pointer"
                >
                  📷 {t(lang, 'photoMode')}
                </button>
              </div>
              {photoAlbum.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#f3e9d4] text-center text-[#6f5744]">
                  {pickLang(
                    lang,
                    '相册还是空的，按 C 键打开拍照模式拍下乔治市风景吧！',
                    'Album is empty. Press C to frame your first George Town shot!',
                    'Album kosong. Tekan C untuk mengambil gambar pertama anda!'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {photoAlbum.map((pic) => (
                    <div
                      key={pic.id}
                      className="rounded-xl overflow-hidden border border-[#2b2118]/14 bg-[#f3e9d4]"
                    >
                      <img
                        src={pic.dataUrl}
                        alt={pic.locationName}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">{pic.locationName}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#e5d8bf]">
                            {pic.filter}
                          </span>
                        </div>
                        {pic.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pic.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#4b7f78]/15 text-[#2f5f58]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end gap-2 pt-1">
                          <a
                            href={pic.dataUrl}
                            download={`penang-days-${pic.id}.png`}
                            className="px-2 py-1 rounded bg-[#4b7f78] text-[#faf3e6] text-[10px] font-semibold"
                          >
                            {pickLang(lang, '下载', 'Save PNG', 'Muat Turun')}
                          </a>
                          <button
                            type="button"
                            onClick={() => onDeletePhoto(pic.id)}
                            className="px-2 py-1 rounded bg-[#c84338]/15 text-[#b0342b] text-[10px] font-semibold cursor-pointer"
                          >
                            {pickLang(lang, '删除', 'Delete', 'Padam')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-[#2b2118] text-[#faf3e6] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#f4e3b8]">
                    {pickLang(lang, '槟城储蓄账户余额', 'George Town Savings', 'Baki Akaun')}
                  </div>
                  <div className="font-mono-num text-2xl font-bold mt-0.5">
                    RM {hud.stats.moneyRM.toFixed(0)}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-[#4b7f78]">
                  {t(lang, 'level')} {hud.stats.level}
                </span>
              </div>

              {bankLedger.length === 0 ? (
                <p className="p-4 rounded-xl bg-[#f3e9d4] text-center text-[#6f5744]">
                  {pickLang(lang, '暂无交易记录', 'No transactions yet', 'Tiada transaksi lagi')}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {bankLedger.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#f3e9d4] border border-[#2b2118]/10"
                    >
                      <div>
                        <div className="font-semibold">
                          {pickLang(lang, tx.labelZh, tx.labelEn, tx.labelMs)}
                        </div>
                        <div className="text-[10px] text-[#6f5744] font-mono-num">{tx.timeText}</div>
                      </div>
                      <span
                        className="font-mono-num font-bold text-sm"
                        style={{ color: tx.amountRM >= 0 ? '#2f6f4e' : '#c84338' }}
                      >
                        {tx.amountRM >= 0 ? `+RM ${tx.amountRM}` : `-RM ${Math.abs(tx.amountRM)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'achievements' && (
            <div>
              <p className="text-[11px] text-[#6f5744] font-semibold mb-2">
                {pickLang(
                  lang,
                  `已解锁 ${unlockedAchievements.length} / ${ACHIEVEMENT_CATALOG.length} 项成就`,
                  `Unlocked ${unlockedAchievements.length} / ${ACHIEVEMENT_CATALOG.length}`,
                  `Dibuka ${unlockedAchievements.length} / ${ACHIEVEMENT_CATALOG.length}`
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACHIEVEMENT_CATALOG.map((ach) => {
                  const unlocked = unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className="p-2.5 rounded-xl border"
                      style={{
                        background: unlocked ? '#e1efe4' : '#efe7d6',
                        borderColor: unlocked ? '#4b7f78' : 'rgba(43,33,24,0.12)',
                        opacity: unlocked ? 1 : 0.72,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">
                          {unlocked ? '🏆 ' : '🔒 '}
                          {pickLang(lang, ach.titleZh, ach.titleEn, ach.titleMs)}
                        </span>
                        <span className="font-mono-num text-[10px] text-[#4b7f78] font-bold">
                          +RM {ach.rewardRM}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6f5744] mt-0.5">
                        {pickLang(lang, ach.descZh, ach.descEn, ach.descMs)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
