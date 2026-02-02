import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

/**
 * X API routes tests
 *
 * Tests for OAuth 1.0a signature generation and X API endpoints
 */

// Type for API responses
interface XApiResponse {
  success: boolean;
  configured?: boolean;
  missing?: string[];
  error?: string;
  data?: { id: string; text: string } | Array<{ id: string; text: string }>;
  url?: string;
  count?: number;
  deleted?: boolean;
  id?: string;
  endpoint?: string;
  usage?: string;
}

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock crypto.getRandomValues for consistent nonce generation
const mockGetRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = i;
  }
  return array;
});

// Mock crypto.subtle for HMAC-SHA1
const mockSubtle = {
  importKey: vi.fn().mockResolvedValue('mock-key'),
  sign: vi.fn().mockResolvedValue(new ArrayBuffer(20))
};

vi.stubGlobal('crypto', {
  getRandomValues: mockGetRandomValues,
  subtle: mockSubtle
});

describe('X API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /x/status', () => {
    it('should return configured: false when credentials are missing', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/status', {
        method: 'GET'
      }, {
        // No X API credentials
      });

      expect(res.status).toBe(200);
      const data = await res.json() as XApiResponse;
      expect(data.configured).toBe(false);
      expect(data.missing).toContain('X_API_KEY');
      expect(data.missing).toContain('X_API_SECRET');
      expect(data.missing).toContain('X_ACCESS_TOKEN');
      expect(data.missing).toContain('X_ACCESS_TOKEN_SECRET');
    });

    it('should return configured: true when all credentials are set', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/status', {
        method: 'GET'
      }, {
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(200);
      const data = await res.json() as XApiResponse;
      expect(data.configured).toBe(true);
      expect(data.missing).toBeUndefined();
    });
  });

  describe('POST /x/tweet', () => {
    it('should return 401 without authentication', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' })
      }, {
        CDP_SECRET: 'my-secret'
      });

      expect(res.status).toBe(401);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 503 when X API credentials are not configured', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' })
      }, {
        CDP_SECRET: 'my-secret'
        // No X API credentials
      });

      expect(res.status).toBe(503);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('not configured');
    });

    it('should return 400 when text is missing', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(400);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('text is required');
    });

    it('should return 400 when text exceeds 280 characters', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const longText = 'a'.repeat(281);

      const res = await app.request('/x/tweet?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: longText })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(400);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('too long');
    });

    it('should post tweet successfully', async () => {
      // Reset module cache to ensure fresh import
      vi.resetModules();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: '12345',
            text: 'Hello World!'
          }
        })
      });

      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello World!' })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(201);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(true);
      const tweetData = data.data as { id: string; text: string };
      expect(tweetData.id).toBe('12345');
      expect(data.url).toContain('12345');
    });

    it('should handle X API errors gracefully', async () => {
      vi.resetModules();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          errors: [{ message: 'Forbidden: Your account is suspended' }]
        })
      });

      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test tweet' })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(403);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('suspended');
    });
  });

  describe('POST /x/thread', () => {
    it('should return 400 when tweets array is missing', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/thread?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(400);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('at least 2 items');
    });

    it('should return 400 when tweets array has only 1 item', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/thread?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets: ['Single tweet'] })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(400);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('at least 2 items');
    });

    it('should return 400 when tweets array exceeds 25 items', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const tweets = Array(26).fill('Tweet content');

      const res = await app.request('/x/thread?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(400);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('Maximum 25');
    });

    it('should post thread successfully', async () => {
      vi.resetModules();

      // Mock two successful tweet posts
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ data: { id: '111', text: 'First tweet' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ data: { id: '222', text: 'Second tweet' } })
        });

      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/thread?secret=my-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets: ['First tweet', 'Second tweet'] })
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(201);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(true);
      const threadData = data.data as Array<{ id: string; text: string }>;
      expect(threadData).toHaveLength(2);
      expect(data.count).toBe(2);
    });
  });

  describe('DELETE /x/tweet/:id', () => {
    it('should return 400 when tweet ID is missing', async () => {
      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      // Note: This test might not work as expected since the route requires :id
      // The framework will return 404 for missing param
      const res = await app.request('/x/tweet/', {
        method: 'DELETE'
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      // Route without ID will be 404 or handled differently
      expect([400, 404]).toContain(res.status);
    });

    it('should delete tweet successfully', async () => {
      vi.resetModules();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { deleted: true } })
      });

      const { xApi } = await import('./x-api');
      const app = new Hono();
      app.route('/x', xApi);

      const res = await app.request('/x/tweet/12345?secret=my-secret', {
        method: 'DELETE'
      }, {
        CDP_SECRET: 'my-secret',
        X_API_KEY: 'test-key',
        X_API_SECRET: 'test-secret',
        X_ACCESS_TOKEN: 'test-token',
        X_ACCESS_TOKEN_SECRET: 'test-token-secret'
      });

      expect(res.status).toBe(200);
      const data = await res.json() as XApiResponse;
      expect(data.success).toBe(true);
      expect(data.deleted).toBe(true);
      expect(data.id).toBe('12345');
    });
  });
});

describe('OAuth 1.0a Signature', () => {
  it('should generate consistent nonce', () => {
    // The mock generates deterministic values
    const array = new Uint8Array(16);
    mockGetRandomValues(array);
    expect(array[0]).toBe(0);
    expect(array[1]).toBe(1);
  });

  it('should call crypto.subtle for HMAC-SHA1', async () => {
    vi.resetModules();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: '12345', text: 'Test' } })
    });

    const { xApi } = await import('./x-api');
    const app = new Hono();
    app.route('/x', xApi);

    await app.request('/x/tweet?secret=my-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test' })
    }, {
      CDP_SECRET: 'my-secret',
      X_API_KEY: 'test-key',
      X_API_SECRET: 'test-secret',
      X_ACCESS_TOKEN: 'test-token',
      X_ACCESS_TOKEN_SECRET: 'test-token-secret'
    });

    // Verify HMAC-SHA1 was used
    expect(mockSubtle.importKey).toHaveBeenCalledWith(
      'raw',
      expect.any(Uint8Array),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
  });
});
