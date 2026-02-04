---
name: tiktok-poster
description: TikTok automation via browser. Upload videos, add captions, hashtags. Schedule for optimal engagement times.
auto_trigger: false
---

# TikTok Poster

TikTokブラウザ自動化。動画アップロード、キャプション、ハッシュタグ。

## 機能

### 投稿機能
- 動画アップロード（最大10分）
- キャプション追加
- ハッシュタグ設定
- サウンド追加
- スケジュール投稿

### 分析機能
- 視聴数追跡
- エンゲージメント率
- フォロワー増減
- トレンド分析

## 使用方法

### 基本投稿
```
「TikTokに動画を投稿して
 動画: [video_url]
 キャプション: [text]」
```

### 詳細設定
```
「TikTok投稿
 動画: [video_url]
 キャプション: [text]
 ハッシュタグ: #tag1 #tag2 #tag3
 公開範囲: [public/friends/private]
 コメント: [on/off]
 デュエット: [on/off]」
```

## ブラウザAPI実装

```javascript
// TikTok Studio経由でアップロード
POST /browser/sequence
{
  "steps": [
    {"action": "goto", "url": "https://www.tiktok.com/creator-center/upload"},
    {"action": "wait", "selector": "[type='file']"},
    {"action": "upload", "selector": "input[type='file']", "file": "${video_path}"},
    {"action": "wait", "ms": 10000}, // アップロード待機
    {"action": "fill", "selector": "[data-testid='caption-input']", "value": "${caption}"},
    {"action": "click", "selector": "[data-testid='post-button']"}
  ]
}
```

## コンテンツ戦略

### バイラル要素
```
1. 最初の1秒でフック
2. 3秒以内にペイオフ（価値提示）
3. ループ可能な構造
4. トレンドサウンド使用
5. テキストオーバーレイ
```

### 人気カテゴリ
| カテゴリ | 特徴 |
|---------|------|
| エデュテインメント | 学び + エンタメ |
| Before/After | ビフォーアフター変化 |
| Day in Life | 日常 vlog |
| Tutorials | ハウツー |
| Storytime | ストーリーテリング |

## ハッシュタグ戦略

### 構成（3-5個推奨）
```
トレンドタグ: 1-2個 (#fyp #foryou #viral)
ニッチタグ: 2-3個 (カテゴリ固有)
ブランドタグ: 1個 (オリジナル)
```

### カテゴリ別

**テック系**
```
#techtok #coding #programmer #developer #ai #tech
```

**ビジネス系**
```
#entrepreneur #smallbusiness #moneytok #sidehustle
```

**エンタメ系**
```
#funny #comedy #pov #skit #relatable
```

## 最適投稿時間

| 時間帯 (JST) | エンゲージメント |
|-------------|----------------|
| 7:00-9:00 | 高（通勤時間） |
| 12:00-14:00 | 中（昼休み） |
| 19:00-21:00 | 最高（プライムタイム） |
| 22:00-24:00 | 高（就寝前） |

## アルゴリズム対策

### FYP（For You Page）に載るコツ
1. **完視聴率**: 最後まで見られる動画
2. **リプレイ率**: 繰り返し再生される
3. **エンゲージメント**: いいね、コメント、シェア
4. **フォロー率**: 動画からのフォロー
5. **投稿頻度**: 1日1-3投稿が理想

### 避けるべきこと
- ウォーターマーク（他プラットフォームのロゴ）
- 低画質動画
- 過度な外部リンク誘導
- スパム的な行動

## 注意事項

### レート制限
- 1日最大投稿数: 制限あり（頻度に注意）
- 投稿間隔: 最低2-3時間推奨

### コミュニティガイドライン
- 著作権侵害コンテンツ禁止
- 危険行為の助長禁止
- 虚偽情報の拡散禁止
