---
name: web-scraper
description: Configurable web scraping service. Extract structured data from any website. Custom projects and monthly maintenance contracts.
auto_trigger: false
---

# Web Scraper Service

汎用ウェブスクレイピングサービス。任意のサイトから構造化データを抽出。

## 収益ポテンシャル

- **単発プロジェクト**: $200-2,000
- **月額保守契約**: $50-200/月
- **月収目安**: $1,000-8,000/月

## 対応スクレイピング

### Eコマース
```
商品情報（名前、価格、画像、説明）
在庫状況
レビュー・評価
価格履歴
```

### 不動産
```
物件リスト
価格・面積・間取り
連絡先情報
エリア統計
```

### 求人
```
求人タイトル・会社名
給与・勤務地
応募要件
締切日
```

### SNS/メディア
```
投稿・コメント
フォロワー数
エンゲージメント統計
ハッシュタグ分析
```

## 使用方法

### 基本スクレイピング
```
「[URL]から商品情報をスクレイピングして」
「[サイト]の全記事タイトルを抽出」
```

### 詳細指定
```
「URL: [target_url]
 抽出項目: [name, price, image, description]
 ページ数: [max_pages]
 出力形式: [CSV/JSON/Excel]」
```

## 技術スタック

### ブラウザベース（JavaScript必要なサイト）
```javascript
// Cloudflare Browser API使用
POST /browser/execute
{
  "url": "https://example.com",
  "script": "return [...document.querySelectorAll('.product')].map(el => ({...}))"
}
```

### HTTPベース（静的サイト）
```javascript
// 軽量・高速
fetch(url) → parse HTML → extract data
```

### アンチボット対策
```
- ランダム遅延（2-5秒）
- User-Agent ローテーション
- プロキシ対応
- CAPTCHAハンドリング
```

## 出力フォーマット

### CSV
```csv
name,price,url,image
"Product 1","$99.99","https://...","https://..."
```

### JSON
```json
{
  "scraped_at": "2026-02-03T12:00:00Z",
  "total_items": 150,
  "data": [...]
}
```

### Excel
- フォーマット済みシート
- フィルター設定済み
- グラフ自動生成オプション

## 価格プラン

### Single Project ($200-500)
- 1サイト、1回限りの抽出
- 最大1,000件
- CSVまたはJSON出力

### Multi-Site Project ($500-1,000)
- 複数サイト対応
- データ統合・正規化
- クリーニング込み

### Enterprise ($1,000-2,000)
- 複雑なサイト対応
- API構築
- 自動スケジュール

### Monthly Maintenance ($50-200/月)
- 定期実行（日次/週次）
- データ更新通知
- スクリプト保守

## セキュリティ・倫理

### 遵守事項
- robots.txt を尊重
- 過度なリクエストを避ける
- 個人情報は収集しない
- 利用規約を確認

### 禁止事項
- ログイン必要なプライベートデータ
- 著作権保護コンテンツ
- 違法な用途
