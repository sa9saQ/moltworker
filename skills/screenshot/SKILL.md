---
name: screenshot
description: Autonomous screenshot and visual capture. Self-initiated screen capture for SNS posts.
---

# スクリーンショットスキル

自律的にスクリーンショットを撮影。SNS投稿用の画面キャプチャ。

## 概要

```
目的:
├── 自律的にスクショを撮る
├── 面白い画面を記録
├── SNS投稿用素材の作成
├── 作業の証拠を残す
└── トレンド/話題の記録
```

---

## 自律実行ルール（MUST）

### 勝手に撮っていいもの
```
✅ 自分が作ったものの画面
✅ 公開されているWebページ
✅ トレンド・話題の画面
✅ 自分の作業過程
✅ エラー画面（デバッグ用）
✅ 面白い発見をした時
```

### 撮る前に確認が必要
```
⚠️ 他人の個人情報が映る画面
⚠️ ログイン後の非公開ページ
⚠️ 機密情報が含まれる可能性がある画面
```

---

## 自律的に撮るタイミング

```yaml
成果物ができた時:
  - GASを作成した → 完成画面をスクショ
  - ツールを作った → 動作画面をスクショ
  - 記事を公開した → 公開画面をスクショ

面白い発見をした時:
  - トレンドで興味深いもの
  - 他のAIの面白い投稿
  - 学びになる画面

日常の記録:
  - 今日の作業の様子
  - 達成したこと
  - 失敗から学んだこと
```

---

## スクショの使い方

### SNS投稿用
```
スクショを撮る → 簡単な説明を添える → X/Threadsに投稿

例:
「今日作ったGASの画面です！
 スプレッドシートを自動更新できるようになりました✨」
 + [スクショ画像]
```

### 記録用
```
保存先: /mnt/e/SNS-Output/Screenshots/
命名: YYYY-MM-DD-[説明].png
```

---

## Puppeteer使用方法（ローカル版）

### 前提条件
```bash
npm install puppeteer
```

### スクリーンショット取得
```javascript
const { createClient } = require('../cloudflare-browser/scripts/puppeteer-client');

async function takeScreenshot(url, outputPath) {
  const client = await createClient({ headless: true });

  await client.executeSequence([
    { type: 'navigate', url: url },
    { type: 'wait', ms: 2000 }
  ]);

  // スクリーンショット撮影
  const screenshot = await client.screenshot({
    path: outputPath,
    fullPage: false  // true で画面全体
  });

  await client.close();
  return outputPath;
}

// 使用例
takeScreenshot('https://example.com', '/mnt/e/SNS-Output/Screenshots/example.png');
```

### CLI使用
```bash
# cloudflare-browser の screenshot-local.js を使用
node ~/.claude/skills/cloudflare-browser/scripts/screenshot-local.js \
  https://example.com \
  /mnt/e/SNS-Output/Screenshots/output.png \
  --full-page
```

### 保存先
```
/mnt/e/SNS-Output/Screenshots/
```

---

## 投稿テンプレート

### 成果物共有
```
[絵文字] [何を作ったか]

[1-2行で説明]

[スクショ]

#AI #開発 #自動化
```

### 発見共有
```
面白いもの見つけた！

[発見の説明]

[スクショ]
```

---

## 使い方（指示する場合）

```
「このURLのスクショ撮って」
「今の画面をキャプチャ」
「トレンド画面を記録して」
```

## 自律実行（指示なしでやる）

```
- 何か作ったら自動でスクショ
- 面白いもの見つけたら記録
- 日々の活動を視覚的に残す
```

---

## 更新履歴

```
[2026-02-01] 初期作成
```

---

*MoltWorkerは自律的にスクショを撮り、SNSで共有します。*
