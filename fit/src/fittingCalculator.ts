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
import { FRAME_DATASET, ENDURANCE_FRAME_DATASET } from './frameDataset';

// ============================================================
// 1. 상수 정의
// ============================================================
export const BASE_TOPCAP_MM = 10;
const USER_SPACER_MIN_MM = 0;
const USER_SPACER_MAX_MM = 25;

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
  const widthEffect = ((width - 400) / 20) * 5;
  const leverEffect = leverAngle === 'inward' ? 6 : 0;
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
    ridingStyle === 'performance'
      ? -10
      : ridingStyle === 'comfort' || ridingStyle === 'endurance'
      ? 5
      : 0;
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
  // 💡 [수정] 타겟 스택 산출 공식을 글로벌 표준(Inseam * 0.685) 기반으로 상향 안정화
  // 기존 공식의 맹점(신장 개입이 커 스택이 8~12mm 낮게 산출됨)을 수정하고,
  // 인심 비례식 85% + 신장 비례식 15% 가중치 혼합을 통해 극단적 체형 편차를 방어함.
  const rawLegStack = inseam * 6.85;
  const rawHeightStack = height * 3.25;
  const baseStack = Math.round(rawLegStack * 0.85 + rawHeightStack * 0.15);

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
  if (inseamRatio >= 46.8) legTypeLabel = '상체 대비 하체가 긴 체형 (Long Leg)';
  else if (inseamRatio <= 45.2)
    legTypeLabel = '하체 대비 상체가 긴 체형 (Long Torso)';

  let armTypeLabel = '';
  let bodyTypeSummary = '';

  if (armInputMode === 'none') {
    armTypeLabel = '팔 길이 미입력 (데이터 자동 추정)';
    bodyTypeSummary = `입력된 신장 및 인심 비율(${legTypeLabel})을 기반으로 상체 및 팔 길이를 역산하여 타겟 리치를 산출하였습니다.`;
  } else {
    const expectedArm = height * EXPECTED_ARM_RATIO;
    const armDelta = armLength - expectedArm;
    if (armDelta >= 1.5) armTypeLabel = '표준 대비 긴 팔 규격';
    else if (armDelta <= -1.5) armTypeLabel = '표준 대비 짧은 팔 규격';
    else armTypeLabel = '표준 팔 길이 규격';

    bodyTypeSummary = `하체/상체 비율은 ${legTypeLabel}에 해당하며, 팔 길이는 ${armTypeLabel}으로 확인됩니다.`;
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
  const idealFrameStack = targetStack - BASE_TOPCAP_MM;
  const idealFrameReach = targetReach;

  const sizeScore =
    Math.abs(frame.stackMm - idealFrameStack) * 1.5 +
    Math.abs(frame.reachMm - idealFrameReach) * 1.5;

  let bestStemAngle = -6;
  let angleStackEffect = 0;

  let rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM;
  let stemAnglePenalty = 0;

  if (rawSpacer < -5) {
    bestStemAngle = -10;
    angleStackEffect = -7;
    stemAnglePenalty = 5;
  }

  rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM - angleStackEffect;
  const actualSpacer = Math.max(
    USER_SPACER_MIN_MM,
    Math.min(USER_SPACER_MAX_MM, Math.round(rawSpacer / 5) * 5)
  );

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

// 💡 현재 보유 자전거 비교 진단
function diagnoseCurrentBike(
  current: CurrentBikeInput | undefined,
  idealTargetStack: number,
  idealTargetReach: number,
  idealSaddleHeight: number,
  idealBRPSetback: number,
  defaultBarReach: number,
  idealCrankLength: number,
  ridingStyle: RidingStyle
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
  const curSpacer = current.spacerHeight ?? 10;
  const curTopCap = current.topCapHeight ?? BASE_TOPCAP_MM;
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

  const validAngles = [curStemAngle, -6, -10, -17].filter(
    (a) => a <= 0 || a === curStemAngle
  );
  const anglesToTest = Array.from(new Set(validAngles));

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
          ? `추가 스페이서 없이 기본 탑캡(${curTopCap}mm)만 적용한 슬램드(Slammed) 세팅이 타겟 스택에 부합합니다.`
          : `현재 적용된 추가 스페이서(${curSpacer}mm) 세팅이 타겟 스택과 오차 범위 내에서 일치합니다.`;
    } else {
      const diff = recSpacer - curSpacer;
      spacerAdvice =
        recSpacer === 0
          ? `추가 스페이서를 모두 제거하고 기본 탑캡(${curTopCap}mm)만 유지하는 슬램드 세팅을 권장합니다.`
          : `현재 스템 각도(${
              curStemAngle > 0 ? `+${curStemAngle}` : curStemAngle
            }°)를 유지한 상태에서 추가 스페이서를 ${recSpacer}mm로 조정하십시오 (현재 대비 ${
              diff > 0 ? `+${diff}mm 증량` : `${Math.abs(diff)}mm 감산`
            }).`;
    }
  } else {
    spacerAdvice = `현재 스템 각도(${
      curStemAngle > 0 ? `+${curStemAngle}` : curStemAngle
    }°)로는 허용 스페이서 범위 내에서 타겟 스택 산출이 불가합니다. 스템 각도를 ${recAngle}°로 변경하고 추가 스페이서를 ${recSpacer}mm로 세팅할 것을 권장합니다.`;
  }

  let stemAdvice = '';
  const bonusComment =
    curCockpitReachBonus !== 0
      ? ` (조향부 유효 리치 보정치 ${
          curCockpitReachBonus > 0 ? '+' : ''
        }${curCockpitReachBonus}mm 산입 기준)`
      : '';

  if (curStem === recStemLength && curStemAngle === recAngle) {
    stemAdvice = `현재 장착된 ${curStem}mm 스템이 타겟 리치에 부합하므로 유지가 권장됩니다.${bonusComment}`;
  } else if (curStem === recStemLength && curStemAngle !== recAngle) {
    stemAdvice = `스템 길이는 적합하나 타겟 스택 도달을 위해 스템 각도를 ${recAngle}° 규격으로 교체할 것을 권장합니다.${bonusComment}`;
  } else {
    const diff = recStemLength - curStem;
    stemAdvice = `타겟 리치 도달을 위해 현재 ${curStem}mm 스템을 ${recStemLength}mm(${
      recAngle > 0 ? `+${recAngle}` : recAngle
    }°) 규격으로 교체할 것을 권장합니다 (현재 대비 ${
      diff > 0 ? `+${diff}mm 연장` : `${Math.abs(diff)}mm 단축`
    }).${bonusComment}`;
  }

  let saddleAdvice = '';
  let saddleHeightDiff: number | null = null;
  if (current.saddleHeight && current.saddleHeight > 0) {
    saddleHeightDiff = current.saddleHeight - idealSaddleHeight;
    if (Math.abs(saddleHeightDiff) <= 3) {
      saddleAdvice = `현재 안장 높이(${current.saddleHeight}mm)가 생체 역학적 타겟 수치와 오차 범위 내에서 일치합니다.`;
    } else if (saddleHeightDiff > 0) {
      saddleAdvice = `현재 안장 높이가 타겟 수치 대비 높습니다. ${idealSaddleHeight}mm로 하향 조정할 것을 권장합니다.`;
    } else {
      saddleAdvice = `현재 안장 높이가 타겟 수치 대비 낮아 페달링 효율 저하가 우려됩니다. ${idealSaddleHeight}mm로 상향 조정할 것을 권장합니다.`;
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
      seatpostAdvice = `⚠️ 싯튜브 각도(${curSTA}°)가 완만한 편으로, 0mm(제로 옵셋) 싯포스트를 적용하고 안장을 한계치까지 전진(${Math.round(
        neededRailForward
      )}mm)시켜야 타겟 BRP 도달이 가능합니다.`;
    } else {
      seatpostAdvice = `싯튜브 각도(${curSTA}°)를 고려할 때, 0mm(제로 옵셋) 싯포스트를 적용하고 안장 레일을 전진 세팅할 것을 권장합니다.`;
    }
  } else if (requiredOffsetFromAxis > 35) {
    isSTAProblematic = true;
    seatpostAdvice = `⚠️ 싯튜브 각도(${curSTA}°)가 가파른 편입니다. 타겟 BRP 도달 및 페달링 안정성 확보를 위해 25mm 이상의 롱 셋백 싯포스트 적용이 필수적입니다.`;
  } else if (requiredOffsetFromAxis >= 10 && requiredOffsetFromAxis <= 25) {
    seatpostAdvice = `싯튜브 각도가 이상적입니다. 표준적인 15~20mm 셋백 싯포스트를 적용하고 안장 레일을 중앙에 위치시키면 최적의 BRP가 산출됩니다.`;
  } else {
    seatpostAdvice = `0~15mm 셋백 싯포스트를 적용하고 레일 위치를 미세 조정하여 타겟 BRP 규격에 유연하게 대응할 수 있습니다.`;
  }

  const isFrameOversized = recRawSpacer < -5;
  const isFrameUndersized = recRawSpacer > 20;
  const isStemExtreme = recStemLength < 70 || recStemLength > 140;

  const isOptimal =
    Math.abs(stackDiff) <= 4 &&
    Math.abs(reachDiff) <= 5 &&
    !isFrameUndersized &&
    !isFrameOversized &&
    curStemAngle === recAngle;

  let status: 'optimal' | 'tunable' | 'excessive' = 'optimal';
  let statusLabel = '현재 세팅 최적화 완료';
  let summary =
    '현재 자전거의 컴포넌트 세팅이 라이더의 생체 역학적 타겟 수치와 오차 범위 내에서 일치합니다. 별도의 부품 교체나 조정이 요구되지 않습니다.';

  if (ridingStyle === 'endurance' && isFrameUndersized) {
    status = 'excessive';
    statusLabel = '프레임 지오메트리 한계 초과';
    summary =
      '타겟 라이딩 성향(엔듀런스) 대비 현재 보유하신 프레임(올라운드/레이스)의 헤드튜브가 지나치게 짧습니다. 조향부 내구성 저하 방지를 위해 엔듀런스 지오메트리 프레임으로의 변경을 강력히 권장합니다.';
    spacerAdvice = `요구 스페이서 적층량(+${recSpacer}mm)이 카본 스티어러 튜브의 구조적 안전 허용치(통상 25mm 이하)를 초과하므로 물리적 셋업이 불가합니다.`;
    stemAdvice = `플러스(+) 각도의 스템 조정을 통한 강제 스택 상향은 에어로다이나믹 저하 및 조향 밸런스 붕괴를 유발하므로 권장하지 않습니다.`;
  } else if (
    isFrameOversized ||
    isFrameUndersized ||
    isStemExtreme ||
    isSTAProblematic
  ) {
    status = 'excessive';
    statusLabel = isSTAProblematic
      ? '지오메트리 한계 초과 (전용 규격 요구)'
      : '프레임 체급 불일치 (규격 변경 권장)';
    summary = isSTAProblematic
      ? '프레임의 싯튜브 각도가 타겟 BRP 범위를 크게 벗어나며, 이를 보완하기 위해서는 특수 규격의 셋백 싯포스트 등 제한적인 컴포넌트 세팅이 요구됩니다.'
      : '현재 프레임 규격이 타겟 지오메트리의 안전 허용 오차를 초과합니다. 스템 및 스페이서의 극단적 조정을 통한 강제 세팅은 조향 안정성을 심각하게 저하시키므로 프레임 사이즈 조정을 권장합니다.';

    if (isFrameOversized)
      spacerAdvice = `추가 스페이서를 모두 제거(슬램드 세팅)하여도 타겟 수치 대비 콕핏 포지션이 높게 형성됩니다. (스택 과다)`;
    if (isFrameUndersized)
      spacerAdvice = `요구 스페이서(+${recSpacer}mm)가 안전 허용치를 초과하여 정상적인 조향부 셋업이 불가합니다.`;
    if (isStemExtreme)
      stemAdvice = `산출된 권장 스템 규격(${recStemLength}mm)이 일반적인 조향 한계(70~140mm)를 벗어나 조향 불안정을 유발합니다.`;
  } else if (!isOptimal) {
    status = 'tunable';
    statusLabel = '컴포넌트 미세 조정 필요';
    summary =
      '프레임 사이즈는 적합하나 콕핏 컴포넌트 세팅의 보정이 필요합니다. 제시된 스페이서 적층 두께 및 스템 규격 조정을 통해 타겟 지오메트리에 도달할 수 있습니다.';
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
        ? `안장을 ${Math.abs(diff)}mm 하향 조정 및 ${Math.abs(
            diff
          )}mm 전진 셋업 시`
        : `안장을 ${Math.abs(diff)}mm 상향 조정 및 ${Math.abs(
            diff
          )}mm 후퇴 셋업 시`;

    crankAdvice = `비권장 규격의 현재 크랭크(${current.crankLength}mm)를 임시로 유지할 경우, 고관절 가동 범위 보상을 위해 ${actionText} 유사한 페달링 궤적 확보가 가능합니다. (임시 타겟 안장높이: ${tempSaddleHeight}mm / 타겟 BRP 셋백: ${tempBRPSetback}mm)`;
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
    (ridingStyle === 'endurance' ? 25 : ridingStyle === 'comfort' ? 15 : -5);
  const targetReach =
    baseReach +
    (ridingStyle === 'endurance' ? -12 : ridingStyle === 'comfort' ? -10 : 5);

  const drivetrainHoodReach = DRIVETRAIN_HOOD_REACH[input.drivetrain] ?? 0;
  const cockpitReachBonus = getCockpitReachBonus(
    input.handlebarWidth,
    leverAngle
  );

  const targetDataset =
    ridingStyle === 'endurance' ? ENDURANCE_FRAME_DATASET : FRAME_DATASET;

  const candidates = targetDataset
    .map((frame) =>
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
    )
    .sort((a, b) => a.totalScore - b.totalScore);

  const bestMatch = candidates[0];
  const matchedFrame = bestMatch.frame;

  const isUpsizedFrame =
    matchedFrame.stackMm + BASE_TOPCAP_MM > targetStack + 5;
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
  let stemAdviceStr = `권장 스템 규격: ${bestMatch.roundedStem}mm / 장착 각도 ${recAngle}° (산출 수치: ${preciseStem}mm)`;

  if (cockpitReachBonus !== 0) {
    stemAdviceStr += ` [레버/핸들바 유효 리치 보정치 ${
      cockpitReachBonus > 0 ? '+' : ''
    }${cockpitReachBonus}mm 산입]`;
  }

  if (recAngle === -10) {
    stemAdviceStr += ` (타겟 스택 하향 조정을 위한 -10° 스템 권장)`;
  } else {
    if (bestMatch.actualSpacer === 0) {
      stemAdviceStr += ` (추가 스페이서가 불필요한 슬램드 세팅 적용)`;
    } else {
      stemAdviceStr += ` (+${bestMatch.actualSpacer}mm 추가 스페이서 적층 필요)`;
    }
  }

  let frameSizeAdviceStr = `신체 실측 데이터 기반 최적 매칭 프레임입니다.`;
  if (bestMatch.rawSpacerNeeded < -5 && recAngle === -6) {
    frameSizeAdviceStr = `⚠️ 프레임 스택 한계 초과: 슬램드 세팅 적용 시에도 타겟 스택 대비 포지션이 높게 형성됩니다.`;
  } else if (recAngle < -6) {
    frameSizeAdviceStr = `타겟 스택 보상을 위해 스템 각도를 -${Math.abs(
      recAngle
    )}도로 하향 조정한 매칭 결과입니다.`;
  }

  const currentBikeDiagnosis = diagnoseCurrentBike(
    input.currentBike,
    targetStack,
    targetReach,
    Math.round(saddleHeight),
    brpSetback,
    input.handlebarReach,
    crankLength,
    ridingStyle
  );

  let cockpitTuningAdvice: string | null = null;
  const totalCockpitExcess = drivetrainHoodReach + cockpitReachBonus;

  if (totalCockpitExcess >= 8 && bestMatch.requiredStem < 100) {
    cockpitTuningAdvice = `현재 핸들바 리치 및 레버 체결 각도로 인해 유효 리치가 과도하게 증가(+${totalCockpitExcess}mm)하여, 비정상적으로 짧은 스템 규격이 산출되었습니다. 프레임 사이즈를 변경하기 전, 레버 각도를 수평(Straight)으로 조정하거나 숏리치 핸들바로 교체하여 콕핏 유효 리치를 감소시킬 것을 강력히 권장합니다.`;
  }

  const referenceModelInfo =
    ridingStyle === 'endurance'
      ? '자이언트 디파이(Giant Defy) 지오메트리 기준 매칭'
      : '스페셜라이즈드 타막 SL9(Tarmac SL9) 지오메트리 기준 매칭';

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
        ? `표준 BRP 대비 후퇴 세팅 (+${Math.round(setbackTotalMm)}mm)`
        : setbackTotalMm < 0
        ? `표준 BRP 대비 전진 세팅 (${Math.round(setbackTotalMm)}mm)`
        : '표준 BRP 위치',
    setbackAdvice: `생체 역학적 최적화 BRP 도달 거리 (${brpSetback}mm)`,
    setbackFemur: null,
    brpSetback,
    saddleNoseSetback,
    crankLength,
    targetStack,
    targetReach,
    targetGeometryAdvice: referenceModelInfo,
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
    handlebarAdvice: '어깨너비 및 레버 꺾임 유효 리치 보정 데이터 반영 완료',
    drivetrain: input.drivetrain,
    drivetrainLabel: DRIVETRAIN_LABELS[input.drivetrain] ?? '기본',
    drivetrainHoodReach,
    drivetrainAdvice:
      drivetrainHoodReach !== 0
        ? `구동계 후드 편차 보정치 ${drivetrainHoodReach}mm 합산 반영`
        : '표준 그룹셋 후드 리치 적용',
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
    cockpitTuningAdvice,
  };
}
