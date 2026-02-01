import { Hono } from 'hono';
import type { AppEnv, MoltbotEnv } from '../types';
import puppeteer, { type Browser, type Page } from '@cloudflare/puppeteer';

/**
 * Browser API - HTTP-based browser automation
 *
 * Alternative to CDP WebSocket for environments where WebSocket is not available.
 * Each request creates a new browser session, performs the operation, and closes.
 *
 * Authentication: Pass secret as query param `?secret=<CDP_SECRET>`
 */
const browserApi = new Hono<AppEnv>();

/**
 * Verify CDP secret
 */
function verifySecret(secret: string | null, expectedSecret: string | undefined): { valid: boolean; error?: string } {
  if (!expectedSecret) {
    return { valid: false, error: 'Browser API not configured. Set CDP_SECRET.' };
  }
  if (!secret || !timingSafeEqual(secret, expectedSecret)) {
    return { valid: false, error: 'Unauthorized' };
  }
  return { valid: true };
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Execute browser operation with automatic cleanup
 */
async function withBrowser<T>(
  env: MoltbotEnv,
  operation: (browser: Browser, page: Page) => Promise<T>
): Promise<T> {
  if (!env.BROWSER) {
    throw new Error('Browser Rendering not configured');
  }

  const browser = await puppeteer.launch(env.BROWSER, { keep_alive: 60000 });
  const page = await browser.newPage();

  try {
    return await operation(browser, page);
  } finally {
    try {
      await browser.close();
    } catch (e) {
      console.error('[Browser API] Error closing browser:', e);
    }
  }
}

/**
 * POST /browser/screenshot - Take a screenshot of a URL
 *
 * Body: { url: string, viewport?: { width: number, height: number }, fullPage?: boolean, format?: 'png'|'jpeg' }
 */
browserApi.post('/screenshot', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    viewport?: { width: number; height: number };
    fullPage?: boolean;
    format?: 'png' | 'jpeg';
    quality?: number;
    waitMs?: number;
  }>();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      // Set viewport
      if (body.viewport) {
        await page.setViewport(body.viewport);
      } else {
        await page.setViewport({ width: 1280, height: 720 });
      }

      // Navigate
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      // Optional wait for rendering
      if (body.waitMs) {
        await new Promise(r => setTimeout(r, body.waitMs));
      }

      // Screenshot
      const data = await page.screenshot({
        type: body.format || 'png',
        encoding: 'base64',
        fullPage: body.fullPage ?? false,
        quality: body.format === 'jpeg' ? body.quality : undefined,
      });

      return {
        data,
        url: page.url(),
        title: await page.title(),
      };
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /browser/navigate - Navigate and get page content
 *
 * Body: { url: string, waitFor?: string, extractText?: boolean }
 */
browserApi.post('/navigate', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    waitFor?: string;
    extractText?: boolean;
    extractHtml?: boolean;
    waitMs?: number;
  }>();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      // Wait for selector if specified
      if (body.waitFor) {
        await page.waitForSelector(body.waitFor, { timeout: 30000 });
      }

      // Optional wait
      if (body.waitMs) {
        await new Promise(r => setTimeout(r, body.waitMs));
      }

      const response: Record<string, unknown> = {
        url: page.url(),
        title: await page.title(),
      };

      if (body.extractText) {
        response.text = await page.evaluate(() => document.body.innerText);
      }

      if (body.extractHtml) {
        response.html = await page.content();
      }

      return response;
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /browser/execute - Execute JavaScript on a page
 *
 * Body: { url: string, script: string, args?: unknown[] }
 */
browserApi.post('/execute', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    script: string;
    args?: unknown[];
    waitMs?: number;
  }>();

  if (!body.url || !body.script) {
    return c.json({ error: 'url and script are required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      if (body.waitMs) {
        await new Promise(r => setTimeout(r, body.waitMs));
      }

      // Execute the script
      const fn = new Function(`return (${body.script}).apply(this, arguments)`);
      const evalResult = await page.evaluate(fn as () => unknown, ...(body.args || []));

      return {
        url: page.url(),
        title: await page.title(),
        result: evalResult,
      };
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /browser/form - Fill a form and optionally submit
 *
 * Body: { url: string, fields: { selector: string, value: string }[], submit?: string, waitAfterSubmit?: number }
 */
browserApi.post('/form', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    fields: Array<{ selector: string; value: string }>;
    submit?: string;
    waitAfterSubmit?: number;
    screenshotAfter?: boolean;
  }>();

  if (!body.url || !body.fields) {
    return c.json({ error: 'url and fields are required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      // Fill fields
      for (const field of body.fields) {
        await page.waitForSelector(field.selector, { timeout: 10000 });
        await page.click(field.selector);
        await page.type(field.selector, field.value);
      }

      // Submit if selector provided
      if (body.submit) {
        await page.click(body.submit);

        // Wait after submit
        if (body.waitAfterSubmit) {
          await new Promise(r => setTimeout(r, body.waitAfterSubmit));
        } else {
          // Wait for navigation
          try {
            await page.waitForNavigation({ timeout: 30000 });
          } catch {
            // Navigation may not happen for all forms
          }
        }
      }

      const response: Record<string, unknown> = {
        url: page.url(),
        title: await page.title(),
      };

      // Optional screenshot
      if (body.screenshotAfter) {
        response.screenshot = await page.screenshot({ encoding: 'base64' });
      }

      return response;
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /browser/click - Click an element on a page
 *
 * Body: { url: string, selector: string, waitAfter?: number }
 */
browserApi.post('/click', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    selector: string;
    waitAfter?: number;
    screenshotAfter?: boolean;
  }>();

  if (!body.url || !body.selector) {
    return c.json({ error: 'url and selector are required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      // Wait for and click element
      await page.waitForSelector(body.selector, { timeout: 10000 });
      await page.click(body.selector);

      // Wait after click
      if (body.waitAfter) {
        await new Promise(r => setTimeout(r, body.waitAfter));
      }

      const response: Record<string, unknown> = {
        url: page.url(),
        title: await page.title(),
      };

      if (body.screenshotAfter) {
        response.screenshot = await page.screenshot({ encoding: 'base64' });
      }

      return response;
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /browser/sequence - Execute a sequence of browser actions
 *
 * Body: {
 *   url: string,
 *   actions: Array<
 *     { type: 'navigate', url: string } |
 *     { type: 'click', selector: string } |
 *     { type: 'type', selector: string, text: string } |
 *     { type: 'wait', ms: number } |
 *     { type: 'waitForSelector', selector: string } |
 *     { type: 'screenshot' } |
 *     { type: 'execute', script: string }
 *   >,
 *   viewport?: { width: number, height: number }
 * }
 */
browserApi.post('/sequence', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  const body = await c.req.json<{
    url: string;
    actions: Array<{
      type: 'navigate' | 'click' | 'type' | 'wait' | 'waitForSelector' | 'screenshot' | 'execute';
      url?: string;
      selector?: string;
      text?: string;
      ms?: number;
      script?: string;
    }>;
    viewport?: { width: number; height: number };
  }>();

  if (!body.url || !body.actions) {
    return c.json({ error: 'url and actions are required' }, 400);
  }

  try {
    const result = await withBrowser(c.env, async (_, page) => {
      await page.setViewport(body.viewport || { width: 1280, height: 720 });
      await page.goto(body.url, { waitUntil: 'load', timeout: 60000 });

      const results: Array<{ action: string; result?: unknown; error?: string }> = [];
      const screenshots: string[] = [];

      for (const action of body.actions) {
        try {
          switch (action.type) {
            case 'navigate':
              if (action.url) {
                await page.goto(action.url, { waitUntil: 'load', timeout: 60000 });
                results.push({ action: `navigate:${action.url}`, result: 'ok' });
              }
              break;

            case 'click':
              if (action.selector) {
                await page.waitForSelector(action.selector, { timeout: 10000 });
                await page.click(action.selector);
                results.push({ action: `click:${action.selector}`, result: 'ok' });
              }
              break;

            case 'type':
              if (action.selector && action.text) {
                await page.waitForSelector(action.selector, { timeout: 10000 });
                await page.type(action.selector, action.text);
                results.push({ action: `type:${action.selector}`, result: 'ok' });
              }
              break;

            case 'wait':
              if (action.ms) {
                await new Promise(r => setTimeout(r, action.ms));
                results.push({ action: `wait:${action.ms}ms`, result: 'ok' });
              }
              break;

            case 'waitForSelector':
              if (action.selector) {
                await page.waitForSelector(action.selector, { timeout: 30000 });
                results.push({ action: `waitForSelector:${action.selector}`, result: 'ok' });
              }
              break;

            case 'screenshot':
              const data = await page.screenshot({ encoding: 'base64' });
              screenshots.push(data as string);
              results.push({ action: 'screenshot', result: `screenshot_${screenshots.length - 1}` });
              break;

            case 'execute':
              if (action.script) {
                const fn = new Function(`return (${action.script})()`);
                const execResult = await page.evaluate(fn as () => unknown);
                results.push({ action: 'execute', result: execResult });
              }
              break;
          }
        } catch (actionErr) {
          results.push({
            action: action.type,
            error: actionErr instanceof Error ? actionErr.message : 'Failed'
          });
        }
      }

      return {
        url: page.url(),
        title: await page.title(),
        results,
        screenshots,
      };
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /browser/test - Test browser availability
 */
browserApi.get('/test', async (c) => {
  const secret = c.req.query('secret');
  const auth = verifySecret(secret, c.env.CDP_SECRET);
  if (!auth.valid) {
    return c.json({ error: auth.error }, 401);
  }

  try {
    const result = await withBrowser(c.env, async (browser, page) => {
      const version = await browser.version();
      await page.goto('about:blank');

      return {
        browserVersion: version,
        pageUrl: page.url(),
      };
    });

    return c.json({ ok: true, ...result });
  } catch (err) {
    return c.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

export { browserApi };
