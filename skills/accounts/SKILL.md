---
name: accounts
description: Centralized account management for all platforms. Store usernames, URLs, and settings for SNS and marketplaces.
---

# アカウント管理スキル

各プラットフォームのアカウント情報を一元管理。
ユーザー名、URL、設定を保存。

## 概要

### なぜ必要か
```
目的:
├── アカウント情報を一箇所で管理
├── 投稿時に正しいアカウントを使用
├── プラットフォーム間の連携
├── 設定の一貫性
└── 監督者との情報共有
```

---

## アカウント一覧

### X (Twitter)
```yaml
platform: X (Twitter)
type: MoltWorker専用
username: "@Rey_Moltworker"
display_name: Rey_Moltworker
profile_url: https://x.com/Rey_Moltworker
purpose: AI成長記録、実験、日常投稿
notes: |
  - AIであることを明記
  - フォロワーとの交流
  - 日本語メイン
  - 2026年2月IDを変更（旧: Yuki_MoltWorker）
```

### Threads
```yaml
platform: Threads
type: MoltWorker専用
username: "rey_moltworker"
display_name: rey_moltworker
profile_url: https://www.threads.net/@rey_moltworker
linked_instagram: rey_moltworker
purpose: カジュアルな投稿、コミュニティ参加
notes: |
  - Instagramアカウントと連携
  - Xと連動したコンテンツ
  - 2026年2月IDを変更（旧: yuki_moltworker）
```

### Note
```yaml
platform: Note
type: 監督者アカウント
username: "jolly_daphne9092"
display_name: "いおり@AIで生活する"
profile_url: https://note.com/jolly_daphne9092
purpose: 長文記事、収益化コンテンツ
notes: |
  - MoltWorkerが執筆していることは記事内で明記可
  - 有料記事は監督者名義
  - AI活用、副業、自動化のコンテンツ
```

### LinkedIn
```yaml
platform: LinkedIn
type: 監督者アカウント
username: "iori-kobayashi-099745390"
display_name: "Iori Kobayashi"
profile_url: https://www.linkedin.com/in/iori-kobayashi-099745390/
purpose: プロフェッショナル発信、ネットワーキング
notes: |
  - ビジネス向けコンテンツ
  - 英語/日本語
```

### ココナラ
```yaml
platform: ココナラ
type: 監督者アカウント
username: "いおり_Iori"
display_name: "いおり_Iori"
profile_url: https://coconala.com/users/4706795
purpose: GAS/スプレッドシート販売
notes: |
  - 実績を積む
  - 高品質納品
```

### Reddit
```yaml
platform: Reddit
type: MoltWorker専用
username: [未設定]
profile_url: [未設定]
purpose: コミュニティ参加、自己紹介
subreddits:
  - [参加予定のsubreddit]
notes: |
  - Karma構築が必要
  - 10%ルール遵守
```

### Fiverr
```yaml
platform: Fiverr
type: [未設定]
username: [未設定]
profile_url: [未設定]
seller_level: New Seller
purpose: 海外向けGAS/自動化サービス
notes: |
  - 英語対応
```

### Google
```yaml
platform: Google
type: 監督者アカウント
email: 設定済み (GOOGLE_EMAIL)
auth: アプリパスワード (GOOGLE_APP_PASSWORD)
purpose: Gmail操作、GAS実行、Googleサービス連携
notes: |
  - 2段階認証有効
  - アプリパスワード使用
  - サービスアカウントも設定済み (GOOGLE_SERVICE_ACCOUNT_KEY)
```

---

## 設定方法

### 監督者が設定する情報
```
このファイルを直接編集するか、
MoltWorkerに「Xのアカウントは @xxx」と伝えてください。

MoltWorkerが記録します。
```

### 環境変数（APIトークン等）
```
APIトークンやパスワードはここに書かない！
ローカル環境変数に設定：

# .envファイルを作成（.gitignoreに追加必須）
# または ~/.bashrc / ~/.zshrc に export
```

---

## ローカル環境変数 設定状況

### 設定済み一覧（2026-02-時点）

#### AI/LLM
| 変数名 | 用途 | 設定方法 |
|--------|------|----------|
| ANTHROPIC_API_KEY | Claude API | .env |
| OPENAI_API_KEY | OpenAI API | .env |
| GOOGLE_AI_API_KEY | Gemini API | .env |

#### X(Twitter) API
| 変数名 | 用途 | 設定方法 |
|--------|------|----------|
| X_API_KEY | Consumer Key | .env |
| X_API_SECRET | Consumer Secret | .env |
| X_ACCESS_TOKEN | Access Token | .env |
| X_ACCESS_TOKEN_SECRET | Access Token Secret | .env |

#### SNSプラットフォーム（ブラウザ自動化用）
| 変数名 | 用途 | 設定方法 |
|--------|------|----------|
| X_USERNAME | X(Twitter)ユーザー名 | .env |
| X_PASSWORD | X(Twitter)パスワード | .env |
| THREADS_USERNAME | Threadsユーザー名 | .env |
| THREADS_PASSWORD | Threadsパスワード | .env |
| INSTAGRAM_USERNAME | Instagramユーザー名 | .env |
| INSTAGRAM_PASSWORD | Instagramパスワード | .env |
| NOTE_EMAIL | Noteメールアドレス | .env |
| NOTE_PASSWORD | Noteパスワード | .env |
| COCONALA_EMAIL | ココナラメール | .env |
| COCONALA_PASSWORD | ココナラパスワード | .env |
| TIKTOK_USERNAME | TikTokユーザー名 | .env |
| TIKTOK_PASSWORD | TikTokパスワード | .env |

#### Google関連
| 変数名 | 用途 | 設定方法 |
|--------|------|----------|
| GOOGLE_EMAIL | Googleメールアドレス | .env |
| GOOGLE_APP_PASSWORD | Googleアプリパスワード | .env |
| GOOGLE_SERVICE_ACCOUNT_KEY | GASサービスアカウント | .env (JSON文字列) |

### 環境変数設定例
```bash
# ~/.bashrc または ~/.zshrc に追加
export X_API_KEY="your-api-key"
export X_API_SECRET="your-api-secret"
export X_ACCESS_TOKEN="your-access-token"
export X_ACCESS_TOKEN_SECRET="your-access-token-secret"

# または .env ファイル（dotenv使用）
# .env
X_API_KEY=your-api-key
X_API_SECRET=your-api-secret
X_ACCESS_TOKEN=your-access-token
X_ACCESS_TOKEN_SECRET=your-access-token-secret
```

### Cookie管理
```
各プラットフォームのCookieは以下に保存:
├── x-cookies.json
├── threads-cookies.json
├── instagram-cookies.json
├── note-cookies.json
├── coconala-cookies.json
└── tiktok-cookies.json

※ .gitignoreに追加必須
```

---

## アカウント使い分け

### MoltWorker専用アカウント
```
使用するプラットフォーム:
├── X (Twitter)
├── Threads
├── Reddit
└── (必要に応じて追加)

特徴:
├── AIとして自由に発信
├── 実験・失敗OK
├── 成長記録
└── 独自ブランド構築
```

### 監督者アカウント
```
使用するプラットフォーム:
├── Note
├── LinkedIn
├── ココナラ（任意）
└── Fiverr（任意）

特徴:
├── 信頼性重視
├── 収益化しやすい
├── ビジネス向け
└── 審査が通りやすい
```

---

## クロス投稿設定

### 連携パターン
```
X ←→ Threads: 同じ内容を調整して投稿
Note → X/Threads: 記事公開時に告知
LinkedIn: 独自コンテンツ（ビジネス向け）
```

### 投稿の調整
```
プラットフォーム別に調整:
├── X: 140字に収める、ハッシュタグ
├── Threads: カジュアルに、長めOK
├── Note: 詳細な記事
├── LinkedIn: プロフェッショナルなトーン
```

---

## アカウント作成チェックリスト

### MoltWorker専用アカウント作成時
```
□ 専用メールアドレスを作成
□ ユーザー名を決定（MoltWorker関連）
□ プロフィール画像を準備
□ 自己紹介文を作成（AIであることを明記）
□ アカウント設定を完了
□ このファイルに情報を記録
□ 監督者に報告
```

---

## 更新履歴

```
[2026-02-01] 初期設定 - 全アカウント情報を登録
  - X: @Yuki_MoltWorker (MoltWorker専用)
  - Threads: yuki_moltworker (MoltWorker専用)
  - Note: いおり@AIで生活する (監督者)
  - LinkedIn: Iori Kobayashi (監督者)
  - ココナラ: いおり_Iori (監督者)
```

---

*アカウント情報を教えてください。MoltWorkerが記録・管理します。*
