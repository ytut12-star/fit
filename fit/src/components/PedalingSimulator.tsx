import { useEffect, useRef } from 'react';
import type { FittingResult, FittingInput } from '../types';

interface PedalingSimulatorProps {
  result: FittingResult;
  input: FittingInput;
}

interface SimParams {
  stackMm: number;
  reachMm: number;
  seatTubeAngleDeg: number;
  saddleHeightMm: number;
  brpSetbackMm: number;
  crankLengthMm: number;
  inseamCm: number;
  calfLengthCm: number | null;
  footSizeMm: number;
  cleatOffsetMm: number;
  pedalStackCorrectionMm: number;
  upperBodyCm: number;
  ridingStyle: 'performance' | 'comfort' | 'endurance'; // 💡 endurance 타입 추가
  armLengthCm: number;
  stemLengthMm: number;
  spacerHeightMm: number;
  handlebarReachMm: number;
  drivetrainHoodReachMm: number;
  stemAngleDeg: number;
}

// ============================================================
// 상수 정의
// ============================================================
const HEAD_TUBE_ANGLE_DEG = 73;
const EXPECTED_TORSO_RATIO = 0.52;
const EXPECTED_ARM_RATIO = 0.34;

const ANKLE_HEIGHT_MM = 70;
const HEEL_TO_ANKLE_RATIO = 0.2;
const CLEAT_FROM_HEEL_RATIO = 0.62;
const PEDAL_AXLE_BASE_RADIUS_MM = 12;

const TORSO_LENGTH_RATIO = 0.52;
const UPPER_ARM_RATIO = 0.47;
const FOREARM_RATIO = 0.53;
const LEVER_LENGTH_MM = 40;

const TUBE_THICKNESS = {
  headtube: 45,
  downtube: 55,
  toptube: 35,
  seattube: 32,
  chainstay: 25,
  seatpost: 27.2,
  cockpit: 40,
};

const CADENCE_PERIOD_MS = 2000;

function estimateArmCm(
  height: number,
  upperBody: number,
  armInputMode: FittingInput['armInputMode'],
  armLengthInput: number | null,
  wingspan: number | null
): number {
  if (armInputMode === 'arm' && armLengthInput && armLengthInput > 0)
    return armLengthInput;
  if (armInputMode === 'wingspan' && wingspan && wingspan > 0) {
    const baseArm = height * EXPECTED_ARM_RATIO;
    const wingDelta = wingspan - height;
    return baseArm + wingDelta / 2;
  }
  const upperBodyDelta = upperBody - height * EXPECTED_TORSO_RATIO;
  return height * EXPECTED_ARM_RATIO + upperBodyDelta * 0.4;
}

function buildSimParams(
  result: FittingResult,
  input: FittingInput
): SimParams | null {
  if (!input.height || !input.inseam) return null;
  const armLengthCm = estimateArmCm(
    input.height,
    result.upperBody,
    input.armInputMode,
    input.armLength,
    input.wingspan
  );

  return {
    stackMm: result.stack,
    reachMm: result.reach,
    seatTubeAngleDeg: result.matchedFrame.seatTubeAngle ?? 73.5,
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

function drawFittingRider(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: SimParams,
  crankAngle: number
) {
  ctx.clearRect(0, 0, w, h);

  // 1. 배경 격자
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 2. 스케일 & BB 원점
  const totalHeightMm = params.saddleHeightMm + 680;
  const scale = (h * 0.62) / totalHeightMm;
  const cx = w * 0.38;
  const cy = h * 0.82;
  const px = (mm: number) => cx + mm * scale;
  const py = (mm: number) => cy - mm * scale;
  const tw = (mm: number) => Math.max(1.2, mm * scale);

  // ==========================================
  // 3. 프레임 지오메트리 정상화
  // ==========================================
  const seatTubeAngleRad = (params.seatTubeAngleDeg * Math.PI) / 180;

  // 안장 상단(BRP 접점) 좌표: BB 기준 싯튜브 각도로 대각선 연장
  const saddleDx = -Math.cos(seatTubeAngleRad) * params.saddleHeightMm;
  const saddleDy = Math.sin(seatTubeAngleRad) * params.saddleHeightMm;
  const saddleX = px(saddleDx);
  const saddleY = py(saddleDy);

  const headTopX = px(params.reachMm);
  const headTopY = py(params.stackMm);
  const headBottomY = headTopY + 30 * scale;

  // 싯클러스터 위치 지정
  const frameSeatTubeLenMm = params.saddleHeightMm * 0.68;
  const seatClusterDx = -Math.cos(seatTubeAngleRad) * frameSeatTubeLenMm;
  const seatClusterDy = Math.sin(seatTubeAngleRad) * frameSeatTubeLenMm;
  const seatClusterX = px(seatClusterDx);
  const seatClusterY = py(seatClusterDy);

  const brpX = px(-params.brpSetbackMm);
  const brpY = saddleY;

  // 4. 휠 실루엣 & BB
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px(-410), cy, 340 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(580), cy, 340 * scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // 헤드튜브
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = tw(TUBE_THICKNESS.headtube);
  ctx.beginPath();
  ctx.moveTo(headTopX, headTopY - 15 * scale);
  ctx.lineTo(headTopX, headBottomY);
  ctx.stroke();

  // 시트튜브 / 다운튜브 / 탑튜브 / 체인스테이
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = tw(TUBE_THICKNESS.seattube);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(seatClusterX, seatClusterY);
  ctx.stroke(); // 싯튜브

  ctx.lineWidth = tw(TUBE_THICKNESS.downtube);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(headTopX, headTopY);
  ctx.stroke(); // 다운튜브

  ctx.lineWidth = tw(TUBE_THICKNESS.toptube);
  ctx.beginPath();
  ctx.moveTo(seatClusterX, seatClusterY);
  ctx.lineTo(headTopX, headTopY);
  ctx.stroke(); // 탑튜브

  ctx.lineWidth = tw(TUBE_THICKNESS.chainstay);
  ctx.beginPath();
  ctx.moveTo(px(-410), cy);
  ctx.lineTo(seatClusterX, seatClusterY);
  ctx.stroke(); // 싯스테이
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px(-410), cy);
  ctx.stroke(); // 체인스테이

  // 싯포스트
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = tw(TUBE_THICKNESS.seatpost);
  ctx.beginPath();
  ctx.moveTo(seatClusterX, seatClusterY);
  ctx.lineTo(saddleX, saddleY);
  ctx.stroke();

  // 안장 본체
  const saddleLength = 250 * scale;
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(
    saddleX,
    saddleY,
    saddleLength / 2,
    7.5 * scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // BRP 마커 & 기준선
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(brpX, brpY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244,63,94,0.5)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(brpX, brpY);
  ctx.lineTo(brpX, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(brpX, cy);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // ==========================================
  // 5. 다리/발 페달링 로직
  // ==========================================
  const hipX = brpX + 30 * scale;
  const hipY = brpY - 20 * scale;

  const pedalX = cx + Math.cos(crankAngle) * params.crankLengthMm * scale;
  const pedalY = cy + Math.sin(crankAngle) * params.crankLengthMm * scale;

  const maxLegExtension = params.saddleHeightMm + params.crankLengthMm - 45;
  const inseamMm = params.inseamCm * 10;
  let thighMm, shinMm;
  if (params.calfLengthCm && params.calfLengthCm > 0) {
    const shinRatio = (params.calfLengthCm * 10) / inseamMm;
    shinMm = maxLegExtension * shinRatio;
    thighMm = maxLegExtension * (1 - shinRatio);
  } else {
    thighMm = maxLegExtension * 0.52;
    shinMm = maxLegExtension * 0.48;
  }

  const pedalRadiusPx =
    Math.max(6, PEDAL_AXLE_BASE_RADIUS_MM + params.pedalStackCorrectionMm) *
    scale;
  const cleatFromHeelMm =
    params.footSizeMm * CLEAT_FROM_HEEL_RATIO + params.cleatOffsetMm;
  const heelLocalX = -cleatFromHeelMm * scale;
  const toeLocalX = heelLocalX + params.footSizeMm * scale;
  const soleLocalY = -pedalRadiusPx;
  const ankleLocalX =
    heelLocalX + params.footSizeMm * HEEL_TO_ANKLE_RATIO * scale;
  const ankleLocalY = soleLocalY - ANKLE_HEIGHT_MM * scale;

  const targetAnkleJointAngleRad =
    ((94.2 + 5.8 * Math.sin(crankAngle - 0.42)) * Math.PI) / 180;
  let footAngle =
    Math.atan2(pedalY - hipY, pedalX - hipX) +
    targetAnkleJointAngleRad -
    Math.PI;
  let ankleX =
    pedalX +
    ankleLocalX * Math.cos(footAngle) -
    ankleLocalY * Math.sin(footAngle);
  let ankleY =
    pedalY +
    ankleLocalX * Math.sin(footAngle) +
    ankleLocalY * Math.cos(footAngle);

  const thighLen = thighMm * scale;
  const shinLen = shinMm * scale;
  const maxLegReach = (thighLen + shinLen) * 0.999;

  let kneeX = 0,
    kneeY = 0,
    kneeAngleRad = Math.PI;
  for (let pass = 0; pass < 2; pass++) {
    const legDx = ankleX - hipX;
    const legDy = ankleY - hipY;
    const clampedDist = Math.min(
      Math.sqrt(legDx * legDx + legDy * legDy),
      maxLegReach * 0.998
    );

    const cosKnee =
      (thighLen * thighLen + shinLen * shinLen - clampedDist * clampedDist) /
      (2 * thighLen * shinLen);
    kneeAngleRad = Math.acos(Math.max(-1, Math.min(1, cosKnee)));
    const legBaseAngle = Math.atan2(legDy, legDx);
    const kneeOffset = Math.asin(
      (shinLen / clampedDist) * Math.sin(kneeAngleRad)
    );

    kneeX = hipX + Math.cos(legBaseAngle - kneeOffset) * thighLen;
    kneeY = hipY + Math.sin(legBaseAngle - kneeOffset) * thighLen;

    const actualShinAngle = Math.atan2(ankleY - kneeY, ankleX - kneeX);
    footAngle = actualShinAngle + targetAnkleJointAngleRad - Math.PI;
    ankleX =
      pedalX +
      ankleLocalX * Math.cos(footAngle) -
      ankleLocalY * Math.sin(footAngle);
    ankleY =
      pedalY +
      ankleLocalX * Math.sin(footAngle) +
      ankleLocalY * Math.cos(footAngle);
  }

  // 렌더링: 크랭크, 페달, 발, 다리
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(pedalX, pedalY);
  ctx.stroke();
  ctx.strokeStyle = '#3f3f46';
  ctx.fillStyle = 'rgba(63,63,70,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pedalX, pedalY, pedalRadiusPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(pedalX, pedalY);
  ctx.rotate(footAngle);
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(heelLocalX, soleLocalY);
  ctx.lineTo(toeLocalX, soleLocalY);
  ctx.lineTo(ankleLocalX, ankleLocalY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(0, soleLocalY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.stroke();
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(kneeX, kneeY);
  ctx.lineTo(ankleX, ankleY);
  ctx.stroke();

  const joints: [number, number, string][] = [
    [hipX, hipY, '#f43f5e'],
    [kneeX, kneeY, '#22d3ee'],
    [ankleX, ankleY, '#0891b2'],
  ];
  for (const [jx, jy, color] of joints) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(jx, jy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // 6. 콕핏 및 핸들바 위치 산출
  // ==========================================
  const steererLeanRad = ((90 - HEAD_TUBE_ANGLE_DEG) * Math.PI) / 180;
  const steererExtMm = params.spacerHeightMm + 20;
  const stemStartMmX = params.reachMm - steererExtMm * Math.sin(steererLeanRad);
  const stemStartMmY = params.stackMm + steererExtMm * Math.cos(steererLeanRad);
  const stemStartX = px(stemStartMmX);
  const stemStartY = py(stemStartMmY);

  const cockpitAngleRad =
    ((90 - HEAD_TUBE_ANGLE_DEG + params.stemAngleDeg) * Math.PI) / 180;
  const totalCockpitLenMm =
    params.stemLengthMm +
    params.handlebarReachMm +
    params.drivetrainHoodReachMm +
    LEVER_LENGTH_MM;
  const preLeverLenMm = totalCockpitLenMm - LEVER_LENGTH_MM;

  const leverStartX = px(
    stemStartMmX + preLeverLenMm * Math.cos(cockpitAngleRad)
  );
  const leverStartY = py(
    stemStartMmY + preLeverLenMm * Math.sin(cockpitAngleRad)
  );
  const handX = px(
    stemStartMmX + totalCockpitLenMm * Math.cos(cockpitAngleRad)
  );
  const handY = py(
    stemStartMmY + totalCockpitLenMm * Math.sin(cockpitAngleRad)
  );

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = tw(TUBE_THICKNESS.headtube * 0.7);
  ctx.beginPath();
  ctx.moveTo(headTopX, headTopY);
  ctx.lineTo(stemStartX, stemStartY);
  ctx.stroke();
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = tw(TUBE_THICKNESS.cockpit);
  ctx.beginPath();
  ctx.moveTo(stemStartX, stemStartY);
  ctx.lineTo(leverStartX, leverStartY);
  ctx.stroke();
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = Math.max(2, tw(TUBE_THICKNESS.cockpit * 0.5));
  ctx.beginPath();
  ctx.moveTo(leverStartX, leverStartY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  // ==========================================
  // 7. 동적 상체/팔 IK 렌더링
  // ==========================================
  const torsoLenMm = params.upperBodyCm * 10 * TORSO_LENGTH_RATIO;
  const torsoLen = torsoLenMm * scale;

  // 💡 [수정] 라이딩 성향별 팔 굽힘 정도(armBendRatio) 정상화 및 세분화
  // 값이 클수록 팔을 곧게 뻗어 상체가 위로 서게(Upright) 됩니다.
  let armBendRatio = 0.97; // endurance: 팔을 거의 뻗어 상체를 높게 유지
  if (params.ridingStyle === 'performance') {
    armBendRatio = 0.85; // performance: 팔을 굽혀 에어로 자세를 취함 (상체 하강)
  } else if (params.ridingStyle === 'comfort') {
    armBendRatio = 0.92; // comfort: 적당히 편안하게 굽힘
  }

  const armLen = params.armLengthCm * 10 * scale;
  const effectiveArmTargetLen = armLen * armBendRatio;

  const targetDx = handX - hipX;
  const targetDy = handY - hipY;
  const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
  const clampedTargetDist = Math.min(
    targetDist,
    (torsoLen + effectiveArmTargetLen) * 0.998
  );

  const cosShoulder =
    (torsoLen * torsoLen +
      clampedTargetDist * clampedTargetDist -
      effectiveArmTargetLen * effectiveArmTargetLen) /
    (2 * torsoLen * clampedTargetDist);
  const torsoOffset = Math.acos(Math.max(-1, Math.min(1, cosShoulder)));
  const baseAngle = Math.atan2(targetDy, targetDx);

  const finalTorsoAngle = baseAngle - torsoOffset;
  const shoulderX = hipX + Math.cos(finalTorsoAngle) * torsoLen;
  const shoulderY = hipY + Math.sin(finalTorsoAngle) * torsoLen;

  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  const upperArmLen = armLen * UPPER_ARM_RATIO;
  const forearmLen = armLen * FOREARM_RATIO;
  const armDx = handX - shoulderX;
  const armDy = handY - shoulderY;
  const armDist = Math.sqrt(armDx * armDx + armDy * armDy);
  const clampedArmDist = Math.min(armDist, (upperArmLen + forearmLen) * 0.998);

  const cosElbow =
    (upperArmLen * upperArmLen +
      forearmLen * forearmLen -
      clampedArmDist * clampedArmDist) /
    (2 * upperArmLen * forearmLen);
  const elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
  const armBaseAngle = Math.atan2(armDy, armDx);

  const elbowOffset = Math.asin(
    (forearmLen / clampedArmDist) * Math.sin(elbowAngle)
  );
  const elbowX = shoulderX + Math.cos(armBaseAngle + elbowOffset) * upperArmLen;
  const elbowY = shoulderY + Math.sin(armBaseAngle + elbowOffset) * upperArmLen;

  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();
  ctx.strokeStyle = '#ddd6fe';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  const upperJoints: [number, number, string][] = [
    [shoulderX, shoulderY, '#a78bfa'],
    [elbowX, elbowY, '#c4b5fd'],
    [handX, handY, '#f43f5e'],
  ];
  for (const [jx, jy, color] of upperJoints) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(jx, jy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. 텍스트 라벨
  const kneeAngleDeg = (kneeAngleRad * 180) / Math.PI;
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BB', cx, cy + 20);
  ctx.fillText('BRP', brpX, brpY - 12);
  ctx.fillText('레버', handX, handY - 12);
  ctx.fillText(`무릎 ${kneeAngleDeg.toFixed(0)}°`, kneeX + 26, kneeY);

  ctx.fillStyle = '#71717a';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    `상체 렌더링 가중치 반영 완료 (Stack: ${params.stackMm} / Reach: ${params.reachMm})`,
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
        drawFittingRider(
          ctx,
          rect.width,
          rect.height,
          paramsRef.current,
          angle
        );
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
            <h3 className="text-sm font-bold text-zinc-100">
              지오메트리 페달링 시뮬레이터
            </h3>
            <p className="text-[11px] text-zinc-500">
              헤드튜브-스페이서-스템-핸들바-후드 적층 구조가 반영된 2D
              애니메이션
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          BRP 기준 콕핏 연동
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-[300px] w-full rounded-xl bg-zinc-950 sm:h-[380px]"
      />
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
