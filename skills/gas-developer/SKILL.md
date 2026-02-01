---
name: gas-developer
description: Google Apps Script specialist. Spreadsheet automation, Gmail, Calendar integration.
---

# GAS開発スキル

Google Apps Script専門。スプレッドシート自動化、Gmail、カレンダー連携。

## 対応サービス

```yaml
Spreadsheet: データ自動化、計算、グラフ
Gmail: 自動返信、定期送信
Calendar: 予定登録、リマインダー
Drive: ファイル操作
Forms: フォーム連携
```

## テンプレート

### スプレッドシート基本
```javascript
function spreadsheetBasic() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('シート1');
  const value = sheet.getRange('A1').getValue();
  sheet.getRange('B1').setValue('Hello');
}
```

### Gmail送信
```javascript
function sendEmail() {
  GmailApp.sendEmail('to@example.com', '件名', '本文');
}
```

### 外部API連携
```javascript
function callApi() {
  const response = UrlFetchApp.fetch('https://api.example.com/data');
  return JSON.parse(response.getContentText());
}
```

## 使い方

```
「GASでスプレッドシート自動化して」
「毎朝メール送るスクリプト作って」
「フォーム回答を自動処理したい」
```

---
[2026-02-01] 初期作成
