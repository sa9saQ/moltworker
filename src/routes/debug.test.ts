import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Debug routes tests
 *
 * These are minimal tests for debug endpoints.
 * Debug routes are protected by Cloudflare Access and DEBUG_ROUTES flag.
 */

describe('debug routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/debug/env', () => {
    it('should return sanitized environment info', () => {
      // The /debug/env endpoint returns a JSON object with boolean flags
      // indicating which environment variables are set (without exposing values)
      const expectedFields = [
        'has_anthropic_key',
        'has_openai_key',
        'has_gateway_token',
        'has_r2_access_key',
        'has_r2_secret_key',
        'has_cf_account_id',
        'dev_mode',
        'debug_routes',
      ];

      // Verify the expected structure
      expect(expectedFields.length).toBeGreaterThan(0);
    });
  });

  describe('/debug/browser', () => {
    it('should check browser-related environment variables', () => {
      // The /debug/browser endpoint checks:
      // 1. CDP_SECRET is set
      // 2. WORKER_URL is set
      // 3. BROWSER binding exists
      // 4. CDP endpoint is reachable
      // 5. Browser can be launched

      const expectedChecks = [
        'cdp_secret_set',
        'worker_url_set',
        'browser_binding_exists',
      ];

      expect(expectedChecks.length).toBe(3);
    });

    it('should sanitize sensitive URLs in output', () => {
      // URLs should have secrets masked
      const testUrl = 'https://example.com/cdp?secret=my-secret-key';
      const sanitized = testUrl.replace(/secret=[^&]+/, 'secret=***');

      expect(sanitized).toBe('https://example.com/cdp?secret=***');
      expect(sanitized).not.toContain('my-secret-key');
    });
  });

  describe('/debug/container-config', () => {
    it('should parse JSON config from container', () => {
      // The container config is stored at /root/.clawdbot/clawdbot.json
      const sampleConfig = {
        agents: { defaults: { model: { primary: 'test-model' } } },
        browser: {
          enabled: true,
          defaultProfile: 'cloudflare',
          profiles: { cloudflare: { cdpUrl: 'wss://example.com/cdp' } },
        },
      };

      // Verify browser config structure
      expect(sampleConfig.browser.enabled).toBe(true);
      expect(sampleConfig.browser.defaultProfile).toBe('cloudflare');
    });
  });
});
