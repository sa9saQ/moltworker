#!/usr/bin/env node
/**
 * Local Browser Client - Puppeteer版
 *
 * Cloudflare Browser Renderingの代替としてローカルPuppeteerを使用
 *
 * Usage:
 *   const { createClient } = require('./puppeteer-client');
 *   const client = await createClient();
 *   await client.navigate('https://example.com');
 *   const screenshot = await client.screenshot();
 *   await client.close();
 */

const puppeteer = require('puppeteer');

/**
 * Puppeteerクライアントを作成
 * @param {Object} options - オプション
 * @param {boolean} options.headless - ヘッドレスモード（デフォルト: true）
 * @param {number} options.timeout - タイムアウト（デフォルト: 60000ms）
 * @param {Object} options.viewport - ビューポート（デフォルト: 1280x800）
 * @returns {Promise<Object>} クライアントオブジェクト
 */
async function createClient(options = {}) {
  const headless = options.headless !== false;
  const timeout = options.timeout || 60000;
  const viewport = options.viewport || { width: 1280, height: 800 };

  // ブラウザ起動オプション
  const launchOptions = {
    headless: headless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      `--window-size=${viewport.width},${viewport.height}`
    ],
    defaultViewport: viewport
  };

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  // デフォルトタイムアウト設定
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);

  // User-Agentを設定（ボット検出回避）
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // クライアントAPI（cdp-client.jsと互換性を持たせる）
  const client = {
    browser,
    page,

    /**
     * URLに遷移
     * @param {string} url - 遷移先URL
     * @param {number} waitMs - 遷移後の待機時間（ms）
     */
    async navigate(url, waitMs = 3000) {
      await page.goto(url, { waitUntil: 'networkidle2' });
      if (waitMs > 0) {
        await new Promise(r => setTimeout(r, waitMs));
      }
    },

    /**
     * スクリーンショット取得
     * @param {string} format - フォーマット（png/jpeg）
     * @param {Object} options - 追加オプション
     * @returns {Promise<Buffer>} 画像バッファ
     */
    async screenshot(format = 'png', options = {}) {
      return page.screenshot({
        type: format,
        fullPage: options.fullPage || false,
        quality: format === 'jpeg' ? (options.quality || 80) : undefined
      });
    },

    /**
     * ビューポート設定
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} scale - デバイスピクセル比
     * @param {boolean} mobile - モバイルモード
     */
    async setViewport(width = 1280, height = 800, scale = 1, mobile = false) {
      await page.setViewport({
        width,
        height,
        deviceScaleFactor: scale,
        isMobile: mobile
      });
    },

    /**
     * JavaScript実行
     * @param {string} expression - 実行するJS式
     * @returns {Promise<any>} 実行結果
     */
    async evaluate(expression) {
      return page.evaluate(expression);
    },

    /**
     * スクロール
     * @param {number} y - スクロール量（px）
     */
    async scroll(y = 300) {
      await page.evaluate((scrollY) => window.scrollBy(0, scrollY), y);
      await new Promise(r => setTimeout(r, 300));
    },

    /**
     * 要素クリック
     * @param {string} selector - セレクタ
     */
    async click(selector) {
      await page.waitForSelector(selector, { visible: true });
      await page.click(selector);
    },

    /**
     * テキスト入力
     * @param {string} selector - セレクタ
     * @param {string} text - 入力テキスト
     * @param {Object} options - 追加オプション
     */
    async type(selector, text, options = {}) {
      await page.waitForSelector(selector, { visible: true });
      if (options.clear) {
        await page.click(selector, { clickCount: 3 });
      }
      await page.type(selector, text, { delay: options.delay || 50 });
    },

    /**
     * セレクタ待機
     * @param {string} selector - セレクタ
     * @param {number} timeout - タイムアウト（ms）
     */
    async waitForSelector(selector, timeout = 30000) {
      await page.waitForSelector(selector, { visible: true, timeout });
    },

    /**
     * 指定時間待機
     * @param {number} ms - ミリ秒
     */
    async wait(ms) {
      await new Promise(r => setTimeout(r, ms));
    },

    /**
     * HTML取得
     * @returns {Promise<string>} HTMLコンテンツ
     */
    async getHTML() {
      return page.content();
    },

    /**
     * テキスト取得
     * @returns {Promise<string>} ページテキスト
     */
    async getText() {
      return page.evaluate(() => document.body.innerText);
    },

    /**
     * ページタイトル取得
     * @returns {Promise<string>} ページタイトル
     */
    async getTitle() {
      return page.title();
    },

    /**
     * 現在のURL取得
     * @returns {string} URL
     */
    getURL() {
      return page.url();
    },

    /**
     * Cookie設定
     * @param {Array} cookies - Cookieオブジェクトの配列
     */
    async setCookies(cookies) {
      await page.setCookie(...cookies);
    },

    /**
     * Cookie取得
     * @returns {Promise<Array>} Cookie配列
     */
    async getCookies() {
      return page.cookies();
    },

    /**
     * シーケンス実行（複数アクションの連続実行）
     * @param {Array} actions - アクション配列
     * @returns {Promise<Object>} 実行結果
     */
    async executeSequence(actions) {
      const results = [];
      const screenshots = [];

      for (const action of actions) {
        try {
          let result = 'ok';

          switch (action.type) {
            case 'navigate':
              await this.navigate(action.url, action.waitMs || 2000);
              break;
            case 'click':
              await this.click(action.selector);
              break;
            case 'type':
              await this.type(action.selector, action.text, action);
              break;
            case 'wait':
              await this.wait(action.ms || 1000);
              break;
            case 'waitForSelector':
              await this.waitForSelector(action.selector, action.timeout);
              break;
            case 'screenshot':
              const buffer = await this.screenshot(action.format || 'png');
              screenshots.push(buffer.toString('base64'));
              result = `screenshot_${screenshots.length - 1}`;
              break;
            case 'execute':
              result = await this.evaluate(action.script);
              break;
            case 'scroll':
              await this.scroll(action.y || 300);
              break;
            default:
              result = `unknown action: ${action.type}`;
          }

          results.push({ action: `${action.type}:${action.selector || action.url || ''}`, result });
        } catch (err) {
          results.push({ action: `${action.type}:${action.selector || action.url || ''}`, error: err.message });
        }
      }

      return {
        ok: true,
        url: this.getURL(),
        title: await this.getTitle(),
        results,
        screenshots
      };
    },

    /**
     * ブラウザを閉じる
     */
    async close() {
      await browser.close();
    }
  };

  return client;
}

module.exports = { createClient };

// CLI mode
if (require.main === module) {
  console.log('Puppeteer Client Library');
  console.log('Usage: const { createClient } = require("./puppeteer-client")');
  console.log('\nQuick test:');

  (async () => {
    try {
      console.log('Starting browser...');
      const client = await createClient({ headless: true });
      console.log('Navigating to example.com...');
      await client.navigate('https://example.com', 1000);
      console.log('Title:', await client.getTitle());
      console.log('Taking screenshot...');
      const screenshot = await client.screenshot();
      require('fs').writeFileSync('test-screenshot.png', screenshot);
      console.log('Screenshot saved to test-screenshot.png');
      await client.close();
      console.log('Done!');
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })();
}
