import { useState } from 'react';
import type { FittingInput, FittingResult } from './types';
import { RIDING_STYLE_LABELS } from './types';
import { calculateFitting } from './fittingCalculator';
import { InputForm } from './components/InputForm';
import { Results } from './components/Results';
import { PedalingSimulator } from './components/PedalingSimulator';
import { Loader2, Sparkles, Bike } from 'lucide-react';

// 초기 기본 입력값 (수정된 types.ts의 구동계 키값 반영)
const INITIAL_INPUT: FittingInput = {
  height: null,
  inseam: null,
  ridingStyle: 'performance',
  armInputMode: 'none',
  armLength: null,
  wingspan: null,
  shoulderWidth: null,
  calfLength: null,
  footSize: null,
  clipPosition: 'standard',
  pedalSystem: 'spdsl',
  handlebarWidth: 400,
  handlebarReach: 75,
  drivetrain: 'shimano_12s_di2', // 💡 types.ts 규격에 맞춰 수정
};

export function App() {
  const [input, setInput] = useState<FittingInput>(INITIAL_INPUT);
  const [result, setResult] = useState<FittingResult | null>(null);
  const [submittedInput, setSubmittedInput] = useState<FittingInput | null>(null); 
  // 💡 광고 및 연산 딜레이 오버레이 상태
  const [isAdLoading, setIsAdLoading] = useState<boolean>(false);

  // [피팅 결과 계산 및 리포트 생성] 버튼 클릭 시 동작
  const handleCalculate = () => {
    setIsAdLoading(true);

    // 💡 1초(1000ms) 테스트 광고 노출 후 연산 및 결과 업데이트
    setTimeout(() => {
      const calculated = calculateFitting(input);
      setResult(calculated);
      setSubmittedInput(input);
      setIsAdLoading(false);
    }, 1000);
  };

  // 초기화 버튼
  const handleReset = () => {
    setInput(INITIAL_INPUT);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500 selection:text-zinc-950">
      {/* 💡 1초 전면 광고 오버레이 모달 */}
      {isAdLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            </div>
            
            <h3 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-1.5">
              <Sparkles size={16} className="text-cyan-400" />
              맞춤 정밀 피팅 분석 중...
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              1초 후 최적화된 피팅 리포트와 2D 시뮬레이터가 생성됩니다.
            </p>

            {/* 💡 전면 스폰서 광고 테스트 박스 */}
            <div className="my-5 rounded-xl border border-dashed border-cyan-500/30 bg-zinc-950/90 p-4 text-center">
              <span className="inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 mb-2">
                SPONSORED AD
              </span>
              <p className="text-xs text-zinc-200 font-medium">
                🚲 프리미엄 로드바이크 & 정밀 피팅 용품 특가전
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                구글 애드센스 / 카카오 애드핏 전면 광고 연동 지점 (1초 대기)
              </p>
            </div>

            {/* 프로그레스 바 */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* 헤더: 커스텀 서비스 브랜드 적용 */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-zinc-950 shadow-lg shadow-cyan-500/20">
              <Bike size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                VELO FIT <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">PRO</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">로드바이크 정밀 콕핏 & 지오메트리 계산기</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 좌측: 입력 폼 */}
          <div className="lg:col-span-5 xl:col-span-4">
            <InputForm
              input={input}
              onChange={setInput}
              onReset={handleReset}
              onCalculate={handleCalculate}
            />
          </div>

{/* 우측: 결과 리포트 & 시뮬레이터 */}
<div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {result && submittedInput ? ( // 💡 submittedInput 확인 추가
              <>
                {/* 💡 실시간 input 대신 박제된 submittedInput을 넘겨줌 */}
                <PedalingSimulator result={result} input={submittedInput} />
                <Results result={result} ridingStyleLabel={RIDING_STYLE_LABELS[submittedInput.ridingStyle]} />
              </>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <span className="text-2xl">🚴</span>
                </div>
                <h3 className="text-base font-bold text-zinc-200">피팅 데이터 입력 대기 중</h3>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-400">
                  좌측 폼에 신체 치수와 옵션을 선택하신 후 하단의 <strong className="text-cyan-400">[피팅 결과 계산 및 리포트 생성]</strong> 버튼을 누르시면 정밀 리포트가 생성됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;