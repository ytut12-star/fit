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

export type LeverAngle = 'straight' | 'inward';

export interface FrameSizeSpec {
  name: string;
  stackMm: number;
  reachMm: number;
  seatTubeAngle?: number;
}

export interface FrameMatchResult {
  frame: FrameSizeSpec;
  spacerNeededMm: number;
  reachDeltaMm: number;
  cost: number;
  withinTolerance: boolean;
}

export interface CurrentBikeInput {
  stack: number | null;
  reach: number | null;
  seatTubeAngle: number | null;
  spacerHeight: number | null; // 유저가 추가로 넣은 순수 스페이서 링 높이
  topCapHeight?: number | null; // 기본 탑캡 두께 (기본 10mm)
  stemLength: number | null;
  stemAngle: number | null;
  drivetrain: Drivetrain;
  handlebarWidth: number | null;
  handlebarReach: number | null;
  leverAngle: LeverAngle;
  saddleHeight: number | null;
  crankLength: number | null;
}

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
  seatpostAdvice: string;
  summary: string;
  crankAdvice: string;
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
  leverAngle: LeverAngle;
  drivetrain: Drivetrain;
  stemAngle?: number;
  currentBike?: CurrentBikeInput;
}

export interface FittingResult {
  upperBody: number;
  cleatOffset: number;

  saddleHeight: number;
  saddleHeightBase: number;
  saddleCrankCorrection: number;
  saddleClipCorrection: number;
  pedalStackCorrection: number;

  setbackBaseMm: number;
  setbackClipCorrection: number;
  setbackTotalMm: number;
  setbackLabel: string;
  setbackAdvice: string;
  setbackFemur: number | null;
  brpSetback: number;
  saddleNoseSetback: number;

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

  spacerHeight: number; // 추천 추가 스페이서 링 높이
  topCapHeight: number; // 기본 헤드셋 탑캡 두께 (10mm)
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

  handlebarWidth: number;
  handlebarReach: number;
  leverAngle: LeverAngle;
  cockpitReachBonus: number;
  handlebarAdvice: string;

  drivetrain: Drivetrain;
  drivetrainLabel: string;
  drivetrainHoodReach: number;
  drivetrainAdvice: string;

  clipGuide: string;
  clipGuideShort: string;
  footSize: number | null;
  usedArmEstimate: boolean;
  shoulderWidth: number;
  seatTubeAngle: number;

  legTypeLabel: string;
  armTypeLabel: string;
  bodyTypeSummary: string;

  currentBikeDiagnosis?: CurrentBikeDiagnosis;
}

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

export const HANDLEBAR_WIDTH_OPTIONS = [360, 380, 400, 420, 440];

export const HANDLEBAR_REACH_OPTIONS = [
  { value: 70, label: '70mm (숏)' },
  { value: 75, label: '75mm (표준)' },
  { value: 80, label: '80mm (롱)' },
  { value: 85, label: '85mm (딥)' },
];
