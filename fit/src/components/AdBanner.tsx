import { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'auto';
  className?: string;
}

export function AdBanner({ className = '' }: AdBannerProps) {
  // 초기 오픈용 임시 브랜드 배너 (광고 비활성화 대체)
  return (
    <div className={`my-3 rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-3 text-center ${className}`}>
      <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
        🚲 <span className="text-zinc-400 font-semibold">VeloSizing</span> • Ride Smarter, Fit Better
      </p>
    </div>
  );
}
