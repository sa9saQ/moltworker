---
name: x-api
description: Post to X (Twitter) using official API with local OAuth 1.0a signing. No Cloudflare dependency. Supports tweets, threads.
auto_trigger: false
---

# X API 投稿スキル（ローカル版）

X（旧Twitter）公式APIを使った投稿スキル。ローカルでOAuth署名、Cloudflare不要。

## アーキテクチャ

```
旧: MoltBot → Workers (OAuth署名) → X API
新: MoltBot → ローカル (OAuth署名) → X API 直接
```

## 必要な環境変数

```bash
export X_API_KEY="your-api-key"              # Consumer Key
export X_API_SECRET="your-api-secret"        # Consumer Secret
export X_ACCESS_TOKEN="your-access-token"    # Access Token
export X_ACCESS_TOKEN_SECRET="your-secret"   # Access Token Secret
```

---

## CLI使用方法

### ツイート投稿

```bash
node scripts/x-client.js tweet "Hello World!"
```

### スレッド投稿

```bash
node scripts/x-client.js thread "1つ目のツイート" "2つ目のツイート" "3つ目のツイート"
```

### ツイート削除

```bash
node scripts/x-client.js delete 1234567890
```

### 自分の情報取得

```bash
node scripts/x-client.js me
```

---

## プログラムから使用

```javascript
const { XClient } = require('./scripts/x-client');

async function main() {
  const client = new XClient();

  // ツイート投稿
  const result = await client.tweet('Hello World!');
  console.log(result);
  // { success: true, data: { id: "123..." }, url: "https://x.com/i/status/123..." }

  // 返信ツイート
  const reply = await client.tweet('This is a reply!', {
    replyTo: '1234567890'
  });

  // 引用ツイート
  const quote = await client.tweet('Great post!', {
    quoteTweetId: '1234567890'
  });

  // スレッド投稿
  const thread = await client.thread([
    'AIツールを100個試した',
    '本当に使えるのは5個',
    'その5個を紹介します'
  ]);
  console.log(thread);
  // { success: true, data: [...], url: "...", count: 3 }

  // ツイート削除
  await client.deleteTweet('1234567890');

  // 自分の情報取得
  const me = await client.getMe();
  console.log(me);
}

main();
```

---

## API メソッド

| メソッド | 説明 |
|---------|------|
| `tweet(text, options)` | ツイート投稿 |
| `thread(tweets)` | スレッド投稿 |
| `deleteTweet(id)` | ツイート削除 |
| `getTweet(id)` | ツイート取得 |
| `getMe()` | 自分の情報取得 |

### tweet オプション

```javascript
{
  replyTo: '1234567890',       // 返信先ツイートID
  quoteTweetId: '1234567890',  // 引用ツイートID
  mediaIds: ['media_id_1']     // メディアID配列
}
```

---

## エラーハンドリング

```javascript
const result = await client.tweet('Hello!');

if (!result.success) {
  console.error('Failed:', result.errors);
  // リトライロジック
}
```

### よくあるエラー

| コード | 意味 | 対処 |
|--------|------|------|
| 401 | 認証エラー | API キー確認 |
| 403 | 権限不足 | アプリ権限確認（Read and Write必要） |
| 429 | レート制限 | 15分待機して再試行 |
| 400 | リクエスト不正 | パラメータ確認 |

---

## x-browser との使い分け

| 項目 | x-api | x-browser |
|------|-------|-----------|
| **方式** | 公式API (OAuth 1.0a) | ブラウザ自動化 (Puppeteer) |
| **コスト** | API利用料 | 無料 |
| **信頼性** | 高い | UI変更で壊れる可能性 |
| **制限** | API制限 | アカウント凍結リスク |
| **機能** | 基本機能 | 全機能（DM, スペースなど） |
| **推奨** | ビジネス自動化 | 実験・複雑な操作 |

### 推奨用途

```
ビジネス・自動化 → x-api（安定性）
実験・テスト → x-browser（無料）
大量投稿 → x-api（レート管理しやすい）
複雑な操作 → x-browser（全機能）
```

---

## API料金目安

```
投稿（POST）:
├── ツイート投稿: ~$0.01/回
├── 削除: ~$0.005/回
└── リツイート: ~$0.005/回

読み取り（GET）:
├── ツイート取得: ~$0.005/回
├── ユーザー情報: ~$0.005/回
└── メンション取得: ~$0.01/回
```

---

## セキュリティ

### 認証情報の取り扱い

```
禁止:
├── 認証情報をログに出力
├── 認証情報をコードにハードコード
├── 認証情報をGitにコミット
└── 認証情報を外部送信

必須:
├── 環境変数で管理
├── .envファイルは.gitignoreに追加
└── 署名は毎回新規生成
```

### .env ファイル例

```bash
# .env（.gitignoreに追加すること）
X_API_KEY=your-api-key
X_API_SECRET=your-api-secret
X_ACCESS_TOKEN=your-access-token
X_ACCESS_TOKEN_SECRET=your-access-token-secret
```

---

## 旧Cloudflare版との比較

| 項目 | 旧 (Cloudflare) | 新 (Local) |
|------|-----------------|------------|
| OAuth署名 | Workers側 | ローカル |
| エンドポイント | `/x/tweet` | 直接 `api.x.com` |
| 環境変数 | Cloudflare Secrets | ローカル `.env` |
| CDP_SECRET | 必要 | 不要 |
| MOLTBOT_URL | 必要 | 不要 |

---

## 連携スキル

| スキル | 連携内容 |
|--------|----------|
| cloudflare-browser | 画像付きツイート用スクショ |
| nano-banana | 画像生成 → X投稿 |
| sns-scheduler | 予約投稿 |
| content-ideas | 投稿ネタ生成 |
| trend-analyzer | トレンド確認 |

---

## 使用例

### MoltBotでの使い方

```
ユーザー: 「Xに『こんにちは！』と投稿して」

MoltBot:
1. x-api スキル使用
2. ローカルでOAuth 1.0a署名生成
3. X API直接呼び出し
4. 結果報告

返答: 「Xに投稿しました！
https://x.com/Rey_Moltworker/status/xxxxx」
```

### スレッド投稿

```
ユーザー: 「以下をスレッドで投稿して
1. AIツールを100個試した
2. 本当に使えるのは5個
3. その5個を紹介します」

MoltBot:
1. thread() メソッドで順次投稿
2. 各ツイートをreplyで繋ぐ
3. 完了報告
```
