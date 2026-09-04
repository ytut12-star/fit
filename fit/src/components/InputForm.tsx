import React, { useState } from 'react';
import type {
  FittingInput,
  RidingStyle,
  ClipPosition,
  PedalSystem,
  Drivetrain,
  ArmInputMode,
  CurrentBikeInput,
  LeverAngle,
} from '../types';
import {
  HANDLEBAR_WIDTH_OPTIONS,
} from '../types';
import { t, type Lang } from '../translations';
import {
  User, Ruler, Footprints, Bike, Compass, Info, Zap, ChevronDown, Sparkles, Wrench, CheckCircle2,
} from 'lucide-react';
import { AdBanner } from './AdBanner';

interface InputFormProps {
  input: FittingInput;
  onChange: (input: FittingInput) => void;
  onReset: () => void;
  onCalculate?: () => void;
  lang: Lang; // 💡 다국어 프롭스 추가
}

export function InputForm({
  input,
  onChange,
  onReset,
  onCalculate,
  lang,
}: InputFormProps) {
  const [showCurrentBike, setShowCurrentBike] = useState(false);

  const updateField = <K extends keyof FittingInput>(
    field: K,
    value: FittingInput[K]
  ) => {
    onChange({ ...input, [field]: value });
  };

  const handleCurrentBikeChange = (field: keyof CurrentBikeInput, val: any) => {
    const current: CurrentBikeInput = input.currentBike ?? {
      stack: null, reach: null, seatTubeAngle: 73.5, spacerHeight: null,
      stemLength: null, stemAngle: -6, drivetrain: input.drivetrain,
      handlebarWidth: input.handlebarWidth, handlebarReach: input.handlebarReach,
      leverAngle: input.leverAngle ?? 'straight', saddleHeight: null, crankLength: null,
    };
    onChange({
      ...input,
      currentBike: { ...current, [field]: val },
    });
  };

  const hasCurrentBikeData = Boolean(
    input.currentBike?.stack || input.currentBike?.reach
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCalculate) onCalculate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">
          <User className="text-cyan-400" size={18} />
          {t[lang].formTitle}
        </h2>
        <button type="button" onClick={onReset} className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors">
          {t[lang].resetBtn}
        </button>
      </div>

      {/* 1. 기본 신체 치수 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {t[lang].sec1Title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].height}</label>
            <input
              type="number" placeholder={t[lang].heightPh} value={input.height ?? ''}
              onChange={(e) => updateField('height', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].inseam}</label>
            <input
              type="number" step="0.5" placeholder={t[lang].inseamPh} value={input.inseam ?? ''}
              onChange={(e) => updateField('inseam', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. 상체 및 팔 길이 측정 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {t[lang].sec2Title}
        </h3>
        <div>
          <label className="block text-xs text-zinc-300 mb-1">{t[lang].armMode}</label>
          <select
            value={input.armInputMode}
            onChange={(e) => updateField('armInputMode', e.target.value as ArmInputMode)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
          >
            <option value="none">{t[lang].armModeAuto}</option>
            <option value="arm">{t[lang].armModeArm}</option>
            <option value="wingspan">{t[lang].armModeWingspan}</option>
          </select>
        </div>

        {input.armInputMode === 'arm' && (
          <div className="space-y-1.5">
            <label className="block text-xs text-zinc-300">{t[lang].armLength}</label>
            <input
              type="number" placeholder={t[lang].armLengthPh} value={input.armLength ?? ''}
              onChange={(e) => updateField('armLength', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 break-keep">
              <Info size={13} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>{t[lang].armInfo}</span>
            </p>
          </div>
        )}

        {input.armInputMode === 'wingspan' && (
          <div className="space-y-1.5">
            <label className="block text-xs text-zinc-300">{t[lang].wingspan}</label>
            <input
              type="number" placeholder={t[lang].wingspanPh} value={input.wingspan ?? ''}
              onChange={(e) => updateField('wingspan', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 break-keep">
              <Info size={13} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>{t[lang].wingspanInfo}</span>
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-zinc-300">{t[lang].shoulderWidth}</label>
            <span className="text-[10px] text-zinc-500">{t[lang].optionalAuto}</span>
          </div>
          <input
            type="number" placeholder={t[lang].shoulderPh} value={input.shoulderWidth ?? ''}
            onChange={(e) => updateField('shoulderWidth', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* 3. 라이딩 스타일 & 유연성 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Compass size={14} className="text-cyan-400" />
          {t[lang].sec3Title}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].ridingStyle}</label>
            <select
              value={input.ridingStyle}
              onChange={(e) => updateField('ridingStyle', e.target.value as RidingStyle)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            >
              {Object.entries(t[lang].styles).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. 정밀 신체 측정치 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <Ruler size={14} className="text-emerald-400" />
          {t[lang].sec4Title}
        </h3>
        <div className="grid grid-cols-2 gap-3 items-start">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].calfLength}</label>
            <input
              type="number" placeholder={t[lang].calfPh} value={input.calfLength ?? ''}
              onChange={(e) => updateField('calfLength', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].footSize}</label>
            <input
              type="number" placeholder={t[lang].footPh} value={input.footSize ?? ''}
              onChange={(e) => updateField('footSize', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 mt-1 break-keep">
          <Info size={13} className="shrink-0 mt-0.5 text-emerald-400" />
          <span>{t[lang].calfInfo}</span>
        </p>
      </div>

      {/* 5. 클릿 및 페달 스택 */}
      <div className="space-y-4 pt-1">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Footprints size={14} className="text-emerald-400" />
          {t[lang].sec5Title}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].pedalSystem}</label>
            <select
              value={input.pedalSystem || 'spdsl'}
              onChange={(e) => updateField('pedalSystem', e.target.value as PedalSystem)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            >
              {Object.entries(t[lang].pedals).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">{t[lang].clipPosition}</label>
            <select
              value={input.clipPosition}
              onChange={(e) => updateField('clipPosition', e.target.value as ClipPosition)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            >
              {Object.entries(t[lang].clips).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. 목표 콕핏 부품 규격 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bike size={14} className="text-violet-400" />
          {t[lang].sec6Title}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">{t[lang].barWidth}</label>
              <select
                value={input.handlebarWidth}
                onChange={(e) => updateField('handlebarWidth', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {HANDLEBAR_WIDTH_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}mm</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-300 mb-1">{t[lang].barReach}</label>
              <select
                value={input.handlebarReach}
                onChange={(e) => updateField('handlebarReach', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {Object.entries(t[lang].reaches).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">{t[lang].leverAngle}</label>
              <select
                value={input.leverAngle ?? 'straight'}
                onChange={(e) => updateField('leverAngle', e.target.value as LeverAngle)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                <option value="straight">{t[lang].leverStraight}</option>
                <option value="inward">{t[lang].leverInward}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-300 mb-1">{t[lang].drivetrain}</label>
              <select
                value={input.drivetrain}
                onChange={(e) => updateField('drivetrain', e.target.value as Drivetrain)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {Object.entries(t[lang].drivetrains).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 7. 현재 자전거 피팅 진단 */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${showCurrentBike || hasCurrentBikeData ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-950/40 via-zinc-900/80 to-zinc-900/90 shadow-xl shadow-cyan-950/40' : 'border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 hover:border-cyan-500/50'}`}>
        <button type="button" onClick={() => setShowCurrentBike(!showCurrentBike)} className="flex w-full items-center justify-between p-4 text-left transition-colors gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${showCurrentBike || hasCurrentBikeData ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30' : 'bg-zinc-800 text-cyan-400 border border-zinc-700'}`}>
              <Wrench size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-zinc-100 whitespace-nowrap">{t[lang].cbTitle}</span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">{t[lang].cbBadge}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 break-keep leading-snug">{t[lang].cbDesc}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasCurrentBikeData && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                <CheckCircle2 size={12} /> {t[lang].cbComplete}
              </span>
            )}
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-transform duration-200 ${showCurrentBike ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 rotate-180' : 'border-zinc-700 bg-zinc-800/80 text-zinc-400'}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </button>

        {showCurrentBike && (
          <div className="border-t border-cyan-500/20 p-4 space-y-4 bg-zinc-950/40">
            <div className="flex items-start gap-2 rounded-xl bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-200 border border-cyan-500/20 break-keep">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>{t[lang].cbInfo}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">{t[lang].cbSec1Title}</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300 font-medium">{t[lang].stack}</label>
                  <input
                    type="number" placeholder={t[lang].stackPh} value={input.currentBike?.stack ?? ''}
                    onChange={(e) => handleCurrentBikeChange('stack', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300 font-medium">{t[lang].reach}</label>
                  <input
                    type="number" placeholder={t[lang].reachPh} value={input.currentBike?.reach ?? ''}
                    onChange={(e) => handleCurrentBikeChange('reach', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">{t[lang].cbSec2Title}</span>
              <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs text-zinc-300">{t[lang].spacer}</label>
                    <span className="text-[10px] font-medium text-cyan-400/90">{t[lang].spacerSub}</span>
                  </div>
                  <input
                    type="number" placeholder={t[lang].spacerPh} value={input.currentBike?.spacerHeight ?? ''}
                    onChange={(e) => handleCurrentBikeChange('spacerHeight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">{t[lang].stem}</label>
                  <input
                    type="number" placeholder={t[lang].stemPh} value={input.currentBike?.stemLength ?? ''}
                    onChange={(e) => handleCurrentBikeChange('stemLength', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">{t[lang].stemAngle}</label>
                  <select
                    value={input.currentBike?.stemAngle ?? -6}
                    onChange={(e) => handleCurrentBikeChange('stemAngle', parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  >
                    {Object.entries(t[lang].stemAngles).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">{t[lang].barWidth}</label>
                  <select
                    value={input.currentBike?.handlebarWidth ?? 400}
                    onChange={(e) => handleCurrentBikeChange('handlebarWidth', parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  >
                    {HANDLEBAR_WIDTH_OPTIONS.map((w) => (
                      <option key={w} value={w}>{w}mm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">{t[lang].cbLeverAngle}</label>
                  <select
                    value={input.currentBike?.leverAngle ?? 'straight'}
                    onChange={(e) => handleCurrentBikeChange('leverAngle', e.target.value as LeverAngle)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  >
                    <option value="straight">{t[lang].leverStraight}</option>
                    <option value="inward">{t[lang].leverInward}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">{t[lang].cbSec3Title}</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300 whitespace-nowrap">{t[lang].saddleHt}</label>
                  <input
                    type="number" placeholder={t[lang].saddlePh} value={input.currentBike?.saddleHeight ?? ''}
                    onChange={(e) => handleCurrentBikeChange('saddleHeight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300 whitespace-nowrap">{t[lang].seatTube}</label>
                  <input
                    type="number" step="0.1" placeholder={t[lang].seatTubePh} value={input.currentBike?.seatTubeAngle ?? ''}
                    onChange={(e) => handleCurrentBikeChange('seatTubeAngle', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs text-zinc-300 whitespace-nowrap">{t[lang].crank}</label>
                  <input
                    type="number" step="2.5" placeholder={t[lang].crankPh} value={input.currentBike?.crankLength ?? ''}
                    onChange={(e) => handleCurrentBikeChange('crankLength', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdBanner slotId="form-bottom-ad" format="rectangle" />

      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-[0.98]">
        <Zap size={18} className="fill-zinc-950" />
        {t[lang].calcBtn}
      </button>
    </form>
  );
}
