export type Lang = 'ko' | 'en';

export const t = {
  ko: {
    // App.tsx
    headerSubtitle: '로드바이크 사이즈 계산기',
    loadingTitle: 'VeloSizing 정밀 분석 중...',
    loadingDesc: '입력하신 신체 치수와 지오메트리 데이터를 기반으로 최적의 세팅을 계산하고 있습니다.',
    loadingSub: '프로페셔널 로드바이크 콕핏 및 컴포넌트 산출 중',
    waitingTitle: '피팅 데이터 입력 대기 중',
    waitingDesc1: '좌측 폼에 신체 치수와 옵션을 선택하신 후 하단의',
    waitingBtn: '[피팅 결과 계산 및 리포트 생성]',
    waitingDesc2: '버튼을 누르시면 정밀 리포트가 생성됩니다.',
    
    // InputForm.tsx - Titles & Buttons
    formTitle: '신체 치수 및 피팅 옵션',
    resetBtn: '초기화',
    calcBtn: '피팅 결과 계산 및 리포트 생성',
    
    // Section 1: Basic
    sec1Title: '1. 기본 신체 치수 (필수)',
    height: '신장 (키 cm)',
    heightPh: '예: 175',
    inseam: '인심 (다리길이 cm)',
    inseamPh: '예: 82.5',

    // Section 2: Upper Body
    sec2Title: '2. 팔 길이 / 상체 치수 측정',
    armMode: '팔 길이 측정 방식',
    armModeAuto: '자동 추정 (신장 비율 기반)',
    armModeArm: '팔 길이 직접 입력 (어깨 끝 뼈 ~ 주먹 중심)',
    armModeWingspan: '윙스팬 (양팔 벌린 전체 길이)',
    armLength: '팔 길이 (cm)',
    armLengthPh: '예: 65',
    armInfo: '측정 기준: 어깨 맨 끝 툭 튀어나온 뼈(견봉)부터 가볍게 주먹을 쥐었을 때 핸들바를 잡게 되는 주먹 관절 중심까지의 직선거리입니다.',
    wingspan: '윙스팬 (양팔 벌린 길이 cm)',
    wingspanPh: '예: 178',
    wingspanInfo: '측정 기준: 벽에 곧게 서서 양팔을 수평으로 벌렸을 때 한쪽 손끝에서 반대쪽 손끝까지의 직선거리입니다.',
    shoulderWidth: '어깨 너비 (cm)',
    optionalAuto: '선택 (미입력 시 자동 추정)',
    shoulderPh: '예: 40',

    // Section 3: Style
    sec3Title: '3. 성향 및 유연성',
    ridingStyle: '라이딩 스타일',
    styles: {
      performance: '퍼포먼스 (권장 / 공격적 에어로)',
      endurance: '엔듀런스 (편안한 장거리 핏)',
      aggressive: '타임트라이얼 (극단적 에어로)',
    },

    // Section 4: Lower Body
    sec4Title: '4. 하체 치수 (선택)',
    calfLength: '종아리 길이 (cm)',
    calfPh: '예: 40',
    footSize: '발 크기 (mm)',
    footPh: '예: 260',
    calfInfo: '종아리 측정 기준: 의자에 앉아 바닥에 맨발을 대고, 바깥쪽 복사뼈 중심부터 무릎 측면 관절이 접히는 홈까지의 수직 길이를 측정합니다.',

    // Section 5: Pedals
    sec5Title: '5. 클릿 및 페달 스택',
    pedalSystem: '페달 & 슈즈 시스템',
    pedals: {
      spdsl: 'Shimano SPD-SL (표준)',
      look: 'Look Keo',
      speedplay: 'Speedplay (Wahoo)',
      flat: '평페달 / 일반 운동화',
    },
    clipPosition: '클릿 위치',
    clips: {
      standard: '표준 (모지구 중심)',
      forward: '전진 세팅 (토크 위주)',
      backward: '후퇴 세팅 / 미드풋 (케이던스 위주)',
    },

    // Section 6: Cockpit
    sec6Title: '6. 목표 콕핏 부품 규격',
    barWidth: '핸들바 폭 (mm)',
    barReach: '핸들바 리치 (mm)',
    reaches: {
      70: '70mm (매우 짧음)',
      75: '75mm (짧음/표준)',
      80: '80mm (표준)',
      85: '85mm (김)',
    },
    leverAngle: '레버 장착 세팅',
    leverStraight: '일자 정석 (0°)',
    leverInward: '안쪽 꺾임 (에어로 / ~10°)',
    drivetrain: '구동계 브랜드 & 단수',
    drivetrains: {
      shimano_11s: '시마노 11단 (기계식/Di2)',
      shimano_12s_di2: '시마노 12단 Di2',
      sram_axs: '스램 AXS (eTap)',
    },

    // Section 7: Current Bike
    cbTitle: '현재 타는 자전거 피팅 진단',
    cbBadge: '선택 기능',
    cbDesc: '현재 자전거 수치를 넣으면 어떤 부품을 바꾸면 좋을지 알려드립니다',
    cbComplete: '입력 완료',
    cbInfo: '제조사 지오메트리 표에서 프레임 스택/리치를 입력하시면, 추천값과 비교해서 스페이서, 스템, 안장/크랭크를 어떻게 맞추면 되는지 알려드립니다.',
    cbSec1Title: '1. 프레임 지오메트리 (핵심)',
    stack: '프레임 스택 (Stack mm)',
    stackPh: '예: 527',
    reach: '프레임 리치 (Reach mm)',
    reachPh: '예: 389',
    cbSec2Title: '2. 현재 장착된 콕핏 세팅',
    spacer: '스페이서 (mm)',
    spacerSub: '-10mm 제외분',
    spacerPh: '예: 10 (총20mm)',
    stem: '스템 길이 (mm)',
    stemPh: '예: 100',
    stemAngle: '스템 각도 (°)',
    stemAngles: {
      '6': '+6° (뒤집음)',
      '-6': '-6° ~ -8° (표준)',
      '-10': '-10° ~ -12°',
      '-17': '-17° (수평)'
    },
    cbLeverAngle: '레버 꺾임 세팅',
    cbSec3Title: '3. 안장 및 크랭크 규격 (선택)',
    saddleHt: '현재 안장높이 (mm)',
    saddlePh: '예: 710',
    seatTube: '싯튜브 각도 (°)',
    seatTubePh: '예: 73.5',
    crank: '현재 크랭크 길이 (mm)',
    crankPh: '예: 172.5'
  },

  // ================= ENGLISH =================
  en: {
    headerSubtitle: 'Road Bike Fit Calculator',
    loadingTitle: 'VeloSizing Precision Analysis...',
    loadingDesc: 'Calculating optimal settings based on your body measurements and geometry data.',
    loadingSub: 'Calculating professional road bike cockpit & components',
    waitingTitle: 'Waiting for Fitting Data',
    waitingDesc1: 'Enter your body measurements on the left, then click',
    waitingBtn: '[Calculate & Generate Report]',
    waitingDesc2: 'to see your precision fit.',
    
    // InputForm.tsx - Titles & Buttons
    formTitle: 'Body Measurements & Options',
    resetBtn: 'Reset',
    calcBtn: 'Calculate Fit & Generate Report',
    
    // Section 1: Basic
    sec1Title: '1. Basic Measurements (Required)',
    height: 'Height (cm)',
    heightPh: 'e.g. 175',
    inseam: 'Inseam (cm)',
    inseamPh: 'e.g. 82.5',

    // Section 2: Upper Body
    sec2Title: '2. Arm / Upper Body Length',
    armMode: 'Arm Length Measurement',
    armModeAuto: 'Auto-estimate (Height ratio)',
    armModeArm: 'Direct input (Acromion to knuckle)',
    armModeWingspan: 'Wingspan (Total arm spread)',
    armLength: 'Arm Length (cm)',
    armLengthPh: 'e.g. 65',
    armInfo: 'Measurement guide: The straight-line distance from the tip of your shoulder bone (acromion) to the center of your knuckles when lightly gripping an imaginary handlebar.',
    wingspan: 'Wingspan (cm)',
    wingspanPh: 'e.g. 178',
    wingspanInfo: 'Measurement guide: Stand straight against a wall and spread your arms horizontally. Measure from fingertip to fingertip.',
    shoulderWidth: 'Shoulder Width (cm)',
    optionalAuto: 'Optional (Auto if empty)',
    shoulderPh: 'e.g. 40',

    // Section 3: Style
    sec3Title: '3. Riding Style & Flexibility',
    ridingStyle: 'Riding Style',
    styles: {
      performance: 'Performance (Recommended / Aero)',
      endurance: 'Endurance (Relaxed / Long distance)',
      aggressive: 'Time Trial (Aggressive Aero)',
    },

    // Section 4: Lower Body
    sec4Title: '4. Lower Body Specs (Optional)',
    calfLength: 'Calf Length (cm)',
    calfPh: 'e.g. 40',
    footSize: 'Foot Size (mm)',
    footPh: 'e.g. 260',
    calfInfo: 'Calf measurement: Sit on a chair barefoot. Measure the vertical distance from the center of the outer ankle bone to the crease on the side of the knee.',

    // Section 5: Pedals
    sec5Title: '5. Cleat & Pedal Stack',
    pedalSystem: 'Pedal System',
    pedals: {
      spdsl: 'Shimano SPD-SL (Standard)',
      look: 'Look Keo',
      speedplay: 'Speedplay (Wahoo)',
      flat: 'Flat Pedals / Sneakers',
    },
    clipPosition: 'Cleat Position',
    clips: {
      standard: 'Standard (Ball of foot)',
      forward: 'Forward (Torque focused)',
      backward: 'Backward / Mid-foot (Cadence)',
    },

    // Section 6: Cockpit
    sec6Title: '6. Target Cockpit Specs',
    barWidth: 'Handlebar Width (mm)',
    barReach: 'Handlebar Reach (mm)',
    reaches: {
      70: '70mm (Very Short)',
      75: '75mm (Short/Standard)',
      80: '80mm (Standard)',
      85: '85mm (Long)',
    },
    leverAngle: 'Lever Angle Setting',
    leverStraight: 'Straight (0°)',
    leverInward: 'Inward (Aero / ~10°)',
    drivetrain: 'Drivetrain System',
    drivetrains: {
      shimano_11s: 'Shimano 11s (Mech/Di2)',
      shimano_12s_di2: 'Shimano 12s Di2',
      sram_axs: 'SRAM AXS (eTap)',
    },

    // Section 7: Current Bike
    cbTitle: 'Current Bike Fit Diagnosis',
    cbBadge: 'Optional',
    cbDesc: 'Enter your current bike specs to get component replacement recommendations.',
    cbComplete: 'Completed',
    cbInfo: 'Enter the Frame Stack/Reach from the manufacturer geometry chart. We will compare it with the recommended values and guide you on spacers, stem, saddle, and cranks.',
    cbSec1Title: '1. Frame Geometry (Core)',
    stack: 'Frame Stack (mm)',
    stackPh: 'e.g. 527',
    reach: 'Frame Reach (mm)',
    reachPh: 'e.g. 389',
    cbSec2Title: '2. Current Cockpit Setup',
    spacer: 'Spacers (mm)',
    spacerSub: 'Excluding headset cover(-10mm)',
    spacerPh: 'e.g. 10 (Total 20mm)',
    stem: 'Stem Length (mm)',
    stemPh: 'e.g. 100',
    stemAngle: 'Stem Angle (°)',
    stemAngles: {
      '6': '+6° (Flipped)',
      '-6': '-6° ~ -8° (Standard)',
      '-10': '-10° ~ -12°',
      '-17': '-17° (Horizontal)'
    },
    cbLeverAngle: 'Lever Angle Setting',
    cbSec3Title: '3. Saddle & Crank (Optional)',
    saddleHt: 'Current Saddle Height (mm)',
    saddlePh: 'e.g. 710',
    seatTube: 'Seat Tube Angle (°)',
    seatTubePh: 'e.g. 73.5',
    crank: 'Current Crank Length (mm)',
    crankPh: 'e.g. 172.5'
  }
};
