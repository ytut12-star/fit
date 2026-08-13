import { useEffect, useState } from 'react';
import { Loader2, X, Sparkles } from 'lucide-react';

interface AdModalProps {
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function AdModal({ open, onComplete, onCancel }: AdModalProps) {
  const LOADING_SECONDS = 3; // 가장 몰입감 있는 3초로 설정
  const [seconds, setSeconds] = useState(LOADING_SECONDS);

  useEffect(() => {
    if (!open) {
      setSeconds(LOADING_SECONDS);
      return;
    }
    if (seconds <= 0) {
      onComplete();
      setSeconds(LOADING_SECONDS);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, seconds, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Loader2 className="animate-spin" size={28} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">VeloSizing 정밀 분석 중...</h3>
          <p className="mt-2 text-sm text-zinc-400">
            입력하신 신체 치수와 지오메트리 데이터를 연산하고 있습니다.
          </p>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((LOADING_SECONDS - seconds) / LOADING_SECONDS) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-400 flex items-center gap-1">
            <Sparkles size={12} className="text-cyan-400" />
            {seconds > 0 ? `${seconds}초 후 맞춤 피팅 리포트 완성` : '결과를 불러오는 중...'}
          </p>
        </div>
      </div>
    </div>
  );
}
