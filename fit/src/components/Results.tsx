import type { FittingResult } from '../types';
import {
  Ruler,
  Bike,
  ArrowUpDown,
  ArrowLeftRight,
  Footprints,
  Gauge,
  Info,
  Link2,
  MoveHorizontal,
  Layers,
  ShieldAlert,
  Activity,
  Sparkles,
  Wrench,
  Sliders,
  Maximize2,
  Minimize2,
  Compass,
} from 'lucide-react';
import { Tooltip } from './ui';
import { AdBanner } from './AdBanner';

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  explanation: string;
  accent?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  chain?: string;
}

const ACCENT: Record<string, string> = {
  cyan: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/30 text-cyan-300',
  emerald:
    'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300',
  rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-300',
  sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/30 text-sky-300',
  violet:
    'from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-300',
};

function ResultCard({
  icon,
  label,
  value,
  unit,
  subtext,
  explanation,
  accent = 'cyan',
  chain,
}: ResultCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${ACCENT[accent]}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          {icon}
          {label}
        </span>
        <Tooltip text={explanation} />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
        <span className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
          {value}
        </span>
        {unit && (
          <span className="text-base font-bold text-zinc-200 sm:text-lg">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          {subtext}
        </p>
      )}
      {chain && (
        <p className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2 text-[11px] text-zinc-500">
          <Link2 size={11} className="text-cyan-500/70" />
          {chain}
        </p>
      )}
    </div>
  );
}

interface ResultsProps {
  result: FittingResult;
  ridingStyleLabel: string;
}

export function Results({ result, ridingStyleLabel }: ResultsProps) {
  const hasClipOffset = result.cleatOffset > 0;
  const hasDrivetrainAdjust = result.drivetrainHoodReach > 0;
  const pedalStackCorrection = result.pedalStackCorrection || 0;
  const diag = result.currentBikeDiagnosis;

  return (
    <div className="space-y-5">
      {/* 💡 0. [신규] 현재 보유 자전거 피팅 적합도 진단 리포트 (입력 시에만 노출) */}
      {diag && diag.hasData && (
        <div
          className={`rounded-2xl border p-5 backdrop-blur-md transition-all shadow-lg ${
            diag.status === 'optimal'
              ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 shadow-emerald-950/20'
              : diag.status === 'tunable'
              ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-cyan-900/10 shadow-cyan-950/20'
              : 'border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-amber-900/10 shadow-amber-950/20'
          }`}
        >
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  diag.status === 'optimal'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : diag.status === 'tunable'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Wrench size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  현재 자전거 피팅 적합도 진단
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {diag.summary}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                diag.status === 'optimal'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : diag.status === 'tunable'
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              {diag.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Sliders size={13} className="text-cyan-400" /> 스택 & 스페이서
                처방
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.spacerAdvice}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Maximize2 size={13} className="text-cyan-400" /> 리치 & 스템
                교체 처방
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.stemAdvice}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Minimize2 size={13} className="text-cyan-400" /> 안장 높이 처방
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.saddleAdvice ||
                  `현재 안장높이 미입력 (추천값: ${result.saddleHeight}mm)`}
              </p>
            </div>

            {/* 💡 [신규] 싯튜브 각도 기반 싯포스트 & 레일 처방 */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Compass size={13} className="text-cyan-400" /> 싯튜브각 & 셋백
                처방
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.seatpostAdvice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. 신체 비율 정밀 진단 리포트 카드 */}
      {(result.legTypeLabel || result.armTypeLabel) && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-900/40 p-5 backdrop-blur-md shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300">
              <Activity size={18} className="text-cyan-400" />
              신체 골격 비율 진단 리포트
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
              <Sparkles size={12} />
              Anchor 정밀 분석
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">
                하체 / 상체 비율 분석
              </span>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {result.legTypeLabel || '표준 비율 체형'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">팔 길이 비율 분석</span>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {result.armTypeLabel || '표준 팔 길이'}
              </p>
            </div>
          </div>

          {result.bodyTypeSummary && (
            <p className="mt-3.5 text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
              💡 <strong className="text-cyan-300">피팅 설계 반영:</strong>{' '}
              {result.bodyTypeSummary}
            </p>
          )}
        </div>
      )}

      {/* 2. 프레임 처방 알림 바 */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          result.isUpsizedFrame
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
        }`}
      >
        {result.isUpsizedFrame ? (
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-400" />
        ) : (
          <Info size={20} className="mt-0.5 shrink-0 text-cyan-400" />
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-zinc-100">
            <span>적용 스타일: {ridingStyleLabel}</span>
            {result.isUpsizedFrame && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                상위 체급 스택 주의
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {result.frameSizeAdvice}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 1번 최상단: 자전거 추천 프레임 사이즈 */}
        <ResultCard
          icon={<Bike size={16} />}
          label="자전거 추천 프레임 사이즈"
          value={result.recommendedFrameSize}
          unit=""
          subtext={`추천 Frame Stack: ${result.stack}mm / Reach: ${result.reach}mm`}
          accent={result.isUpsizedFrame ? 'amber' : 'cyan'}
          explanation={`신체 체급 앵커 Base Stack(${result.baseStack}mm)과 Base Reach(${result.baseReach}mm)를 최우선으로 매칭한 권장 프레임 체급입니다.`}
          chain="체급 앵커(Base Geometry) 중심 매칭 완료"
        />

        {/* 클릿 오프셋 */}
        <ResultCard
          icon={<Footprints size={16} />}
          label="클릿 오프셋 (C)"
          value={hasClipOffset ? `${result.cleatOffset}mm` : '0mm'}
          unit=""
          subtext={result.clipGuideShort}
          accent="emerald"
          explanation={result.clipGuide}
          chain={
            result.footSize ? `발 크기 ${result.footSize}mm 반영` : undefined
          }
        />

        {/* 1단계 · 추천 안장 높이 */}
        <ResultCard
          icon={<Ruler size={16} />}
          label="1단계 · 추천 안장 높이"
          value={`${result.saddleHeight}`}
          unit="mm (BB~안장)"
          accent="cyan"
          explanation={`페달/클릿/슈즈 스택과 무릎 관절 각도를 반영한 추천 안장 높이입니다. 기본 ${
            result.saddleHeightBase
          }mm / 클릿 보정 ${result.saddleClipCorrection}mm / 페달스택 보정 ${
            pedalStackCorrection > 0 ? '+' : ''
          }${pedalStackCorrection}mm.`}
          chain={
            pedalStackCorrection !== 0
              ? `페달/슈즈 스택 보정 ${
                  pedalStackCorrection > 0 ? '+' : ''
                }${pedalStackCorrection}mm 반영`
              : '표준 로드 클릿 스택 적용'
          }
        />

        {/* 2단계 · 안장 앞뒤 위치 (BRP 글로벌 표준) */}
        <ResultCard
          icon={<MoveHorizontal size={16} />}
          label="2단계 · 안장 앞뒤 위치 (BRP 기준)"
          value={`${result.brpSetback}`}
          unit="mm (BRP~BB)"
          subtext={`BRP(안장 폭 75mm 지점)~BB 수직거리`}
          accent="rose"
          explanation={`💡 BRP(Biomechanical Reference Point)는 안장 폭이 75mm가 되는 지점으로, 브랜드/안장 형태와 상관없이 좌골이 실제 위치하는 글로벌 기준점입니다. ${result.setbackAdvice}`}
          chain={
            hasClipOffset
              ? `클릿 오프셋 ${result.cleatOffset}mm 반영`
              : '기본 KOPS 정석 위치'
          }
        />

        {/* 3단계 · 스티어러 스페이서 */}
        <ResultCard
          icon={<Layers size={16} />}
          label="3단계 · 스티어러 스페이서 (Spacer)"
          value={`${result.spacerHeight}`}
          unit="mm"
          subtext={`핸들바 실질 Stack: ${result.effectiveStack}mm`}
          accent={result.isUpsizedFrame ? 'emerald' : 'amber'}
          explanation={`선택하신 라이딩 스타일에 최적화된 실제 스페이서 장착 높이입니다.`}
          chain={
            result.spacerHeight > 0
              ? `스페이서 ${result.spacerHeight}mm 적재`
              : '스티어러 풀 컷팅 (Slammed Stem / 0mm)'
          }
        />

        {/* 4단계 · 추천 스템 길이 */}
        <ResultCard
          icon={<Bike size={16} />}
          label="4단계 · 추천 스템 길이"
          value={`${result.stemLength}`}
          unit="mm"
          subtext={result.stemAdvice}
          accent="sky"
          explanation={result.stemAdvice}
          chain="각도 수평 투영 기하학 정밀 반영"
        />

        {/* 콕핏 실측 세트 1: 총 유효 스택 */}
        <ResultCard
          icon={<ArrowUpDown size={16} />}
          label="총 유효 스택 (Effective Stack)"
          value={`${result.effectiveStack}`}
          unit="mm"
          subtext={`프레임 Stack (${result.stack}mm) + 스페이서 (${result.spacerHeight}mm)`}
          accent="amber"
          explanation="순수 프레임 Stack에 적재된 스페이서 높이가 가산된, 지면 기준 실질 핸들바 높이입니다."
          chain={
            result.spacerHeight > 0
              ? `스페이서 +${result.spacerHeight}mm 적재 반영`
              : '스티어러 풀 컷팅 (0mm)'
          }
        />

        {/* 콕핏 실측 세트 2: 총 유효 리치 */}
        <ResultCard
          icon={<ArrowLeftRight size={16} />}
          label="총 유효 리치 (Cockpit Reach)"
          value={`${result.effectiveReach}`}
          unit="mm"
          subtext="프레임 Reach + 스페이서 보정 + 스템 + 핸들바 + Setback"
          accent="cyan"
          explanation="안장 후퇴, 프레임 규격, 스페이서, 스템, 핸들바, 구동계 후드가 모두 유기적으로 통합 반영된 상체-후드간 실측 유효 거리입니다."
          chain={
            hasDrivetrainAdjust ? `구동계 후드 리치 편차 반영 포함` : undefined
          }
        />

        {/* 크랭크 암 길이 */}
        <ResultCard
          icon={<Gauge size={16} />}
          label="크랭크 암 길이"
          value={String(result.crankLength)}
          unit="mm"
          subtext="인심 전용 숏 크랭크 규격 적용"
          accent="emerald"
          explanation="신체 인심 규격에 전용으로 매핑된 추천 크랭크 암 길이입니다. 고관절 찝힘을 예방하고 케이던스 유지에 탁월합니다."
        />
      </div>

      {/* 결과창 하단 가로형 주요 광고 영역 */}
      <AdBanner slotId="result-bottom-ad" format="horizontal" />
    </div>
  );
}
