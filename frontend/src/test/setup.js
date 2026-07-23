import '@testing-library/jest-dom/vitest';

// jsdom에는 window.matchMedia가 구현되어 있지 않다. 반응형 레이아웃(FE-12)이
// 이를 사용하므로, 기본값(데스크톱 폭 매칭)을 제공해 다른 테스트가 깨지지
// 않게 하고, 필요한 테스트는 이 값을 직접 오버라이드해서 사용한다.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}
