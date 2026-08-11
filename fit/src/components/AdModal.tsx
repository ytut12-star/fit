import { useEffect, useState } from 'react';
import { Loader2, X, Lock } from 'lucide-react';

interface AdModalProps {
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function AdModal({ open, onComplete, onCancel }: AdModalProps) {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (!open) {
      setSeconds(5);
      return;
    }
    if (seconds <= 0) {
      onComplete();
      setSeconds(5);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, seconds, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-zinc-400 hover:text-zinc-100"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">5초 보상형 광고 시청 중...</h3>
          <p className="mt-2 text-sm text-zinc-400">
            피팅 결과를 무료로 열람하기 위해 잠시만 기다려주세요.
          </p>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - seconds) / 5) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-zinc-300">
            <Lock size={12} className="mr-1 inline" />
            {seconds > 0 ? `${seconds}초 후 결과 공개` : '결과를 불러오는 중...'}
          </p>
        </div>
      </div>
    </div>
  );
}
