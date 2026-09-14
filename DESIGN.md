---
version: 1.0.0
name: Toss-Design-System
description: >
  토스(toss.im)와 토스증권(tossinvest)의 모던하고 친근하며 신뢰도 높은 금융·투자 
  앱 스타일을 차용한 스포츠 중계 디자인 시스템. 광활한 여백, 24px의 넉넉한 
  둥근 모서리, 부드러운 회색배경 위의 순백색 카드 구조, 활기찬 토스 블루(#3182f6) 
  및 토스 레드(#f04452) 액센트를 조합한다.
---

# ─────────────────────────────────────────────
# COLORS (Toss Light Theme · High Contrast)
# ─────────────────────────────────────────────
colors:
  # Brand Colors
  primary: "#3182f6"            # 토스 블루 (Toss Blue)
  primary-hover: "#1b64da"
  primary-soft: "#e8f3ff"
  
  # Neutral Palette
  ink-primary: "#191f28"        # 헤드라인, 타이틀
  ink-secondary: "#333d4b"      # 중요 본문, 서브헤더
  ink-tertiary: "#4e5968"       # 일반 본문
  ink-muted: "#8b95a1"          # 회색 설명조, 보조 정보
  ink-faint: "#b0b8c1"          # 비활성 상태, 흐린 메타
  
  # Backgrounds
  canvas: "#f2f4f6"             # 전체 페이지 배경 (Toss Grey)
  surface: "#ffffff"            # 카드 및 컨테이너 배경 (Pure White)
  surface-hover: "#fafbfc"      # 테이블 행 호버, 탭 호버
  surface-muted: "#f9fafb"      # 중첩된 패널 배경
  
  # Divider & Borders
  border-light: "#e5e8eb"       # 아주 얇고 부드러운 경계선
  border-medium: "#d1d6db"      # 포커스 또는 중요 테두리
  
  # ── 시맨틱 및 스포츠 피드 매핑 (Toss Securities 스타일) ──
  # 상승 / 득점 / 안타 / 홈런 (한국식 주식 상승색)
  bull-red: "#f04452"
  bull-red-soft: "#feebee"
  # 하락 / 삼진 / 아웃 (한국식 주식 하락색)
  bear-blue: "#3182f6"
  bear-blue-soft: "#e8f3ff"
  # 경고 / 볼넷 / 도루
  warning-yellow: "#ffad12"
  warning-yellow-soft: "#fff7e6"

# ─────────────────────────────────────────────
# TYPOGRAPHY (Toss Product Sans / Pretendard)
# ─────────────────────────────────────────────
typography:
  display-lg:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 28px
    fontWeight: 800
    lineHeight: 38px
    letterSpacing: "-0.6px"      # 대시보드 메인 타이틀
  display-md:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 22px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: "-0.4px"      # 큰 수치 정보 (득점 등)
  display-sm:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 26px
    letterSpacing: "-0.2px"      # 카드 소제목
  body-lg:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: "-0.1px"      # 리스트 행 중요 헤더
  body:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 15px
    fontWeight: 500
    lineHeight: 22px            # 기본 중계 메시지
  body-sm:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px            # 테이블 셀, 보조 정보
  caption:
    fontFamily: Pretendard, -apple-system, sans-serif
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px            # 타임스탬프, 구장 날씨 정보
  mono:
    fontFamily: SF Pro Mono, JetBrains Mono, monospace
    fontSize: 14px
    fontWeight: 600
    lineHeight: 18px            # 투구 속도, 볼카운트 데이터 수치

# ─────────────────────────────────────────────
# SHAPES & CORNERS (Generous Radii)
# ─────────────────────────────────────────────
rounded:
  xs: 4px       # 이모지 배지
  sm: 8px       # 알림 배지, 인풋
  md: 14px      # 소형 버튼, 토글 탭
  lg: 20px      # 모드 변경 패널, 통계 칩
  xl: 24px      # 주력 카드, 스코어보드, 중계 로그 컨테이너

# ─────────────────────────────────────────────
# SPACING
# ─────────────────────────────────────────────
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px      # 카드 패딩 기본값
  xl: 32px
  xxl: 48px

# ─────────────────────────────────────────────
# DO'S and DON'TS
# ─────────────────────────────────────────────
do:
  - 전체 배경색은 무조건 회색조 `#f2f4f6`로 칠하고 카드는 순백색 `#ffffff`로 분리할 것.
  - 카드의 경계선은 아주 연하게 처리하고(`border-light`), 그림자를 거의 쓰지 않거나 부드러운 스택 섀도만 사용.
  - 버튼 코너 반경을 12px~14px(`rounded-xl`) 정도로 크게 둥글려서 친근한 터치감을 제공할 것.
  - 야구 중계 피드의 안타, 홈런, 득점 같은 긍정 이벤트는 토스 레드 `#f04452`를, 아웃이나 삼진은 토스 블루 `#3182f6`를 적용할 것 (토스증권 주식 차트색 매칭).
  - 글자 크기를 키우고 자간을 살짝 좁혀(Pretendard 폰트) 화면이 시각적으로 가득 차 보이지만 답답하지 않게 여백을 넉넉히 둘 것.

dont:
  - 진한 회색이나 검은색 캔버스, 어두운 모달, 사이키델릭한 네온 그라디언트는 절대 금지.
  - 1px hairline 테두리를 도처에 강하게 치지 말 것 - 토스 스타일은 부드러운 회색 면 분할이 핵심.
  - 날카로운 코너(0px ~ 4px)와 지나친 조밀함(밀집화)은 토스의 신뢰감을 해치므로 피할 것.
