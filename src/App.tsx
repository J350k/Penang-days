import { useCallback, useEffect, useRef, useState } from 'react';
import { DialogueModal } from './components/DialogueModal';
import { FoodPassportModal } from './components/FoodPassportModal';
import { GameHud } from './components/GameHud';
import { HomeDecorModal } from './components/HomeDecorModal';
import { LoadingScreen } from './components/LoadingScreen';
import { MinigameModal, type MinigameId } from './components/MinigameModal';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { PauseModal } from './components/PauseModal';
import { PhoneModal } from './components/PhoneModal';
import { PhotoModeHud } from './components/PhotoModeHud';
import { SettingsModal } from './components/SettingsModal';
import { ShopModal, type ShopMode } from './components/ShopModal';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls } from './components/TouchControls';
import { VehicleHud } from './components/VehicleHud';
import { WardrobeModal } from './components/WardrobeModal';
import { PenangGameEngine, getNpcDefinition } from './game/PenangGameEngine';
import { DEFAULT_TIME_OF_DAY, formatGameTime } from './game/dayNight/dayNightMath';
import { pickLang } from './game/i18n';
import { buildNpcDialogue } from './game/npc/npcData';
import {
  DEFAULT_SPAWN_PLAYER,
  clearSaveData,
  createDefaultSaveData,
  loadSaveData,
} from './game/storage/saveSystem';
import { FOOD_STALL_SPECS } from './game/world/foodStalls';
import type {
  DialogueChoice,
  DialogueNode,
  GameMode,
  HudSnapshot,
  NearbyPrompt,
  OutfitId,
  PhotoAlbumItem,
  PhotoFilterId,
  SettingsState,
} from './game/types';

function detectTouchDeviceOrNarrow(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  return coarse || 'ontouchstart' in window || window.innerWidth < 860;
}

function isAutostartQuery(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autostart') === '1';
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PenangGameEngine | null>(null);
  const modeRef = useRef<GameMode>('title');
  const toastTimerRef = useRef<number>(0);

  const [initialSave] = useState(() => loadSaveData());
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => initialSave !== null);
  const [mode, setMode] = useState<GameMode>('title');
  const [bootLoading, setBootLoading] = useState<boolean>(() => !isAutostartQuery());
  const [tutorialDone, setTutorialDone] = useState<boolean>(
    () => (initialSave?.tutorialCompleted ?? false) || isAutostartQuery()
  );
  const [showTouchControls, setShowTouchControls] = useState<boolean>(detectTouchDeviceOrNarrow);
  const [settings, setSettings] = useState<SettingsState>(
    () => initialSave?.settings ?? createDefaultSaveData().settings
  );

  const [activeDialogue, setActiveDialogue] = useState<{
    npcId: string;
    node: DialogueNode;
  } | null>(null);
  const [activeShop, setActiveShop] = useState<ShopMode | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [photoModeOpen, setPhotoModeOpen] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  const [photoAlbum, setPhotoAlbum] = useState<PhotoAlbumItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const def = initialSave ?? createDefaultSaveData();
    return {
      timeInfo: formatGameTime(def.timeOfDay ?? DEFAULT_TIME_OF_DAY, def.dayCount ?? 1),
      weather: { isRaining: false, rainIntensity: 0, wetFactor: 0 },
      locationName: '一楼客厅',
      isIndoors: true,
      isRunning: false,
      floorLevel: 1,
      stats: def.stats,
      playerPos: def.player ?? DEFAULT_SPAWN_PLAYER,
      motorcycle: { ...def.motorcycle, mounted: false, speed: 0 },
      carOwned: def.car.owned,
      activeVehicle: {
        mounted: false,
        kind: 'motorcycle',
        x: def.motorcycle.x,
        z: def.motorcycle.z,
        speed: 0,
        rpm: 850,
        gear: 'N',
        fuel: def.motorcycle.fuel,
        condition: def.motorcycle.condition,
      },
      trackedQuestId: def.quests.trackedQuestId,
      trackedTarget: null,
      tasks: [],
      nearbyPrompt: null,
      minimapMarkers: [],
      foodPassportCount: def.foodPassport.length,
      discoveredLandmarksCount: def.discoveredLandmarks.length,
      unlockedAchievementsCount: def.unlockedAchievements.length,
      timedDeliveryRemaining: null,
    };
  });

  useEffect(() => {
    if (!bootLoading) return;
    const id = window.setTimeout(() => setBootLoading(false), 650);
    return () => window.clearTimeout(id);
  }, [bootLoading]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3600);
  }, []);

  const applyMode = useCallback((nextMode: GameMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
    document.body.dataset.state = nextMode;
    engineRef.current?.setMode(nextMode);
  }, []);

  const closeSubModals = useCallback(() => {
    setActiveDialogue(null);
    setActiveShop(null);
    setPassportOpen(false);
    setSettingsOpen(false);
    setPhoneOpen(false);
    setDecorOpen(false);
    setWardrobeOpen(false);
    setActiveMinigame(null);
    if (photoModeOpen) {
      setPhotoModeOpen(false);
      engineRef.current?.setPhotoMode(false);
    }
  }, [photoModeOpen]);

  const handlePauseToggle = useCallback(() => {
    if (
      activeDialogue ||
      activeShop ||
      passportOpen ||
      settingsOpen ||
      phoneOpen ||
      decorOpen ||
      wardrobeOpen ||
      photoModeOpen ||
      activeMinigame
    ) {
      closeSubModals();
      return;
    }
    if (modeRef.current === 'playing') {
      applyMode('paused');
    } else if (modeRef.current === 'paused') {
      applyMode('playing');
    }
  }, [
    activeDialogue,
    activeMinigame,
    activeShop,
    applyMode,
    closeSubModals,
    decorOpen,
    passportOpen,
    phoneOpen,
    photoModeOpen,
    settingsOpen,
    wardrobeOpen,
  ]);

  const handlePhoneToggle = useCallback(() => {
    if (modeRef.current !== 'playing') return;
    setPhoneOpen((v) => {
      const next = !v;
      if (next && photoModeOpen) {
        setPhotoModeOpen(false);
        engineRef.current?.setPhotoMode(false);
      }
      return next;
    });
  }, [photoModeOpen]);

  const handlePhotoToggle = useCallback(() => {
    if (modeRef.current !== 'playing') return;
    setPhotoModeOpen((v) => {
      const next = !v;
      engineRef.current?.setPhotoMode(next, next ? 50 : undefined);
      if (next) setPhoneOpen(false);
      return next;
    });
  }, []);

  const handlePromptInteract = useCallback((prompt: NearbyPrompt) => {
    const engine = engineRef.current;
    if (!engine) return;
    const lang = engine.getSettings().language;

    if (prompt.type === 'npc') {
      const node = buildNpcDialogue(
        prompt.id,
        engine.getQuestState(),
        engine.getFoodPassport().length,
        engine.getMotorcycleState().owned,
        lang
      );
      setActiveDialogue({ npcId: prompt.id, node });
    } else if (prompt.type === 'stall') {
      const stall = FOOD_STALL_SPECS.find((s) => s.id === prompt.id);
      setActiveShop({
        kind: 'food',
        stallId: prompt.id,
        title: stall ? pickLang(lang, stall.stallName, stall.subLabel, stall.subLabel) : prompt.label,
      });
    } else if (prompt.type === 'shop') {
      if (prompt.id === 'outfit-shop') {
        setActiveShop({
          kind: 'outfit',
          title: pickLang(lang, '娘惹服饰专卖店', 'George Town Boutique', 'Butik Warisan'),
        });
      } else if (prompt.id === 'scooter-shop') {
        setActiveShop({
          kind: 'motorcycle',
          title: pickLang(lang, '明珠车行', 'Pearl Motors', 'Pearl Motors'),
        });
      }
    } else if (prompt.type === 'decor') {
      setDecorOpen(true);
    } else if (prompt.type === 'wardrobe') {
      setWardrobeOpen(true);
    } else if (prompt.type === 'bus') {
      setPhoneOpen(true);
    } else if (prompt.type === 'jetski') {
      setActiveMinigame('jetski-slalom');
    }
  }, []);

  // Keep engine movement input locked while any modal is open
  useEffect(() => {
    const anyModal = Boolean(
      activeDialogue ||
        activeShop ||
        passportOpen ||
        settingsOpen ||
        phoneOpen ||
        decorOpen ||
        wardrobeOpen ||
        activeMinigame
    );
    engineRef.current?.setUiModalOpen(anyModal);
  }, [
    activeDialogue,
    activeMinigame,
    activeShop,
    decorOpen,
    passportOpen,
    phoneOpen,
    settingsOpen,
    wardrobeOpen,
  ]);

  // Ref for stable callback access inside engine constructor
  const pauseRef = useRef(handlePauseToggle);
  pauseRef.current = handlePauseToggle;
  const phoneRef = useRef(handlePhoneToggle);
  phoneRef.current = handlePhoneToggle;
  const photoRef = useRef(handlePhotoToggle);
  photoRef.current = handlePhotoToggle;
  const promptRef = useRef(handlePromptInteract);
  promptRef.current = handlePromptInteract;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new PenangGameEngine(
      container,
      {
        onHudUpdate: (snapshot) => setHud(snapshot),
        onPauseToggle: () => pauseRef.current(),
        onPhoneToggle: () => phoneRef.current(),
        onPhotoToggle: () => photoRef.current(),
        onPromptInteract: (prompt) => promptRef.current(prompt),
        onToast: (msg) => showToast(msg),
      },
      initialSave
    );
    engineRef.current = engine;

    if (isAutostartQuery()) {
      applyMode('playing');
    } else {
      document.body.dataset.state = 'title';
    }

    const onBeforeUnload = () => {
      engine.saveProgress();
    };
    const onFirstTouch = () => {
      setShowTouchControls(true);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('touchstart', onFirstTouch);
      window.clearTimeout(toastTimerRef.current);
      engine.dispose();
      engineRef.current = null;
    };
  }, [applyMode, initialSave, showToast]);

  const handleStartContinue = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    engineRef.current?.unlockAudio();
    applyMode('playing');
  }, [applyMode]);

  const handleStartFresh = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    clearSaveData();
    const fresh = createDefaultSaveData();
    fresh.settings = { ...settings };
    engineRef.current?.loadState(fresh);
    setHasSavedGame(false);
    setTutorialDone(isAutostartQuery());
    setPhotoAlbum([]);
    closeSubModals();
    engineRef.current?.unlockAudio();
    applyMode('playing');
  }, [applyMode, closeSubModals, settings]);

  const handleReturnHome = useCallback(() => {
    engineRef.current?.resetToHome();
    applyMode('playing');
  }, [applyMode]);

  const handleBackToTitle = useCallback(() => {
    setHasSavedGame(loadSaveData() !== null);
    applyMode('title');
  }, [applyMode]);

  const handleDialogueChoice = (choice: DialogueChoice) => {
    const engine = engineRef.current;
    if (!engine || !activeDialogue) return;

    if (choice.affinityDelta) {
      engine.addNpcAffinity(activeDialogue.npcId, choice.affinityDelta);
    }

    if (choice.action === 'accept_quest' && choice.questId) {
      engine.acceptQuest(choice.questId);
      setActiveDialogue(null);
    } else if (choice.action === 'complete_quest' && choice.questId) {
      engine.completeQuest(choice.questId);
      setActiveDialogue(null);
    } else if (choice.action === 'open_shop' && choice.shopId) {
      const stall = FOOD_STALL_SPECS.find((s) => s.id === choice.shopId);
      const lang = settings.language;
      setActiveDialogue(null);
      setActiveShop({
        kind: 'food',
        stallId: choice.shopId,
        title: stall ? pickLang(lang, stall.stallName, stall.subLabel, stall.subLabel) : choice.shopId,
      });
    } else if (choice.action === 'open_minigame' && choice.minigameId) {
      setActiveDialogue(null);
      setActiveMinigame(choice.minigameId);
    } else if (choice.action === 'chat_affinity') {
      showToast(
        pickLang(
          settings.language,
          `好感度 +${choice.affinityDelta ?? 5}`,
          `Affinity +${choice.affinityDelta ?? 5}`,
          `Mesra +${choice.affinityDelta ?? 5}`
        )
      );
      setActiveDialogue(null);
    } else {
      setActiveDialogue(null);
    }
  };

  const handleUpdateSettings = (next: SettingsState) => {
    setSettings(next);
    engineRef.current?.applySettings(next);
  };

  const handleCapturePhoto = (filter: PhotoFilterId) => {
    const item = engineRef.current?.capturePhoto(filter);
    if (item) {
      setPhotoAlbum((prev) => [item, ...prev].slice(0, 18));
      showToast(
        pickLang(
          settings.language,
          `咔嚓！已存入手机相册（${item.locationName}）`,
          `Photo saved to Phone Album (${item.locationName})`,
          `Foto disimpan ke Album (${item.locationName})`
        )
      );
    }
  };

  const lang = settings.language;
  const activeNpcDef = activeDialogue ? getNpcDefinition(activeDialogue.npcId) : null;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#1f2933]">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="game-canvas-container"
        className="w-full h-full"
      />

      {bootLoading && <LoadingScreen lang={lang} />}

      {mode === 'title' && !bootLoading && (
        <TitleScreen
          hasSavedGame={hasSavedGame}
          lang={lang}
          onStartContinue={handleStartContinue}
          onStartFresh={handleStartFresh}
        />
      )}

      {mode === 'playing' && !photoModeOpen && (
        <>
          <GameHud
            hud={hud}
            lang={lang}
            showTouchControls={showTouchControls}
            toastMessage={toastMessage}
            onToggleTouchControls={() => setShowTouchControls((v) => !v)}
            onSelectQuest={(qid) => engineRef.current?.setTrackedQuest(qid)}
            onInteractPrompt={() => engineRef.current?.triggerNearbyPrompt()}
            onOpenPassport={() => setPassportOpen(true)}
            onOpenPhone={() => setPhoneOpen(true)}
            onOpenPhoto={() => handlePhotoToggle()}
            onOpenSettings={() => setSettingsOpen(true)}
            onPause={() => applyMode('paused')}
          />
          <VehicleHud
            activeVehicle={hud.activeVehicle}
            lang={lang}
            onHorn={() => engineRef.current?.honkHorn()}
            onDismount={() => engineRef.current?.dismountVehicle()}
            onRefuel={() => engineRef.current?.refuelActiveOrOwned()}
            onRepair={() => engineRef.current?.repairMotorcycle()}
          />
          {showTouchControls && (
            <TouchControls
              inputManager={engineRef.current?.getInputManager() ?? null}
              isMounted={hud.activeVehicle.mounted}
              vehicleKind={hud.activeVehicle.kind}
              lang={lang}
            />
          )}
          {!tutorialDone && (
            <OnboardingOverlay
              lang={lang}
              onComplete={() => {
                setTutorialDone(true);
                engineRef.current?.markTutorialCompleted();
              }}
            />
          )}
        </>
      )}

      {mode === 'playing' && photoModeOpen && (
        <PhotoModeHud
          lang={lang}
          onAdjustCamera={(dx, dy, fov) => engineRef.current?.adjustPhotoCamera(dx, dy, fov)}
          onShutter={handleCapturePhoto}
          onExit={() => {
            setPhotoModeOpen(false);
            engineRef.current?.setPhotoMode(false);
          }}
        />
      )}

      {mode === 'paused' && (
        <PauseModal
          hud={hud}
          lang={lang}
          onResume={() => applyMode('playing')}
          onOpenSettings={() => setSettingsOpen(true)}
          onReturnHome={handleReturnHome}
          onBackToTitle={handleBackToTitle}
        />
      )}

      {activeDialogue && (
        <DialogueModal
          node={activeDialogue.node}
          roleLabel={
            activeNpcDef
              ? pickLang(lang, activeNpcDef.roleZh, activeNpcDef.roleEn, activeNpcDef.roleMs)
              : ''
          }
          affinity={engineRef.current?.getNpcAffinity(activeDialogue.npcId) ?? 0}
          lang={lang}
          onChoice={handleDialogueChoice}
          onClose={() => setActiveDialogue(null)}
        />
      )}

      {activeShop && (
        <ShopModal
          shop={activeShop}
          moneyRM={hud.stats.moneyRM}
          lang={lang}
          foodPassport={engineRef.current?.getFoodPassport() ?? []}
          ownedOutfits={engineRef.current?.getOwnedOutfits() ?? ['linen-teal']}
          equippedOutfit={engineRef.current?.getEquippedOutfit() ?? 'linen-teal'}
          motorcycleOwned={hud.motorcycle.owned}
          carOwned={hud.carOwned}
          onBuyFood={(foodId) => {
            const res = engineRef.current?.buyAndEatFood(foodId);
            if (res && !res.ok && res.reason) showToast(res.reason);
          }}
          onBuyOrEquipOutfit={(outfitId: OutfitId) => {
            const res = engineRef.current?.buyOrEquipOutfit(outfitId);
            if (res && !res.ok && res.reason) showToast(res.reason);
          }}
          onBuyMotorcycle={() => {
            const res = engineRef.current?.buyMotorcycle();
            if (res?.ok) {
              setActiveShop(null);
            } else if (res?.reason) {
              showToast(res.reason);
            }
          }}
          onBuyCar={() => {
            const res = engineRef.current?.buyCar();
            if (res?.ok) {
              setActiveShop(null);
            } else if (res?.reason) {
              showToast(res.reason);
            }
          }}
          onClose={() => setActiveShop(null)}
        />
      )}

      {passportOpen && (
        <FoodPassportModal
          foodPassport={engineRef.current?.getFoodPassport() ?? []}
          lang={lang}
          onClose={() => setPassportOpen(false)}
        />
      )}

      {phoneOpen && engineRef.current && (
        <PhoneModal
          lang={lang}
          hud={hud}
          npcAffinities={engineRef.current.getAllNpcAffinities()}
          discoveredLandmarks={engineRef.current.getDiscoveredLandmarks()}
          unlockedAchievements={engineRef.current.getUnlockedAchievements()}
          dailyChallenge={engineRef.current.getDailyChallengeState()}
          bankLedger={engineRef.current.getBankLedger()}
          photoAlbum={photoAlbum}
          onSelectQuest={(qid) => engineRef.current?.setTrackedQuest(qid)}
          onRideBus={(stopId) => engineRef.current?.rideBusTo(stopId)}
          onClaimDaily={(id) => engineRef.current?.claimDailyChallenge(id)}
          onDeletePhoto={(id) => setPhotoAlbum((prev) => prev.filter((p) => p.id !== id))}
          onOpenPhotoMode={() => {
            setPhoneOpen(false);
            handlePhotoToggle();
          }}
          onOpenPassport={() => {
            setPhoneOpen(false);
            setPassportOpen(true);
          }}
          onOpenDecor={() => {
            setPhoneOpen(false);
            setDecorOpen(true);
          }}
          onOpenWardrobe={() => {
            setPhoneOpen(false);
            setWardrobeOpen(true);
          }}
          onClose={() => setPhoneOpen(false)}
        />
      )}

      {decorOpen && engineRef.current && (
        <HomeDecorModal
          lang={lang}
          moneyRM={hud.stats.moneyRM}
          ownedFurnitureIds={engineRef.current.getOwnedFurnitureIds()}
          placedFurniture={engineRef.current.getPlacedFurniture()}
          onBuyFurniture={(id) => {
            const res = engineRef.current?.buyFurniture(id);
            if (res && !res.ok && res.reason) showToast(res.reason);
          }}
          onPlaceFurniture={(itemId, floor, gx, gz) => {
            engineRef.current?.placeFurniture(itemId, floor, gx, gz, 0);
          }}
          onRotateOrReclaim={(instanceId, action) => {
            engineRef.current?.rotateOrReclaimFurniture(instanceId, action);
          }}
          onClose={() => setDecorOpen(false)}
        />
      )}

      {wardrobeOpen && engineRef.current && (
        <WardrobeModal
          lang={lang}
          moneyRM={hud.stats.moneyRM}
          ownedOutfits={engineRef.current.getOwnedOutfits()}
          equippedOutfit={engineRef.current.getEquippedOutfit()}
          wardrobe={engineRef.current.getWardrobeState()}
          onBuyOrEquipOutfit={(id) => {
            const res = engineRef.current?.buyOrEquipOutfit(id);
            if (res && !res.ok && res.reason) showToast(res.reason);
          }}
          onUpdateWardrobe={(w) => engineRef.current?.setWardrobe(w)}
          onClose={() => setWardrobeOpen(false)}
        />
      )}

      {activeMinigame && (
        <MinigameModal
          minigameId={activeMinigame}
          lang={lang}
          onPlayWokSizzle={() => engineRef.current?.playWokSizzleSound()}
          onComplete={(won, rm, xp) => {
            engineRef.current?.recordMinigameResult(activeMinigame, won, rm, xp);
          }}
          onClose={() => setActiveMinigame(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onRestartGame={handleStartFresh}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
