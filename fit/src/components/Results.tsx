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
  AlertTriangle,
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
  const pedalStackCorrection = result.pedalStackCorrection || 0;
  const diag = result.currentBikeDiagnosis;

  return (
    <div className="space-y-5">
      {/* 💡 콕핏 부품 튜닝 우선 권고 배너 */}
      {result.cockpitTuningAdvice && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-rose-900/10 p-5 shadow-lg shadow-rose-950/20 backdrop-blur-md">
          <AlertTriangle size={24} className="shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong className="block text-sm font-bold text-rose-300 mb-1.5">
              ⚠️ 콕핏 규격 조정 권고 (프레임 사이즈 확정 전 필수 검토)
            </strong>
            <p className="text-xs leading-relaxed text-zinc-300 break-keep">
              {result.cockpitTuningAdvice}
            </p>
          </div>
        </div>
      )}

      {/* 0. 현재 보유 자전거 피팅 적합도 진단 리포트 */}
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
                  현재 보유 자전거 피팅 적합도 진단
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
                <Sliders size={13} className="text-cyan-400" /> 스택 및 스페이서
                보정
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.spacerAdvice}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Maximize2 size={13} className="text-cyan-400" /> 리치 및 스템
                규격 보정
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.stemAdvice}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Minimize2 size={13} className="text-cyan-400" /> 타겟 안장 높이
                검증
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.saddleAdvice ||
                  `현재 안장 높이 데이터 누락 (산출된 목표값: ${result.saddleHeight}mm)`}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Compass size={13} className="text-cyan-400" /> 싯튜브 각도 및
                셋백 분석
              </span>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diag.seatpostAdvice}
              </p>
            </div>
          </div>

          {/* 크랭크 길이 임시 보정 알림 배너 */}
          {diag.crankAdvice && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200 break-keep">
              <AlertTriangle
                size={18}
                className="shrink-0 mt-0.5 text-amber-400"
              />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-amber-500 mb-0.5">
                  비권장 규격 크랭크 사용 시 임시 피팅 가이드
                </strong>
                {diag.crankAdvice}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. 신체 비율 정밀 진단 리포트 카드 */}
      {(result.legTypeLabel || result.armTypeLabel) && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-900/40 p-5 backdrop-blur-md shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300">
              <Activity size={18} className="text-cyan-400" />
              신체 비율 정밀 분석
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
              <Sparkles size={12} />
              실측 데이터 기반 산출
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">하체/상체 비율 진단</span>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {result.legTypeLabel || '표준 비율 체형'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">팔 길이 비율 진단</span>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {result.armTypeLabel || '표준 팔 길이'}
              </p>
            </div>
          </div>

          {result.bodyTypeSummary && (
            <p className="mt-3.5 text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
              💡 <strong className="text-cyan-300">알고리즘 반영 사항:</strong>{' '}
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
            <span>타겟 라이딩 성향: {ridingStyleLabel}</span>
            {result.isUpsizedFrame && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                프레임 스택 한계 주의
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
          label="권장 프레임 사이즈"
          value={result.recommendedFrameSize}
          unit=""
          subtext={`프레임 데이터 (Stack: ${result.stack}mm / Reach: ${result.reach}mm)`}
          accent={result.isUpsizedFrame ? 'amber' : 'cyan'}
          explanation={`사용자의 신체 데이터를 바탕으로 산출된 기준 스택(${result.baseStack}mm) 및 리치(${result.baseReach}mm)에 가장 부합하는 프레임 사이즈입니다.`}
          chain={result.targetGeometryAdvice} // 💡 동적으로 타막/디파이 기준 텍스트 출력
        />

        {/* 클릿 오프셋 */}
        <ResultCard
          icon={<Footprints size={16} />}
          label="클릿 오프셋 보정 (C)"
          value={hasClipOffset ? `${result.cleatOffset}mm` : '0mm'}
          unit=""
          subtext={result.clipGuideShort}
          accent="emerald"
          explanation={result.clipGuide}
          chain={
            result.footSize
              ? `슈즈 사이즈 ${result.footSize}mm 기준 보정치 반영`
              : undefined
          }
        />

        {/* 1단계 · 추천 안장 높이 */}
        <ResultCard
          icon={<Ruler size={16} />}
          label="1단계 · 타겟 안장 높이"
          value={`${result.saddleHeight}`}
          unit="mm (BB~안장 상단)"
          accent="cyan"
          explanation={`페달, 클릿, 슈즈의 스택 및 적정 슬관절 굴곡 각도를 종합적으로 반영한 목표 안장 높이입니다. (기준 수치 ${
            result.saddleHeightBase
          }mm / 클릿 위치 보정 ${
            result.saddleClipCorrection
          }mm / 하드웨어 스택 보정 ${
            pedalStackCorrection > 0 ? '+' : ''
          }${pedalStackCorrection}mm)`}
          chain={
            pedalStackCorrection !== 0
              ? `페달/슈즈 시스템 스택 보정 ${
                  pedalStackCorrection > 0 ? '+' : ''
                }${pedalStackCorrection}mm 반영`
              : '표준 로드 페달 시스템 스택 적용'
          }
        />

        {/* 2단계 · 안장 앞뒤 위치 (BRP 글로벌 표준) */}
        <ResultCard
          icon={<MoveHorizontal size={16} />}
          label="2단계 · 안장 셋백 (BRP 기준)"
          value={`${result.brpSetback}`}
          unit="mm (BRP~BB)"
          subtext={`BRP(안장 폭 75mm 지점)부터 BB축까지의 수직 거리`}
          accent="rose"
          explanation={`💡 BRP(Biomechanical Reference Point, 안장 폭 75mm 지점)는 제조사 및 안장 형태와 무관하게 좌골 결절이 안착하는 실질적 생체 역학 기준점입니다. ${result.setbackAdvice}`}
          chain={
            hasClipOffset
              ? `클릿 오프셋 보정치 ${result.cleatOffset}mm 반영`
              : '표준 KOPS(Knee Over Pedal Spindle) 기준 적용'
          }
        />

        {/* 3단계 · 스티어러 스페이서 (기본 탑캡 구분 명시) */}
        <ResultCard
          icon={<Layers size={16} />}
          label="3단계 · 필요 스페이서 스택 (Spacer)"
          value={`${result.spacerHeight}`}
          unit="mm"
          subtext={
            result.spacerHeight === 0
              ? `기본 탑캡(${result.topCapHeight}mm) 단일 장착 (추가 링 0mm)`
              : `기본 탑캡(${result.topCapHeight}mm) + 추가 스페이서 ${result.spacerHeight}mm`
          }
          accent={result.isUpsizedFrame ? 'emerald' : 'amber'}
          explanation={`조향부 필수 부품인 헤드셋 베어링 커버(기본 탑캡 ${result.topCapHeight}mm) 상단에 추가로 요구되는 스페이서 링의 두께입니다.`}
          chain={
            result.spacerHeight > 0
              ? `추가 스페이서 +${
                  result.spacerHeight
                }mm 요구 (콕핏 하단 스택 총합 +${
                  result.topCapHeight + result.spacerHeight
                }mm)`
              : `스티어러 풀 컷팅 권장 (기본 탑캡 ${result.topCapHeight}mm만 적용)`
          }
        />

        {/* 4단계 · 추천 스템 길이 */}
        <ResultCard
          icon={<Bike size={16} />}
          label="4단계 · 권장 스템 규격"
          value={`${result.stemLength}`}
          unit="mm"
          subtext={result.stemAdvice}
          accent="sky"
          explanation={result.stemAdvice}
          chain="조향부 기울기(Steerer Angle) 및 스템 각도 궤적 반영"
        />

        {/* 콕핏 실측 세트 1: 총 유효 스택 */}
        <ResultCard
          icon={<ArrowUpDown size={16} />}
          label="유효 스택 (Effective Stack)"
          value={`${result.effectiveStack}`}
          unit="mm"
          subtext={`프레임(${result.stack}) + 탑캡(${result.topCapHeight}) + 추가 스페이서(${result.spacerHeight})`}
          accent="amber"
          explanation="프레임 스택에 기본 탑캡(10mm) 및 추가 스페이서 스택을 합산한 최종 콕핏 수직 높이(지면 대비 상대값)입니다."
          chain={`기본 탑캡(${result.topCapHeight}mm) 및 스페이서 두께 완벽 합산`}
        />

        {/* 콕핏 실측 세트 2: 총 유효 리치 */}
        <ResultCard
          icon={<ArrowLeftRight size={16} />}
          label="유효 리치 (Effective Cockpit Reach)"
          value={`${result.effectiveReach}`}
          unit="mm"
          subtext={
            result.cockpitReachBonus !== 0
              ? `핸들바 규격(${result.handlebarWidth}mm) 및 레버 체결각 (${
                  result.cockpitReachBonus > 0 ? '+' : ''
                }${result.cockpitReachBonus}mm) 보정 반영`
              : '프레임 Reach + 콕핏 규격 + 안장 셋백 편차 종합'
          }
          accent="cyan"
          explanation="안장 셋백, 프레임 리치, 조향부(스페이서 높이 보상치, 스템, 핸들바 리치) 및 구동계 레버 규격이 모두 반영된 라이더 상체의 최종 수평 도달 거리입니다."
          chain={
            result.cockpitReachBonus !== 0
              ? `핸들바 폭(${result.handlebarWidth}mm) 및 레버 각도 보정치 ${
                  result.cockpitReachBonus > 0 ? '+' : ''
                }${result.cockpitReachBonus}mm 합산`
              : '핸들바 및 구동계 레버 표준 포지션 적용'
          }
        />

        {/* 크랭크 암 길이 */}
        <ResultCard
          icon={<Gauge size={16} />}
          label="권장 크랭크 암 규격"
          value={String(result.crankLength)}
          unit="mm"
          subtext="인심 기준 생체 역학적 최적화 규격 산출"
          accent="emerald"
          explanation="하체(인심) 길이를 기준으로 고관절 가동 범위와 페달링 효율을 극대화할 수 있는 권장 크랭크 암 규격입니다."
        />
      </div>

      <AdBanner slotId="result-bottom-ad" format="horizontal" />
    </div>
  );
}
