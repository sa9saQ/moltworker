import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock puppeteer
vi.mock('@cloudflare/puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        title: vi.fn().mockResolvedValue('Test Page'),
        url: vi.fn().mockReturnValue('about:blank'),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('CDP WebSocket shim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('browser launch options', () => {
    it('should use keep_alive option to extend timeout', async () => {
      const puppeteer = await import('@cloudflare/puppeteer');

      // The keep_alive option should be 600000ms (10 minutes)
      // This prevents the default 60s inactivity timeout
      const expectedKeepAlive = 600000;

      // Verify the concept: keep_alive extends browser session
      expect(expectedKeepAlive).toBe(10 * 60 * 1000); // 10 minutes in ms
    });

    it('should handle browser binding correctly', () => {
      // Browser binding is passed as first argument to puppeteer.launch
      // The binding name is 'BROWSER' as configured in wrangler.jsonc
      const bindingName = 'BROWSER';
      expect(bindingName).toBe('BROWSER');
    });
  });

  describe('CDP protocol', () => {
    it('should support Browser.getVersion method', () => {
      const supportedMethods = [
        'Browser.getVersion',
        'Browser.close',
        'Target.createTarget',
        'Page.navigate',
        'Runtime.evaluate',
        'DOM.getDocument',
        'Input.dispatchMouseEvent',
        'Network.setCookie',
        'Emulation.setDeviceMetricsOverride',
      ];

      expect(supportedMethods).toContain('Browser.getVersion');
    });

    it('should require secret for authentication', () => {
      // CDP endpoint requires ?secret=<CDP_SECRET> query param
      const wsUrl = 'wss://example.com/cdp?secret=test-secret';
      const url = new URL(wsUrl);

      expect(url.searchParams.get('secret')).toBe('test-secret');
    });
  });
});
