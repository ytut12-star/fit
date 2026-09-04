import type { FittingResult } from '../types';
import { t, type Lang } from '../translations';
import {
  Ruler, Bike, ArrowUpDown, ArrowLeftRight, Footprints, Gauge, Info, Link2, MoveHorizontal, Layers, ShieldAlert, Activity, Sparkles, Wrench, Sliders, Maximize2, Minimize2, Compass, AlertTriangle,
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
  emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300',
  rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-300',
  sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/30 text-sky-300',
  violet: 'from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-300',
};

function ResultCard({ icon, label, value, unit, subtext, explanation, accent = 'cyan', chain }: ResultCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${ACCENT[accent]}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          {icon} {label}
        </span>
        <Tooltip text={explanation} />
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
        <span className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">{value}</span>
        {unit && <span className="text-base font-bold text-zinc-200 sm:text-lg">{unit}</span>}
      </div>
      {subtext && <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{subtext}</p>}
      {chain && (
        <p className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2 text-[11px] text-zinc-500">
          <Link2 size={11} className="text-cyan-500/70" /> {chain}
        </p>
      )}
    </div>
  );
}

interface ResultsProps {
  result: FittingResult;
  ridingStyleLabel: string;
  lang: Lang; // 💡 언어 프롭스 추가
}

export function Results({ result, ridingStyleLabel, lang }: ResultsProps) {
  const hasClipOffset = result.cleatOffset > 0;
  const pedalStackCorrection = result.pedalStackCorrection || 0;
  const diag = result.currentBikeDiagnosis;

  return (
    <div className="space-y-5">
      {result.cockpitTuningAdvice && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-rose-900/10 p-5 shadow-lg shadow-rose-950/20 backdrop-blur-md">
          <AlertTriangle size={24} className="shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong className="block text-sm font-bold text-rose-300 mb-1.5">
              {t[lang].rAlertTitle}
            </strong>
            <p className="text-xs leading-relaxed text-zinc-300 break-keep">
              {result.cockpitTuningAdvice}
            </p>
          </div>
        </div>
      )}

      {diag && diag.hasData && (
        <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all shadow-lg ${diag.status === 'optimal' ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 shadow-emerald-950/20' : diag.status === 'tunable' ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-cyan-900/10 shadow-cyan-950/20' : 'border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-amber-900/10 shadow-amber-950/20'}`}>
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${diag.status === 'optimal' ? 'bg-emerald-500/20 text-emerald-400' : diag.status === 'tunable' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <Wrench size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">{t[lang].rDiagTitle}</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">{diag.summary}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${diag.status === 'optimal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : diag.status === 'tunable' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
              {diag.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5"><Sliders size={13} className="text-cyan-400" /> {t[lang].rDiagSpacer}</span>
              <p className="text-xs leading-relaxed text-zinc-200">{diag.spacerAdvice}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5"><Maximize2 size={13} className="text-cyan-400" /> {t[lang].rDiagStem}</span>
              <p className="text-xs leading-relaxed text-zinc-200">{diag.stemAdvice}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5"><Minimize2 size={13} className="text-cyan-400" /> {t[lang].rDiagSaddle}</span>
              <p className="text-xs leading-relaxed text-zinc-200">{diag.saddleAdvice || t[lang].rDiagSaddleMiss(result.saddleHeight)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5"><Compass size={13} className="text-cyan-400" /> {t[lang].rDiagSeatpost}</span>
              <p className="text-xs leading-relaxed text-zinc-200">{diag.seatpostAdvice}</p>
            </div>
          </div>

          {diag.crankAdvice && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200 break-keep">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-amber-500 mb-0.5">{t[lang].rDiagCrank}</strong>
                {diag.crankAdvice}
              </div>
            </div>
          )}
        </div>
      )}

      {(result.legTypeLabel || result.armTypeLabel) && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-900/40 p-5 backdrop-blur-md shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300">
              <Activity size={18} className="text-cyan-400" /> {t[lang].rRatioTitle}
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
              <Sparkles size={12} /> {t[lang].rRatioBadge}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">{t[lang].rRatioLeg}</span>
              <p className="mt-1 text-sm font-bold text-zinc-100">{result.legTypeLabel || t[lang].rRatioDefLeg}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
              <span className="text-xs text-zinc-400">{t[lang].rRatioArm}</span>
              <p className="mt-1 text-sm font-bold text-zinc-100">{result.armTypeLabel || t[lang].rRatioDefArm}</p>
            </div>
          </div>
          {result.bodyTypeSummary && (
            <p className="mt-3.5 text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
              {t[lang].rAlgoNotice} <strong className="text-cyan-300"></strong> {result.bodyTypeSummary}
            </p>
          )}
        </div>
      )}

      <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${result.isUpsizedFrame ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'}`}>
        {result.isUpsizedFrame ? <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-400" /> : <Info size={20} className="mt-0.5 shrink-0 text-cyan-400" />}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-zinc-100">
            <span>{t[lang].rTargetStyle}: {ridingStyleLabel}</span>
            {result.isUpsizedFrame && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                {t[lang].rFrameLimit}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">{result.frameSizeAdvice}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard
          icon={<Bike size={16} />} label={t[lang].rRecFrame} value={result.recommendedFrameSize} unit=""
          subtext={t[lang].rRecFrameSub(result.stack, result.reach)}
          accent={result.isUpsizedFrame ? 'amber' : 'cyan'}
          explanation={t[lang].rRecFrameExp(result.baseStack, result.baseReach)}
          chain={result.targetGeometryAdvice}
        />
        <ResultCard
          icon={<Footprints size={16} />} label={t[lang].rCleatTitle}
          value={hasClipOffset ? `${result.cleatOffset}mm` : '0mm'} unit=""
          subtext={result.clipGuideShort} accent="emerald" explanation={result.clipGuide}
          chain={result.footSize ? t[lang].rCleatChain(result.footSize) : undefined}
        />
        <ResultCard
          icon={<Ruler size={16} />} label={t[lang].rSaddleTitle} value={`${result.saddleHeight}`} unit={t[lang].rSaddleUnit} accent="cyan"
          explanation={t[lang].rSaddleExp(result.saddleHeightBase, result.saddleClipCorrection, `${pedalStackCorrection > 0 ? '+' : ''}${pedalStackCorrection}`)}
          chain={pedalStackCorrection !== 0 ? t[lang].rSaddleChain1(`${pedalStackCorrection > 0 ? '+' : ''}${pedalStackCorrection}`) : t[lang].rSaddleChain2}
        />
        <ResultCard
          icon={<MoveHorizontal size={16} />} label={t[lang].rSetbackTitle} value={`${result.brpSetback}`} unit={t[lang].rSetbackUnit} subtext={t[lang].rSetbackSub} accent="rose"
          explanation={t[lang].rSetbackExp(result.setbackAdvice)}
          chain={hasClipOffset ? t[lang].rSetbackChain1(result.cleatOffset) : t[lang].rSetbackChain2}
        />
        <ResultCard
          icon={<Layers size={16} />} label={t[lang].rSpacerTitle} value={`${result.spacerHeight}`} unit="mm"
          subtext={result.spacerHeight === 0 ? t[lang].rSpacerSub1(result.topCapHeight) : t[lang].rSpacerSub2(result.topCapHeight, result.spacerHeight)}
          accent={result.isUpsizedFrame ? 'emerald' : 'amber'} explanation={t[lang].rSpacerExp(result.topCapHeight)}
          chain={result.spacerHeight > 0 ? t[lang].rSpacerChain1(result.spacerHeight, result.topCapHeight + result.spacerHeight) : t[lang].rSpacerChain2(result.topCapHeight)}
        />
        <ResultCard
          icon={<Bike size={16} />} label={t[lang].rStemTitle} value={`${result.stemLength}`} unit="mm"
          subtext={result.stemAdvice} accent="sky" explanation={result.stemAdvice} chain={t[lang].rStemChain}
        />
        <ResultCard
          icon={<ArrowUpDown size={16} />} label={t[lang].rEffStackTitle} value={`${result.effectiveStack}`} unit="mm"
          subtext={t[lang].rEffStackSub(result.stack, result.topCapHeight, result.spacerHeight)} accent="amber" explanation={t[lang].rEffStackExp} chain={t[lang].rEffStackChain(result.topCapHeight)}
        />
        <ResultCard
          icon={<ArrowLeftRight size={16} />} label={t[lang].rEffReachTitle} value={`${result.effectiveReach}`} unit="mm"
          subtext={result.cockpitReachBonus !== 0 ? t[lang].rEffReachSub1(result.handlebarWidth, `${result.cockpitReachBonus > 0 ? '+' : ''}${result.cockpitReachBonus}`) : t[lang].rEffReachSub2}
          accent="cyan" explanation={t[lang].rEffReachExp}
          chain={result.cockpitReachBonus !== 0 ? t[lang].rEffReachChain1(result.handlebarWidth, `${result.cockpitReachBonus > 0 ? '+' : ''}${result.cockpitReachBonus}`) : t[lang].rEffReachChain2}
        />
        <ResultCard
          icon={<Gauge size={16} />} label={t[lang].rCrankTitle} value={String(result.crankLength)} unit="mm" subtext={t[lang].rCrankSub} accent="emerald" explanation={t[lang].rCrankExp}
        />
      </div>
      <AdBanner slotId="result-bottom-ad" format="horizontal" />
    </div>
  );
}
