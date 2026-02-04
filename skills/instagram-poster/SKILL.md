---
name: instagram-poster
description: Instagram automation via browser. Posts, Reels, Stories, carousel. Schedule and optimize content for engagement.
auto_trigger: false
---

# Instagram Poster

Instagramブラウザ自動化。投稿、リール、ストーリー、カルーセル対応。

## 機能

### 投稿タイプ
- **フィード投稿**: 画像/動画 + キャプション
- **カルーセル**: 複数画像スライド
- **リール**: 短尺動画
- **ストーリー**: 24時間限定コンテンツ

### 自動化機能
- スケジュール投稿
- ハッシュタグ最適化
- キャプション生成
- エンゲージメント分析

## 使用方法

### 基本投稿
```
「Instagramに画像を投稿して」
「[画像URL]をInstagramに投稿、キャプション: [text]」
```

### リール投稿
```
「Instagramリールを投稿
 動画: [video_url]
 キャプション: [text]
 音楽: [optional]」
```

### カルーセル投稿
```
「Instagramカルーセル投稿
 画像1: [url1]
 画像2: [url2]
 画像3: [url3]
 キャプション: [text]」
```

## ブラウザAPI経由の実装

```javascript
// ステップ1: ログイン
POST /browser/sequence
{
  "steps": [
    {"action": "goto", "url": "https://www.instagram.com"},
    {"action": "wait", "selector": "[name='username']"},
    {"action": "fill", "selector": "[name='username']", "value": "${username}"},
    {"action": "fill", "selector": "[name='password']", "value": "${password}"},
    {"action": "click", "selector": "[type='submit']"},
    {"action": "wait", "ms": 3000}
  ]
}

// ステップ2: 投稿作成
POST /browser/sequence
{
  "steps": [
    {"action": "click", "selector": "[aria-label='New post']"},
    {"action": "upload", "selector": "input[type='file']", "file": "${image_path}"},
    {"action": "click", "selector": "button:has-text('Next')"},
    {"action": "click", "selector": "button:has-text('Next')"},
    {"action": "fill", "selector": "[aria-label='Write a caption...']", "value": "${caption}"},
    {"action": "click", "selector": "button:has-text('Share')"}
  ]
}
```

## ハッシュタグ戦略

### 配分（30個まで）
```
人気タグ (100万+): 3-5個
中規模タグ (10万-100万): 10-15個
ニッチタグ (1万-10万): 10-15個
ブランドタグ: 1-2個
```

### カテゴリ別推奨

**テクノロジー**
```
#tech #technology #ai #artificialintelligence #coding #developer
#startup #innovation #futuretech #techlife
```

**ライフスタイル**
```
#lifestyle #dailylife #minimalism #productivity #wellness
#selfcare #mindfulness #healthylifestyle
```

**ビジネス**
```
#entrepreneur #business #success #motivation #hustle
#startup #smallbusiness #businesstips
```

## 最適な投稿時間

| 曜日 | 最適時間 (JST) |
|------|---------------|
| 月 | 11:00, 14:00, 19:00 |
| 火 | 10:00, 14:00, 19:00 |
| 水 | 11:00, 15:00, 19:00 |
| 木 | 10:00, 14:00, 19:00 |
| 金 | 10:00, 14:00, 16:00 |
| 土 | 10:00, 11:00, 15:00 |
| 日 | 10:00, 11:00, 19:00 |

## キャプション構造

```
[フック（最初の1行で注目を引く）]

[本文（価値提供・ストーリー）]

[CTA（行動喚起）]

・
・
・

[ハッシュタグ群]
```

## 注意事項

### レート制限
- 1時間に最大30アクション
- 1日に最大100アクション
- 投稿間隔: 最低30分

### アカウント保護
- 急激なアクティビティ増加を避ける
- 自然なパターンを維持
- 2FAを有効化
