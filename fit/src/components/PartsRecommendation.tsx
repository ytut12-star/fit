import { ShoppingBag, ExternalLink, Wrench } from 'lucide-react';
import type { FittingResult } from '../types';

interface PartsRecommendationProps {
  result: FittingResult;
}

export function PartsRecommendation({ result }: PartsRecommendationProps) {
  const queries = [
    { label: `스템 ${result.stemLength}mm`, q: `${result.stemLength}mm 스템 로드 자전거` },
    { label: `크랭크 ${result.crankLength}mm`, q: `${result.crankLength}mm 크랭크암 로드 자전거` },
    { label: `핸들바 ${result.handlebarWidth}mm`, q: `${result.handlebarWidth}mm 드롭 핸들바 로드` },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-6">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-cyan-400" />
        <h3 className="text-base font-bold text-zinc-100">추천 스템/핸들바/구동계 최저가 보기</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        추천 규격 — 스템 {result.stemLength}mm · 크랭크 {result.crankLength}mm · 핸들바 {result.handlebarWidth}mm (리치 {result.handlebarReach}mm) · {result.drivetrainLabel.split(' - ')[0]}
      </p>
      <div className="mt-4 space-y-3">
        {queries.map((item) => (
          <div key={item.label}>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">{item.label}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={`https://www.coupang.com/np/search?q=${encodeURIComponent(item.q)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm transition-colors hover:border-cyan-500/50 hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2 text-zinc-100">
                  <ShoppingBag size={15} className="text-cyan-400" />
                  쿠팡에서 찾기
                </span>
                <ExternalLink size={14} className="text-zinc-500 group-hover:text-cyan-400" />
              </a>
              <a
                href={`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(item.q)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm transition-colors hover:border-amber-500/50 hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2 text-zinc-100">
                  <ShoppingBag size={15} className="text-amber-400" />
                  알리익스프레스
                </span>
                <ExternalLink size={14} className="text-zinc-500 group-hover:text-amber-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        * 제휴 링크(Placeholder) — 실제 연동 시 파트너 ID가 적용됩니다.
      </p>
    </div>
  );
}
