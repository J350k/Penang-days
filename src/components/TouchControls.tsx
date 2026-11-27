import { useRef, useState } from 'react';
import { pickLang, t } from '../game/i18n';
import type { InputManager } from '../game/player/inputManager';
import type { LanguageCode, VehicleKind } from '../game/types';

interface TouchControlsProps {
  inputManager: InputManager | null;
  isMounted: boolean;
  vehicleKind?: VehicleKind;
  lang: LanguageCode;
}

const JOYSTICK_RADIUS = 44;

export function TouchControls({
  inputManager,
  isMounted,
  vehicleKind,
  lang,
}: TouchControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const joyTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprintActive, setSprintActive] = useState(false);

  const updateJoystickFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    setKnobOffset({ x: dx, y: dy });
    inputManager?.setJoystick(dx / JOYSTICK_RADIUS, -dy / JOYSTICK_RADIUS);
  };

  const resetJoystick = () => {
    joyTouchIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    inputManager?.setJoystick(0, 0);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none" data-testid="touch-controls">
      {/* Right-side invisible touch-drag look surface */}
      <div
        className="fixed top-20 right-0 bottom-0 left-[38%] pointer-events-auto"
        style={{ touchAction: 'none' }}
        aria-label="滑动旋转视角区域"
        onTouchStart={(e) => {
          if (lookTouchIdRef.current !== null) return;
          const touch = e.changedTouches[0];
          if (!touch) return;
          lookTouchIdRef.current = touch.identifier;
          lookLastPosRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchMove={(e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === lookTouchIdRef.current) {
              const dx = touch.clientX - lookLastPosRef.current.x;
              const dy = touch.clientY - lookLastPosRef.current.y;
              lookLastPosRef.current = { x: touch.clientX, y: touch.clientY };
              inputManager?.addTouchLookDelta(dx, dy);
              break;
            }
          }
        }}
        onTouchEnd={(e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
              lookTouchIdRef.current = null;
              break;
            }
          }
        }}
        onTouchCancel={() => {
          lookTouchIdRef.current = null;
        }}
      />

      {/* Left Virtual Joystick (walks on foot / steers when riding) */}
      <div
        ref={baseRef}
        data-testid="virtual-joystick"
        aria-label="虚拟摇杆"
        className="fixed bottom-6 left-5 w-28 h-28 rounded-full flex items-center justify-center pointer-events-auto"
        style={{
          touchAction: 'none',
          background: 'rgba(250, 243, 230, 0.24)',
          border: '2px solid rgba(250, 243, 230, 0.55)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (joyTouchIdRef.current !== null) return;
          const touch = e.changedTouches[0];
          if (!touch) return;
          joyTouchIdRef.current = touch.identifier;
          updateJoystickFromClient(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joyTouchIdRef.current) {
              updateJoystickFromClient(touch.clientX, touch.clientY);
              break;
            }
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
              resetJoystick();
              break;
            }
          }
        }}
        onTouchCancel={() => resetJoystick()}
      >
        <div
          className="w-12 h-12 rounded-full pointer-events-none relative z-10"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            background: 'rgba(250, 243, 230, 0.92)',
            border: '2px solid #2b2118',
            boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      {/* Bottom-Right Action Pedals (Sprint on foot vs Throttle/Brake/Horn on Vehicle) */}
      {isMounted ? (
        <div className="fixed bottom-6 right-5 flex items-end gap-2.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => inputManager?.triggerHorn()}
            className="w-12 h-12 rounded-full font-semibold text-[11px] cursor-pointer"
            style={{
              background: 'rgba(250, 243, 230, 0.88)',
              color: '#2b2118',
              border: '2px solid rgba(43, 33, 24, 0.28)',
            }}
          >
            {vehicleKind === 'trishaw' ? t(lang, 'bell') : t(lang, 'horn')}
          </button>
          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              inputManager?.setTouchBrake(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              inputManager?.setTouchBrake(false);
            }}
            onTouchCancel={() => inputManager?.setTouchBrake(false)}
            onMouseDown={() => inputManager?.setTouchBrake(true)}
            onMouseUp={() => inputManager?.setTouchBrake(false)}
            onMouseLeave={() => inputManager?.setTouchBrake(false)}
            className="w-14 h-14 rounded-full font-semibold text-xs cursor-pointer"
            style={{
              background: 'rgba(111, 87, 68, 0.92)',
              color: '#faf3e6',
              border: '2px solid rgba(250, 243, 230, 0.6)',
            }}
          >
            {t(lang, 'brake')}
          </button>
          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              inputManager?.setTouchThrottle(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              inputManager?.setTouchThrottle(false);
            }}
            onTouchCancel={() => inputManager?.setTouchThrottle(false)}
            onMouseDown={() => inputManager?.setTouchThrottle(true)}
            onMouseUp={() => inputManager?.setTouchThrottle(false)}
            onMouseLeave={() => inputManager?.setTouchThrottle(false)}
            className="w-16 h-16 rounded-full font-bold text-xs cursor-pointer"
            style={{
              background: '#c86a4e',
              color: '#faf3e6',
              border: '2px solid rgba(250, 243, 230, 0.75)',
            }}
          >
            {t(lang, 'throttle')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="mobile-sprint-btn"
          aria-pressed={sprintActive}
          onClick={() => {
            const next = !sprintActive;
            setSprintActive(next);
            inputManager?.setTouchSprint(next);
          }}
          className="fixed bottom-8 right-6 w-16 h-16 rounded-full flex items-center justify-center font-semibold text-xs pointer-events-auto cursor-pointer"
          style={{
            background: sprintActive ? '#c86a4e' : 'rgba(250, 243, 230, 0.88)',
            color: sprintActive ? '#faf3e6' : '#2b2118',
            border: '2px solid rgba(43, 33, 24, 0.28)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
          }}
        >
          {sprintActive
            ? pickLang(lang, '奔跑中', 'Running', 'Lari')
            : pickLang(lang, '奔跑', 'Sprint', 'Lari')}
        </button>
      )}
    </div>
  );
}
