import type {
  FittingInput,
  FittingResult,
  FrameSizeSpec,
  RidingStyle,
  ClipPosition,
  CurrentBikeInput,
  CurrentBikeDiagnosis,
  LeverAngle,
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
export const BASE_TOPCAP_MM = 10; // 💡 필수 기본 헤드셋 베어링 커버/인터널 탑캡 최소 두께
const USER_SPACER_MIN_MM = 0; // 추가 스페이서 링 최소값
const USER_SPACER_MAX_MM = 25; // 추가 스페이서 링 최대 권장값

const REFERENCE_STEM_MM = 100;
const REFERENCE_BAR_REACH_MM = 75;

const HEAD_TUBE_ANGLE_DEG = 73;
const STEERER_LEAN_ANGLE = 90 - HEAD_TUBE_ANGLE_DEG;
const HEAD_ANGLE_LEAN_RATIO = Math.tan(STEERER_LEAN_ANGLE * (Math.PI / 180));

const EXPECTED_TORSO_RATIO = 0.52;
const EXPECTED_ARM_RATIO = 0.34;
const SETBACK_EFFECTIVE_REACH_FACTOR = 0.4;

const DEBUG_MODE = false;

// 💡 핸들바 폭 & 레버 꺾임에 의한 유효 리치 변화량 산출
export function getCockpitReachBonus(
  width: number = 400,
  leverAngle: LeverAngle = 'straight'
): number {
  const widthEffect = ((width - 400) / 20) * 5; // 400mm 기준 20mm 넓어질 때마다 +5mm
  const leverEffect = leverAngle === 'inward' ? 6 : 0; // 안쪽 꺾임 시 +6mm
  return widthEffect + leverEffect;
}

// ============================================================
// 2. 단위 연산 헬퍼 함수
// ============================================================
function estimateArm(
  height: number,
  upperBody: number,
  inputMode: string,
  inputLength: number | null,
  wingspan: number | null
): number {
  if (inputMode === 'arm' && inputLength && inputLength > 0) return inputLength;
  if (inputMode === 'wingspan' && wingspan && wingspan > 0) {
    const baseArm = height * EXPECTED_ARM_RATIO;
    const wingDelta = wingspan - height;
    return baseArm + wingDelta / 2;
  }
  const upperBodyDelta = upperBody - height * EXPECTED_TORSO_RATIO;
  return height * EXPECTED_ARM_RATIO + upperBodyDelta * 0.4;
}

function calculateCrankLength(inseam: number): number {
  const rawCrank = 145 + (inseam - 65) * 1.2;
  const sizes = [150, 155, 160, 165, 167.5, 170, 172.5, 175];
  return sizes.reduce((prev, curr) =>
    Math.abs(curr - rawCrank) < Math.abs(prev - rawCrank) ? curr : prev
  );
}

function calculateCleatOffset(
  clipPosition: ClipPosition,
  footSize: number | null
): number {
  return clipPosition === 'midfoot' && footSize && footSize > 0
    ? footSize * 0.025
    : clipPosition === 'midfoot'
    ? 15
    : 0;
}

function calculateSaddleHeight(
  inseam: number,
  crankLength: number,
  clipPosition: ClipPosition,
  cleatOffset: number,
  pedalStackCorrection: number
) {
  let baseMm = inseam * 0.863 * 10 + (170 - crankLength) * 0.4;
  if (clipPosition === 'midfoot') baseMm -= 4;
  const clipCorrection = -(cleatOffset * 0.5);
  return {
    saddleHeight: baseMm + clipCorrection + pedalStackCorrection,
    saddleHeightBaseMm: baseMm,
    saddleClipCorrection: clipCorrection,
  };
}

function calculateSetback(
  inseam: number,
  calfLength: number | null,
  cleatOffset: number,
  ridingStyle: RidingStyle
) {
  let femurMm = 0;
  if (calfLength && calfLength > 0) {
    femurMm = (inseam - calfLength) * 10;
  } else {
    femurMm = inseam * 0.52 * 10;
  }

  const baseBRP = femurMm * 0.47;
  const styleAdjust =
    ridingStyle === 'performance' ? -10 : ridingStyle === 'comfort' ? 5 : 0;
  const cleatAdjust = cleatOffset * 0.8;

  const brpSetback = Math.round(baseBRP + styleAdjust + cleatAdjust);
  const saddleNoseSetback = brpSetback - 115;
  const setbackTotalMm = styleAdjust + cleatAdjust;

  return {
    femurMm: Math.round(femurMm),
    setbackBaseMm: Math.round(baseBRP),
    styleAdjust,
    setbackClipCorrection: Math.round(cleatAdjust),
    setbackTotalMm: Math.round(setbackTotalMm),
    brpSetback,
    saddleNoseSetback,
  };
}

function calculateBaseGeometry(
  inseam: number,
  height: number,
  upperBody: number,
  armLength: number
) {
  const baseStack = Math.round(inseam * 4.5 + height + 10);
  const expectedTorso = height * EXPECTED_TORSO_RATIO;
  const expectedArm = height * EXPECTED_ARM_RATIO;
  const torsoDelta = upperBody - expectedTorso;
  const armDelta = armLength - expectedArm;
  const baseReach = Math.round(
    378 + (height - 175) * 1.2 + torsoDelta * 1.0 + armDelta * 1.0
  );

  return { baseStack, baseReach };
}

function diagnoseBodyProportions(
  height: number,
  inseam: number,
  armLength: number,
  armInputMode: string
) {
  const inseamRatio = (inseam / height) * 100;
  let legTypeLabel = '표준 비율 체형';
  if (inseamRatio >= 46.8)
    legTypeLabel = '다리가 길고 상체가 짧은 체형 (롱레그)';
  else if (inseamRatio <= 45.2)
    legTypeLabel = '상체가 길고 다리가 다소 짧은 체형 (롱 토르소)';

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
// 3. Frame Evaluator & Solver (기본 탑캡 10mm 포함)
// ============================================================
function evaluateFrame(
  frame: FrameSizeSpec,
  baseStack: number,
  baseReach: number,
  targetStack: number,
  targetReach: number,
  handlebarReach: number,
  drivetrainHoodReach: number,
  ridingStyle: RidingStyle,
  cockpitReachBonus: number
) {
  const sizeScore =
    Math.abs(frame.stackMm - baseStack) * 1.5 +
    Math.abs(frame.reachMm - baseReach) * 1.5;

  let bestStemAngle = -6;
  let angleStackEffect = 0;

  // 💡 필요 높이 = 목표 스택 - 프레임 스택 - 기본 탑캡(10mm)
  let rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM;
  let stemAnglePenalty = 0;

  if (rawSpacer < -3) {
    bestStemAngle = -10;
    angleStackEffect = -7;
    stemAnglePenalty = 5;
  }

  rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM - angleStackEffect;
  const actualSpacer = Math.max(
    USER_SPACER_MIN_MM,
    Math.min(USER_SPACER_MAX_MM, Math.round(rawSpacer / 5) * 5)
  );

  // 총 유효 스택
  const effectiveStack =
    frame.stackMm + BASE_TOPCAP_MM + actualSpacer + angleStackEffect;
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
  if (actualSpacer > 15) spacerScore = (actualSpacer - 15) * 1.0;

  const reachScore = Math.abs(targetReach - frame.reachMm) * 1.0;

  // 스티어러 튜브 물리적 높이 (기본 탑캡 + 추가 스페이서)
  const totalSteererStack = BASE_TOPCAP_MM + actualSpacer;
  const spacerReachOffset = -totalSteererStack * HEAD_ANGLE_LEAN_RATIO;

  const reqStemHorizontal =
    REFERENCE_STEM_MM +
    (targetReach - frame.reachMm) -
    spacerReachOffset +
    (REFERENCE_BAR_REACH_MM - handlebarReach) -
    drivetrainHoodReach -
    cockpitReachBonus;

  const stemAngleToGround = STEERER_LEAN_ANGLE + bestStemAngle;
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemBodyRaw = reqStemHorizontal / Math.cos(stemAngleRad);
  const roundedStem = Math.round(stemBodyRaw / 10) * 10;

  let stemScore = 0;
  if (stemBodyRaw >= 90 && stemBodyRaw <= 110) stemScore = 0;
  else if (stemBodyRaw >= 80 && stemBodyRaw < 90)
    stemScore = (90 - stemBodyRaw) * 1.5;
  else if (stemBodyRaw > 110 && stemBodyRaw <= 120)
    stemScore = (stemBodyRaw - 110) * 1.5;
  else if (stemBodyRaw < 80) stemScore = 15 + (80 - stemBodyRaw) * 5.0;
  else stemScore = 15 + (stemBodyRaw - 120) * 5.0;

  const totalScore =
    sizeScore +
    stackScore +
    negativeSpacerScore +
    spacerScore +
    reachScore +
    stemScore +
    stemAnglePenalty;

  const physicalFeasible =
    rawSpacer >= -15 &&
    rawSpacer <= 35 &&
    stemBodyRaw >= 70 &&
    stemBodyRaw <= 140;
  const positionFeasible = Math.abs(stackMismatch) <= 15 && physicalFeasible;
  const preferred =
    rawSpacer >= -5 &&
    rawSpacer <= 25 &&
    stemBodyRaw >= 80 &&
    stemBodyRaw <= 120 &&
    positionFeasible;

  let fitStatus = 'oversized';
  if (preferred) fitStatus = 'ideal';
  else if (positionFeasible) fitStatus = 'acceptable';
  else if (!physicalFeasible) fitStatus = 'requires_excessive_adjustment';
  if (rawSpacer < -15 || stemBodyRaw < 70) fitStatus = 'undersized';

  return {
    frame,
    totalScore,
    rawSpacerNeeded: rawSpacer,
    actualSpacer,
    stackMismatch,
    spacerReachOffset,
    requiredStem: stemBodyRaw,
    roundedStem: Math.max(80, Math.min(130, roundedStem)),
    withinTolerance: physicalFeasible,
    fitStatus,
    recommendedStemAngle: bestStemAngle,
    angleStackEffect,
  } as any;
}

// 💡 현재 보유 자전거 비교 진단 (기본 탑캡 10mm 연동)
function diagnoseCurrentBike(
  current: CurrentBikeInput | undefined,
  idealTargetStack: number,
  idealTargetReach: number,
  idealSaddleHeight: number,
  idealBRPSetback: number,
  defaultBarReach: number,
  idealCrankLength: number
): CurrentBikeDiagnosis {
  if (!current || !current.stack || !current.reach) {
    return {
      hasData: false,
      stackDiff: 0,
      reachDiff: 0,
      saddleHeightDiff: null,
      seatTubeAngleUsed: 73.5,
      status: 'optimal',
      statusLabel: '데이터 없음',
      spacerAdvice: '',
      stemAdvice: '',
      saddleAdvice: '',
      seatpostAdvice: '',
      summary: '',
      crankAdvice: '',
    };
  }

  const curStack = current.stack;
  const curReach = current.reach;
  const curSpacer = current.spacerHeight ?? 10; // 추가 스페이서 링
  const curTopCap = current.topCapHeight ?? BASE_TOPCAP_MM; // 기본 탑캡
  const curStem = current.stemLength ?? 100;
  const curStemAngle = current.stemAngle ?? -6;
  const curBarReach = current.handlebarReach ?? defaultBarReach;
  const curDrivetrainReach = DRIVETRAIN_HOOD_REACH[current.drivetrain] ?? 0;

  const curCockpitReachBonus = getCockpitReachBonus(
    current.handlebarWidth ?? 400,
    current.leverAngle ?? 'straight'
  );

  const curSTA =
    current.seatTubeAngle && current.seatTubeAngle > 0
      ? current.seatTubeAngle
      : 73.5;
  const effectiveSaddleHeight =
    current.saddleHeight && current.saddleHeight > 0
      ? current.saddleHeight
      : idealSaddleHeight;

  const anglesToTest = [curStemAngle, -6, -10, -17, 6];
  let bestCombo: any = null;
  let fallbackCombo: any = null;
  let minFallbackScore = Infinity;

  for (const angle of anglesToTest) {
    let effect = 0;
    if (angle === 6) effect = 21;
    else if (angle === -10) effect = -7;
    else if (angle === -17) effect = -19;

    const rawSpacer = idealTargetStack - curStack - curTopCap - effect;
    const spacer = Math.max(0, Math.round(rawSpacer / 5) * 5);

    const angleRad = (STEERER_LEAN_ANGLE + angle) * (Math.PI / 180);
    const totalSteererStack = curTopCap + spacer;
    const spacerReachOffset = -totalSteererStack * HEAD_ANGLE_LEAN_RATIO;

    const reqStemHorizontal =
      REFERENCE_STEM_MM +
      (idealTargetReach - curReach) -
      spacerReachOffset +
      (REFERENCE_BAR_REACH_MM - curBarReach) -
      curDrivetrainReach -
      curCockpitReachBonus;
    const reqStem =
      Math.round(reqStemHorizontal / Math.cos(angleRad) / 10) * 10;

    const isSpacerValid = rawSpacer >= -3 && spacer <= 20;
    const isStemValid = reqStem >= 70 && reqStem <= 130;

    const combo = { angle, spacer, reqStem, rawSpacer };

    if (isSpacerValid && isStemValid && !bestCombo) {
      bestCombo = combo;
      break;
    }

    const score = Math.abs(rawSpacer - 5) + Math.abs(reqStem - 100);
    if (score < minFallbackScore) {
      minFallbackScore = score;
      fallbackCombo = combo;
    }
  }

  const finalCombo = bestCombo || fallbackCombo;
  const {
    angle: recAngle,
    spacer: recSpacer,
    reqStem: recStemLength,
    rawSpacer: recRawSpacer,
  } = finalCombo;

  let curAngleStackEffect = 0;
  if (curStemAngle === 6) curAngleStackEffect = 21;
  else if (curStemAngle === -10) curAngleStackEffect = -7;
  else if (curStemAngle === -17) curAngleStackEffect = -19;

  const curEffectiveStack =
    curStack + curTopCap + curSpacer + curAngleStackEffect;
  const stackDiff = curEffectiveStack - idealTargetStack;

  const curAngleRad = (STEERER_LEAN_ANGLE + curStemAngle) * (Math.PI / 180);
  const curStemHorizontal = curStem * Math.cos(curAngleRad);
  const curEffectiveReach =
    curReach -
    (curTopCap + curSpacer) * HEAD_ANGLE_LEAN_RATIO +
    curStemHorizontal +
    curBarReach +
    curDrivetrainReach +
    curCockpitReachBonus;

  const recAngleRad = (STEERER_LEAN_ANGLE + recAngle) * (Math.PI / 180);
  const idealStemHorizontal = recStemLength * Math.cos(recAngleRad);
  const idealEffectiveReach =
    curReach -
    (curTopCap + recSpacer) * HEAD_ANGLE_LEAN_RATIO +
    idealStemHorizontal +
    curBarReach +
    curDrivetrainReach +
    curCockpitReachBonus;
  const reachDiff = curEffectiveReach - idealEffectiveReach;

  let spacerAdvice = '';
  if (curStemAngle === recAngle) {
    if (curSpacer === recSpacer) {
      spacerAdvice =
        recSpacer === 0
          ? `현재 기본 탑캡(${curTopCap}mm)만 장착된 슬램드(0mm) 세팅이 목표 높이와 완벽히 일치합니다.`
          : `현재 장착된 추가 스페이서(${curSpacer}mm, 기본탑캡 별도) 세팅이 목표 높이와 정확히 일치합니다.`;
    } else {
      const diff = recSpacer - curSpacer;
      spacerAdvice =
        recSpacer === 0
          ? `추가 스페이서를 모두 제거하고 기본 탑캡(${curTopCap}mm)만 장착(0mm 풀커팅)하세요.`
          : `스템 각도(${
              curStemAngle > 0 ? `+${curStemAngle}` : curStemAngle
            }°)를 유지하고 추가 스페이서를 ${recSpacer}mm로 재조정하세요 (현재 대비 ${
              diff > 0 ? '+' : ''
            }${diff}mm).`;
    }
  } else {
    spacerAdvice = `현재 각도(${
      curStemAngle > 0 ? `+${curStemAngle}` : curStemAngle
    }°)로는 스페이서 허용치(0~20mm)를 맞출 수 없습니다. 스템을 ${recAngle}°로 교체 후 추가 스페이서를 ${recSpacer}mm로 세팅하세요.`;
  }

  let stemAdvice = '';
  const bonusComment =
    curCockpitReachBonus !== 0
      ? ` (핸들바/레버 세팅 보정 ${
          curCockpitReachBonus > 0 ? '+' : ''
        }${curCockpitReachBonus}mm 반영)`
      : '';

  if (curStem === recStemLength && curStemAngle === recAngle) {
    stemAdvice = `현재 장착된 ${curStem}mm 스템 길이가 리치에 최적화되어 교체가 불필요합니다.${bonusComment}`;
  } else if (curStem === recStemLength && curStemAngle !== recAngle) {
    stemAdvice = `리치를 위한 길이는 ${curStem}mm로 적당하나, 스택 보정을 위해 스템 각도만 ${recAngle}°로 교체하세요.${bonusComment}`;
  } else {
    const diff = recStemLength - curStem;
    stemAdvice = `리치 최적화를 위해 현재 ${curStem}mm 스템 대신 ${recStemLength}mm 스템(${
      recAngle > 0 ? `+${recAngle}` : recAngle
    }°)으로 교체(${
      diff > 0 ? `+${diff}mm 연장` : `${diff}mm 단축`
    })를 추천합니다.${bonusComment}`;
  }

  let saddleAdvice = '';
  let saddleHeightDiff: number | null = null;
  if (current.saddleHeight && current.saddleHeight > 0) {
    saddleHeightDiff = current.saddleHeight - idealSaddleHeight;
    if (Math.abs(saddleHeightDiff) <= 3) {
      saddleAdvice = `현재 안장 높이(${current.saddleHeight}mm)가 추천값(${idealSaddleHeight}mm)과 정밀하게 일치합니다.`;
    } else if (saddleHeightDiff > 0) {
      saddleAdvice = `현재 안장이 추천값보다 ${saddleHeightDiff}mm 높습니다. (${idealSaddleHeight}mm로 하향 권장)`;
    } else {
      saddleAdvice = `현재 안장이 추천값보다 ${Math.abs(
        saddleHeightDiff
      )}mm 낮습니다. (${idealSaddleHeight}mm로 상향 권장)`;
    }
  }

  const staRad = (curSTA * Math.PI) / 180;
  const seatTubeAxisSetback = effectiveSaddleHeight * Math.cos(staRad);
  const requiredOffsetFromAxis = idealBRPSetback - seatTubeAxisSetback;

  let seatpostAdvice = '';
  let isSTAProblematic = false;

  if (requiredOffsetFromAxis < -10) {
    const neededRailForward = Math.abs(requiredOffsetFromAxis);
    if (neededRailForward > 25) {
      isSTAProblematic = true;
      seatpostAdvice = `⚠️ 싯튜브 각도(${curSTA}°)가 과도하게 누워있어 0mm(제로옵셋) 싯포스트를 장착하고도 안장 레일을 앞쪽으로 끝까지 밀어야(${Math.round(
        neededRailForward
      )}mm 전진) 권장 BRP(${idealBRPSetback}mm) 구현이 가능합니다.`;
    } else {
      seatpostAdvice = `싯튜브 각도(${curSTA}°)가 완만한 편입니다. 0mm(제로옵셋) 싯포스트 사용 및 안장 레일 앞쪽 세팅을 권장합니다.`;
    }
  } else if (requiredOffsetFromAxis > 35) {
    isSTAProblematic = true;
    seatpostAdvice = `⚠️ 싯튜브 각도(${curSTA}°)가 매우 가파릅니다. 권장 BRP(${idealBRPSetback}mm) 확보를 위해 25mm 이상의 롱 셋백 싯포스트 장착이 필수적입니다.`;
  } else if (requiredOffsetFromAxis >= 10 && requiredOffsetFromAxis <= 25) {
    seatpostAdvice = `싯튜브 각도(${curSTA}°)가 적정합니다. 일반적인 15~20mm 셋백 싯포스트에 안장을 중앙 장착하면 이상적입니다.`;
  } else {
    seatpostAdvice = `현재 싯튜브 각도(${curSTA}°) 기준, 0~15mm 셋백 싯포스트 장착 시 안장 레일 조절을 통해 권장 BRP(${idealBRPSetback}mm)를 맞출 수 있습니다.`;
  }

  const isFrameOversized = recRawSpacer < -5;
  const isFrameUndersized = recSpacer > 20;
  const isStemExtreme = recStemLength < 70 || recStemLength > 140;

  const isOptimal =
    Math.abs(stackDiff) <= 4 &&
    Math.abs(reachDiff) <= 5 &&
    !isFrameUndersized &&
    !isFrameOversized &&
    curStemAngle === recAngle;

  let status: 'optimal' | 'tunable' | 'excessive' = 'optimal';
  let statusLabel = '완벽히 호환되는 세팅';
  let summary =
    '현재 세팅이 신체 치수와 이상적으로 맞아떨어집니다. 부품 교체가 필요 없습니다.';

  if (
    isFrameOversized ||
    isFrameUndersized ||
    isStemExtreme ||
    isSTAProblematic
  ) {
    status = 'excessive';
    statusLabel = isSTAProblematic
      ? '지오메트리 극단 편차 (부품 한계)'
      : '프레임 체급 불일치 (기변 고려)';
    summary = isSTAProblematic
      ? '프레임의 싯튜브 각도 또는 규격 편차가 극단적이어서 전용 부품(특수 싯포스트 등) 세팅이 요구됩니다.'
      : '현재 프레임 사이즈가 권장 한계를 초과하여(스페이서 20mm 초과 등) 스템 교체만으로는 완벽한 피팅이 어렵습니다.';
  } else if (!isOptimal) {
    status = 'tunable';
    statusLabel = '스페이서/스템 조절로 최적화';
    summary =
      '프레임 사이즈는 본인에게 맞습니다. 스페이서 높이 우선 조절 및 필요시 스템 교체로 최적의 피팅을 완성할 수 있습니다.';
  }

  let crankAdvice = '';
  if (
    current.crankLength &&
    current.crankLength > 0 &&
    current.crankLength !== idealCrankLength
  ) {
    const diff = current.crankLength - idealCrankLength;
    const tempSaddleHeight = idealSaddleHeight - diff;
    const tempBRPSetback = idealBRPSetback - diff;
    const actionText =
      diff > 0
        ? `안장을 ${Math.abs(diff)}mm 낮추고, 앞으로 ${Math.abs(diff)}mm 당겨야`
        : `안장을 ${Math.abs(diff)}mm 높이고, 뒤로 ${Math.abs(diff)}mm 미뤄야`;

    crankAdvice = `기변 전까지 현재 크랭크(${current.crankLength}mm)를 그대로 사용할 경우, ${actionText} 페달링 궤적이 유지됩니다. (임시 권장 안장높이: ${tempSaddleHeight}mm / BRP 셋백: ${tempBRPSetback}mm)`;
  }

  return {
    hasData: true,
    stackDiff,
    reachDiff,
    saddleHeightDiff,
    seatTubeAngleUsed: curSTA,
    status,
    statusLabel,
    spacerAdvice,
    stemAdvice,
    saddleAdvice,
    seatpostAdvice,
    summary,
    crankAdvice,
  };
}

// ============================================================
// 4. 메인 계산 파이프라인
// ============================================================
export function calculateFitting(input: FittingInput): FittingResult | null {
  const {
    height,
    inseam,
    ridingStyle,
    clipPosition,
    pedalSystem,
    armInputMode,
    leverAngle = 'straight',
  } = input;
  if (!height || !inseam || height <= 0 || inseam <= 0) return null;

  const upperBody = height - inseam;
  const armLength = estimateArm(
    height,
    upperBody,
    armInputMode,
    input.armLength,
    input.wingspan
  );
  const crankLength = calculateCrankLength(inseam);
  const cleatOffset = calculateCleatOffset(clipPosition, input.footSize);

  const pedalStackCorrection = PEDAL_STACK_CORRECTION[pedalSystem] ?? 0;
  const { saddleHeight, saddleHeightBaseMm, saddleClipCorrection } =
    calculateSaddleHeight(
      inseam,
      crankLength,
      clipPosition,
      cleatOffset,
      pedalStackCorrection
    );

  const {
    setbackBaseMm,
    setbackClipCorrection,
    setbackTotalMm,
    brpSetback,
    saddleNoseSetback,
  } = calculateSetback(inseam, input.calfLength, cleatOffset, ridingStyle);

  const { baseStack, baseReach } = calculateBaseGeometry(
    inseam,
    height,
    upperBody,
    armLength
  );
  const { legTypeLabel, armTypeLabel, bodyTypeSummary } =
    diagnoseBodyProportions(height, inseam, armLength, armInputMode);

  const targetStack =
    baseStack +
    (ridingStyle === 'comfort' ? 15 : ridingStyle === 'performance' ? -5 : 0);
  const targetReach =
    baseReach +
    (ridingStyle === 'comfort' ? -10 : ridingStyle === 'performance' ? 5 : 0);

  const drivetrainHoodReach = DRIVETRAIN_HOOD_REACH[input.drivetrain] ?? 0;
  const cockpitReachBonus = getCockpitReachBonus(
    input.handlebarWidth,
    leverAngle
  );

  const candidates = FRAME_DATASET.map((frame) =>
    evaluateFrame(
      frame,
      baseStack,
      baseReach,
      targetStack,
      targetReach,
      input.handlebarReach,
      drivetrainHoodReach,
      ridingStyle,
      cockpitReachBonus
    )
  ).sort((a, b) => a.totalScore - b.totalScore);

  const bestMatch = candidates[0];
  const matchedFrame = bestMatch.frame;

  const isUpsizedFrame = matchedFrame.stackMm + BASE_TOPCAP_MM > baseStack + 10;
  const effectiveStack =
    matchedFrame.stackMm +
    BASE_TOPCAP_MM +
    bestMatch.actualSpacer +
    bestMatch.angleStackEffect;

  const stemAngleToGround = STEERER_LEAN_ANGLE + bestMatch.recommendedStemAngle;
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemHorizontalRun = bestMatch.roundedStem * Math.cos(stemAngleRad);

  const effectiveReach = Math.round(
    matchedFrame.reachMm +
      bestMatch.spacerReachOffset +
      stemHorizontalRun +
      input.handlebarReach +
      drivetrainHoodReach +
      cockpitReachBonus +
      setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR
  );

  const recAngle = bestMatch.recommendedStemAngle;
  const preciseStem = Math.round(bestMatch.requiredStem * 10) / 10;
  let stemAdviceStr = `추천 스템 ${bestMatch.roundedStem}mm (정밀 ${preciseStem}mm) / ${recAngle}도`;

  if (cockpitReachBonus !== 0) {
    stemAdviceStr += ` [보정 ${
      cockpitReachBonus > 0 ? '+' : ''
    }${cockpitReachBonus}mm]`;
  }

  if (recAngle === -10) {
    stemAdviceStr += ` (스택 하향을 위한 -10도 스템)`;
  } else {
    if (bestMatch.actualSpacer === 0) {
      stemAdviceStr += ` (추가 스페이서 0mm / 슬램드)`;
    } else {
      stemAdviceStr += ` (+${bestMatch.actualSpacer}mm 추가 스페이서)`;
    }
  }

  let frameSizeAdviceStr = `최적 체급 매칭 완료`;
  if (bestMatch.rawSpacerNeeded < -5 && recAngle === -6) {
    frameSizeAdviceStr = `⚠️ 목표 스택 초과. 추가적인 낙차 확보 불가`;
  } else if (recAngle < -6) {
    frameSizeAdviceStr = `스택 보정을 위해 스템 각도(-${Math.abs(
      recAngle
    )}도) 튜닝 적용됨`;
  }

  const currentBikeDiagnosis = diagnoseCurrentBike(
    input.currentBike,
    targetStack,
    targetReach,
    Math.round(saddleHeight),
    brpSetback,
    input.handlebarReach,
    crankLength
  );

  // 💡 [신규 로직] 콕핏 셋업이 프레임/스템 선택을 망가뜨리고 있는지 감지 (피터의 조언)
  let cockpitTuningAdvice: string | null = null;
  const totalCockpitExcess = drivetrainHoodReach + cockpitReachBonus;

  if (totalCockpitExcess >= 8 && bestMatch.requiredStem < 100) {
    cockpitTuningAdvice = `현재 콕핏 부품(구동계 후드 + 레버 세팅)이 리치를 비정상적으로 연장(+${totalCockpitExcess}mm)시키고 있어 스템이 극단적으로 짧아집니다. 사이즈를 내리기 전에 1순위로 '레버 각도를 일자(Straight)로 원복'하고, 2순위로 '숏리치 핸들바' 교체를 강력히 권장합니다.`;
  }

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
    setbackLabel:
      setbackTotalMm > 0
        ? `기본 위치 대비 후퇴 (+${Math.round(setbackTotalMm)}mm)`
        : setbackTotalMm < 0
        ? `기본 위치 대비 전진 (${Math.round(setbackTotalMm)}mm)`
        : '표준 위치',
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
    frameSizeAdvice: frameSizeAdviceStr,
    strRatio:
      Math.round((matchedFrame.stackMm / matchedFrame.reachMm) * 100) / 100,
    spacerHeight: bestMatch.actualSpacer,
    topCapHeight: BASE_TOPCAP_MM,
    effectiveStack,
    spacerReachOffset: Math.round(bestMatch.spacerReachOffset),
    stemBaseLength: Math.round(bestMatch.requiredStem),
    stemSetbackAdjust:
      Math.round(-setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR * 10) / 10,
    stemHandlebarReachAdjust: REFERENCE_BAR_REACH_MM - input.handlebarReach,
    stemHandlebarWidthAdjust: 0,
    stemDrivetrainAdjust: -drivetrainHoodReach,
    stemTotalAdjust: 0,
    stemLength: bestMatch.roundedStem,
    stemAdvice: stemAdviceStr,
    effectiveReach,
    handlebarWidth: input.handlebarWidth,
    handlebarReach: input.handlebarReach,
    leverAngle,
    cockpitReachBonus,
    handlebarAdvice: '어깨폭 정렬 및 레버 꺾임 유효 리치 반영됨',
    drivetrain: input.drivetrain,
    drivetrainLabel: DRIVETRAIN_LABELS[input.drivetrain] ?? '기본',
    drivetrainHoodReach,
    drivetrainAdvice:
      drivetrainHoodReach !== 0
        ? `후드 편차 ${drivetrainHoodReach}mm 반영`
        : '표준 후드 적용',
    clipGuide: clipPosition === 'midfoot' ? 'Mid-foot' : '정석',
    clipGuideShort: clipPosition === 'midfoot' ? 'Mid-foot' : '정석',
    footSize: input.footSize && input.footSize > 0 ? input.footSize : null,
    usedArmEstimate: input.armInputMode === 'none',
    shoulderWidth: input.shoulderWidth ?? 40,
    seatTubeAngle: 73.5,
    legTypeLabel,
    armTypeLabel,
    bodyTypeSummary,
    currentBikeDiagnosis,
    cockpitTuningAdvice, // 💡 새롭게 추가된 피터의 튜닝 권고 메시지를 리턴 객체에 바인딩합니다.
  };
}
