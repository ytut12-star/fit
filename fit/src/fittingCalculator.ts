import type {
  FittingInput,
  FittingResult,
  FrameSizeSpec,
  RidingStyle,
  ClipPosition,
} from './types';
import {
  DRIVETRAIN_HOOD_REACH,
  DRIVETRAIN_LABELS,
  PEDAL_STACK_CORRECTION,
} from './types';
import { FRAME_DATASET } from './frameDataset';

// ============================================================
// 1. 상수 정의
// ============================================================
const SPACER_MIN_MM = 0; 
const SPACER_MAX_MM = 30;

const REFERENCE_STEM_MM = 100;
const REFERENCE_BAR_REACH_MM = 75;
const DEFAULT_STEM_ANGLE_DEG = -6;

const HEAD_TUBE_ANGLE_DEG = 73; 
const STEERER_LEAN_ANGLE = 90 - HEAD_TUBE_ANGLE_DEG; 
const HEAD_ANGLE_LEAN_RATIO = Math.tan(STEERER_LEAN_ANGLE * (Math.PI / 180)); 

const EXPECTED_TORSO_RATIO = 0.52;
const EXPECTED_ARM_RATIO = 0.34;
const SETBACK_EFFECTIVE_REACH_FACTOR = 0.4; 

const DEBUG_MODE = false; 

// ============================================================
// 2. 단위 연산 헬퍼 함수
// ============================================================
function estimateArm(height: number, upperBody: number, inputMode: string, inputLength: number | null, wingspan: number | null): number {
  if (inputMode === 'arm' && inputLength && inputLength > 0) return inputLength;
  if (inputMode === 'wingspan' && wingspan && wingspan > 0) return (wingspan - 35) / 2;
  const upperBodyDelta = upperBody - height * EXPECTED_TORSO_RATIO;
  return height * EXPECTED_ARM_RATIO + upperBodyDelta * 0.4;
}

function calculateCrankLength(inseam: number): number {
  const rawCrank = 145 + (inseam - 65) * 1.2;
  const sizes = [150, 155, 160, 165, 167.5, 170, 172.5, 175];
  return sizes.reduce((prev, curr) => Math.abs(curr - rawCrank) < Math.abs(prev - rawCrank) ? curr : prev);
}

function calculateCleatOffset(clipPosition: ClipPosition, footSize: number | null): number {
  return clipPosition === 'midfoot' && footSize && footSize > 0 ? footSize * 0.025 : (clipPosition === 'midfoot' ? 15 : 0);
}

function calculateSaddleHeight(inseam: number, crankLength: number, clipPosition: ClipPosition, cleatOffset: number, pedalStackCorrection: number) {
  let baseMm = inseam * 0.863 * 10 + (170 - crankLength) * 0.4;
  if (clipPosition === 'midfoot') baseMm -= 4; 
  const clipCorrection = -(cleatOffset * 0.5);
  return { saddleHeight: baseMm + clipCorrection + pedalStackCorrection, saddleHeightBaseMm: baseMm, saddleClipCorrection: clipCorrection };
}

// 💡 [개선] 프레임 각도 완전 배제: 순수 인체 비율(대퇴골 0.47) 기반 BRP 셋백 도출 함수
function calculateSetback(
  inseam: number,              // cm
  calfLength: number | null,   // cm
  cleatOffset: number,         // mm
  ridingStyle: RidingStyle
) {
  // 1. 대퇴골(허벅지) 절대 길이 도출 (cm -> mm)
  let femurMm = 0;
  if (calfLength && calfLength > 0) {
    femurMm = (inseam - calfLength) * 10;
  } else {
    // 실측값이 없으면 표준 인체 비율 52% 적용
    femurMm = (inseam * 0.52) * 10; 
  }

  // 2. 신체 기반(대퇴골) BRP 기준점 도출 (대퇴골 수평 투영 47% 상수 적용)
  const baseBRP = femurMm * 0.47;

  // 3. 라이딩 스타일 보정 (퍼포먼스는 전진, 컴포트는 후퇴)
  const styleAdjust = ridingStyle === 'performance' ? -10 : ridingStyle === 'comfort' ? 5 : 0;

  // 4. 클릿 오프셋 보정 (미드풋 적용 시 발 전진에 따른 보상 후퇴)
  const cleatAdjust = cleatOffset * 0.8;

  // 최종 BRP 수평 셋백 (BB 수직선 ~ BRP)
  const brpSetback = Math.round(baseBRP + styleAdjust + cleatAdjust);

  // 안장 코 셋백 (최신 숏노즈 안장 기준 약 115mm 차감 예시)
  const saddleNoseSetback = brpSetback - 115;
  
  const setbackTotalMm = styleAdjust + cleatAdjust;

  return {
    femurMm: Math.round(femurMm),
    setbackBaseMm: Math.round(baseBRP),
    styleAdjust,
    setbackClipCorrection: Math.round(cleatAdjust),
    setbackTotalMm: Math.round(setbackTotalMm),
    brpSetback,
    saddleNoseSetback
  };
}

// 💡 [필수 헬퍼] 신체 비율 기반 Base Stack & Reach 도출
function calculateBaseGeometry(inseam: number, height: number, upperBody: number, armLength: number) {
  const baseStack = Math.round(inseam * 4.5 + height + 10);
  
  const expectedTorso = height * EXPECTED_TORSO_RATIO;
  const expectedArm = height * EXPECTED_ARM_RATIO;
  const torsoDelta = upperBody - expectedTorso;
  const armDelta = armLength - expectedArm;
  const baseReach = Math.round(378 + (height - 175) * 1.2 + torsoDelta * 1.0 + armDelta * 1.0);

  return { baseStack, baseReach };
}

function diagnoseBodyProportions(height: number, inseam: number, armLength: number, armInputMode: string) {
  const inseamRatio = (inseam / height) * 100;
  let legTypeLabel = '표준 비율 체형';
  if (inseamRatio >= 46.8) legTypeLabel = '다리가 길고 상체가 짧은 체형 (롱레그)';
  else if (inseamRatio <= 45.2) legTypeLabel = '상체가 길고 다리가 다소 짧은 체형 (롱 토르소)';

  let armTypeLabel = '';
  let bodyTypeSummary = '';

  if (armInputMode === 'none') {
    armTypeLabel = '팔 길이 입력 필요 (현재 자동 추정값 사용 중)';
    bodyTypeSummary = `키 대비 하체 비율(${legTypeLabel})을 기준으로 상체 및 팔 길이를 비율 추정하여 콕핏 리치를 산출했습니다.`;
  } else {
    const expectedArm = height * EXPECTED_ARM_RATIO;
    const armDelta = armLength - expectedArm;
    if (armDelta >= 1.5) armTypeLabel = '키 대비 긴 팔';
    else if (armDelta <= -1.5) armTypeLabel = '키 대비 짧은 팔';
    else armTypeLabel = '표준 팔 길이';

    bodyTypeSummary = `키 대비 ${legTypeLabel}이며, ${armTypeLabel} 특성을 가지고 있습니다.`;
  }

  return { legTypeLabel, armTypeLabel, bodyTypeSummary };
}

// ============================================================
// 3. Frame Evaluator & Solver
// ============================================================
function evaluateFrame(
  frame: FrameSizeSpec, baseStack: number, baseReach: number, targetStack: number, targetReach: number,
  handlebarReach: number, drivetrainHoodReach: number, stemAngleDeg: number
) {
  const sizeScore = Math.abs(frame.stackMm - baseStack) * 1.5 + Math.abs(frame.reachMm - baseReach) * 1.5;

  const rawSpacer = targetStack - frame.stackMm;
  const actualSpacer = Math.max(SPACER_MIN_MM, Math.min(SPACER_MAX_MM, Math.round(rawSpacer / 5) * 5));

  const effectiveStack = frame.stackMm + actualSpacer;
  const stackMismatch = targetStack - effectiveStack;
  let stackScore = Math.abs(stackMismatch) * 2.0;

  let negativeSpacerScore = 0;
  if (rawSpacer < 0) {
    const over = Math.abs(rawSpacer);
    if (over <= 5) negativeSpacerScore = 0; 
    else if (over <= 10) negativeSpacerScore = (over - 5) * 2.0;
    else if (over <= 20) negativeSpacerScore = 10 + (over - 10) * 3.0;
    else negativeSpacerScore = 40 + (over - 20) * 5.0; 
  }

  let spacerScore = 0;
  if (actualSpacer > 20) spacerScore = (actualSpacer - 20) * 1.0;

  const reachScore = Math.abs(targetReach - frame.reachMm) * 1.0;

  const spacerReachOffset = -actualSpacer * HEAD_ANGLE_LEAN_RATIO;
  const reqStemHorizontal = REFERENCE_STEM_MM + (targetReach - frame.reachMm) - spacerReachOffset + (REFERENCE_BAR_REACH_MM - handlebarReach) - drivetrainHoodReach;
  
  const stemAngleToGround = STEERER_LEAN_ANGLE + stemAngleDeg; 
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemBodyRaw = reqStemHorizontal / Math.cos(stemAngleRad);
  const roundedStem = Math.round(stemBodyRaw / 10) * 10; 

  let stemScore = 0;
  if (stemBodyRaw >= 90 && stemBodyRaw <= 110) stemScore = 0;
  else if (stemBodyRaw >= 80 && stemBodyRaw < 90) stemScore = (90 - stemBodyRaw) * 1.5;
  else if (stemBodyRaw > 110 && stemBodyRaw <= 120) stemScore = (stemBodyRaw - 110) * 1.5;
  else if (stemBodyRaw < 80) stemScore = 15 + (80 - stemBodyRaw) * 5.0;
  else stemScore = 15 + (stemBodyRaw - 120) * 5.0;

  const totalScore = sizeScore + stackScore + negativeSpacerScore + spacerScore + reachScore + stemScore;

  const physicalFeasible = rawSpacer >= -15 && rawSpacer <= 40 && stemBodyRaw >= 70 && stemBodyRaw <= 140;
  const positionFeasible = Math.abs(stackMismatch) <= 15 && physicalFeasible;
  const preferred = rawSpacer >= -5 && rawSpacer <= 30 && stemBodyRaw >= 80 && stemBodyRaw <= 120 && positionFeasible;

  let fitStatus = 'oversized';
  if (preferred) fitStatus = 'ideal';
  else if (positionFeasible) fitStatus = 'acceptable';
  else if (!physicalFeasible) fitStatus = 'requires_excessive_adjustment';
  if (rawSpacer < -15 || stemBodyRaw < 70) fitStatus = 'undersized';

  return {
    frame, totalScore, rawSpacerNeeded: rawSpacer, actualSpacer, stackMismatch, spacerReachOffset,
    requiredStem: stemBodyRaw, roundedStem: Math.max(80, Math.min(130, roundedStem)),
    withinTolerance: physicalFeasible, fitStatus,
    debug: { sizeScore, stackScore, negativeSpacerScore, spacerScore, reachScore, stemScore, totalScore }
  } as any;
}

// ============================================================
// 4. 메인 계산 파이프라인
// ============================================================
export function calculateFitting(input: FittingInput): FittingResult | null {
  const { height, inseam, ridingStyle, clipPosition, pedalSystem, armInputMode } = input;
  if (!height || !inseam || height <= 0 || inseam <= 0) return null;

  const upperBody = height - inseam;
  const armLength = estimateArm(height, upperBody, armInputMode, input.armLength, input.wingspan);
  const crankLength = calculateCrankLength(inseam);
  const cleatOffset = calculateCleatOffset(clipPosition, input.footSize);
  
  const pedalStackCorrection = PEDAL_STACK_CORRECTION[pedalSystem] ?? 0;
  const { saddleHeight, saddleHeightBaseMm, saddleClipCorrection } = calculateSaddleHeight(inseam, crankLength, clipPosition, cleatOffset, pedalStackCorrection);
  
  // 💡 신체 비율(대퇴골 0.47) 기반 BRP 셋백 도출 함수 호출
  const { setbackBaseMm, setbackClipCorrection, setbackTotalMm, brpSetback, saddleNoseSetback } = calculateSetback(inseam, input.calfLength, cleatOffset, ridingStyle);
  
  const { baseStack, baseReach } = calculateBaseGeometry(inseam, height, upperBody, armLength);
  const { legTypeLabel, armTypeLabel, bodyTypeSummary } = diagnoseBodyProportions(height, inseam, armLength, armInputMode);
  
  const targetStack = baseStack + (ridingStyle === 'comfort' ? 5 : ridingStyle === 'performance' ? -5 : 0);
  const targetReach = baseReach + (ridingStyle === 'comfort' ? -5 : ridingStyle === 'performance' ? 5 : 0);

  const stemAngleDeg = input.stemAngle ?? DEFAULT_STEM_ANGLE_DEG;
  const drivetrainHoodReach = DRIVETRAIN_HOOD_REACH[input.drivetrain] ?? 0;

  const candidates = FRAME_DATASET.map(frame => 
    evaluateFrame(frame, baseStack, baseReach, targetStack, targetReach, input.handlebarReach, drivetrainHoodReach, stemAngleDeg)
  ).sort((a, b) => a.totalScore - b.totalScore);

  const bestMatch = candidates[0];
  const matchedFrame = bestMatch.frame;

  if (DEBUG_MODE) {
    console.log(`\n=== FITTING DEBUG LOG [${height}/${inseam} | ${ridingStyle}] ===`);
    console.log(`Base: Stack ${baseStack}, Reach ${baseReach} | Target: Stack ${targetStack}, Reach ${targetReach}`);
    console.log(`Body Diagnosis: ${legTypeLabel} / ${armTypeLabel}`);
    console.log('=====================================\n');
  }

  const isUpsizedFrame = matchedFrame.stackMm > baseStack + 10;
  const effectiveStack = matchedFrame.stackMm + bestMatch.actualSpacer;
  
  const stemAngleToGround = STEERER_LEAN_ANGLE + stemAngleDeg;
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemHorizontalRun = bestMatch.roundedStem * Math.cos(stemAngleRad);
  
  const effectiveReach = Math.round(
    matchedFrame.reachMm + bestMatch.spacerReachOffset + stemHorizontalRun + 
    input.handlebarReach + drivetrainHoodReach + (setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR)
  );

  return {
    upperBody: Math.round(upperBody * 10) / 10,
    cleatOffset: Math.round(cleatOffset * 10) / 10,
    saddleHeight: Math.round(saddleHeight),
    saddleHeightBase: Math.round(saddleHeightBaseMm),
    saddleCrankCorrection: Math.round((170 - crankLength) * 0.4),
    saddleClipCorrection: Math.round(saddleClipCorrection * 10) / 10,
    pedalStackCorrection,
    setbackBaseMm: Math.round(setbackBaseMm * 10) / 10,
    setbackClipCorrection: Math.round(setbackClipCorrection * 10) / 10,
    setbackTotalMm: Math.round(setbackTotalMm * 10) / 10,
    setbackLabel: setbackTotalMm > 0 ? `기본 위치 대비 후퇴 (+${Math.round(setbackTotalMm)}mm)` : setbackTotalMm < 0 ? `기본 위치 대비 전진 (${Math.round(setbackTotalMm)}mm)` : '표준 위치',
    setbackAdvice: `BRP 기준 ${brpSetback}mm 세팅`,
    setbackFemur: null,
    brpSetback,
    saddleNoseSetback,
    crankLength,
    targetStack,
    targetReach,
    targetGeometryAdvice: '신체 앵커(Base) 기반 체급 우선 매칭 완료',
    recommendedFrameSize: matchedFrame.name,
    matchedFrame,
    frameCandidates: candidates,
    isUpsizedFrame,
    baseStack,
    baseReach,
    stack: matchedFrame.stackMm,
    reach: matchedFrame.reachMm,
    frameSizeAdvice: bestMatch.rawSpacerNeeded < 0 ? `⚠️ 목표 스택 초과. 스템 하향 요망` : `최적 체급 매칭`,
    strRatio: Math.round((matchedFrame.stackMm / matchedFrame.reachMm) * 100) / 100,
    spacerHeight: bestMatch.actualSpacer,
    effectiveStack,
    spacerReachOffset: Math.round(bestMatch.spacerReachOffset),
    stemBaseLength: Math.round(bestMatch.requiredStem),
    stemSetbackAdjust: Math.round(-setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR * 10) / 10,
    stemHandlebarReachAdjust: REFERENCE_BAR_REACH_MM - input.handlebarReach,
    stemHandlebarWidthAdjust: 0,
    stemDrivetrainAdjust: -drivetrainHoodReach,
    stemTotalAdjust: 0,
    stemLength: bestMatch.roundedStem,
    stemAdvice: `추천 스템 ${bestMatch.roundedStem}mm (이론값 ${bestMatch.requiredStem.toFixed(1)}mm)`,
    effectiveReach,
    handlebarWidth: input.handlebarWidth,
    handlebarReach: input.handlebarReach,
    handlebarAdvice: '어깨폭 정렬 확인',
    drivetrain: input.drivetrain,
    drivetrainLabel: DRIVETRAIN_LABELS[input.drivetrain] ?? '기본',
    drivetrainHoodReach,
    drivetrainAdvice: drivetrainHoodReach !== 0 ? `후드 편차 ${drivetrainHoodReach}mm 반영` : '표준 후드 적용',
    clipGuide: clipPosition === 'midfoot' ? 'Mid-foot' : '정석',
    clipGuideShort: clipPosition === 'midfoot' ? 'Mid-foot' : '정석',
    footSize: input.footSize && input.footSize > 0 ? input.footSize : null,
    usedArmEstimate: input.armInputMode === 'none',
    shoulderWidth: input.shoulderWidth ?? 40,
    seatTubeAngle: 73.5,
    legTypeLabel,
    armTypeLabel,
    bodyTypeSummary,
  };
}