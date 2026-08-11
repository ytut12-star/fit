import { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'auto';
  className?: string;
}

export function AdBanner({ slotId, format = 'auto', className = '' }: AdBannerProps) {
  useEffect(() => {
    // Google AdSense 등의 광고 스크립트 실행 트리거 (필요시 활성화)
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // console.error(e);
    }
  }, []);

  return (
    <div className={`my-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-center ${className}`}>
      {/* 💡 실서비스 적용 시 아래 영역에 구글 AdSense / 카카오 AdFit <ins> 태그를 넣으시면 됩니다. */}
      <div className="flex w-full min-h-[90px] flex-col items-center justify-center rounded-xl bg-zinc-950/80 border border-zinc-800/60 p-3 text-xs text-zinc-500">
        <span className="mb-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
          SPONSORED AD
        </span>
        <p className="text-zinc-400 text-xs">광고 영역 ({format === 'horizontal' ? '728x90 디스플레이' : '반응형 스폰서 스팟'})</p>
        <span className="mt-1 text-[10px] text-zinc-600">애드센스 / 애드핏 스크립트 연동 지점 [Slot: {slotId || 'default'}]</span>
      </div>
    </div>
  );
}