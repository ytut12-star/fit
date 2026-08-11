import { useEffect, useRef } from 'react';
import type { FittingResult, FittingInput } from '../types';

interface PedalingSimulatorProps {
  result: FittingResult;
  input: FittingInput;
}

interface SimParams {
  // 프레임 (matchedFrame 기준 실측치)
  stackMm: number;
  reachMm: number;
  seatTubeAngleDeg: number;
  // 라이더 포지션
  saddleHeightMm: number;
  brpSetbackMm: number;
  crankLengthMm: number;
  // 다리
  inseamCm: number;
  calfLengthCm: number | null;
  footSizeMm: number;
  cleatOffsetMm: number;
  pedalStackCorrectionMm: number;
  // 상체/팔
  upperBodyCm: number;
  ridingStyle: 'performance' | 'comfort';
  armLengthCm: number;
  // 콕핏
  stemLengthMm: number;
  spacerHeightMm: number;
  handlebarReachMm: number;
  drivetrainHoodReachMm: number;
  stemAngleDeg: number;
}

// ============================================================
// fittingCalculator.ts와 동일한 상수/공식을 참조합니다.
// (계산기 파일을 import할 수 없는 순수 상수이므로 여기 복제 — 계산기 쪽 값이
//  바뀌면 이 파일의 HEAD_TUBE_ANGLE_DEG, EXPECTED_TORSO_RATIO, EXPECTED_ARM_RATIO도
//  같이 맞춰주세요.)
// ============================================================
const HEAD_TUBE_ANGLE_DEG = 73; // fittingCalculator.ts의 HEAD_TUBE_ANGLE_DEG와 동일
const EXPECTED_TORSO_RATIO = 0.52;
const EXPECTED_ARM_RATIO = 0.34;

// --- 다리/발 관련 인체 비율 상수 ---
// 인심(크로치~바닥) = 허벅지 + 종아리 + 발목높이 로 분해합니다.
// 종아리 실측값이 있으면 허벅지 = 인심 - 종아리 - 발목높이 로 역산하고,
// 없으면 (인심-발목높이)를 52:48로 분배합니다 (계산기의 femur 52% 기본값과 동일 철학).
const ANKLE_HEIGHT_MM = 70; // 발목(복사뼈) ~ 바닥(페달 sole) 수직 거리 표준 근사치
const HEEL_TO_ANKLE_RATIO = 0.20; // 발 길이 대비 뒤꿈치~발목축 비율 (해부학적 후퇴)
const CLEAT_FROM_HEEL_RATIO = 0.62; // 뒤꿈치~중족골(정석 클릿 위치) 비율

// --- 페달축 원 반지름 ---
const PEDAL_AXLE_BASE_RADIUS_MM = 12;

// --- 상체/팔 ---
const TORSO_LENGTH_RATIO = 0.58; // upperBody(키-인심) 대비 실제 몸통(엉덩이~어깨) 길이 비율
const TORSO_ANGLE_PERFORMANCE_DEG = 38; // 정석 퍼포먼스 포지션 상체각(수평 기준)
const TORSO_ANGLE_COMFORT_DEG = 48; // 정석 컴포트 포지션 상체각(수평 기준)
const UPPER_ARM_RATIO = 0.47;
const FOREARM_RATIO = 0.53;

// --- 레버(후드) ---
const LEVER_LENGTH_MM = 40; // 4cm

// --- 부품 실제 두께(mm) → 화면 선굵기 매핑용 ---
const TUBE_THICKNESS = {
  headtube: 45,
  downtube: 55,
  toptube: 35,
  seattube: 32,
  chainstay: 25,
  seatpost: 27.2,
  cockpit: 40, // 스템+바 구간
};

// 케이던스 30rpm: 1회전 = 2000ms
const CADENCE_PERIOD_MS = 2000;

function estimateArmCm(
  height: number,
  upperBody: number,
  armInputMode: FittingInput['armInputMode'],
  armLengthInput: number | null,
  wingspan: number | null
): number {
  if (armInputMode === 'arm' && armLengthInput && armLengthInput > 0) return armLengthInput;
  if (armInputMode === 'wingspan' && wingspan && wingspan > 0) return (wingspan - 35) / 2;
  const upperBodyDelta = upperBody - height * EXPECTED_TORSO_RATIO;
  return height * EXPECTED_ARM_RATIO + upperBodyDelta * 0.4;
}

function buildSimParams(result: FittingResult, input: FittingInput): SimParams | null {
  if (!input.height || !input.inseam) return null;
  const armLengthCm = estimateArmCm(input.height, result.upperBody, input.armInputMode, input.armLength, input.wingspan);

  return {
    stackMm: result.stack,
    reachMm: result.reach,
    seatTubeAngleDeg: result.matchedFrame.seatTubeAngle,
    saddleHeightMm: result.saddleHeight,
    brpSetbackMm: result.brpSetback,
    crankLengthMm: result.crankLength,
    inseamCm: input.inseam,
    calfLengthCm: input.calfLength,
    footSizeMm: result.footSize ?? 260,
    cleatOffsetMm: result.cleatOffset,
    pedalStackCorrectionMm: result.pedalStackCorrection,
    upperBodyCm: result.upperBody,
    ridingStyle: input.ridingStyle,
    armLengthCm,
    spacerHeightMm: result.spacerHeight,
    stemLengthMm: result.stemLength,
    handlebarReachMm: result.handlebarReach,
    drivetrainHoodReachMm: result.drivetrainHoodReach,
    stemAngleDeg: input.stemAngle ?? -6,
  };
}

function drawFittingRider(ctx: CanvasRenderingContext2D, w: number, h: number, params: SimParams, crankAngle: number) {
  ctx.clearRect(0, 0, w, h);

  // 1. 배경 격자
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // 2. 스케일 & BB 원점
  const totalHeightMm = params.saddleHeightMm + 680;
  const scale = (h * 0.62) / totalHeightMm;
  const cx = w * 0.38;
  const cy = h * 0.82;
  const px = (mm: number) => cx + mm * scale;
  const py = (mm: number) => cy - mm * scale;
  const tw = (mm: number) => Math.max(1.2, mm * scale);

  // 3. 프레임 지오메트리 (matchedFrame의 실제 Stack/Reach/SeatTubeAngle 사용)
  const seatTubeAngleRad = (params.seatTubeAngleDeg * Math.PI) / 180;
  const saddleDx = -Math.cos(seatTubeAngleRad) * params.saddleHeightMm;
  const saddleDy = Math.sin(seatTubeAngleRad) * params.saddleHeightMm;
  const saddleX = px(saddleDx);
  const saddleY = py(saddleDy);

  const headTopX = px(params.reachMm);
  const headTopY = py(params.stackMm);
  const headBottomY = headTopY + 30 * scale;

  const seatClusterX = headTopX - (params.reachMm - saddleDx) * 0.15;
  const seatClusterY = headTopY;

  // BRP (Biomechanical Reference Point) - 안장코 대신 이 지점이 다리/상체의 기준점
  const brpX = px(-params.brpSetbackMm);
  const brpY = saddleY;

  // 4. 휠 실루엣
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(px(-410), cy, 340 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px(580), cy, 340 * scale, 0, Math.PI * 2); ctx.stroke();

  // BB 센터
  ctx.fillStyle = '#27272a';
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();

  // 헤드튜브
  ctx.strokeStyle = '#71717a'; ctx.lineWidth = tw(TUBE_THICKNESS.headtube);
  ctx.beginPath(); ctx.moveTo(headTopX, headTopY - 15 * scale); ctx.lineTo(headTopX, headBottomY); ctx.stroke();

  // 시트튜브 / 다운튜브 / 탑튜브 / 체인스테이
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = tw(TUBE_THICKNESS.seattube);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(seatClusterX, seatClusterY); ctx.stroke();
  ctx.lineWidth = tw(TUBE_THICKNESS.downtube);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(headTopX, headTopY); ctx.stroke();
  ctx.lineWidth = tw(TUBE_THICKNESS.toptube);
  ctx.beginPath(); ctx.moveTo(seatClusterX, seatClusterY); ctx.lineTo(headTopX, headTopY); ctx.stroke();
  ctx.lineWidth = tw(TUBE_THICKNESS.chainstay);
  ctx.beginPath(); ctx.moveTo(px(-410), cy); ctx.lineTo(seatClusterX, seatClusterY); ctx.stroke();

  // 시트포스트 & 안장
  ctx.strokeStyle = '#71717a'; ctx.lineWidth = tw(TUBE_THICKNESS.seatpost);
  ctx.beginPath(); ctx.moveTo(seatClusterX, seatClusterY); ctx.lineTo(saddleX, saddleY); ctx.stroke();

  const saddleLength = 250 * scale;
  ctx.fillStyle = '#18181b';
  ctx.beginPath(); ctx.ellipse(saddleX, saddleY, saddleLength / 2, 7.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#71717a'; ctx.lineWidth = 1; ctx.stroke();

  // BRP 마커 (빨간 점 + 기준선)
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath(); ctx.arc(brpX, brpY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(244,63,94,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(brpX, brpY); ctx.lineTo(brpX, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(brpX, cy); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.setLineDash([]);

// ==========================================
  // 5. 다리/발 계산 준비
  // ==========================================
  
  // 💡 [수정 1] 해부학적 고관절(대퇴골두) 위치 세팅 (좌골결절 BRP 기준 살짝 앞/위)
  const hipX = brpX + 30 * scale;
  const hipY = brpY - 20 * scale; // 캔버스는 Y가 위로 갈수록 작아짐(-)

  const pedalX = cx + Math.cos(crankAngle) * params.crankLengthMm * scale;
  const pedalY = cy + Math.sin(crankAngle) * params.crankLengthMm * scale;

  // 💡 [수정 2] 다리 IK(역운동학) 뼈 길이 동적 보정 (황금 무릎 각도 140~145도 유지)
  // 단순히 인심에서 발목을 빼면 실제 인체 뼈대(Trochanteric Height)보다 짧아져 무릎이 과신전 됩니다.
  // 따라서 안장~페달까지의 '실제 도달 필요 거리(Extension)'를 기준으로 뼈 길이를 튜닝합니다.
  const maxLegExtension = params.saddleHeightMm + params.crankLengthMm - 45; // 45mm는 클릿/발목 굽힘 마진
  const inseamMm = params.inseamCm * 10;
  let thighMm: number;
  let shinMm: number;

  if (params.calfLengthCm && params.calfLengthCm > 0) {
    // 사용자가 종아리 길이를 입력한 경우, 그 '비율'을 뼈 길이에 반영
    const inputShinMm = params.calfLengthCm * 10;
    const shinRatio = inputShinMm / inseamMm;
    shinMm = maxLegExtension * shinRatio;
    thighMm = maxLegExtension * (1 - shinRatio);
  } else {
    // 입력값이 없으면 표준 인체 비율(52:48) 적용
    thighMm = maxLegExtension * 0.52;
    shinMm = maxLegExtension * 0.48;
  }

  // 페달축 원 반지름: 페달/클릿 시스템 스택에 비례
  const pedalRadiusMm = Math.max(6, PEDAL_AXLE_BASE_RADIUS_MM + params.pedalStackCorrectionMm);
  const pedalRadiusPx = pedalRadiusMm * scale;

  // 발(삼각형) 로컬 좌표 (페달축 중심 0,0 기준, 회전 전)
  const cleatFromHeelMm = params.footSizeMm * CLEAT_FROM_HEEL_RATIO + params.cleatOffsetMm;
  const heelLocalX = -cleatFromHeelMm * scale;
  const toeLocalX = heelLocalX + params.footSizeMm * scale;
  const soleLocalY = -pedalRadiusPx; // 발바닥은 페달축 원의 윗변에 접함
  const ankleOffsetMm = params.footSizeMm * HEEL_TO_ANKLE_RATIO;
  const ankleLocalX = heelLocalX + ankleOffsetMm * scale;
  const ankleLocalY = soleLocalY - ANKLE_HEIGHT_MM * scale;

  // 발목 각도: 크랭크 위치에 따라 자연스럽게 변화 (3시≈90°, 6시 약간 신전, 12시 약간 굴곡)
  const targetAnkleJointAngleDeg = 94.2 + 5.8 * Math.sin(crankAngle - 0.42);
  const targetAnkleJointAngleRad = (targetAnkleJointAngleDeg * Math.PI) / 180;
  const legAngleEst = Math.atan2(pedalY - hipY, pedalX - hipX);

  let footAngle = legAngleEst + targetAnkleJointAngleRad - Math.PI;
  let ankleX = pedalX + ankleLocalX * Math.cos(footAngle) - ankleLocalY * Math.sin(footAngle);
  let ankleY = pedalY + ankleLocalX * Math.sin(footAngle) + ankleLocalY * Math.cos(footAngle);

  const thighLen = thighMm * scale;
  const shinLen = shinMm * scale;
  const maxLegReach = (thighLen + shinLen) * 0.999;

  let kneeX = 0;
  let kneeY = 0;
  let kneeAngleRad = Math.PI;
  for (let pass = 0; pass < 2; pass++) {
    const legDx = ankleX - hipX;
    const legDy = ankleY - hipY;
    const legDist = Math.sqrt(legDx * legDx + legDy * legDy);
    const clampedDist = Math.min(legDist, maxLegReach * 0.998);

    const cosKnee = (thighLen * thighLen + shinLen * shinLen - clampedDist * clampedDist) / (2 * thighLen * shinLen);
    kneeAngleRad = Math.acos(Math.max(-1, Math.min(1, cosKnee)));
    const legBaseAngle = Math.atan2(legDy, legDx);
    const kneeOffset = Math.asin((shinLen / clampedDist) * Math.sin(kneeAngleRad));

    kneeX = hipX + Math.cos(legBaseAngle - kneeOffset) * thighLen;
    kneeY = hipY + Math.sin(legBaseAngle - kneeOffset) * thighLen;

    const actualShinAngle = Math.atan2(ankleY - kneeY, ankleX - kneeX);
    footAngle = actualShinAngle + targetAnkleJointAngleRad - Math.PI;
    ankleX = pedalX + ankleLocalX * Math.cos(footAngle) - ankleLocalY * Math.sin(footAngle);
    ankleY = pedalY + ankleLocalX * Math.sin(footAngle) + ankleLocalY * Math.cos(footAngle);
  }

  // 크랭크 암
  ctx.strokeStyle = '#e4e4e7'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pedalX, pedalY); ctx.stroke();

  // 페달축 원 (반지름 = 페달 스택 반영)
  ctx.strokeStyle = '#3f3f46'; ctx.fillStyle = 'rgba(63,63,70,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(pedalX, pedalY, pedalRadiusPx, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // 발(삼각형) 렌더링
  ctx.save();
  ctx.translate(pedalX, pedalY);
  ctx.rotate(footAngle);

  ctx.fillStyle = '#27272a'; ctx.strokeStyle = '#71717a'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(heelLocalX, soleLocalY);
  ctx.lineTo(toeLocalX, soleLocalY);
  ctx.lineTo(ankleLocalX, ankleLocalY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 클릿 위치 마커 (페달축 중심 = 클릿 접점)
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(0, soleLocalY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(kneeX, kneeY); ctx.stroke();
  ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(kneeX, kneeY); ctx.lineTo(ankleX, ankleY); ctx.stroke();

  const joints: [number, number, string][] = [
    [hipX, hipY, '#f43f5e'],
    [kneeX, kneeY, '#22d3ee'],
    [ankleX, ankleY, '#0891b2'],
  ];
  for (const [jx, jy, color] of joints) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(jx, jy, 4, 0, Math.PI * 2); ctx.fill();
  }
// ==========================================
  // 💡 6. 콕핏 (스티어러 튜브 연장 및 실제 스템 체결점 반영)
  // ==========================================
  const steererLeanDeg = 90 - HEAD_TUBE_ANGLE_DEG; // 수직선 기준 헤드튜브 기울기 (약 17도)
  const steererLeanRad = (steererLeanDeg * Math.PI) / 180;

  // 스페이서 높이 + 스템 클램프 두께의 절반(약 20mm)을 합산하여 스티어러 튜브 연장 길이 산출
  const steererExtMm = params.spacerHeightMm + 20; 

  // 실제 스템 중심선이 시작되는 좌표 (헤드튜브에서 스티어러 각도를 따라 위로 올라감)
  const stemStartMmX = params.reachMm - (steererExtMm * Math.sin(steererLeanRad));
  const stemStartMmY = params.stackMm + (steererExtMm * Math.cos(steererLeanRad));
  const stemStartX = px(stemStartMmX);
  const stemStartY = py(stemStartMmY);

  // 스템/핸들바 직선의 지면 대비 수평 각도 계산
  const cockpitAngleDeg = steererLeanDeg + params.stemAngleDeg;
  const cockpitAngleRad = (cockpitAngleDeg * Math.PI) / 180;

  const totalCockpitLenMm = params.stemLengthMm + params.handlebarReachMm + params.drivetrainHoodReachMm + LEVER_LENGTH_MM;
  const preLeverLenMm = totalCockpitLenMm - LEVER_LENGTH_MM;

  // 레버 시작점과 끝점 계산 (stemStart 기준)
  const leverStartMmX = stemStartMmX + preLeverLenMm * Math.cos(cockpitAngleRad);
  const leverStartMmY = stemStartMmY + preLeverLenMm * Math.sin(cockpitAngleRad);
  const leverStartX = px(leverStartMmX);
  const leverStartY = py(leverStartMmY);

  const handMmX = stemStartMmX + totalCockpitLenMm * Math.cos(cockpitAngleRad);
  const handMmY = stemStartMmY + totalCockpitLenMm * Math.sin(cockpitAngleRad);
  const handX = px(handMmX);
  const handY = py(handMmY);

  // 헤드튜브 상단 ~ 스템 시작점까지 이어지는 스페이서/스티어러 튜브 렌더링
  ctx.strokeStyle = '#06b6d4'; // 스페이서 구간 색상 (청록색)
  ctx.lineWidth = tw(TUBE_THICKNESS.headtube * 0.7);
  ctx.beginPath(); ctx.moveTo(headTopX, headTopY); ctx.lineTo(stemStartX, stemStartY); ctx.stroke();

  // 스템+바 구간 렌더링
  ctx.strokeStyle = '#a1a1aa'; ctx.lineWidth = tw(TUBE_THICKNESS.cockpit);
  ctx.beginPath(); ctx.moveTo(stemStartX, stemStartY); ctx.lineTo(leverStartX, leverStartY); ctx.stroke();
  
  // 레버(후드) 구간 렌더링
  ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = Math.max(2, tw(TUBE_THICKNESS.cockpit * 0.5));
  ctx.beginPath(); ctx.moveTo(leverStartX, leverStartY); ctx.lineTo(handX, handY); ctx.stroke();
// ==========================================
  // 7. 상체 (라이딩 스타일별 정석 각도, 실측 upperBody 길이)
  // ==========================================
  const torsoAngleDeg = params.ridingStyle === 'performance' ? TORSO_ANGLE_PERFORMANCE_DEG : TORSO_ANGLE_COMFORT_DEG;
  const torsoAngleRad = (torsoAngleDeg * Math.PI) / 180;
  const torsoLenMm = params.upperBodyCm * 10 * TORSO_LENGTH_RATIO;
  const torsoLen = torsoLenMm * scale;

  // 💡 [수정] 수평(지면) 기준 각도로 정상화 (X축은 cos, Y축은 sin)
  const shoulderX = hipX + Math.cos(torsoAngleRad) * torsoLen;
  const shoulderY = hipY - Math.sin(torsoAngleRad) * torsoLen; // 캔버스는 Y가 아래로 갈수록 커지므로 빼줌(-)

  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();

  // 8. 팔 (실측/추정 팔 길이 기반 IK)
  const armLen = params.armLengthCm * 10 * scale;
  const upperArmLen = armLen * UPPER_ARM_RATIO;
  const forearmLen = armLen * FOREARM_RATIO;

  const armDx = handX - shoulderX;
  const armDy = handY - shoulderY;
  const armDist = Math.sqrt(armDx * armDx + armDy * armDy);
  const clampedArmDist = Math.min(armDist, (upperArmLen + forearmLen) * 0.998);

  const cosElbow = (upperArmLen * upperArmLen + forearmLen * forearmLen - clampedArmDist * clampedArmDist) / (2 * upperArmLen * forearmLen);
  const elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
  const armBaseAngle = Math.atan2(armDy, armDx);
  const elbowOffset = Math.asin((forearmLen / clampedArmDist) * Math.sin(elbowAngle));

  const elbowX = shoulderX + Math.cos(armBaseAngle + elbowOffset) * upperArmLen;
  const elbowY = shoulderY + Math.sin(armBaseAngle + elbowOffset) * upperArmLen;

  ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(elbowX, elbowY); ctx.stroke();
  ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(elbowX, elbowY); ctx.lineTo(handX, handY); ctx.stroke();

  const upperJoints: [number, number, string][] = [
    [shoulderX, shoulderY, '#a78bfa'],
    [elbowX, elbowY, '#c4b5fd'],
    [handX, handY, '#f43f5e'],
  ];
  for (const [jx, jy, color] of upperJoints) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(jx, jy, 4, 0, Math.PI * 2); ctx.fill();
  }

  // 9. 라벨 & 실시간 무릎 각도
  const kneeAngleDeg = (kneeAngleRad * 180) / Math.PI;

  ctx.fillStyle = '#a1a1aa'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BB', cx, cy + 20);
  ctx.fillText('BRP', brpX, brpY - 12);
  ctx.fillText('레버', handX, handY - 12);
  ctx.fillText(`무릎 ${kneeAngleDeg.toFixed(0)}°`, kneeX + 26, kneeY);

  ctx.fillStyle = '#71717a'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(
    `헤드튜브-스페이서-스템-핸들바-후드 적층 구조 반영 (Stack: ${params.stackMm} / Reach: ${params.reachMm})`,
    12,
    24
  );
}

export function PedalingSimulator({ result, input }: PedalingSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<SimParams | null>(buildSimParams(result, input));
  const animRef = useRef<number>(0);

  paramsRef.current = buildSimParams(result, input);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();
    const angularSpeed = (2 * Math.PI) / CADENCE_PERIOD_MS;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const angle = elapsed * angularSpeed;
      const rect = canvas.getBoundingClientRect();
      if (paramsRef.current) {
        drawFittingRider(ctx, rect.width, rect.height, paramsRef.current, angle);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <ActivityIcon />
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">지오메트리 페달링 시뮬레이터</h3>
            <p className="text-[11px] text-zinc-500">헤드튜브-스페이서-스템-핸들바-후드 적층 구조가 반영된 2D 애니메이션</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          BRP 기준 콕핏 연동
        </span>
      </div>
      <canvas ref={canvasRef} className="h-[300px] w-full rounded-xl bg-zinc-950 sm:h-[380px]" />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-zinc-500 sm:grid-cols-5">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> BRP / 클릿
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400" /> 허벅지
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-600" /> 종아리
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-violet-400" /> 상체/팔
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> 레버(후드)
        </span>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
