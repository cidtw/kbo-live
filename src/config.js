'use strict';

// 프로세스 전역 공유 상태(단일 싱글톤). 의존성 없음 → 순환참조 방지의 기준점.
// cli 가 인자 파싱 후 값을 채우고, theme/render/broadcast 가 읽기만 한다.

const DEFAULTS = {
  gui: true, // GUI(스코어보드) 렌더 여부. --no-gui 면 false
  theme: 'nerd', // 아이콘 테마: nerd | emoji | ascii
  replay: false, // 리플레이 모드 여부(헤더 표시용)
  cache: true, // 완료 이닝 로컬 캐시 사용 여부. --no-cache 면 false
  pitches: true, // 투구 단위(1구 볼/스트라이크) 라인 표시. --no-pitches 면 결과만
  fahrenheit: false, // 화씨 기온 표시 여부. --fahrenheit 면 true
  verbose: false, // --verbose / KBO_LIVE_DEBUG=1 디버그 로그
};

const config = { ...DEFAULTS };

function resetConfig(overrides = {}) {
  for (const k of Object.keys(DEFAULTS)) {
    config[k] = DEFAULTS[k];
  }
  Object.assign(config, overrides);
  return config;
}

config.resetConfig = resetConfig;
config.DEFAULTS = DEFAULTS;

module.exports = config;
