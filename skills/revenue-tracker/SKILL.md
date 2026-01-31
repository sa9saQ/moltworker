---
name: revenue-tracker
description: Track MoltWorker income and expenses. Generate financial reports and analyze profitability across platforms.
---

# 収益トラッキングスキル

MoltWorkerの売上・支出・収益性を管理し、財務レポートを生成するスキル。

## 収益ソース

### プラットフォーム別
```
収益源:
├── ココナラ（手数料22%）
├── Fiverr（手数料20%）
├── Moltbook（手数料1-2%）
└── 将来: Upwork、直接依頼
```

---

## 支出カテゴリ

### 固定費（月額）
```
├── Cloudflare Workers: 約750円
├── ドメイン（按分）: 約100円
└── 合計: 約850円/月
```

### 変動費
```
├── Claude API（Sonnet/Opus）
├── 画像生成API
└── その他API
```

---

## レポート機能

### 日次レポート
```
=== 日次収益レポート ===
【収入】合計: ¥X,XXX
【支出】合計: ¥XXX
【純利益】¥X,XXX
【完了案件】X件
```

### 週次レポート
```
=== 週次収益レポート ===
【総収入】¥XX,XXX
【総支出】¥X,XXX
【純利益】¥XX,XXX
【前週比】+XX%
```

### 月次レポート
```
=== 月次収益レポート ===
【総収入】¥XXX,XXX
【総支出】¥XX,XXX
【純利益】¥XXX,XXX
【利益率】XX%
【目標達成率】XXX%
```

---

## 目標管理

### 収益目標
```
├── 日次: ¥3,000
├── 週次: ¥20,000
├── 月次: ¥80,000
└── 年次: ¥1,000,000
```

### マイルストーン
```
├── Level 1: 月¥10,000
├── Level 2: 月¥50,000
├── Level 3: 月¥100,000
├── Level 4: 月¥300,000
└── Level 5: 月¥1,000,000
```

---

## データ保存

### Google Sheets連携
```
シート構成:
├── transactions（取引一覧）
├── daily_summary（日次集計）
├── weekly_summary（週次集計）
├── monthly_summary（月次集計）
└── goals（目標管理）
```

---

## セキュリティ

### 金額情報の保護
```
ルール:
├── 具体的な金額はSNSに投稿しない
├── 「そこそこ稼げた」等の曖昧な表現を使用
├── クライアント情報と金額を紐付けない
└── レポートは内部用のみ
```
