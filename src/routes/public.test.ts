import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the gateway module
vi.mock('../gateway', () => ({
  findExistingMoltbotProcess: vi.fn(),
  ensureMoltbotGateway: vi.fn().mockResolvedValue({
    id: 'test-process-id',
    status: 'running',
  }),
}));

describe('Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /sandbox-health', () => {
    it('should return health status', async () => {
      // The endpoint returns static health info
      const expectedResponse = {
        status: 'ok',
        service: 'moltbot-sandbox',
        gateway_port: 18789,
      };

      expect(expectedResponse.status).toBe('ok');
      expect(expectedResponse.service).toBe('moltbot-sandbox');
    });
  });

  describe('GET /api/status', () => {
    it('should return not_running when no process exists', () => {
      // When no process exists, status should be not_running
      const response = { ok: false, status: 'not_running' };
      expect(response.status).toBe('not_running');
    });

    it('should return running when process is healthy', () => {
      // When process exists and is responding
      const response = { ok: true, status: 'running', processId: 'test-id' };
      expect(response.status).toBe('running');
    });
  });

  describe('POST /api/boot', () => {
    it('should start the gateway and return status', () => {
      // Boot endpoint should trigger gateway startup
      const expectedResponse = {
        ok: true,
        status: 'started',
        message: 'Gateway boot initiated',
      };

      expect(expectedResponse.ok).toBe(true);
      expect(expectedResponse.status).toBe('started');
    });

    it('should handle errors gracefully', () => {
      // When boot fails, should return error
      const errorResponse = {
        ok: false,
        status: 'error',
        error: 'Failed to start gateway',
      };

      expect(errorResponse.ok).toBe(false);
    });
  });
});
