---
name: cloudflare-browser
description: Control headless Chrome via Puppeteer for local execution. Screenshots, navigation, form filling, browser automation without Cloudflare dependency.
---

# Local Browser Automation (Puppeteer)

ローカルPCでヘッドレスブラウザを操作するスキル。Cloudflare不要。

## 前提条件

```bash
# Puppeteerインストール（初回のみ）
npm install puppeteer

# または pnpm
pnpm add puppeteer
```

## スクリプト一覧

| スクリプト | 用途 |
|-----------|------|
| `puppeteer-client.js` | 再利用可能なクライアントライブラリ |
| `screenshot-local.js` | スクリーンショット取得 |
| `video-local.js` | 動画キャプチャ（ffmpeg必要） |

---

## 使用方法

### スクリーンショット

```bash
# 基本
node scripts/screenshot-local.js https://example.com output.png

# フルページ
node scripts/screenshot-local.js https://example.com output.png --full-page

# モバイル表示
node scripts/screenshot-local.js https://example.com output.png --mobile

# JPEG形式
node scripts/screenshot-local.js https://example.com output.jpg --jpeg
```

### 動画キャプチャ

```bash
# 複数URL
node scripts/video-local.js "https://example.com,https://google.com" output.mp4

# スクロール付き
node scripts/video-local.js "https://example.com" output.mp4 --scroll --fps 15
```

### プログラムから使用

```javascript
const { createClient } = require('./scripts/puppeteer-client');

async function main() {
  const client = await createClient({ headless: true });

  // ページ遷移
  await client.navigate('https://example.com');
  console.log('Title:', await client.getTitle());

  // スクリーンショット
  const screenshot = await client.screenshot('png');
  require('fs').writeFileSync('screenshot.png', screenshot);

  // クリック
  await client.click('button.submit');

  // テキスト入力
  await client.type('#email', 'user@example.com');

  // シーケンス実行
  const result = await client.executeSequence([
    { type: 'navigate', url: 'https://x.com' },
    { type: 'waitForSelector', selector: '[data-testid="tweetTextarea_0"]' },
    { type: 'type', selector: '[data-testid="tweetTextarea_0"]', text: 'Hello!' },
    { type: 'wait', ms: 1000 },
    { type: 'screenshot' }
  ]);

  await client.close();
}

main();
```

---

## API リファレンス

### createClient(options)

```javascript
const client = await createClient({
  headless: true,          // ヘッドレスモード（デフォルト: true）
  timeout: 60000,          // タイムアウト（ms）
  viewport: { width: 1280, height: 800 }
});
```

### client メソッド

| メソッド | 説明 |
|---------|------|
| `navigate(url, waitMs)` | URLに遷移 |
| `screenshot(format, options)` | スクリーンショット取得 |
| `click(selector)` | 要素クリック |
| `type(selector, text, options)` | テキスト入力 |
| `waitForSelector(selector, timeout)` | 要素待機 |
| `wait(ms)` | 指定時間待機 |
| `scroll(y)` | スクロール |
| `evaluate(expression)` | JavaScript実行 |
| `getHTML()` | HTML取得 |
| `getText()` | テキスト取得 |
| `getTitle()` | タイトル取得 |
| `getURL()` | URL取得 |
| `setCookies(cookies)` | Cookie設定 |
| `getCookies()` | Cookie取得 |
| `executeSequence(actions)` | 複数アクション実行 |
| `close()` | ブラウザ終了 |

---

## シーケンスアクション

`executeSequence()` で使用可能なアクション：

| type | パラメータ | 説明 |
|------|-----------|------|
| navigate | url, waitMs | 別URLに遷移 |
| click | selector | 要素クリック |
| type | selector, text, clear, delay | テキスト入力 |
| wait | ms | 指定ミリ秒待機 |
| waitForSelector | selector, timeout | 要素表示まで待機 |
| screenshot | format | スクリーンショット |
| execute | script | JavaScript実行 |
| scroll | y | スクロール |

---

## SNS投稿パターン

### X(Twitter)投稿

```javascript
await client.executeSequence([
  { type: 'navigate', url: 'https://x.com/compose/tweet' },
  { type: 'waitForSelector', selector: '[data-testid="tweetTextarea_0"]' },
  { type: 'type', selector: '[data-testid="tweetTextarea_0"]', text: '投稿内容' },
  { type: 'wait', ms: 1000 },
  { type: 'click', selector: '[data-testid="tweetButton"]' },
  { type: 'wait', ms: 3000 },
  { type: 'screenshot' }
]);
```

### Threads投稿

```javascript
await client.executeSequence([
  { type: 'navigate', url: 'https://threads.net' },
  { type: 'click', selector: '[aria-label="New post"]' },
  { type: 'waitForSelector', selector: '[data-contents="true"]' },
  { type: 'type', selector: '[data-contents="true"]', text: '投稿内容' },
  { type: 'wait', ms: 1000 },
  { type: 'click', selector: '[data-testid="post-button"]' },
  { type: 'wait', ms: 3000 },
  { type: 'screenshot' }
]);
```

### Coconalaログイン

```javascript
await client.executeSequence([
  { type: 'navigate', url: 'https://coconala.com/login' },
  { type: 'type', selector: '#email', text: 'メールアドレス' },
  { type: 'type', selector: '#password', text: 'パスワード' },
  { type: 'click', selector: 'button[type="submit"]' },
  { type: 'wait', ms: 5000 },
  { type: 'screenshot' }
]);
```

### note.com投稿

```javascript
await client.executeSequence([
  { type: 'navigate', url: 'https://note.com/new' },
  { type: 'waitForSelector', selector: '.editor' },
  { type: 'type', selector: '.title-input', text: '記事タイトル' },
  { type: 'type', selector: '.editor', text: '記事本文...' },
  { type: 'screenshot' }
]);
```

---

## Cookie/セッション管理

ログイン状態を維持するには、Cookieを保存・復元：

```javascript
const fs = require('fs');

// ログイン後にCookieを保存
const cookies = await client.getCookies();
fs.writeFileSync('cookies.json', JSON.stringify(cookies));

// 次回起動時にCookieを復元
const savedCookies = JSON.parse(fs.readFileSync('cookies.json'));
await client.setCookies(savedCookies);
await client.navigate('https://example.com/dashboard');
```

---

## トラブルシューティング

### ブラウザが起動しない

```bash
# Chromiumの依存関係インストール（Linux）
sudo apt install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 \
  libpangocairo-1.0-0 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0
```

### セレクタが見つからない

1. `--headless false` で可視化して確認
2. `waitForSelector` で待機時間を増やす
3. DevToolsでセレクタを確認

### メモリ不足

```javascript
// 複数ページ処理時はページを閉じる
await client.page.close();
const newPage = await client.browser.newPage();
```

---

## 旧Cloudflare版との互換性

| 旧 (Cloudflare) | 新 (Local) |
|-----------------|------------|
| `CDP_SECRET` 環境変数 | 不要 |
| `WORKER_URL` 環境変数 | 不要 |
| `POST /browser/screenshot` | `client.screenshot()` |
| `POST /browser/sequence` | `client.executeSequence()` |
| WebSocket CDP | Puppeteer直接制御 |

---

## 他スキルとの連携

| スキル | 使用方法 |
|--------|---------|
| x-browser | executeSequenceでX投稿 |
| threads-poster | executeSequenceでThreads投稿 |
| coconala-seller | フォーム操作で商品管理 |
| note-publisher | executeSequenceで記事投稿 |
| instagram-poster | executeSequenceでInstagram投稿 |
| tiktok-poster | executeSequenceでTikTok投稿 |

---

## セキュリティ注意事項

- Cookieファイルは `.gitignore` に追加
- パスワードはハードコードしない（環境変数使用）
- 過度な自動化はアカウント凍結リスクあり
- 投稿間隔は最低30分空ける（SNS系）
