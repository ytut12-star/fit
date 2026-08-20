// ============================================================
// frameDataset.ts
// 로드바이크 프레임 지오메트리 데이터셋
// 1. FRAME_DATASET: 스페셜라이즈드 타막 (올라운드/레이스)
// 2. ENDURANCE_FRAME_DATASET: 자이언트 디파이 (엔듀런스)
// ============================================================

import type { FrameSizeSpec } from './types';

// 1. 올라운드 / 레이스 프레임 (스페셜라이즈드 타막 SL 기준)
export const FRAME_DATASET: FrameSizeSpec[] = [
  {
    name: '44 (XXS)',
    sizeNum: 44,
    stackMm: 501,
    reachMm: 366,
    seatTubeAngle: 75.5,
  },
  {
    name: '49 (XS)',
    sizeNum: 49,
    stackMm: 514,
    reachMm: 375,
    seatTubeAngle: 75.5,
  },
  {
    name: '52 (S)',
    sizeNum: 52,
    stackMm: 527,
    reachMm: 380,
    seatTubeAngle: 74.0,
  },
  {
    name: '54 (M)',
    sizeNum: 54,
    stackMm: 544,
    reachMm: 384,
    seatTubeAngle: 74.0,
  },
  {
    name: '56 (L)',
    sizeNum: 56,
    stackMm: 565,
    reachMm: 395,
    seatTubeAngle: 73.5,
  },
  {
    name: '58 (XL)',
    sizeNum: 58,
    stackMm: 591,
    reachMm: 402,
    seatTubeAngle: 73.5,
  },
  {
    name: '61 (XXL)',
    sizeNum: 61,
    stackMm: 612,
    reachMm: 408,
    seatTubeAngle: 73.0,
  },
];

// 2. 엔듀런스 프레임 (자이언트 디파이 공식 지오메트리 실측 기준)
export const ENDURANCE_FRAME_DATASET: FrameSizeSpec[] = [
  { name: 'XS', sizeNum: 48, stackMm: 527, reachMm: 369, seatTubeAngle: 74.5 },
  { name: 'S', sizeNum: 51, stackMm: 541, reachMm: 375, seatTubeAngle: 74.0 },
  { name: 'M', sizeNum: 54, stackMm: 558, reachMm: 380, seatTubeAngle: 73.5 },
  { name: 'ML', sizeNum: 56, stackMm: 577, reachMm: 384, seatTubeAngle: 73.0 },
  { name: 'L', sizeNum: 58, stackMm: 596, reachMm: 393, seatTubeAngle: 73.0 },
  { name: 'XL', sizeNum: 61, stackMm: 615, reachMm: 402, seatTubeAngle: 73.0 },
];

// 데이터셋 상 다음 사이즈 업 프레임 이름 조회 (기본값: 올라운드 데이터셋)
export function getUpsizedFrameName(
  sizeNum: number,
  dataset: FrameSizeSpec[] = FRAME_DATASET
): string {
  const idx = dataset.findIndex((f) => f.sizeNum === sizeNum);
  if (idx === -1 || idx === dataset.length - 1) {
    return dataset[dataset.length - 1].name;
  }
  return dataset[idx + 1].name;
}
