// ============================================================
// frameDataset.ts
// 스페셜라이즈드 타막(Tarmac) 공식 지오메트리 데이터셋
// (이미지 표 기준 Frame Stack, Frame Reach, Seat Tube Angle 실측값 반영)
// ============================================================

import type { FrameSizeSpec } from './types';

export const FRAME_DATASET: FrameSizeSpec[] = [
  { name: '44 (XXS)', sizeNum: 44, stackMm: 501, reachMm: 366, seatTubeAngle: 75.5 },
  { name: '49 (XS)', sizeNum: 49, stackMm: 514, reachMm: 375, seatTubeAngle: 75.5 },
  { name: '52 (S)', sizeNum: 52, stackMm: 527, reachMm: 380, seatTubeAngle: 74.0 },
  { name: '54 (M)', sizeNum: 54, stackMm: 544, reachMm: 384, seatTubeAngle: 74.0 },
  { name: '56 (L)', sizeNum: 56, stackMm: 565, reachMm: 395, seatTubeAngle: 73.5 },
  { name: '58 (XL)', sizeNum: 58, stackMm: 591, reachMm: 402, seatTubeAngle: 73.5 },
  { name: '61 (XXL)', sizeNum: 61, stackMm: 612, reachMm: 408, seatTubeAngle: 73.0 },
];

// 데이터셋 상 다음 사이즈 업 프레임 이름 조회 (최상위 사이즈면 자기 자신 반환)
export function getUpsizedFrameName(sizeNum: number): string {
  const idx = FRAME_DATASET.findIndex((f) => f.sizeNum === sizeNum);
  if (idx === -1 || idx === FRAME_DATASET.length - 1) {
    return FRAME_DATASET[FRAME_DATASET.length - 1].name;
  }
  return FRAME_DATASET[idx + 1].name;
}