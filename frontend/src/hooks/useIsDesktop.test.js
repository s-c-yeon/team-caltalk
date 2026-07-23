import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsDesktop } from './useIsDesktop';

function createMatchMediaMock(initialMatches) {
  let listeners = [];
  let matches = initialMatches;
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: (_event, cb) => listeners.push(cb),
    removeEventListener: (_event, cb) => {
      listeners = listeners.filter((l) => l !== cb);
    },
  };
  function triggerChange(newMatches) {
    matches = newMatches;
    listeners.forEach((cb) => cb({ matches: newMatches }));
  }
  return { mql, triggerChange };
}

describe('useIsDesktop (FE-12, 768px 기준선)', () => {
  it('초기값은 matchMedia(min-width: 768px)의 결과를 따름', () => {
    const { mql } = createMatchMediaMock(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('브라우저 폭 변경(리사이즈) 시 새로고침 없이 즉시 상태가 갱신됨', () => {
    const { mql, triggerChange } = createMatchMediaMock(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);

    act(() => {
      triggerChange(false);
    });
    expect(result.current).toBe(false);
  });
});
