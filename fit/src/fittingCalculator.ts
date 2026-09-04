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

export type Lang = 'ko' | 'en';

// ============================================================
// 💡 [i18n] 알고리즘 코어 내부 동적 번역 딕셔너리
// ============================================================
const T = {
  ko: {
    legLong: '상체 대비 하체가 긴 체형 (Long Leg)',
    legShort: '하체 대비 상체가 긴 체형 (Long Torso)',
    legStd: '표준 비율 체형',
    armAuto: '팔 길이 미입력 (데이터 자동 추정)',
    armLong: '표준 대비 긴 팔 규격',
    armShort: '표준 대비 짧은 팔 규격',
    armStd: '표준 팔 길이 규격',
    bodySumAuto: (leg: string) => `입력된 신장 및 인심 비율(${leg})을 기반으로 상체 및 팔 길이를 역산하여 타겟 리치를 산출하였습니다.`,
    bodySumMan: (leg: string, arm: string) => `하체/상체 비율은 ${leg}에 해당하며, 팔 길이는 ${arm}으로 확인됩니다.`,
    
    cbNoData: '데이터 없음',
    cbOptLabel: '현재 세팅 최적화 완료',
    cbOptSum: '현재 자전거의 컴포넌트 세팅이 라이더의 생체 역학적 타겟 수치와 오차 범위 내에서 일치합니다. 별도의 부품 교체나 조정이 요구되지 않습니다.',
    cbExcFrameUndersized: '프레임 지오메트리 한계 초과',
    cbExcFrameUndersizedSum: '타겟 라이딩 성향(엔듀런스) 대비 현재 보유하신 프레임(올라운드/레이스)의 헤드튜브가 지나치게 짧습니다. 조향부 내구성 저하 방지를 위해 엔듀런스 지오메트리 프레임으로의 변경을 강력히 권장합니다.',
    cbExcSpacerImp: (rec: number) => `요구 스페이서 적층량(+${rec}mm)이 카본 스티어러 튜브의 구조적 안전 허용치(통상 25mm 이하)를 초과하므로 물리적 셋업이 불가합니다.`,
    cbExcStemPos: '플러스(+) 각도의 스템 조정을 통한 강제 스택 상향은 에어로다이나믹 저하 및 조향 밸런스 붕괴를 유발하므로 권장하지 않습니다.',
    cbExcGeoLimit: '지오메트리 한계 초과 (전용 규격 요구)',
    cbExcMismatch: '프레임 체급 불일치 (규격 변경 권장)',
    cbExcSTASum: '프레임의 싯튜브 각도가 타겟 BRP 범위를 크게 벗어나며, 이를 보완하기 위해서는 특수 규격의 셋백 싯포스트 등 제한적인 컴포넌트 세팅이 요구됩니다.',
    cbExcSizeSum: '현재 프레임 규격이 타겟 지오메트리의 안전 허용 오차를 초과합니다. 스템 및 스페이서의 극단적 조정을 통한 강제 세팅은 조향 안정성을 심각하게 저하시키므로 프레임 사이즈 조정을 권장합니다.',
    cbExcSpacerSlam: '추가 스페이서를 모두 제거(슬램드 세팅)하여도 타겟 수치 대비 콕핏 포지션이 높게 형성됩니다. (스택 과다)',
    cbExcStemExt: (req: number) => `산출된 권장 스템 규격(${req}mm)이 일반적인 조향 한계(70~140mm)를 벗어나 조향 불안정을 유발합니다.`,
    cbTunableLabel: '컴포넌트 미세 조정 필요',
    cbTunableSum: '프레임 사이즈는 적합하나 콕핏 컴포넌트 세팅의 보정이 필요합니다. 제시된 스페이서 적층 두께 및 스템 규격 조정을 통해 타겟 지오메트리에 도달할 수 있습니다.',
    
    spcSlammedFit: (top: number) => `추가 스페이서 없이 기본 탑캡(${top}mm)만 적용한 슬램드(Slammed) 세팅이 타겟 스택에 부합합니다.`,
    spcMatch: (spc: number) => `현재 적용된 추가 스페이서(${spc}mm) 세팅이 타겟 스택과 오차 범위 내에서 일치합니다.`,
    spcSlammedReq: (top: number) => `추가 스페이서를 모두 제거하고 기본 탑캡(${top}mm)만 유지하는 슬램드 세팅을 권장합니다.`,
    spcAdjust: (ang: number, rec: number, diffStr: string) => `현재 스템 각도(${ang > 0 ? `+${ang}` : ang}°)를 유지한 상태에서 추가 스페이서를 ${rec}mm로 조정하십시오 (현재 대비 ${diffStr}).`,
    spcDiffUp: (diff: number) => `+${diff}mm 증량`,
    spcDiffDown: (diff: number) => `${Math.abs(diff)}mm 감산`,
    spcChange: (cur: number, recA: number, recS: number) => `현재 스템 각도(${cur > 0 ? `+${cur}` : cur}°)로는 허용 스페이서 범위 내에서 타겟 스택 산출이 불가합니다. 스템 각도를 ${recA}°로 변경하고 추가 스페이서를 ${recS}mm로 세팅할 것을 권장합니다.`,
    
    stemKeep: (stem: number, bonus: string) => `현재 장착된 ${stem}mm 스템이 타겟 리치에 부합하므로 유지가 권장됩니다.${bonus}`,
    stemChangeAng: (ang: number, bonus: string) => `스템 길이는 적합하나 타겟 스택 도달을 위해 스템 각도를 ${ang}° 규격으로 교체할 것을 권장합니다.${bonus}`,
    stemChangeAll: (cur: number, req: number, ang: number, diffStr: string, bonus: string) => `타겟 리치 도달을 위해 현재 ${cur}mm 스템을 ${req}mm(${ang > 0 ? `+${ang}` : ang}°) 규격으로 교체할 것을 권장합니다 (현재 대비 ${diffStr}).${bonus}`,
    stemDiffUp: (diff: number) => `+${diff}mm 연장`,
    stemDiffDown: (diff: number) => `${Math.abs(diff)}mm 단축`,
    stemBonus: (bonus: number) => ` (조향부 유효 리치 보정치 ${bonus > 0 ? '+' : ''}${bonus}mm 산입 기준)`,
    
    sadMatch: (h: number) => `현재 안장 높이(${h}mm)가 생체 역학적 타겟 수치와 오차 범위 내에서 일치합니다.`,
    sadHigh: (h: number) => `현재 안장 높이가 타겟 수치 대비 높습니다. ${h}mm로 하향 조정할 것을 권장합니다.`,
    sadLow: (h: number) => `현재 안장 높이가 타겟 수치 대비 낮아 페달링 효율 저하가 우려됩니다. ${h}mm로 상향 조정할 것을 권장합니다.`,
    
    postFwdLimit: (sta: number, fwd: number) => `⚠️ 싯튜브 각도(${sta}°)가 완만한 편으로, 0mm(제로 옵셋) 싯포스트를 적용하고 안장을 한계치까지 전진(${Math.round(fwd)}mm)시켜야 타겟 BRP 도달이 가능합니다.`,
    postFwd: (sta: number) => `싯튜브 각도(${sta}°)를 고려할 때, 0mm(제로 옵셋) 싯포스트를 적용하고 안장 레일을 전진 세팅할 것을 권장합니다.`,
    postBackLimit: (sta: number) => `⚠️ 싯튜브 각도(${sta}°)가 가파른 편입니다. 타겟 BRP 도달 및 페달링 안정성 확보를 위해 25mm 이상의 롱 셋백 싯포스트 적용이 필수적입니다.`,
    postIdeal: '싯튜브 각도가 이상적입니다. 표준적인 15~20mm 셋백 싯포스트를 적용하고 안장 레일을 중앙에 위치시키면 최적의 BRP가 산출됩니다.',
    postFlexible: '0~15mm 셋백 싯포스트를 적용하고 레일 위치를 미세 조정하여 타겟 BRP 규격에 유연하게 대응할 수 있습니다.',
    
    crankActionFwd: (diff: number) => `안장을 ${Math.abs(diff)}mm 하향 조정 및 ${Math.abs(diff)}mm 전진 셋업 시`,
    crankActionBack: (diff: number) => `안장을 ${Math.abs(diff)}mm 상향 조정 및 ${Math.abs(diff)}mm 후퇴 셋업 시`,
    crankTemp: (cur: number, action: string, h: number, set: number) => `비권장 규격의 현재 크랭크(${cur}mm)를 임시로 유지할 경우, 고관절 가동 범위 보상을 위해 ${action} 유사한 페달링 궤적 확보가 가능합니다. (임시 타겟 안장높이: ${h}mm / 타겟 BRP 셋백: ${set}mm)`,
    
    stemAdvBase: (r: number, a: number, p: number) => `권장 스템 규격: ${r}mm / 장착 각도 ${a}° (산출 수치: ${p}mm)`,
    stemAdvBonus: (b: number) => ` [레버/핸들바 유효 리치 보정치 ${b > 0 ? '+' : ''}${b}mm 산입]`,
    stemAdvLower: ' (타겟 스택 하향 조정을 위한 -10° 스템 권장)',
    stemAdvSlam: ' (추가 스페이서가 불필요한 슬램드 세팅 적용)',
    stemAdvSpc: (s: number) => ` (+${s}mm 추가 스페이서 적층 필요)`,
    
    frameAdvOpt: '신체 실측 데이터 기반 최적 매칭 프레임입니다.',
    frameAdvLimit: '⚠️ 프레임 스택 한계 초과: 슬램드 세팅 적용 시에도 타겟 스택 대비 포지션이 높게 형성됩니다.',
    frameAdvAng: (a: number) => `타겟 스택 보상을 위해 스템 각도를 -${Math.abs(a)}도로 하향 조정한 매칭 결과입니다.`,
    
    cockpitWarn: (stem: number, steps: string) => `⚠️ [조향 밸런스 경고] 타겟 리치 도달을 위한 요구 스템이 ${stem}mm로 산출되어 정상적인 조향 한계 범위를 벗어납니다. 프레임이나 구동계를 유지한 상태에서 조향 안정성을 확보하려면 다음 순서로 콕핏 세팅을 변경할 것을 권장합니다.\n\n${steps}`,
    cockpitActShort: '숏리치(70~75mm) 핸들바로 교체',
    cockpitActLong: '롱리치(80~85mm) 핸들바로 교체',
    cockpitActLever: '레버 안쪽 꺾기(Inward) 취소 및 수평(Straight) 원복',
    cockpitStep1: (a: string) => `1순위: ${a}\n`,
    cockpitStep2: (a: string) => `2순위: ${a}\n`,
    cockpitStepFinal: (a: string) => `최종: 위 콕핏 타협 후에도 조향 범위가 확보되지 않는다면 프레임 사이즈 ${a} 고려`,
    cockpitExcess: (exc: number) => `현재 핸들바 리치 및 레버 체결 각도로 인해 유효 리치가 과도하게 증가(+${exc}mm)하여, 짧은 스템 규격이 산출되었습니다. 조향성을 높이려면 레버 각도를 수평으로 조정하거나 숏리치 핸들바로 교체하는 것을 권장합니다.`,
    
    refDefy: '자이언트 디파이(Giant Defy) 지오메트리 기준 매칭',
    refTarmac: '스페셜라이즈드 타막 SL9(Tarmac SL9) 지오메트리 기준 매칭',
    
    setbackLabelBack: (v: number) => `표준 앵커 대비 후퇴 세팅 (+${v}mm)`,
    setbackLabelFwd: (v: number) => `표준 앵커 대비 전진 세팅 (${v}mm)`,
    setbackLabelStd: '표준 BRP 앵커 위치',
    setbackAdv: (v: number) => `신체 비례 정밀 역산 BRP 도달 거리 (${v}mm)`,
    
    hbAdv: '어깨너비 및 레버 꺾임 유효 리치 보정 데이터 반영 완료',
    dtAdvDev: (v: number) => `구동계 후드 편차 보정치 ${v}mm 합산 반영`,
    dtAdvStd: '표준 그룹셋 후드 리치 적용',
    clipMid: 'Mid-foot',
    clipStd: '정석'
  },
  en: {
    legLong: 'Long Leg / Short Torso',
    legShort: 'Short Leg / Long Torso',
    legStd: 'Standard Proportion',
    armAuto: 'Arm Length Not Provided (Auto-estimated)',
    armLong: 'Longer Arms than Standard',
    armShort: 'Shorter Arms than Standard',
    armStd: 'Standard Arm Length',
    bodySumAuto: (leg: string) => `Target reach calculated by reverse-engineering torso and arm length based on height and inseam ratio (${leg}).`,
    bodySumMan: (leg: string, arm: string) => `Leg/Torso ratio is ${leg}, and arm length is verified as ${arm}.`,
    
    cbNoData: 'No Data',
    cbOptLabel: 'Current Setup is Optimal',
    cbOptSum: 'Your current bike components match your biomechanical target within safe tolerances. No part changes required.',
    cbExcFrameUndersized: 'Frame Geometry Limit Exceeded',
    cbExcFrameUndersizedSum: 'The headtube of your current frame (All-round/Race) is too short for your target style (Endurance). Highly recommend switching to an endurance frame.',
    cbExcSpacerImp: (rec: number) => `Required spacers (+${rec}mm) exceed carbon steerer safety limits (usually 25mm max). Physical setup is not viable.`,
    cbExcStemPos: 'Forcing a higher stack with a positive (+) angle stem causes aerodynamic loss and steering imbalance. Not recommended.',
    cbExcGeoLimit: 'Geometry Limit Exceeded (Special Specs Req.)',
    cbExcMismatch: 'Frame Size Mismatch (Change Recommended)',
    cbExcSTASum: 'Seat tube angle deviates significantly from target BRP. Requires restrictive component tuning like a special setback seatpost.',
    cbExcSizeSum: 'Current frame size exceeds safe tolerances. Forcing the setup via extreme stem/spacer adjustments degrades steering stability.',
    cbExcSpacerSlam: 'Even with all extra spacers removed (slammed), the cockpit position is higher than the target. (Excessive stack)',
    cbExcStemExt: (req: number) => `Calculated stem size (${req}mm) is out of standard limits (70-140mm), causing steering instability.`,
    cbTunableLabel: 'Component Tuning Required',
    cbTunableSum: 'Frame size is suitable, but cockpit needs tuning. Adjust spacers and stem as recommended to reach your target geometry.',
    
    spcSlammedFit: (top: number) => `A slammed setup with only the base top cap (${top}mm) perfectly matches the target stack.`,
    spcMatch: (spc: number) => `Current extra spacers (${spc}mm) match the target stack within tolerance.`,
    spcSlammedReq: (top: number) => `Recommend removing all extra spacers for a slammed setup (base top cap ${top}mm only).`,
    spcAdjust: (ang: number, rec: number, diffStr: string) => `Maintain current stem angle (${ang > 0 ? `+${ang}` : ang}°) and adjust extra spacers to ${rec}mm (${diffStr}).`,
    spcDiffUp: (diff: number) => `add +${diff}mm`,
    spcDiffDown: (diff: number) => `remove ${Math.abs(diff)}mm`,
    spcChange: (cur: number, recA: number, recS: number) => `Current stem angle (${cur > 0 ? `+${cur}` : cur}°) cannot reach target stack safely. Change stem angle to ${recA}° and set extra spacers to ${recS}mm.`,
    
    stemKeep: (stem: number, bonus: string) => `Current ${stem}mm stem matches the target reach. Recommend keeping it.${bonus}`,
    stemChangeAng: (ang: number, bonus: string) => `Stem length is optimal, but replace with a ${ang}° stem to achieve the target stack.${bonus}`,
    stemChangeAll: (cur: number, req: number, ang: number, diffStr: string, bonus: string) => `Replace current ${cur}mm stem with a ${req}mm (${ang > 0 ? `+${ang}` : ang}°) stem to reach target reach (${diffStr}).${bonus}`,
    stemDiffUp: (diff: number) => `+${diff}mm longer`,
    stemDiffDown: (diff: number) => `${Math.abs(diff)}mm shorter`,
    stemBonus: (bonus: number) => ` (incl. cockpit effective reach correction ${bonus > 0 ? '+' : ''}${bonus}mm)`,
    
    sadMatch: (h: number) => `Current saddle height (${h}mm) matches the biomechanical target within tolerance.`,
    sadHigh: (h: number) => `Current saddle height is too high. Recommend lowering to ${h}mm.`,
    sadLow: (h: number) => `Current saddle height is too low, reducing efficiency. Recommend raising to ${h}mm.`,
    
    postFwdLimit: (sta: number, fwd: number) => `⚠️ Slack seat tube angle (${sta}°). A 0mm offset seatpost and pushing saddle forward to the limit (${Math.round(fwd)}mm) is required for target BRP.`,
    postFwd: (sta: number) => `Considering seat tube angle (${sta}°), a 0mm offset seatpost with forward saddle rails is recommended.`,
    postBackLimit: (sta: number) => `⚠️ Steep seat tube angle (${sta}°). A long setback seatpost (25mm+) is essential for target BRP and pedaling stability.`,
    postIdeal: 'Ideal seat tube angle. A standard 15-20mm setback seatpost with centered rails will yield the optimal BRP.',
    postFlexible: 'A 0-15mm setback seatpost with minor rail adjustments can flexibly accommodate the target BRP.',
    
    crankActionFwd: (diff: number) => `lowering saddle by ${Math.abs(diff)}mm and moving it forward by ${Math.abs(diff)}mm`,
    crankActionBack: (diff: number) => `raising saddle by ${Math.abs(diff)}mm and moving it backward by ${Math.abs(diff)}mm`,
    crankTemp: (cur: number, action: string, h: number, set: number) => `If temporarily keeping non-recommended crank (${cur}mm), a similar pedaling trajectory can be achieved by ${action}. (Temp Target Saddle: ${h}mm / Target BRP: ${set}mm)`,
    
    stemAdvBase: (r: number, a: number, p: number) => `Rec. Stem: ${r}mm / Angle: ${a}° (Calculated: ${p}mm)`,
    stemAdvBonus: (b: number) => ` [incl. lever/bar reach correction ${b > 0 ? '+' : ''}${b}mm]`,
    stemAdvLower: ' (-10° stem recommended to lower target stack)',
    stemAdvSlam: ' (Slammed setup, no extra spacers)',
    stemAdvSpc: (s: number) => ` (+${s}mm extra spacers required)`,
    
    frameAdvOpt: 'Optimal frame match based on your body measurements.',
    frameAdvLimit: '⚠️ Frame Stack Limit: Even slammed, the position is higher than your target stack.',
    frameAdvAng: (a: number) => `Match result requires lowering stem angle to -${Math.abs(a)}° to compensate for target stack.`,
    
    cockpitWarn: (stem: number, steps: string) => `⚠️ [Steering Balance] Target stem is calculated at ${stem}mm, exceeding standard limits. To maintain stability, recommend adjusting cockpit in this order:\n\n${steps}`,
    cockpitActShort: 'Replace with Short Reach (70-75mm) Handlebar',
    cockpitActLong: 'Replace with Long Reach (80-85mm) Handlebar',
    cockpitActLever: 'Revert inward levers to straight position',
    cockpitStep1: (a: string) => `1st Priority: ${a}\n`,
    cockpitStep2: (a: string) => `2nd Priority: ${a}\n`,
    cockpitStepFinal: (a: string) => `Final: If steering range is still insufficient, consider sizing ${a} the frame.`,
    cockpitExcess: (exc: number) => `Excessive effective reach (+${exc}mm) from current handlebar & lever angle resulted in a short stem. Adjust levers to straight or use a short-reach handlebar.`,
    
    refDefy: 'Matched to Giant Defy Geometry',
    refTarmac: 'Matched to Specialized Tarmac SL9 Geometry',
    
    setbackLabelBack: (v: number) => `Backward setup vs Std Anchor (+${v}mm)`,
    setbackLabelFwd: (v: number) => `Forward setup vs Std Anchor (${v}mm)`,
    setbackLabelStd: 'Standard BRP Anchor Position',
    setbackAdv: (v: number) => `Precisely calculated BRP reach based on body proportions (${v}mm)`,
    
    hbAdv: 'Shoulder width & inward lever effective reach correction applied',
    dtAdvDev: (v: number) => `Drivetrain hood deviation correction ${v}mm applied`,
    dtAdvStd: 'Standard groupset hood reach applied',
    clipMid: 'Mid-foot',
    clipStd: 'Standard'
  }
};

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

const EXPECTED_TORSO_RATIO = 0.535;
const EXPECTED_ARM_RATIO = 0.34;
const SETBACK_EFFECTIVE_REACH_FACTOR = 0.4;

const MIDFOOT_FIXED_OFFSET_MM = 12;

const DEBUG_MODE = false;

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
function estimateArm(height: number, upperBody: number, inputMode: string, inputLength: number | null, wingspan: number | null): number {
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
  return sizes.reduce((prev, curr) => Math.abs(curr - rawCrank) < Math.abs(prev - rawCrank) ? curr : prev);
}

function calculateCleatOffset(clipPosition: ClipPosition): number {
  return clipPosition === 'midfoot' ? MIDFOOT_FIXED_OFFSET_MM : 0;
}

function calculateSaddleHeight(inseam: number, crankLength: number, clipPosition: ClipPosition, footSize: number | null, cleatOffset: number, pedalStackCorrection: number) {
  let baseMm = inseam * 0.863 * 10 + (170 - crankLength) * 0.4;
  let clipCorrection = 0;
  if (clipPosition === 'midfoot') {
    baseMm -= 4;
    clipCorrection = -(cleatOffset * 0.5);
  } else {
    if (footSize && footSize > 0) {
      clipCorrection = (footSize - 260) * 0.15;
    }
  }
  return {
    saddleHeight: baseMm + clipCorrection + pedalStackCorrection,
    saddleHeightBaseMm: baseMm,
    saddleClipCorrection: clipCorrection,
  };
}

function calculateSetback(inseam: number, calfLength: number | null, footSize: number | null, ridingStyle: RidingStyle, clipPosition: ClipPosition, cleatOffset: number) {
  const REFERENCE_INSEAM_CM = 82.5; const REFERENCE_CALF_CM = 40.0; const REFERENCE_FOOT_SIZE_MM = 260; const REFERENCE_BRP_SETBACK_MM = 177;
  const INSEAM_FACTOR = 0.1; const CALF_RATIO_FACTOR = 300; const FOOT_SIZE_FACTOR = 0.3;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const inseamCorrection = clamp((inseam - REFERENCE_INSEAM_CM) * 10 * INSEAM_FACTOR, -5, 5);
  let calfCorrection = 0;
  if (calfLength && calfLength > 0) {
    const referenceCalfRatio = REFERENCE_CALF_CM / REFERENCE_INSEAM_CM;
    const actualCalfRatio = calfLength / inseam;
    calfCorrection = clamp((referenceCalfRatio - actualCalfRatio) * CALF_RATIO_FACTOR, -12, 12);
  }
  let footSizeCorrection = 0;
  if (footSize && footSize > 0) {
    footSizeCorrection = clamp((footSize - REFERENCE_FOOT_SIZE_MM) * FOOT_SIZE_FACTOR, -6, 6);
  }
  const styleCorrection = ridingStyle === 'performance' ? -10 : ridingStyle === 'comfort' || ridingStyle === 'endurance' ? 5 : 0;
  const cleatCorrection = clipPosition === 'midfoot' ? cleatOffset : 0;
  const rawBRPSetback = REFERENCE_BRP_SETBACK_MM + inseamCorrection + calfCorrection + footSizeCorrection + styleCorrection + cleatCorrection;
  const brpSetback = Math.round(clamp(rawBRPSetback, 140, 230));

  return { brpSetback, saddleNoseSetback: brpSetback - 115, setbackTotalMm: brpSetback - REFERENCE_BRP_SETBACK_MM, inseamCorrection: Math.round(inseamCorrection * 10) / 10, calfCorrection: Math.round(calfCorrection * 10) / 10, footSizeCorrection: Math.round(footSizeCorrection * 10) / 10, styleCorrection, cleatCorrection: Math.round(cleatCorrection * 10) / 10 };
}

function calculateBaseGeometry(inseam: number, height: number, upperBody: number, armLength: number) {
  const rawLegStack = inseam * 6.85;
  const rawHeightStack = height * 3.25;
  const baseStack = Math.round(rawLegStack * 0.85 + rawHeightStack * 0.15);
  const expectedTorso = height * EXPECTED_TORSO_RATIO;
  const expectedArm = height * EXPECTED_ARM_RATIO;
  const torsoDelta = upperBody - expectedTorso;
  const armDelta = armLength - expectedArm;
  const baseReach = Math.round(378 + (height - 175) * 1.2 + torsoDelta * 1.0 + armDelta * 1.0);
  return { baseStack, baseReach };
}

// 💡 다국어 파라미터(lang) 추가
function diagnoseBodyProportions(height: number, inseam: number, armLength: number, armInputMode: string, lang: Lang) {
  const inseamRatio = (inseam / height) * 100;
  let legTypeLabel = T[lang].legStd;
  if (inseamRatio >= 46.8) legTypeLabel = T[lang].legLong;
  else if (inseamRatio <= 45.8) legTypeLabel = T[lang].legShort;

  let armTypeLabel = '';
  let bodyTypeSummary = '';

  if (armInputMode === 'none') {
    armTypeLabel = T[lang].armAuto;
    bodyTypeSummary = T[lang].bodySumAuto(legTypeLabel);
  } else {
    const expectedArm = height * EXPECTED_ARM_RATIO;
    const armDelta = armLength - expectedArm;
    if (armDelta >= 1.5) armTypeLabel = T[lang].armLong;
    else if (armDelta <= -1.5) armTypeLabel = T[lang].armShort;
    else armTypeLabel = T[lang].armStd;
    bodyTypeSummary = T[lang].bodySumMan(legTypeLabel, armTypeLabel);
  }

  return { legTypeLabel, armTypeLabel, bodyTypeSummary };
}

function evaluateFrame(frame: FrameSizeSpec, baseStack: number, baseReach: number, targetStack: number, targetReach: number, handlebarReach: number, drivetrainHoodReach: number, ridingStyle: RidingStyle, cockpitReachBonus: number) {
  const idealFrameStack = targetStack - BASE_TOPCAP_MM;
  const baselineSpacerReachOffset = -BASE_TOPCAP_MM * HEAD_ANGLE_LEAN_RATIO;
  const idealFrameReach = targetReach - baselineSpacerReachOffset + (REFERENCE_BAR_REACH_MM - handlebarReach) - drivetrainHoodReach - cockpitReachBonus;
  const sizeScore = Math.abs(frame.stackMm - idealFrameStack) * 1.5 + Math.abs(frame.reachMm - idealFrameReach) * 1.5;

  let bestStemAngle = -6; let angleStackEffect = 0; let rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM; let stemAnglePenalty = 0;
  if (rawSpacer < -5) { bestStemAngle = -10; angleStackEffect = -7; stemAnglePenalty = 5; }
  rawSpacer = targetStack - frame.stackMm - BASE_TOPCAP_MM - angleStackEffect;
  const actualSpacer = Math.max(USER_SPACER_MIN_MM, Math.min(USER_SPACER_MAX_MM, Math.round(rawSpacer / 5) * 5));

  const effectiveStack = frame.stackMm + BASE_TOPCAP_MM + actualSpacer + angleStackEffect;
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
  const reqStemHorizontal = REFERENCE_STEM_MM + (targetReach - frame.reachMm) - spacerReachOffset + (REFERENCE_BAR_REACH_MM - handlebarReach) - drivetrainHoodReach - cockpitReachBonus;
  const stemAngleToGround = STEERER_LEAN_ANGLE + bestStemAngle;
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemBodyRaw = reqStemHorizontal / Math.cos(stemAngleRad);
  const roundedStem = Math.round(stemBodyRaw / 10) * 10;

  let stemScore = 0;
  if (stemBodyRaw >= 90 && stemBodyRaw <= 110) stemScore = 0;
  else if (stemBodyRaw >= 80 && stemBodyRaw < 90) stemScore = (90 - stemBodyRaw) * 1.5;
  else if (stemBodyRaw > 110 && stemBodyRaw <= 120) stemScore = (stemBodyRaw - 110) * 1.5;
  else if (stemBodyRaw < 80) stemScore = 15 + (80 - stemBodyRaw) * 5.0;
  else stemScore = 15 + (stemBodyRaw - 120) * 5.0;

  const totalScore = sizeScore + stackScore + negativeSpacerScore + spacerScore + reachScore + stemScore + stemAnglePenalty;
  const physicalFeasible = rawSpacer >= -15 && rawSpacer <= 35 && stemBodyRaw >= 70 && stemBodyRaw <= 140;
  const positionFeasible = Math.abs(stackMismatch) <= 15 && physicalFeasible;
  const preferred = rawSpacer >= -5 && rawSpacer <= 25 && stemBodyRaw >= 80 && stemBodyRaw <= 120 && positionFeasible;

  let fitStatus = 'oversized';
  if (preferred) fitStatus = 'ideal';
  else if (positionFeasible) fitStatus = 'acceptable';
  else if (!physicalFeasible) fitStatus = 'requires_excessive_adjustment';
  if (rawSpacer < -15 || stemBodyRaw < 70) fitStatus = 'undersized';

  return { frame, totalScore, rawSpacerNeeded: rawSpacer, actualSpacer, stackMismatch, spacerReachOffset, requiredStem: stemBodyRaw, roundedStem: Math.max(80, Math.min(130, roundedStem)), withinTolerance: physicalFeasible, fitStatus, recommendedStemAngle: bestStemAngle, angleStackEffect } as any;
}

// 💡 다국어 파라미터(lang) 추가
function diagnoseCurrentBike(current: CurrentBikeInput | undefined, idealTargetStack: number, idealTargetReach: number, idealSaddleHeight: number, idealBRPSetback: number, defaultBarReach: number, idealCrankLength: number, ridingStyle: RidingStyle, lang: Lang): CurrentBikeDiagnosis {
  if (!current || !current.stack || !current.reach) {
    return { hasData: false, stackDiff: 0, reachDiff: 0, saddleHeightDiff: null, seatTubeAngleUsed: 73.5, status: 'optimal', statusLabel: T[lang].cbNoData, spacerAdvice: '', stemAdvice: '', saddleAdvice: '', seatpostAdvice: '', summary: '', crankAdvice: '' };
  }

  const curStack = current.stack; const curReach = current.reach; const curSpacer = current.spacerHeight ?? 10; const curTopCap = current.topCapHeight ?? BASE_TOPCAP_MM; const curStem = current.stemLength ?? 100; const curStemAngle = current.stemAngle ?? -6; const curBarReach = current.handlebarReach ?? defaultBarReach; const curDrivetrainReach = DRIVETRAIN_HOOD_REACH[current.drivetrain] ?? 0;
  const curCockpitReachBonus = getCockpitReachBonus(current.handlebarWidth ?? 400, current.leverAngle ?? 'straight');
  const curSTA = current.seatTubeAngle && current.seatTubeAngle > 0 ? current.seatTubeAngle : 73.5;
  const effectiveSaddleHeight = current.saddleHeight && current.saddleHeight > 0 ? current.saddleHeight : idealSaddleHeight;

  const validAngles = [curStemAngle, -6, -10, -17].filter((a) => a <= 0 || a === curStemAngle);
  const anglesToTest = Array.from(new Set(validAngles));

  let bestCombo: any = null; let fallbackCombo: any = null; let minFallbackScore = Infinity;

  for (const angle of anglesToTest) {
    let effect = 0; if (angle === 6) effect = 21; else if (angle === -10) effect = -7; else if (angle === -17) effect = -19;
    const rawSpacer = idealTargetStack - curStack - curTopCap - effect;
    const spacer = Math.max(0, Math.round(rawSpacer / 5) * 5);
    const angleRad = (STEERER_LEAN_ANGLE + angle) * (Math.PI / 180);
    const totalSteererStack = curTopCap + spacer;
    const spacerReachOffset = -totalSteererStack * HEAD_ANGLE_LEAN_RATIO;
    const reqStemHorizontal = REFERENCE_STEM_MM + (idealTargetReach - curReach) - spacerReachOffset + (REFERENCE_BAR_REACH_MM - curBarReach) - curDrivetrainReach - curCockpitReachBonus;
    const reqStem = Math.round(reqStemHorizontal / Math.cos(angleRad) / 10) * 10;
    const isSpacerValid = rawSpacer >= -3 && spacer <= 20;
    const isStemValid = reqStem >= 70 && reqStem <= 130;
    const combo = { angle, spacer, reqStem, rawSpacer };
    if (isSpacerValid && isStemValid && !bestCombo) { bestCombo = combo; break; }
    const score = Math.abs(rawSpacer - 5) + Math.abs(reqStem - 100);
    if (score < minFallbackScore) { minFallbackScore = score; fallbackCombo = combo; }
  }

  const finalCombo = bestCombo || fallbackCombo;
  const { angle: recAngle, spacer: recSpacer, reqStem: recStemLength, rawSpacer: recRawSpacer } = finalCombo;

  let curAngleStackEffect = 0;
  if (curStemAngle === 6) curAngleStackEffect = 21; else if (curStemAngle === -10) curAngleStackEffect = -7; else if (curStemAngle === -17) curAngleStackEffect = -19;

  const curEffectiveStack = curStack + curTopCap + curSpacer + curAngleStackEffect;
  const stackDiff = curEffectiveStack - idealTargetStack;
  const curAngleRad = (STEERER_LEAN_ANGLE + curStemAngle) * (Math.PI / 180);
  const curStemHorizontal = curStem * Math.cos(curAngleRad);
  const curEffectiveReach = curReach - (curTopCap + curSpacer) * HEAD_ANGLE_LEAN_RATIO + curStemHorizontal + curBarReach + curDrivetrainReach + curCockpitReachBonus;

  const recAngleRad = (STEERER_LEAN_ANGLE + recAngle) * (Math.PI / 180);
  const idealStemHorizontal = recStemLength * Math.cos(recAngleRad);
  const idealEffectiveReach = curReach - (curTopCap + recSpacer) * HEAD_ANGLE_LEAN_RATIO + idealStemHorizontal + curBarReach + curDrivetrainReach + curCockpitReachBonus;
  const reachDiff = curEffectiveReach - idealEffectiveReach;

  let spacerAdvice = '';
  if (curStemAngle === recAngle) {
    if (curSpacer === recSpacer) {
      spacerAdvice = recSpacer === 0 ? T[lang].spcSlammedFit(curTopCap) : T[lang].spcMatch(curSpacer);
    } else {
      const diff = recSpacer - curSpacer;
      spacerAdvice = recSpacer === 0 ? T[lang].spcSlammedReq(curTopCap) : T[lang].spcAdjust(curStemAngle, recSpacer, diff > 0 ? T[lang].spcDiffUp(diff) : T[lang].spcDiffDown(diff));
    }
  } else {
    spacerAdvice = T[lang].spcChange(curStemAngle, recAngle, recSpacer);
  }

  let stemAdvice = '';
  const bonusComment = curCockpitReachBonus !== 0 ? T[lang].stemBonus(curCockpitReachBonus) : '';

  if (curStem === recStemLength && curStemAngle === recAngle) {
    stemAdvice = T[lang].stemKeep(curStem, bonusComment);
  } else if (curStem === recStemLength && curStemAngle !== recAngle) {
    stemAdvice = T[lang].stemChangeAng(recAngle, bonusComment);
  } else {
    const diff = recStemLength - curStem;
    stemAdvice = T[lang].stemChangeAll(curStem, recStemLength, recAngle, diff > 0 ? T[lang].stemDiffUp(diff) : T[lang].stemDiffDown(diff), bonusComment);
  }

  let saddleAdvice = '';
  let saddleHeightDiff: number | null = null;
  if (current.saddleHeight && current.saddleHeight > 0) {
    saddleHeightDiff = current.saddleHeight - idealSaddleHeight;
    if (Math.abs(saddleHeightDiff) <= 3) saddleAdvice = T[lang].sadMatch(current.saddleHeight);
    else if (saddleHeightDiff > 0) saddleAdvice = T[lang].sadHigh(idealSaddleHeight);
    else saddleAdvice = T[lang].sadLow(idealSaddleHeight);
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
      seatpostAdvice = T[lang].postFwdLimit(curSTA, neededRailForward);
    } else {
      seatpostAdvice = T[lang].postFwd(curSTA);
    }
  } else if (requiredOffsetFromAxis > 35) {
    isSTAProblematic = true;
    seatpostAdvice = T[lang].postBackLimit(curSTA);
  } else if (requiredOffsetFromAxis >= 10 && requiredOffsetFromAxis <= 25) {
    seatpostAdvice = T[lang].postIdeal;
  } else {
    seatpostAdvice = T[lang].postFlexible;
  }

  const isFrameOversized = recRawSpacer < -5;
  const isFrameUndersized = recRawSpacer > 20;
  const isStemExtreme = recStemLength < 70 || recStemLength > 140;

  const isOptimal = Math.abs(stackDiff) <= 4 && Math.abs(reachDiff) <= 5 && !isFrameUndersized && !isFrameOversized && curStemAngle === recAngle;

  let status: 'optimal' | 'tunable' | 'excessive' = 'optimal';
  let statusLabel = T[lang].cbOptLabel;
  let summary = T[lang].cbOptSum;

  if (ridingStyle === 'endurance' && isFrameUndersized) {
    status = 'excessive';
    statusLabel = T[lang].cbExcFrameUndersized;
    summary = T[lang].cbExcFrameUndersizedSum;
    spacerAdvice = T[lang].cbExcSpacerImp(recSpacer);
    stemAdvice = T[lang].cbExcStemPos;
  } else if (isFrameOversized || isFrameUndersized || isStemExtreme || isSTAProblematic) {
    status = 'excessive';
    statusLabel = isSTAProblematic ? T[lang].cbExcGeoLimit : T[lang].cbExcMismatch;
    summary = isSTAProblematic ? T[lang].cbExcSTASum : T[lang].cbExcSizeSum;
    if (isFrameOversized) spacerAdvice = T[lang].cbExcSpacerSlam;
    if (isFrameUndersized) spacerAdvice = T[lang].cbExcSpacerImp(recSpacer);
    if (isStemExtreme) stemAdvice = T[lang].cbExcStemExt(recStemLength);
  } else if (!isOptimal) {
    status = 'tunable';
    statusLabel = T[lang].cbTunableLabel;
    summary = T[lang].cbTunableSum;
  }

  let crankAdvice = '';
  if (current.crankLength && current.crankLength > 0 && current.crankLength !== idealCrankLength) {
    const diff = current.crankLength - idealCrankLength;
    const tempSaddleHeight = idealSaddleHeight - diff;
    const tempBRPSetback = idealBRPSetback - diff;
    const actionText = diff > 0 ? T[lang].crankActionFwd(diff) : T[lang].crankActionBack(diff);
    crankAdvice = T[lang].crankTemp(current.crankLength, actionText, tempSaddleHeight, tempBRPSetback);
  }

  return { hasData: true, stackDiff, reachDiff, saddleHeightDiff, seatTubeAngleUsed: curSTA, status, statusLabel, spacerAdvice, stemAdvice, saddleAdvice, seatpostAdvice, summary, crankAdvice };
}

// ============================================================
// 4. 메인 계산 파이프라인 (💡 lang 파라미터 추가)
// ============================================================
export function calculateFitting(input: FittingInput, lang: Lang = 'ko'): FittingResult | null {
  const { height, inseam, ridingStyle, clipPosition, pedalSystem, armInputMode, leverAngle = 'straight' } = input;
  if (!height || !inseam || height <= 0 || inseam <= 0) return null;

  const upperBody = height - inseam;
  const armLength = estimateArm(height, upperBody, armInputMode, input.armLength, input.wingspan);
  const crankLength = calculateCrankLength(inseam);
  const cleatOffset = calculateCleatOffset(clipPosition);

  const { saddleHeight, saddleHeightBaseMm, saddleClipCorrection } = calculateSaddleHeight(inseam, crankLength, clipPosition, input.footSize, cleatOffset, PEDAL_STACK_CORRECTION[pedalSystem] ?? 0);
  const { brpSetback, saddleNoseSetback, setbackTotalMm, inseamCorrection, calfCorrection, footSizeCorrection, styleCorrection, cleatCorrection } = calculateSetback(inseam, input.calfLength, input.footSize, ridingStyle, clipPosition, cleatOffset);
  const { baseStack, baseReach } = calculateBaseGeometry(inseam, height, upperBody, armLength);
  const { legTypeLabel, armTypeLabel, bodyTypeSummary } = diagnoseBodyProportions(height, inseam, armLength, armInputMode, lang);

  const targetStack = baseStack + (ridingStyle === 'endurance' ? 25 : ridingStyle === 'comfort' ? 15 : -5);
  const targetReach = baseReach + (ridingStyle === 'endurance' ? -12 : ridingStyle === 'comfort' ? -10 : 5);
  const drivetrainHoodReach = DRIVETRAIN_HOOD_REACH[input.drivetrain] ?? 0;
  const cockpitReachBonus = getCockpitReachBonus(input.handlebarWidth, leverAngle);

  const targetDataset = ridingStyle === 'endurance' ? ENDURANCE_FRAME_DATASET : FRAME_DATASET;
  const candidates = targetDataset.map((frame) => evaluateFrame(frame, baseStack, baseReach, targetStack, targetReach, input.handlebarReach, drivetrainHoodReach, ridingStyle, cockpitReachBonus)).sort((a, b) => a.totalScore - b.totalScore);

  const bestMatch = candidates[0];
  const matchedFrame = bestMatch.frame;
  const isUpsizedFrame = matchedFrame.stackMm + BASE_TOPCAP_MM > targetStack + 5;
  const effectiveStack = matchedFrame.stackMm + BASE_TOPCAP_MM + bestMatch.actualSpacer + bestMatch.angleStackEffect;
  const stemAngleToGround = STEERER_LEAN_ANGLE + bestMatch.recommendedStemAngle;
  const stemAngleRad = stemAngleToGround * (Math.PI / 180);
  const stemHorizontalRun = bestMatch.roundedStem * Math.cos(stemAngleRad);
  const effectiveReach = Math.round(matchedFrame.reachMm + bestMatch.spacerReachOffset + stemHorizontalRun + input.handlebarReach + drivetrainHoodReach + cockpitReachBonus + setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR);

  const recAngle = bestMatch.recommendedStemAngle;
  const preciseStem = Math.round(bestMatch.requiredStem * 10) / 10;
  let stemAdviceStr = T[lang].stemAdvBase(bestMatch.roundedStem, recAngle, preciseStem);

  if (cockpitReachBonus !== 0) {
    stemAdviceStr += T[lang].stemAdvBonus(cockpitReachBonus);
  }

  if (recAngle === -10) {
    stemAdviceStr += T[lang].stemAdvLower;
  } else {
    if (bestMatch.actualSpacer === 0) stemAdviceStr += T[lang].stemAdvSlam;
    else stemAdviceStr += T[lang].stemAdvSpc(bestMatch.actualSpacer);
  }

  let frameSizeAdviceStr = T[lang].frameAdvOpt;
  if (bestMatch.rawSpacerNeeded < -5 && recAngle === -6) {
    frameSizeAdviceStr = T[lang].frameAdvLimit;
  } else if (recAngle < -6) {
    frameSizeAdviceStr = T[lang].frameAdvAng(recAngle);
  }

  const currentBikeDiagnosis = diagnoseCurrentBike(input.currentBike, targetStack, targetReach, Math.round(saddleHeight), brpSetback, input.handlebarReach, crankLength, ridingStyle, lang);

  let cockpitTuningAdvice: string | null = null;
  const isStemTooShort = bestMatch.roundedStem < 80;
  const isStemTooLong = bestMatch.roundedStem > 120;

  if (isStemTooShort || isStemTooLong) {
    const handleAction = isStemTooShort ? T[lang].cockpitActShort : T[lang].cockpitActLong;
    const leverAction = isStemTooShort && leverAngle === 'inward' ? T[lang].cockpitActLever : null;

    let adviceSteps = T[lang].cockpitStep1(handleAction);
    if (leverAction) adviceSteps += T[lang].cockpitStep2(leverAction);
    adviceSteps += T[lang].cockpitStepFinal(isStemTooShort ? 'Down' : 'Up'); // 한국어/영어 범용(다운/업, Down/Up)

    cockpitTuningAdvice = T[lang].cockpitWarn(bestMatch.roundedStem, adviceSteps);
  } else {
    const totalCockpitExcess = drivetrainHoodReach + cockpitReachBonus;
    if (totalCockpitExcess >= 8 && bestMatch.requiredStem < 100) {
      cockpitTuningAdvice = T[lang].cockpitExcess(totalCockpitExcess);
    }
  }

  const referenceModelInfo = ridingStyle === 'endurance' ? T[lang].refDefy : T[lang].refTarmac;

  return {
    upperBody: Math.round(upperBody * 10) / 10, cleatOffset: Math.round(cleatOffset * 10) / 10, saddleHeight: Math.round(saddleHeight), saddleHeightBase: Math.round(saddleHeightBaseMm), saddleCrankCorrection: Math.round((170 - crankLength) * 0.4), saddleClipCorrection: Math.round(saddleClipCorrection * 10) / 10, pedalStackCorrection: PEDAL_STACK_CORRECTION[pedalSystem] ?? 0,
    setbackBaseMm: 177, setbackClipCorrection: cleatCorrection, setbackTotalMm: Math.round(setbackTotalMm * 10) / 10,
    setbackLabel: setbackTotalMm > 0 ? T[lang].setbackLabelBack(Math.round(setbackTotalMm)) : setbackTotalMm < 0 ? T[lang].setbackLabelFwd(Math.round(setbackTotalMm)) : T[lang].setbackLabelStd,
    setbackAdvice: T[lang].setbackAdv(brpSetback),
    setbackFemur: null, brpSetback, saddleNoseSetback, crankLength, targetStack, targetReach, targetGeometryAdvice: referenceModelInfo, recommendedFrameSize: matchedFrame.name, matchedFrame, frameCandidates: candidates, isUpsizedFrame, baseStack, baseReach, stack: matchedFrame.stackMm, reach: matchedFrame.reachMm, frameSizeAdvice: frameSizeAdviceStr,
    strRatio: Math.round((matchedFrame.stackMm / matchedFrame.reachMm) * 100) / 100, spacerHeight: bestMatch.actualSpacer, topCapHeight: BASE_TOPCAP_MM, effectiveStack, spacerReachOffset: Math.round(bestMatch.spacerReachOffset), stemBaseLength: Math.round(bestMatch.requiredStem), stemSetbackAdjust: Math.round(-setbackTotalMm * SETBACK_EFFECTIVE_REACH_FACTOR * 10) / 10, stemHandlebarReachAdjust: REFERENCE_BAR_REACH_MM - input.handlebarReach, stemHandlebarWidthAdjust: 0, stemDrivetrainAdjust: -drivetrainHoodReach, stemTotalAdjust: 0, stemLength: bestMatch.roundedStem, stemAdvice: stemAdviceStr, effectiveReach, handlebarWidth: input.handlebarWidth, handlebarReach: input.handlebarReach, leverAngle, cockpitReachBonus,
    handlebarAdvice: T[lang].hbAdv,
    drivetrain: input.drivetrain,
    drivetrainLabel: lang === 'ko' ? DRIVETRAIN_LABELS[input.drivetrain] ?? '기본' : (input.drivetrain === 'shimano_11s' ? 'Shimano 11s' : input.drivetrain === 'shimano_12s_di2' ? 'Shimano 12s Di2' : 'SRAM AXS'),
    drivetrainHoodReach,
    drivetrainAdvice: drivetrainHoodReach !== 0 ? T[lang].dtAdvDev(drivetrainHoodReach) : T[lang].dtAdvStd,
    clipGuide: clipPosition === 'midfoot' ? T[lang].clipMid : T[lang].clipStd,
    clipGuideShort: clipPosition === 'midfoot' ? T[lang].clipMid : T[lang].clipStd,
    footSize: input.footSize && input.footSize > 0 ? input.footSize : null, usedArmEstimate: input.armInputMode === 'none', shoulderWidth: input.shoulderWidth ?? 40, seatTubeAngle: 73.5, legTypeLabel, armTypeLabel, bodyTypeSummary, currentBikeDiagnosis, cockpitTuningAdvice,
  };
}
