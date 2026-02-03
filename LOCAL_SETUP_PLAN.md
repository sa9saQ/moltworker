# OpenClaw ローカルPC セットアップ計画

作成日: 2026-02-03

---

## 📋 PCセットアップチェックリスト

### Phase 1: OS基本セットアップ
- [ ] OS インストール（Ubuntu 24.04 LTS推奨 or Windows 11 + WSL2）
- [ ] SSH設定（リモートアクセス用）
- [ ] 固定IPアドレス設定
- [ ] ファイアウォール設定

### Phase 2: 開発環境
- [ ] Node.js 22+ インストール
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- [ ] pnpm インストール
  ```bash
  npm install -g pnpm
  ```
- [ ] Git インストール
- [ ] Docker インストール（オプション、Ollama用）

### Phase 3: OpenClaw インストール
- [ ] OpenClaw CLI インストール
  ```bash
  npm install -g openclaw@latest
  ```
- [ ] セットアップウィザード実行
  ```bash
  openclaw onboard --install-daemon
  ```

### Phase 4: API Keys 設定
- [ ] Claude setup-token 生成（サブスク用）
  ```bash
  claude setup-token
  ```
- [ ] Anthropic API Key（バックアップ用）
- [ ] OpenAI API Key（Codex用）
- [ ] xAI Grok API Key（SNSリサーチ用）
- [ ] Google Gemini API Key（Web検索用）

### Phase 5: 外部アクセス設定（オプション）
- [ ] Tailscale インストール（外出先アクセス用）
  ```bash
  curl -fsSL https://tailscale.com/install.sh | sh
  sudo tailscale up
  ```

---

## 🧠 Alex Finn方式: 脳/筋肉アーキテクチャ

### コンセプト
```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🧠 BRAIN (脳) - Claude Opus 4.5                            │
│  ├── 全体の指揮・戦略                                       │
│  ├── 性格・人格                                              │
│  ├── 指示の理解・分析                                        │
│  ├── 意思決定                                                │
│  └── タスク分解・委譲                                        │
│                                                              │
│  💪 MUSCLES (筋肉) - 専門ツール                              │
│  ├── コーディング → OpenAI Codex                            │
│  ├── Web検索 → Google Gemini                                │
│  ├── SNS/Xリサーチ → xAI Grok                               │
│  ├── Reddit検索 → OpenAI GPT-4o                             │
│  └── ブラウザ操作 → Cloudflare Browser Rendering            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### なぜこの構成か

| モデル | 役割 | 理由 |
|--------|------|------|
| Claude Opus 4.5 | 脳 | 推論深度89%（Codex 84%）、複雑なバグ分析に優れる |
| OpenAI Codex | コーディング | 速度23%速い、SWE-bench 80%、コスト効率良い |
| Gemini | Web検索 | 無料枠1500回/日、Grounding with Google Search |
| Grok | SNS/X検索 | Xデータにリアルタイムアクセス、2Mコンテキスト |
| OpenAI GPT-4o | Reddit | 一般的なWeb検索・分析に安定 |

---

## 💰 コスト分析

### サブスク vs API 比較

| サービス | サブスク | API従量課金 | おすすめ |
|----------|---------|------------|---------|
| Claude (脳) | $100-200/月 Max | $3/$15 per 1M | **サブスク** (定額で安心) |
| Codex (筋肉) | $20/月 Plus | $1.50/$6 per 1M | **サブスク** (月10回以上なら) |
| Gemini | 無料枠あり | $14/1k検索 | **無料枠** (1500回/日) |
| Grok | $30/月 SuperGrok | $0.20/$0.50 per 1M | **API** ($25無料枠あり) |

### 月額コスト見積もり

**Alex Finn方式（最適化版）:**
```
Claude Max       : $100-200/月（脳として定額）
ChatGPT Plus     :  $20/月（Codex用）
Gemini           :  $0/月（無料枠内）
Grok API         : $5-30/月（従量）
OpenAI API       : $10-30/月（Reddit検索）
─────────────────────────────
合計             : $135-280/月
```

**現在のAPI従量課金のみ（高い）:**
```
Claude API       : $150-300+/月（2-3日で$50のペース）
```

→ **サブスク活用で40-60%コスト削減可能**

---

## 🔄 自動切り替えシステム（TODO）

### 要件
1. Claude Max サブスクの5時間制限を検出
2. 制限中は自動でAnthropic APIに切り替え
3. 制限解除後はサブスクに戻る

### 実装方針
```
┌─────────────────────────────────────────────────────────────┐
│                   Model Router Skill                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. リクエスト受信                                           │
│       ↓                                                      │
│  2. Claude Max サブスク状態チェック                          │
│       │                                                      │
│       ├─ 利用可能 → setup-token 経由でリクエスト            │
│       │                                                      │
│       └─ 制限中 → API Key 経由でリクエスト                  │
│                    （Sonnet 4.5 で節約）                     │
│       ↓                                                      │
│  3. 定期的に制限状態を再チェック（5分ごと）                  │
│       │                                                      │
│       └─ 解除検出 → サブスクに戻す                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 実装ファイル（予定）
- `skills/model-router/SKILL.md` - スキル定義
- `skills/model-router/scripts/check-limit.js` - 制限チェック
- `skills/model-router/scripts/switch-provider.js` - 切り替えロジック

---

## 📝 TODO リスト

### 高優先度
- [ ] PCセットアップ完了
- [ ] OpenClawインストール
- [ ] Claude Max setup-token 設定
- [ ] Codex (ChatGPT Plus) 設定
- [ ] 自動切り替えスキル実装

### 中優先度
- [ ] Gemini API 設定（Web検索）
- [ ] Grok API 設定（SNS/Xリサーチ）
- [ ] OpenAI API 設定（Reddit検索）

### 低優先度
- [ ] Tailscale 設定（外部アクセス）
- [ ] Cloudflareからのデータ移行
- [ ] 監視・アラート設定

---

## 📊 ベンチマーク参考

### SWE-bench Verified (コーディング能力)
| モデル | スコア | 備考 |
|--------|-------|------|
| Claude Opus 4.5 | 80.9% | 複雑なバグ分析に強い |
| GPT-5.2 Codex | 80.0% | 速度23%速い |
| Gemini 3 Pro | 78.5% | バランス型 |

### コード生成速度
| モデル | 5分間で生成できる行数 |
|--------|---------------------|
| Claude Code | ~1,200行 |
| Codex | ~200行 |

→ **脳（思考）はClaude、筋肉（大量生成）はCodex** が理にかなっている

---

## 📦 スキル移行手順（Cloudflare → サブPC）

### 現在のスキル一覧（92個）
GitHubリポジトリ: `https://github.com/sa9saQ/moltworker.git`

```
skills/
├── accounts, affiliate-link, affiliate-marketing, airdrop-hunter
├── analytics-tracker, arbitrage-bot, auto-fix, auto-reply
├── automation, autonomous-actions, bankr-trading, business-automation
├── clawhub-publisher, cloudflare-browser, coconala-seller, code-docs-generator
├── code-review, content-ideas, course-creator, creative-ideator
├── customer-crm, daily-routine, deep-research, defi-optimizer
├── developer, digital-product-creator, email-manager, email-marketing-copy
├── emergency-response, engagement-helper, failure-analyzer, fiverr-seller
├── gas-developer, gumroad-seller, human-negotiator, human-security
├── idea-lab, instagram-poster, learning-engine, linkedin-automation
├── linkedin-poster, medium-writer, memory, metamask-wallet
├── model-router, moltbook-negotiator, moltbook-optimizer, moltbook-security
├── nano-banana, natural-conversation, note-publisher, note-writer
├── persona, podcast-creator, polymarket-trader, product-image-generator
├── prompt-injection-guard, prompt-seller, quality-checker, quality-gate
├── reddit-poster, resources, revenue-ideator, revenue-tracker
├── root-cause-tracing, saas-builder, scheduler, screenshot
├── security-review, self-identity, seo-content-engine, skill-creator
├── skill-self-improvement, sns-scheduler, social-scheduler, supervisor-proposer
├── systematic-debug, template-seller, thought-logger, threads-poster
├── threat-model, tiktok-poster, trend-analyzer, upwork-seller
├── verification-checkpoint, video-generator, web-scraper, web-search
├── website-builder, x-api, x-browser, youtube-automation
└── 計92個
```

### 移行方法

**方法1: GitHub経由（推奨）**
```bash
# サブPCで実行
git clone https://github.com/sa9saQ/moltworker.git
cd moltworker

# スキルをOpenClawにコピー
cp -r skills/* ~/.openclaw/skills/
```

**方法2: 直接コピー（ネットワーク経由）**
```bash
# メインPCで（このマシン）
cd /home/zsaku/research/autonomous-ai-agent-system/moltworker
tar -czvf skills-backup.tar.gz skills/

# サブPCに転送（Tailscale使用時）
scp skills-backup.tar.gz user@subpc:~/

# サブPCで展開
tar -xzvf skills-backup.tar.gz -C ~/.openclaw/
```

### 注意事項
- `cloudflare-browser` スキルはローカルでは動かない（Cloudflare Browser Rendering依存）
- `x-api` スキルはWorkers経由のOAuth必要 → ローカル用に修正必要

---

## 🧠 記憶データ移行（Cloudflare → サブPC）

### 記憶システムの仕組み
OpenClawの記憶は**Google Sheets**に保存されている（R2ではない）。

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 (Daily)   → Google Sheet: daily_memories           │
│  Layer 2 (Weekly)  → Google Sheet: weekly_memories          │
│  Layer 3 (Monthly) → Google Sheet: monthly_memories         │
│  Layer 4 (Core)    → Google Sheet: core_memories            │
│                                                              │
│  圧縮フロー:                                                 │
│  Daily (24h後) → Weekly (7日後) → Monthly (30日後) → Core   │
└─────────────────────────────────────────────────────────────┘
```

### 移行手順

**ステップ1: Google Sheets APIキー確認**
```bash
# CloudflareのシークレットからGoogleサービスアカウントキーを取得
npx wrangler secret list

# 必要なシークレット:
# - GOOGLE_SERVICE_ACCOUNT_KEY（JSON形式）
# - MEMORY_SPREADSHEET_ID
```

**ステップ2: サービスアカウントキーをローカルに設定**
```bash
# サブPCで
mkdir -p ~/.openclaw/credentials

# Google Cloud Consoleからサービスアカウントキーをダウンロード
# または Cloudflare Secretsから取得（手動コピー）
# ファイル: ~/.openclaw/credentials/google-service-account.json
```

**ステップ3: 環境変数設定**
```bash
# ~/.openclaw/.env に追加
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=~/.openclaw/credentials/google-service-account.json
MEMORY_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
```

**ステップ4: 記憶データは自動同期**
- Google Sheetsはクラウド上にあるため、移行不要
- 同じSpreadsheet IDを設定すれば、サブPCからも同じ記憶にアクセス可能

### Google Sheets記憶の確認方法
```
Spreadsheet URL: https://docs.google.com/spreadsheets/d/{MEMORY_SPREADSHEET_ID}

シート構成:
├── daily_memories   - 24時間以内の記憶
├── weekly_memories  - 1週間以内の要約
├── monthly_memories - 1ヶ月以内の要約
└── core_memories    - 永続的な重要記憶
```

### R2に保存されている設定・状態ファイルの移行
```bash
# 同期状態ファイル
npx wrangler r2 object get moltbot-data/.last-sync \
    --file /tmp/r2-last-sync.txt --remote

# 設定ファイル（存在する場合）
npx wrangler r2 object get moltbot-data/clawdbot/clawdbot.json \
    --file ~/.openclaw/config.json --remote

# スキル固有の状態ファイル（存在する場合）
npx wrangler r2 object get moltbot-data/skills/memory/state.json \
    --file ~/.openclaw/skills/memory/state.json --remote
```

### 移行チェックリスト
- [ ] Google サービスアカウントキーをサブPCに設置
- [ ] MEMORY_SPREADSHEET_ID を環境変数に設定
- [ ] Google Sheetsへのアクセス確認（シートが読める）
- [ ] R2の設定ファイルをダウンロード（clawdbot.json等）
- [ ] OpenClawで記憶機能の動作確認

### R2からカスタム設定も移行
```bash
# R2から設定ファイルをダウンロード
npx wrangler r2 object get moltbot-data/clawdbot/clawdbot.json \
    --file ~/.openclaw/clawdbot.json --remote

# 最終同期時刻確認（2026-02-03時点で正常同期確認済み）
npx wrangler r2 object get moltbot-data/.last-sync --file /tmp/last-sync.txt --remote
cat /tmp/last-sync.txt
```

### R2全体バックアップ（rclone推奨）
```bash
# rcloneインストール
sudo apt install rclone

# 設定（~/.config/rclone/rclone.conf）
[r2]
type = s3
provider = Cloudflare
access_key_id = YOUR_R2_ACCESS_KEY_ID
secret_access_key = YOUR_R2_SECRET_ACCESS_KEY
endpoint = https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com

# 全データダウンロード
rclone sync r2:moltbot-data/ ./r2-full-backup/
```

---

## 🎯 Codex 5.2 専用設定（最高モデル）

### 決定事項
- **使用モデル: gpt-5.2-codex**（最高性能のみ使用）
- **miniは使わない**

### 料金
| 項目 | 金額 |
|------|------|
| 入力 | $2.00/1M tokens |
| 出力 | $12.00/1M tokens |
| 1セッション目安 | $0.22 |
| 月30セッション | $6.60 |

### 設定方法

**サブスク（ChatGPT Plus $20/月）- メイン**
```bash
# OpenClawでCodex設定
openclaw config set codex.model "gpt-5.2-codex"
openclaw config set codex.subscription true
```

**API（バックアップ）**
```bash
# 制限時のフォールバック用
openclaw config set codex.api_key "sk-..."
openclaw config set codex.fallback_model "gpt-5.2-codex"
```

### 2026年2月キャンペーン
- **2倍レートリミット実施中**（期間限定）
- Plus: 週3,000メッセージ → 6,000メッセージ
- Pro: 実質無制限

---

## 🔄 自動切り替えシステム（Claude + Codex）

### アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                 Intelligent Model Router                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  【Claude (脳)】                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Primary: Claude Max サブスク (setup-token)          │   │
│  │     ↓ 5時間制限検出                                  │   │
│  │  Fallback: Anthropic API (Sonnet 4.5 で節約)        │   │
│  │     ↓ 制限解除検出                                   │   │
│  │  → サブスクに自動復帰                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  【Codex (筋肉)】                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Primary: ChatGPT Plus サブスク (gpt-5.2-codex)     │   │
│  │     ↓ 週間制限検出                                   │   │
│  │  Fallback: OpenAI API (gpt-5.2-codex, $2/$12)       │   │
│  │     ↓ 制限リセット検出                               │   │
│  │  → サブスクに自動復帰                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 実装TODO
- [ ] `skills/model-router/` の機能拡張
- [ ] Claude制限検出スクリプト
- [ ] Codex制限検出スクリプト
- [ ] 自動切り替えロジック
- [ ] 制限解除の定期チェック（5分ごと）

---

## 📝 最終TODO（優先順位付き）

### 🔴 最優先（サブPCセットアップ直後）
1. [ ] Node.js 22+ インストール
2. [ ] OpenClaw インストール (`npm install -g openclaw@latest`)
3. [ ] GitHubからスキルをclone
4. [ ] Claude Max setup-token 設定
5. [ ] ChatGPT Plus 契約（2倍キャンペーン中！）
6. [ ] Codex gpt-5.2-codex 設定

### 🟡 高優先（動作確認後）
7. [ ] 自動切り替えスキル実装（Claude用）
8. [ ] 自動切り替えスキル実装（Codex用）
9. [ ] Gemini API 設定（Web検索）
10. [ ] Grok API 設定（SNS/Xリサーチ）

### 🟢 中優先
11. [ ] OpenAI API 設定（Reddit検索、バックアップ）
12. [ ] Tailscale 設定（外部アクセス）
13. [ ] cloudflare-browser スキルのローカル対応

### ⚪ 低優先
14. [ ] Cloudflareデプロイの停止検討
15. [ ] 監視・アラート設定

---

## 🔗 参考リンク

- [OpenClaw公式ドキュメント](https://docs.openclaw.ai/)
- [Claude Opus 4.5 vs GPT-5.2 Codex比較](https://vertu.com/lifestyle/claude-opus-4-5-vs-gpt-5-2-codex-head-to-head-coding-benchmark-comparison/)
- [Codex Pricing](https://developers.openai.com/codex/pricing/)
- [xAI Grok API Pricing](https://docs.x.ai/docs/models)
- [Gemini Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search)
- [GitHubリポジトリ](https://github.com/sa9saQ/moltworker)
