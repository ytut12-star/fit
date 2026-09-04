import { useState, useEffect } from 'react';
import type { FittingInput, FittingResult } from './types';
import { calculateFitting } from './fittingCalculator';
import { InputForm } from './components/InputForm';
import { Results } from './components/Results';
import { PedalingSimulator } from './components/PedalingSimulator';
import { Loader2, Sparkles, Bike, Globe } from 'lucide-react';

// 💡 1. 다국어 설정 파일 및 로컬스토리지 훅 불러오기
import { t, type Lang } from './translations';
import { t, type Lang } from './translations';

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
  drivetrain: 'shimano_12s_di2',
};

export function App() {
  const [input, setInput] = useState<FittingInput>(INITIAL_INPUT);
  const [result, setResult] = useState<FittingResult | null>(null);
  const [submittedInput, setSubmittedInput] = useState<FittingInput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 💡 1. 접속할 때마다 브라우저 언어 즉시 감지 (로컬 스토리지 안 씀)
  const getInitialLang = (): Lang => {
    if (typeof navigator === 'undefined') return 'ko';
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'en' ? 'en' : 'ko';
  };

  // 💡 2. 로컬 스토리지(useLocalStorage) 대신 일반 useState 사용
  const [lang, setLang] = useState<Lang>(getInitialLang());

  // 💡 3. HTML lang 속성 동기화 (기존 동일)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang(lang === 'ko' ? 'en' : 'ko');
  };

  const handleCalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      const calculated = calculateFitting(input, lang);
      setResult(calculated);
      setSubmittedInput(input);
      setIsLoading(false);
    }, 2500);
  };

  const handleReset = () => {
    setInput(INITIAL_INPUT);
    setResult(null);
    setSubmittedInput(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500 selection:text-zinc-950 overflow-x-hidden">
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            </div>

            <h3 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-1.5">
              <Sparkles size={16} className="text-cyan-400" />
              {t[lang].loadingTitle}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              {t[lang].loadingDesc}
            </p>

            <div className="my-5 rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-4 text-center">
              <p className="text-xs text-zinc-300 font-medium">
                🚲 Ride Smarter, Fit Better
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {t[lang].loadingSub}
              </p>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* 헤더 부분 */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-zinc-950 shadow-lg shadow-cyan-500/20">
              <Bike size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                VeloSizing{' '}
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  PRO
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                {t[lang].headerSubtitle}
              </span>
            </div>
          </div>

          {/* 💡 5. 언어 전환 토글 버튼 추가 */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Globe size={14} className="text-cyan-500" />
            {lang === 'ko' ? 'English' : '한국어'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          <div className="lg:col-span-5 xl:col-span-4">
            {/* 💡 추후 InputForm 내부를 다국어화 할 때 lang={lang} 을 프롭스로 넘겨주시면 됩니다 */}
            <InputForm
              input={input}
              onChange={setInput}
              onReset={handleReset}
              onCalculate={handleCalculate}
              lang={lang}
            />
          </div>

          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {result && submittedInput ? (
              <>
                <PedalingSimulator result={result} input={submittedInput} lang={lang} />
                <Results
                 result={result}
  // 💡 타입(types.ts) 대신 번역 파일(t[lang])에서 가져오도록 수정
  ridingStyleLabel={t[lang].styles[submittedInput.ridingStyle as keyof typeof t.ko.styles]}
  lang={lang}
                />
              </>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <span className="text-2xl">🚴</span>
                </div>
                <h3 className="text-base font-bold text-zinc-200">
                  {t[lang].waitingTitle}
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-400">
                  {t[lang].waitingDesc1}{' '}
                  <strong className="text-cyan-400">
                    {t[lang].waitingBtn}
                  </strong>{' '}
                  {t[lang].waitingDesc2}
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
