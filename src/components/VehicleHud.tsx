import { pickLang, t } from '../game/i18n';
import { GAS_STATION_POS } from '../game/systems/progression';
import { getSpeedKmh } from '../game/vehicle/motorcyclePhysics';
import type { ActiveVehicleHud, LanguageCode } from '../game/types';

interface VehicleHudProps {
  activeVehicle: ActiveVehicleHud;
  lang: LanguageCode;
  onHorn: () => void;
  onDismount: () => void;
  onRefuel: () => void;
  onRepair: () => void;
}

export function VehicleHud({
  activeVehicle,
  lang,
  onHorn,
  onDismount,
  onRefuel,
  onRepair,
}: VehicleHudProps) {
  if (!activeVehicle.mounted) return null;

  const kmh = getSpeedKmh(activeVehicle.speed);
  const isTrishaw = activeVehicle.kind === 'trishaw';
  const nearGas =
    !isTrishaw &&
    Math.hypot(activeVehicle.x - GAS_STATION_POS.x, activeVehicle.z - GAS_STATION_POS.z) < 6.5;

  const vehicleName =
    activeVehicle.kind === 'car'
      ? pickLang(lang, '轿车', 'Sedan', 'Kereta')
      : activeVehicle.kind === 'trishaw'
      ? pickLang(lang, '三轮车', 'Trishaw', 'Beca')
      : pickLang(lang, '摩托', 'Scooter', 'Skuter');

  const rpmPct = isTrishaw
    ? Math.min(100, Math.max(10, (kmh / 18) * 100))
    : Math.min(100, Math.max(12, ((activeVehicle.rpm - 800) / 6000) * 100));

  return (
    <div
      data-testid="vehicle-hud"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto rounded-2xl px-4 py-2.5 text-[#2b2118] flex flex-wrap items-center justify-center gap-3 sm:gap-4"
      style={{
        background: 'rgba(250, 243, 230, 0.94)',
        border: '1px solid rgba(43, 33, 24, 0.2)',
        boxShadow: '0 10px 28px rgba(24, 18, 12, 0.22)',
      }}
    >
      <div className="flex items-center gap-2 pr-2 border-r border-[#2b2118]/15">
        <div className="text-center">
          <div className="font-mono-num text-2xl font-bold leading-none text-[#c8553d]">
            {kmh}
          </div>
          <div className="text-[10px] font-medium text-[#6f5744]">{t(lang, 'speedUnit')}</div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="px-2 py-0.5 rounded bg-[#2b2118] text-[#faf3e6] font-mono-num text-xs font-bold">
            {activeVehicle.gear}
          </span>
          <span className="text-[10px] font-semibold text-[#6f5744]">{vehicleName}</span>
        </div>
      </div>

      <div className="w-28 space-y-1">
        <div className="flex justify-between text-[10px] font-medium">
          <span>{isTrishaw ? pickLang(lang, '踏频', 'Cadence', 'Kayuhan') : t(lang, 'rpm')}</span>
          <span className="font-mono-num">
            {isTrishaw ? `${Math.round(activeVehicle.rpm)}` : `${Math.round(activeVehicle.rpm)}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#2b2118]/15 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${rpmPct}%`,
              background: rpmPct > 82 ? '#c84338' : '#4b7f78',
            }}
          />
        </div>

        {!isTrishaw && (
          <>
            <div className="flex justify-between text-[10px] font-medium">
              <span>{t(lang, 'fuel')}</span>
              <span className="font-mono-num">{Math.round(activeVehicle.fuel)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#2b2118]/15 overflow-hidden">
              <div
                className="h-full bg-[#d98c2b]"
                style={{ width: `${Math.max(0, Math.min(100, activeVehicle.fuel))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-medium">
              <span>{t(lang, 'condition')}</span>
              <span className="font-mono-num">{Math.round(activeVehicle.condition)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#2b2118]/15 overflow-hidden">
              <div
                className="h-full bg-[#4b7f78]"
                style={{ width: `${Math.max(0, Math.min(100, activeVehicle.condition))}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onHorn}
          className="px-2.5 py-1.5 rounded-lg bg-[#e9dcc6] hover:bg-[#dfd0b6] text-xs font-semibold cursor-pointer"
        >
          {isTrishaw ? `${t(lang, 'bell')} (H)` : `${t(lang, 'horn')} (H)`}
        </button>
        <button
          type="button"
          onClick={onDismount}
          className="px-2.5 py-1.5 rounded-lg bg-[#c86a4e] hover:bg-[#b55a3f] text-[#faf3e6] text-xs font-semibold cursor-pointer"
        >
          {t(lang, 'dismountBike')} (F)
        </button>
        {nearGas && (
          <>
            <button
              type="button"
              onClick={onRefuel}
              className="px-2.5 py-1.5 rounded-lg bg-[#4b7f78] hover:bg-[#3d6b65] text-[#faf3e6] text-xs font-semibold cursor-pointer"
            >
              {t(lang, 'refuel')}
            </button>
            <button
              type="button"
              onClick={onRepair}
              className="px-2.5 py-1.5 rounded-lg bg-[#6f5744] hover:bg-[#594434] text-[#faf3e6] text-xs font-semibold cursor-pointer"
            >
              {t(lang, 'repairBike')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
