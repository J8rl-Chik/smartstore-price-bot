import { afterEach, describe, expect, it, vi } from 'vitest';
import setWebdriverFalse from './setWebdriverFalse.js';

describe('setWebdriverFalse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigator.webdriver가 항상 false를 반환하도록 Object.defineProperty를 호출한다', () => {
    const mockDefineProperty = vi
      .spyOn(Object, 'defineProperty')
      .mockImplementation((target) => target);

    setWebdriverFalse();

    expect(mockDefineProperty).toHaveBeenCalledWith(navigator, 'webdriver', {
      get: expect.any(Function),
    });

    const [, , descriptor] = mockDefineProperty.mock.calls[0] as [
      Navigator,
      string,
      { get: () => boolean },
    ];

    expect(descriptor.get()).toBe(false);
  });
});
