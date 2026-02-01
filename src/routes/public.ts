import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { MOLTBOT_PORT } from '../config';
import { findExistingMoltbotProcess, ensureMoltbotGateway } from '../gateway';

/**
 * Public routes - NO Cloudflare Access authentication required
 * 
 * These routes are mounted BEFORE the auth middleware is applied.
 * Includes: health checks, static assets, and public API endpoints.
 */
const publicRoutes = new Hono<AppEnv>();

// GET /sandbox-health - Health check endpoint
publicRoutes.get('/sandbox-health', (c) => {
  return c.json({
    status: 'ok',
    service: 'moltbot-sandbox',
    gateway_port: MOLTBOT_PORT,
  });
});

// GET /logo.png - Serve logo from ASSETS binding
publicRoutes.get('/logo.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /logo-small.png - Serve small logo from ASSETS binding
publicRoutes.get('/logo-small.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /api/status - Public health check for gateway status (no auth required)
publicRoutes.get('/api/status', async (c) => {
  const sandbox = c.get('sandbox');
  
  try {
    const process = await findExistingMoltbotProcess(sandbox);
    if (!process) {
      return c.json({ ok: false, status: 'not_running' });
    }
    
    // Process exists, check if it's actually responding
    // Try to reach the gateway with a short timeout
    try {
      await process.waitForPort(18789, { mode: 'tcp', timeout: 5000 });
      return c.json({ ok: true, status: 'running', processId: process.id });
    } catch {
      return c.json({ ok: false, status: 'not_responding', processId: process.id });
    }
  } catch (err) {
    return c.json({ ok: false, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/boot - Start the gateway (no auth required, but rate limited)
// This allows triggering gateway startup without Cloudflare Access
publicRoutes.post('/api/boot', async (c) => {
  const sandbox = c.get('sandbox');

  try {
    // Check if already running first
    const existingProcess = await findExistingMoltbotProcess(sandbox);
    if (existingProcess && existingProcess.status === 'running') {
      return c.json({
        ok: true,
        status: 'already_running',
        processId: existingProcess.id,
        message: 'Gateway is already running'
      });
    }

    // Start the gateway
    const process = await ensureMoltbotGateway(sandbox, c.env);

    return c.json({
      ok: true,
      status: 'started',
      processId: process.id,
      message: 'Gateway boot initiated',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return c.json({
      ok: false,
      status: 'error',
      error: errorMessage
    }, 500);
  }
});

// GET /api/env-check - Check if critical env vars are set (not their values)
publicRoutes.get('/api/env-check', (c) => {
  const env = c.env;
  return c.json({
    ANTHROPIC_API_KEY: !!env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!env.OPENAI_API_KEY,
    AI_GATEWAY_API_KEY: !!env.AI_GATEWAY_API_KEY,
    AI_GATEWAY_BASE_URL: !!env.AI_GATEWAY_BASE_URL,
    ANTHROPIC_BASE_URL: !!env.ANTHROPIC_BASE_URL,
    DISCORD_BOT_TOKEN: !!env.DISCORD_BOT_TOKEN,
    MOLTBOT_GATEWAY_TOKEN: !!env.MOLTBOT_GATEWAY_TOKEN,
    // Browser-related
    CDP_SECRET: !!env.CDP_SECRET,
    WORKER_URL: !!env.WORKER_URL,
    BROWSER_BINDING: !!env.BROWSER,
  });
});

// GET /api/browser-check - Check browser configuration from container
publicRoutes.get('/api/browser-check', async (c) => {
  const sandbox = c.get('sandbox');
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      cdp_secret_set: !!c.env.CDP_SECRET,
      worker_url_set: !!c.env.WORKER_URL,
      browser_binding_exists: !!c.env.BROWSER,
    },
  };

  // Read container's browser config
  try {
    const proc = await sandbox.startProcess('cat /root/.clawdbot/clawdbot.json');
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      if (proc.status !== 'running') break;
      attempts++;
    }

    const logs = await proc.getLogs();
    const stdout = logs.stdout || '';

    try {
      const config = JSON.parse(stdout);
      if (config.browser) {
        result.container_browser = {
          enabled: config.browser.enabled,
          defaultProfile: config.browser.defaultProfile,
          profiles: config.browser.profiles ? Object.keys(config.browser.profiles) : [],
          remoteCdpTimeoutMs: config.browser.remoteCdpTimeoutMs,
          remoteCdpHandshakeTimeoutMs: config.browser.remoteCdpHandshakeTimeoutMs,
        };

        // Show CDP URL (sanitized - hide secret)
        if (config.browser.profiles?.cloudflare?.cdpUrl) {
          const cdpUrl = config.browser.profiles.cloudflare.cdpUrl;
          result.cdp_url_sanitized = cdpUrl.replace(/secret=[^&]+/, 'secret=***');

          // Extract just the host part to verify WORKER_URL is correct
          const urlMatch = cdpUrl.match(/^(https?:\/\/[^/]+)/);
          if (urlMatch) {
            result.cdp_url_host = urlMatch[1];
          }
        }
      } else {
        result.container_browser = null;
        result.error = 'Browser config not found in container config';
      }
    } catch {
      result.config_parse_error = 'Failed to parse container config JSON';
    }
  } catch (err) {
    result.container_error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test if Worker CDP endpoint is reachable from Worker (not container, but still useful)
  if (c.env.CDP_SECRET && c.env.WORKER_URL) {
    try {
      const testUrl = `${c.env.WORKER_URL.replace(/\/$/, '')}/cdp?secret=${encodeURIComponent(c.env.CDP_SECRET)}`;
      const response = await fetch(testUrl, {
        headers: { 'Accept': 'application/json' },
      });
      result.cdp_endpoint_test = {
        status: response.status,
        ok: response.ok,
      };
      if (response.ok) {
        result.cdp_endpoint_response = await response.json();
      }
    } catch (err) {
      result.cdp_endpoint_error = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  return c.json(result);
});

// GET /api/logs - Get recent gateway logs (for debugging)
publicRoutes.get('/api/logs', async (c) => {
  const sandbox = c.get('sandbox');

  try {
    const process = await findExistingMoltbotProcess(sandbox);
    if (!process) {
      return c.json({ ok: false, error: 'Gateway not running' });
    }

    const logs = await process.getLogs();
    // Return last 100 lines of stdout/stderr
    const stdout = (logs.stdout || '').split('\n').slice(-100).join('\n');
    const stderr = (logs.stderr || '').split('\n').slice(-100).join('\n');

    return c.json({
      ok: true,
      processId: process.id,
      status: process.status,
      stdout,
      stderr,
    });
  } catch (err) {
    return c.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

// GET /_admin/assets/* - Admin UI static assets (CSS, JS need to load for login redirect)
// Assets are built to dist/client with base "/_admin/"
publicRoutes.get('/_admin/assets/*', async (c) => {
  const url = new URL(c.req.url);
  // Rewrite /_admin/assets/* to /assets/* for the ASSETS binding
  const assetPath = url.pathname.replace('/_admin/assets/', '/assets/');
  const assetUrl = new URL(assetPath, url.origin);
  return c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw));
});

// GET /api/browser-test - Quick browser test (uses internal secret)
publicRoutes.get('/api/browser-test', async (c) => {
  // Check if browser API is configured
  if (!c.env.CDP_SECRET || !c.env.BROWSER) {
    return c.json({
      ok: false,
      error: 'Browser API not configured',
      missing: {
        cdp_secret: !c.env.CDP_SECRET,
        browser_binding: !c.env.BROWSER,
      }
    });
  }

  try {
    const puppeteer = await import('@cloudflare/puppeteer');

    const startTime = Date.now();
    const browser = await puppeteer.default.launch(c.env.BROWSER, { keep_alive: 30000 });
    const launchTime = Date.now() - startTime;

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to a simple test page
    const navStart = Date.now();
    await page.goto('https://example.com', { waitUntil: 'load', timeout: 30000 });
    const navTime = Date.now() - navStart;

    const title = await page.title();
    const url = page.url();

    // Take a screenshot
    const screenshotStart = Date.now();
    const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
    const screenshotTime = Date.now() - screenshotStart;

    await browser.close();

    return c.json({
      ok: true,
      message: 'Browser API working!',
      test_results: {
        launch_time_ms: launchTime,
        navigation_time_ms: navTime,
        screenshot_time_ms: screenshotTime,
        page_title: title,
        page_url: url,
        screenshot_size: (screenshot as string).length,
      },
      screenshot: screenshot,
    });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    }, 500);
  }
});

export { publicRoutes };
