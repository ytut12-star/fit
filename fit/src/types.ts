export type RidingStyle = 'performance' | 'comfort';
export type ClipPosition = 'standard' | 'midfoot';
export type ArmInputMode = 'arm' | 'wingspan' | 'none';
export type PedalSystem = 'spdsl' | 'speedplay' | 'spd' | 'flat';

export type Drivetrain =
  | 'shimano_12s_di2'
  | 'shimano_11s_di2'
  | 'shimano_11s_mech'
  | 'sram_d1'
  | 'sram_e1'
  | 'campagnolo';

// 프레임 데이터셋 스펙 타입
export interface FrameSizeSpec {
  name: string;
  stackMm: number;
  reachMm: number;
  seatTubeAngle?: number;
}

// 프레임 매칭 결과 타입
export interface FrameMatchResult {
  frame: FrameSizeSpec;
  spacerNeededMm: number;
  reachDeltaMm: number;
  cost: number;
  withinTolerance: boolean;
}

// 현재 보유 자전거 입력 타입
export interface CurrentBikeInput {
  stack: number | null;
  reach: number | null;
  seatTubeAngle: number | null;
  spacerHeight: number | null;
  stemLength: number | null;
  stemAngle: number | null;
  drivetrain: Drivetrain;
  handlebarWidth: number | null;
  handlebarReach: number | null;
  saddleHeight: number | null;
  crankLength: number | null;
}

// 현재 보유 자전거 진단 리포트 타입
export interface CurrentBikeDiagnosis {
  hasData: boolean;
  stackDiff: number;
  reachDiff: number;
  saddleHeightDiff: number | null;
  seatTubeAngleUsed: number;
  status: 'optimal' | 'tunable' | 'excessive';
  statusLabel: string;
  spacerAdvice: string;
  stemAdvice: string;
  saddleAdvice: string;
  seatpostAdvice: string; // 💡 싯튜브 각도 기반 싯포스트/레일 처방
  summary: string;
}

export interface FittingInput {
  height: number | null;
  inseam: number | null;
  ridingStyle: RidingStyle;
  armInputMode: ArmInputMode;
  armLength: number | null;
  wingspan: number | null;
  shoulderWidth: number | null;
  calfLength: number | null;
  footSize: number | null;
  pedalSystem: PedalSystem;
  clipPosition: ClipPosition;
  handlebarWidth: number;
  handlebarReach: number;
  drivetrain: Drivetrain;
  stemAngle?: number;
  currentBike?: CurrentBikeInput;
}

export interface FittingResult {
  upperBody: number;
  cleatOffset: number;

  // 1단계: 안장 높이
  saddleHeight: number;
  saddleHeightBase: number;
  saddleCrankCorrection: number;
  saddleClipCorrection: number;
  pedalStackCorrection: number;

  // 2단계: 안장 앞뒤 위치 (Setback)
  setbackBaseMm: number;
  setbackClipCorrection: number;
  setbackTotalMm: number;
  setbackLabel: string;
  setbackAdvice: string;
  setbackFemur: number | null;
  brpSetback: number;
  saddleNoseSetback: number;

  // 3단계: 프레임 & 목표 지오메트리
  crankLength: number;
  targetStack: number;
  targetReach: number;
  targetGeometryAdvice: string;
  recommendedFrameSize: string;
  matchedFrame: FrameSizeSpec;
  frameCandidates: FrameMatchResult[];
  isUpsizedFrame: boolean;
  baseStack: number;
  baseReach: number;
  stack: number;
  reach: number;
  frameSizeAdvice: string;
  strRatio: number;

  // 4단계: 스템 & 유효 리치
  spacerHeight: number;
  effectiveStack: number;
  spacerReachOffset: number;
  stemBaseLength: number;
  stemSetbackAdjust: number;
  stemHandlebarReachAdjust: number;
  stemHandlebarWidthAdjust: number;
  stemDrivetrainAdjust: number;
  stemTotalAdjust: number;
  stemLength: number;
  stemAdvice: string;
  effectiveReach: number;

  // 핸들바 & 콕핏
  handlebarWidth: number;
  handlebarReach: number;
  handlebarAdvice: string;

  // 구동계
  drivetrain: Drivetrain;
  drivetrainLabel: string;
  drivetrainHoodReach: number;
  drivetrainAdvice: string;

  // 클릿 가이드 & 보조 지표
  clipGuide: string;
  clipGuideShort: string;
  footSize: number | null;
  usedArmEstimate: boolean;
  shoulderWidth: number;
  seatTubeAngle: number;

  // 체형 판별
  legTypeLabel: string;
  armTypeLabel: string;
  bodyTypeSummary: string;

  // 현재 자전거 정밀 진단 결과
  currentBikeDiagnosis?: CurrentBikeDiagnosis;
}

// ============================================================
// 라벨 및 상수 정의
// ============================================================

export const RIDING_STYLE_LABELS: Record<RidingStyle, string> = {
  performance: '퍼포먼스 핏 (속도/효율 중심)',
  comfort: '컴포트 핏 (편안함/장거리 중심)',
};

export const CLIP_POSITION_LABELS: Record<ClipPosition, string> = {
  standard: '정석 위치 (중족골 중심)',
  midfoot: '뒤로 밀어서 세팅 (Mid-foot / 발목 부담 완화)',
};

export const PEDAL_SYSTEM_LABELS: Record<PedalSystem, string> = {
  spdsl: '로드 표준 (Shimano SPD-SL / Look Keo ~ 15mm)',
  speedplay: '스피드플레이 (Wahoo Speedplay ~ 11.5mm / 낮음)',
  spd: 'MTB 2홀 클릿 (Shimano SPD ~ 18mm / 약간 높음)',
  flat: '평페달 + 일반 운동화 (~ 20mm 이상 / 높음)',
};

export const PEDAL_STACK_CORRECTION: Record<PedalSystem, number> = {
  spdsl: 0,
  speedplay: -3,
  spd: 3,
  flat: 5,
};

export const DRIVETRAIN_LABELS: Record<Drivetrain, string> = {
  shimano_12s_di2: '시마노 12단 Di2 [기준]',
  shimano_11s_di2: '시마노 11단 Di2 (-2mm)',
  shimano_11s_mech: '시마노 11단 기계식 (+2mm)',
  sram_d1: '스램 D1 (+3mm)',
  sram_e1: '스램 E1 (+9mm)',
  campagnolo: '캄파놀로 (-2mm)',
};

export const DRIVETRAIN_HOOD_REACH: Record<Drivetrain, number> = {
  shimano_12s_di2: 0,
  shimano_11s_di2: -2,
  shimano_11s_mech: 2,
  sram_d1: 3,
  sram_e1: 9,
  campagnolo: -2,
};

export const HANDLEBAR_WIDTH_OPTIONS = [380, 400, 420, 440];

export const HANDLEBAR_REACH_OPTIONS = [
  { value: 70, label: '70mm (숏)' },
  { value: 75, label: '75mm (표준)' },
  { value: 80, label: '80mm (롱)' },
  { value: 85, label: '85mm (딥)' },
];
