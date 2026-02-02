# MoltWorker 変更履歴

## 2026-02-02

### アカウント変更
- X: `@Yuki_MoltWorker` → `@Rey_Moltworker`
- Threads: `yuki_moltworker` → `rey_moltworker`

### X API設定
- X Developer Portal でアプリ「ReyMoltworker」作成
- 従量課金（Pay-per-use）$25クレジット購入
- OAuth 1.0a 認証情報設定済み:
  - `X_API_KEY` (Consumer Key)
  - `X_API_SECRET` (Consumer Secret)
  - `X_ACCESS_TOKEN`
  - `X_ACCESS_TOKEN_SECRET`

### 新規スキル作成（Phase 1: 基本スキル）

| スキル | 用途 |
|--------|------|
| `skill-creator` | スキル作成のベストプラクティス |
| `human-security` | 人間対応のセキュリティ（詐欺・フィッシング対策） |
| `natural-conversation` | AIっぽくない自然な対話 |
| `x-api` | X公式API経由の投稿 |
| `email-manager` | メール確認・返信 |
| `web-search` | 普通のウェブ検索 |
| `deep-research` | ディープリサーチ（徹底調査） |

### 新規スキル作成（Phase 2: 収益化スキル）

| スキル | 用途 | 収益ポテンシャル |
|--------|------|------------------|
| `metamask-wallet` | MetaMask連携、暗号資産送受信、DeFi操作 | - |
| `defi-optimizer` | DeFiイールド最適化（AAVE, Compound, Curve, Yearn） | 変動大 |
| `video-generator` | AI動画生成（Pika, Runway, HeyGen, Kling） | - |
| `youtube-automation` | フェイスレスYouTubeチャンネル自動運営 | $500-30,000/月 |
| `affiliate-marketing` | AIアフィリエイトマーケティング | $500-8,000/月 |
| `digital-product-creator` | デジタル商品作成・販売 | $500-10,000/月 |
| `course-creator` | オンラインコース作成・販売 | $1,000-10,000/月 |
| `template-seller` | テンプレート販売（Notion, Canva, Excel等） | $500-5,000/月 |
| `prompt-seller` | AIプロンプト作成・販売 | $200-2,000/月 |
| `saas-builder` | Micro-SaaS構築・運営 | $5,000-50,000/月 |
| `failure-analyzer` | 失敗分析・学習システム（全スキル共通） | - |

### セキュリティ強化

**認証強化:**
- `/api/boot`, `/api/logs`, `/api/env-check`, `/api/browser-check`, `/api/browser-test` にCF Access認証を追加
- 認証なしでアクセス可能なエンドポイントを最小化

**新規スキル作成（Phase 3: セキュリティ・品質スキル）:**

| スキル | 用途 |
|--------|------|
| `security-review` | 包括的セキュリティレビュー（OWASP、暗号資産、AI） |
| `systematic-debug` | 証拠ベースの体系的デバッグ（4フェーズ） |
| `code-review` | コードレビュー（Quick/Standard/Full） |
| `threat-model` | STRIDE脅威モデリング、攻撃シナリオ設計 |
| `quality-gate` | 品質ゲート（Level 1-3、デプロイ/コミット前チェック） |
| `auto-fix` | 自動修正（lint、型エラー、構文エラー） |
| `root-cause-tracing` | 根本原因追跡（5 Whys、フォールトツリー） |
| `verification-checkpoint` | 完了宣言前の検証チェックポイント |

**承認フロー改善:**
- `metamask-wallet`: 4段階承認レベル（自動→確認→承認→二重確認）
- `defi-optimizer`: 同様の4段階承認レベル
- 監督者承認で大口取引（$1,000+）も実行可能に
- 累積監視機能追加（24時間で$500超で警告）

**APIモード変更:**
- OAuthトークン処理を削除（サードパーティツールでブロックされているため）
- APIキーのみの認証に変更

### model-router強化

**サブスク↔API自動切り替え機能追加:**
- 429エラー、"usage limit reached"検出でAPIに自動切り替え
- 6時間後（または週間制限なら7日後）にサブスクに自動復帰
- 切り替え時は監督者に通知

**サブスクリセット時間:**
- 水曜 1:00 にリセット

### コード修正: サブスク↔API自動切り替え対応

**変更ファイル:**
- `src/types.ts` - CLAUDE_CODE_OAUTH_TOKEN追加
- `src/gateway/env.ts` - 両方の認証情報を渡すように修正
- `src/index.ts` - 認証チェックロジック更新

**動作:**
```
通常: CLAUDE_CODE_OAUTH_TOKEN（サブスク）を使用
  ↓
429/制限検出: ANTHROPIC_API_KEY（API）にフォールバック
  ↓
制限解除後: サブスクに自動復帰
```

**設定方法:**
```bash
# 両方設定しておく（推奨）
wrangler secret put CLAUDE_CODE_OAUTH_TOKEN  # サブスク用
wrangler secret put ANTHROPIC_API_KEY        # フォールバック用
```

### サーバーでのサブスク使用方法（調査結果）

```
方法1: SSH Port Forwarding
ssh -L 8080:localhost:8080 user@server.com
→ サーバーでclaude login → ローカルブラウザで認証

方法2: OAuthトークン転送
export CLAUDE_CODE_OAUTH_TOKEN="トークン"

方法3: 認証ファイル転送
scp ~/.claude/auth.json user@server:~/.claude/
```

### DeFi/仮想通貨スキルの方針

- **自律的に成長しながら戦略を考える**
- 失敗から学び、戦略を改善
- 監督者承認は大きな取引のみ必要

### 自律行動ルール更新

**自分の判断でOK:**
- SNSへの投稿
- プロフィール変更
- リサーチ（web-search, deep-research）
- スキルの組み合わせ判断

**確認必須:**
- お金がかかること
- スキル開発・作成
- アカウント削除など取り消し不可の操作
- 監督者の個人情報

### 成長ルール追加
- 毎日新しいことを学ぶ
- 投稿の反応から学習
- 振り返りサイクル（投稿ごと/毎日/毎週）

---

## 2026-02-01

### 初期設定
- MoltWorkerプロジェクト作成
- Cloudflare AI Gateway設定（403エラー対策）
- 基本スキル群の設定
