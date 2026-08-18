import type {
  FittingInput,
  RidingStyle,
  ClipPosition,
  PedalSystem,
  Drivetrain,
  ArmInputMode,
} from '../types';
import {
  RIDING_STYLE_LABELS,
  CLIP_POSITION_LABELS,
  PEDAL_SYSTEM_LABELS,
  DRIVETRAIN_LABELS,
  HANDLEBAR_WIDTH_OPTIONS,
  HANDLEBAR_REACH_OPTIONS,
} from '../types';
import {
  User,
  Ruler,
  Footprints,
  Bike,
  Compass,
  Info,
  Zap,
} from 'lucide-react';
import { AdBanner } from './AdBanner';

interface InputFormProps {
  input: FittingInput;
  onChange: (input: FittingInput) => void;
  onReset: () => void;
  onCalculate?: () => void;
}

export function InputForm({ input, onChange, onReset, onCalculate }: InputFormProps) {
  const updateField = <K extends keyof FittingInput>(field: K, value: FittingInput[K]) => {
    onChange({ ...input, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCalculate) onCalculate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">
          <User className="text-cyan-400" size={18} />
          신체 치수 및 피팅 옵션
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors"
        >
          초기화
        </button>
      </div>

      {/* 1. 기본 신체 치수 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          1. 기본 신체 치수 (필수)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">신장 (키 cm)</label>
            <input
              type="number"
              placeholder="예: 175"
              value={input.height ?? ''}
              onChange={(e) => updateField('height', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">인심 (다리길이 cm)</label>
            <input
              type="number"
              placeholder="예: 82.5"
              value={input.inseam ?? ''}
              onChange={(e) => updateField('inseam', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. 상체 및 팔 길이 측정 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          2. 팔 길이 / 상체 정밀 측정
        </h3>
        <div>
          <label className="block text-xs text-zinc-300 mb-1">팔 길이 측정 방식</label>
          <select
            value={input.armInputMode}
            onChange={(e) => updateField('armInputMode', e.target.value as ArmInputMode)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
          >
            <option value="none">자동 추정 (신장 비율 기반)</option>
            <option value="arm">팔 길이 직접 입력 (어깨 끝 뼈 ~ 주먹 중심)</option>
            <option value="wingspan">윙스팬 (양팔 벌린 전체 길이)</option>
          </select>
        </div>

        {input.armInputMode === 'arm' && (
          <div className="space-y-1.5">
            <label className="block text-xs text-zinc-300">팔 길이 (cm)</label>
            <input
              type="number"
              placeholder="예: 65"
              value={input.armLength ?? ''}
              onChange={(e) => updateField('armLength', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
              <Info size={13} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>
                <strong>측정 기준:</strong> 어깨 맨 끝 툭 튀어나온 뼈(견봉)부터 가볍게 주먹을 쥐었을 때 핸들바를 잡게 되는 주먹 관절 중심까지의 직선거리입니다.
              </span>
            </p>
          </div>
        )}

        {input.armInputMode === 'wingspan' && (
          <div className="space-y-1.5">
            <label className="block text-xs text-zinc-300">윙스팬 (양팔 벌린 길이 cm)</label>
            <input
              type="number"
              placeholder="예: 178"
              value={input.wingspan ?? ''}
              onChange={(e) => updateField('wingspan', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            />
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
              <Info size={13} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>
                <strong>측정 기준:</strong> 벽에 곧게 서서 양팔을 수평으로 벌렸을 때 한쪽 손끝에서 반대쪽 손끝까지의 직선거리입니다.
              </span>
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-zinc-300">어깨 너비 (cm)</label>
            <span className="text-[10px] text-zinc-500">선택 (미입력 시 자동 추정)</span>
          </div>
          <input
            type="number"
            placeholder="예: 40"
            value={input.shoulderWidth ?? ''}
            onChange={(e) => updateField('shoulderWidth', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* 3. 라이딩 스타일 & 유연성 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Compass size={14} className="text-cyan-400" />
          3. 성향 및 유연성
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">라이딩 스타일</label>
            <select
              value={input.ridingStyle}
              onChange={(e) => updateField('ridingStyle', e.target.value as RidingStyle)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-all"
            >
              {Object.entries(RIDING_STYLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. 정밀 신체 측정치 (하체) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <Ruler size={14} className="text-emerald-400" />
          4. 하체 정밀 측정치 (선택)
        </h3>
        <div className="grid grid-cols-2 gap-3 items-start">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">종아리 길이 (cm)</label>
            <input
              type="number"
              placeholder="예: 40"
              value={input.calfLength ?? ''}
              onChange={(e) => updateField('calfLength', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">발 크기 (mm)</label>
            <input
              type="number"
              placeholder="예: 260"
              value={input.footSize ?? ''}
              onChange={(e) => updateField('footSize', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        {/* 💡 종아리 길이 측정 안내 가이드 박스 추가 */}
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 mt-1">
          <Info size={13} className="shrink-0 mt-0.5 text-emerald-400" />
          <span>
            <strong>종아리 측정 기준:</strong> 의자에 앉아 바닥에 맨발을 대고, <strong>바깥쪽 복사뼈 중심부터 무릎 측면 관절이 접히는 홈까지</strong>의 수직 길이를 측정합니다.
          </span>
        </p>
      </div>

      {/* 5. 클릿 및 페달/슈즈 시스템 */}
      <div className="space-y-4 pt-1">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Footprints size={14} className="text-emerald-400" />
          5. 클릿 및 페달 스택
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1">페달 & 슈즈 시스템</label>
            <select
              value={input.pedalSystem || 'spdsl'}
              onChange={(e) => updateField('pedalSystem', e.target.value as PedalSystem)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            >
              {Object.entries(PEDAL_SYSTEM_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1">클릿 위치</label>
            <select
              value={input.clipPosition}
              onChange={(e) => updateField('clipPosition', e.target.value as ClipPosition)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all"
            >
              {Object.entries(CLIP_POSITION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. 콕핏 & 구동계 하드웨어 */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bike size={14} className="text-violet-400" />
          6. 콕핏 부품 규격
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">핸들바 폭 (mm)</label>
              <select
                value={input.handlebarWidth}
                onChange={(e) => updateField('handlebarWidth', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {HANDLEBAR_WIDTH_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}mm
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-300 mb-1">핸들바 리치 (mm)</label>
              <select
                value={input.handlebarReach}
                onChange={(e) => updateField('handlebarReach', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {HANDLEBAR_REACH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">구동계 브랜드 & 단수</label>
              <select
                value={input.drivetrain}
                onChange={(e) => updateField('drivetrain', e.target.value as Drivetrain)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-all"
              >
                {Object.entries(DRIVETRAIN_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
         
          </div>
        </div>
      </div>

      <AdBanner slotId="form-bottom-ad" format="rectangle" />

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
      >
        <Zap size={18} className="fill-zinc-950" />
        피팅 결과 계산 및 리포트 생성
      </button>
    </form>
  );
}
