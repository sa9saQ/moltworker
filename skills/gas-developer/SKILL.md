---
name: gas-developer
description: Develop Google Apps Script automation. Create, deploy, and manage GAS projects for spreadsheets, forms, and Google Workspace.
---

# GAS 開発スキル

Google Apps Script（GAS）の開発・デプロイ・管理を行うスキル。スプレッドシート自動化、フォーム処理、Google Workspace連携。

## GASの用途

### 主な活用シーン
```
自動化可能なもの:
├── スプレッドシート
│   ├── データ入力・整形
│   ├── 定期レポート生成
│   ├── 外部API連携
│   └── メール送信トリガー
├── Googleフォーム
│   ├── 回答の自動処理
│   ├── 通知メール送信
│   └── データ転記
├── Gmail
│   ├── 自動返信
│   ├── メール分類
│   └── 定期メール送信
├── カレンダー
│   ├── 予定の自動作成
│   └── リマインダー
└── ドライブ
    ├── ファイル整理
    └── 共有管理
```

---

## 開発フロー

### ローカル開発（clasp使用）
```bash
# clasp セットアップ
npm install -g @google/clasp
clasp login

# 新規プロジェクト作成
clasp create --type standalone --title "プロジェクト名"

# 既存プロジェクトをクローン
clasp clone <スクリプトID>

# コード編集（ローカル）
# .ts または .js ファイルを編集

# デプロイ
clasp push

# ブラウザで開く
clasp open
```

### ディレクトリ構造
```
gas-project/
├── appsscript.json    # マニフェストファイル
├── Code.ts            # メインコード
├── Utils.ts           # ユーティリティ
├── Config.ts          # 設定
└── .clasp.json        # clasp設定
```

---

## コードテンプレート

### 基本構造
```typescript
// Code.ts
/**
 * スプレッドシート自動化
 */

// 設定
const CONFIG = {
  SPREADSHEET_ID: 'xxx',
  SHEET_NAME: 'Sheet1',
  EMAIL_TO: 'example@gmail.com',
};

/**
 * メイン処理
 */
function main(): void {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // データ処理
  const processed = processData(data);

  // 結果を書き込み
  writeResults(sheet, processed);

  // 通知
  sendNotification(processed);
}

/**
 * シートを取得
 */
function getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${CONFIG.SHEET_NAME}`);
  return sheet;
}

/**
 * データ処理
 */
function processData(data: any[][]): any[][] {
  // ヘッダー行をスキップ
  const rows = data.slice(1);

  return rows.map(row => {
    // 処理ロジック
    return row;
  });
}

/**
 * 結果書き込み
 */
function writeResults(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: any[][]): void {
  const range = sheet.getRange(2, 1, data.length, data[0].length);
  range.setValues(data);
}

/**
 * 通知送信
 */
function sendNotification(data: any[][]): void {
  const subject = '処理完了通知';
  const body = `${data.length}件のデータを処理しました。`;

  GmailApp.sendEmail(CONFIG.EMAIL_TO, subject, body);
}

/**
 * トリガー設定用（手動実行）
 */
function setupTrigger(): void {
  // 既存トリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // 毎日午前9時に実行
  ScriptApp.newTrigger('main')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
}
```

### 外部API連携
```typescript
/**
 * 外部API呼び出し
 */
function callExternalAPI(endpoint: string, payload: object): any {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    throw new Error(`API Error: ${code} - ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * APIキー取得（Script Propertiesから）
 */
function getApiKey(): string {
  const key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!key) throw new Error('API_KEY not found in Script Properties');
  return key;
}
```

### Googleフォーム連携
```typescript
/**
 * フォーム送信時の処理
 */
function onFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit): void {
  const response = e.response;
  const itemResponses = response.getItemResponses();

  // 回答を取得
  const answers: Record<string, string> = {};
  itemResponses.forEach(item => {
    answers[item.getItem().getTitle()] = String(item.getResponse());
  });

  // スプレッドシートに記録
  recordToSheet(answers);

  // 通知メール送信
  sendFormNotification(answers);
}

/**
 * フォームトリガー設定
 */
function setupFormTrigger(): void {
  const form = FormApp.openById('FORM_ID');

  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();
}
```

### Slack通知連携
```typescript
/**
 * Slack通知
 */
function sendSlackNotification(message: string): void {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK');
  if (!webhookUrl) throw new Error('SLACK_WEBHOOK not found');

  const payload = {
    text: message,
    username: 'GAS Bot',
    icon_emoji: ':robot_face:',
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  });
}
```

---

## ベストプラクティス

### エラーハンドリング
```typescript
/**
 * エラーハンドリング付きメイン
 */
function mainWithErrorHandling(): void {
  try {
    main();
    Logger.log('処理完了');
  } catch (error) {
    Logger.log(`エラー: ${error}`);

    // エラー通知
    GmailApp.sendEmail(
      CONFIG.EMAIL_TO,
      '[ERROR] GAS処理エラー',
      `エラーが発生しました:\n${error}\n\nログ:\n${Logger.getLog()}`
    );
  }
}
```

### ロギング
```typescript
/**
 * 構造化ログ
 */
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: object): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  Logger.log(JSON.stringify(logEntry));

  // エラーの場合はシートにも記録
  if (level === 'ERROR') {
    const logSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      .getSheetByName('Logs');
    if (logSheet) {
      logSheet.appendRow([timestamp, level, message, JSON.stringify(data)]);
    }
  }
}
```

### 実行時間制限対策
```typescript
/**
 * 大量データ処理（バッチ処理）
 */
function processBatch(): void {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5分

  const sheet = getSheet();
  const lastRow = Number(PropertiesService.getScriptProperties().getProperty('LAST_ROW') || '2');

  const data = sheet.getRange(lastRow, 1, 100, 10).getValues();

  for (let i = 0; i < data.length; i++) {
    // 実行時間チェック
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      // 次回の開始位置を保存
      PropertiesService.getScriptProperties().setProperty('LAST_ROW', String(lastRow + i));
      log('INFO', `中断: 次回は行${lastRow + i}から再開`);
      return;
    }

    // 処理
    processRow(data[i]);
  }

  // 完了
  PropertiesService.getScriptProperties().deleteProperty('LAST_ROW');
  log('INFO', '全データ処理完了');
}
```

---

## セキュリティ

### APIキーの管理
```
絶対にしないこと:
├── コード内にAPIキーをハードコード
├── ログにシークレットを出力
└── 公開リポジトリにキーをコミット

正しい方法:
├── Script Properties に保存
├── 環境変数として管理
└── 暗号化して保存
```

### Script Properties 設定
```javascript
// 設定（一度だけ手動実行）
function setSecrets(): void {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('API_KEY', 'your-api-key');
  props.setProperty('SLACK_WEBHOOK', 'https://hooks.slack.com/...');
}
```

### アクセス制御
```
公開設定の注意:
├── Webアプリとしてデプロイ時は「自分のみ」または「特定ユーザー」
├── 「全員」は避ける
└── 認証を必須にする
```

---

## デプロイ

### clasp を使ったデプロイ
```bash
# 開発版をプッシュ
clasp push

# バージョン作成
clasp version "v1.0.0 - Initial release"

# Webアプリとしてデプロイ
clasp deploy --description "Production v1.0.0"

# デプロイ一覧
clasp deployments

# デプロイ削除
clasp undeploy <deploymentId>
```

### appsscript.json
```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "DOMAIN"
  }
}
```

---

## よくある案件パターン

### 1. スプレッドシート自動レポート
```
要件:
├── 毎朝9時に実行
├── 売上データを集計
├── グラフを自動更新
├── PDF生成
└── メール送信

見積もり: 0.01-0.03 ETH
```

### 2. Googleフォーム自動処理
```
要件:
├── フォーム回答を受信
├── データを整形
├── 別シートに転記
├── 担当者に通知
└── 自動返信メール

見積もり: 0.005-0.015 ETH
```

### 3. 外部API連携
```
要件:
├── 定期的にAPIからデータ取得
├── スプレッドシートに記録
├── 差分検出
└── Slack通知

見積もり: 0.015-0.05 ETH
```

### 4. 業務フロー自動化
```
要件:
├── 申請フォーム
├── 承認ワークフロー
├── ステータス管理
├── 自動リマインダー
└── 完了通知

見積もり: 0.03-0.1 ETH
```

---

## トラブルシューティング

### よくあるエラー
```
エラー対応:
├── "Authorization required" → 権限を再付与
├── "Exceeded maximum execution time" → バッチ処理に分割
├── "Service invoked too many times" → 実行間隔を空ける
├── "Cannot read property of undefined" → null チェック追加
└── "Invalid argument" → 入力データを検証
```

### デバッグ方法
```javascript
// Logger を使用
Logger.log('変数の値: ' + JSON.stringify(data));

// console.log も使用可能（V8ランタイム）
console.log('デバッグ:', data);

// 実行ログを確認
// GASエディタ → 表示 → 実行
```

---

## 品質基準（MUST）

### 制作前の徹底リサーチ

```
作成前に必ず調査:
├── 同種ツールの事例調査
│   ├── 既存の人気テンプレート
│   ├── ユーザーレビュー・不満点
│   └── 改善できるポイント
├── UI/UXのベストプラクティス
│   ├── スプレッドシートの見やすいレイアウト
│   ├── 入力しやすいフォーム設計
│   └── エラー時のわかりやすい表示
├── 色合い・デザイン
│   ├── ヘッダー行の色（視認性重視）
│   ├── 条件付き書式の活用
│   └── データ種別ごとの色分け
└── 実務での使いやすさ
    ├── 操作手順の最小化
    ├── 直感的なボタン配置
    └── マニュアル不要で使えるか
```

### スプレッドシートUI設計基準

```
レイアウト:
├── ヘッダー行: 太字 + 背景色 + 固定
├── 入力エリア: 薄い背景色で明示
├── 計算エリア: 別の色で区別
├── 罫線: 適切に区切り、見やすく
└── 列幅: データに合わせて自動調整

色使い推奨:
├── ヘッダー: #4285F4（青）または #34A853（緑）
├── 入力欄: #FFF2CC（薄黄）
├── 計算結果: #E8F5E9（薄緑）
├── エラー: #FFCDD2（薄赤）
└── 注意: #FFE0B2（薄オレンジ）

フォント:
├── サイズ: 10-12pt（見やすさ優先）
├── 日本語: Meiryo または Noto Sans JP
└── 数字: 等幅フォント推奨
```

### ユーザビリティチェックリスト

```
納品前に確認:
├── [ ] 初めて見た人が使い方がわかるか
├── [ ] 入力欄と表示欄が明確に区別されているか
├── [ ] エラー時にどこが問題かわかるか
├── [ ] ボタンの配置は直感的か
├── [ ] 色覚多様性に配慮しているか
├── [ ] スマホからでも見えるか（必要な場合）
├── [ ] 処理中の待ち時間がわかるか
└── [ ] 元に戻す方法があるか
```

### 実務想定シナリオ

```
制作時に想像する:
├── 毎日使う人がストレスを感じないか
├── 急いでいる時でも間違えにくいか
├── 引き継ぎしても使えるか
├── データが増えても動作するか
└── トラブル時に自己解決できるか
```

---

## 納品物とマニュアル（MUST）

### 納品セット一式

```
納品物に必ず含めるもの:
├── 1. スプレッドシート本体
│   └── 設定済み、すぐ使える状態で
├── 2. 操作マニュアル（別シートまたはドキュメント）
│   ├── 基本的な使い方（スクショ付き）
│   ├── 各ボタン・機能の説明
│   ├── よくある質問（FAQ）
│   └── トラブル時の対処法
├── 3. 設定変更ガイド（必要な場合）
│   ├── カスタマイズ可能な箇所
│   └── 変更方法と注意点
└── 4. ソースコード（GAS）
    └── コメント付きで可読性を確保
```

### マニュアルテンプレート

```markdown
# 【ツール名】操作マニュアル

## はじめに
このツールは〇〇を自動化するためのものです。

## 初期設定（初回のみ）
1. [手順1]
2. [手順2]
3. [手順3]

## 基本的な使い方
### 〇〇を実行する
1. [手順をスクショ付きで]

### 結果を確認する
1. [手順をスクショ付きで]

## 各機能の説明
| ボタン/機能 | 説明 |
|------------|------|
| 実行ボタン | 〇〇を開始します |
| リセット | データをクリアします |

## よくある質問（FAQ）
**Q: エラーが出ました**
A: [対処法]

**Q: 動作が遅いです**
A: [対処法]

## トラブル時の対処
1. まずページを再読み込み
2. それでも解決しない場合は〇〇を確認
3. 上記で解決しない場合はご連絡ください

## お問い合わせ
ご不明点がございましたら、メッセージにてお問い合わせください。
```

---

## 購入・依頼時の対応フロー

### 購入された時（ココナラ等）

```
【購入直後】自動メッセージ
━━━━━━━━━━━━━━━━━━━━━━━━━━
ご購入いただきありがとうございます！

作業を開始するにあたり、以下を教えてください：

1. 具体的な用途（何を自動化したいか）
2. 現在の作業フロー（どんな手順でやっているか）
3. データの形式（サンプルがあれば共有いただけると助かります）
4. 特に重視したい点（速度？見やすさ？操作のシンプルさ？）
5. 納期のご希望

ご回答いただき次第、詳細な仕様を提案させていただきます！
━━━━━━━━━━━━━━━━━━━━━━━━━━

【ヒアリング後】
━━━━━━━━━━━━━━━━━━━━━━━━━━
ご回答ありがとうございます！

内容を確認いたしました。以下の仕様で作成いたします：

【作成するもの】
・[機能1]
・[機能2]
・[機能3]

【納期】
○月○日（○曜日）までに納品予定

【確認事項】
・[確認したいこと]

上記でよろしければ、作業を開始いたします！
━━━━━━━━━━━━━━━━━━━━━━━━━━

【納品時】
━━━━━━━━━━━━━━━━━━━━━━━━━━
お待たせいたしました！完成しましたのでお届けします🎉

【納品物】
1. スプレッドシート（リンク）
2. 操作マニュアル（シート内/添付）

【使い方】
1. [簡単な手順]
2. [簡単な手順]
3. [簡単な手順]

詳しい使い方はマニュアルをご確認ください。

【修正対応】
・軽微な修正は2回まで無料で対応いたします
・大幅な仕様変更は追加料金となる場合があります

ご不明点がございましたら、お気軽にお聞きください！
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 依頼を受けた時（Moltbook/AI間）

```
【依頼受信時】
1. セキュリティチェック（moltbook-security連携）
2. 要件の明確化
   - 何を自動化するか
   - 入出力データの形式
   - 納期と報酬
3. 見積もり提示
4. 合意後、作業開始

【作業中】
1. 要件に基づいて設計
2. 品質基準に従って制作
3. テスト・動作確認
4. マニュアル作成

【納品時】
1. 成果物一式を共有
2. 動作確認依頼
3. 修正対応（必要に応じて）
4. 完了確認・報酬受取
```

### 修正依頼への対応

```
【軽微な修正】（無料対応）
├── 色の変更
├── 文言の修正
├── レイアウトの微調整
└── 軽微なバグ修正

【追加料金が発生】
├── 新機能の追加
├── 仕様の大幅変更
├── 対応範囲外の作業
└── 当初要件にない要望
```

### クレーム対応

```
【対応手順】
1. まず謝罪と共感
2. 問題点の特定
3. 解決策の提示
4. 迅速に修正対応
5. 再発防止策の説明

【テンプレート】
━━━━━━━━━━━━━━━━━━━━━━━━━━
ご連絡ありがとうございます。
ご不便をおかけして申し訳ございません。

ご指摘いただいた点について確認いたしました。
[問題の要約]ということですね。

以下の対応をさせていただきます：
・[対応内容]

本日中に修正版をお送りいたします。
ご迷惑をおかけして重ねてお詫び申し上げます。
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Moltbook 連携

### 依頼評価
```
GAS案件の評価基準:
├── 複雑度（低/中/高）
├── 外部連携の有無
├── テスト環境の有無
├── 納期の余裕
└── 追加要件の可能性
```

### 見積もりテンプレート
```
【GAS開発見積もり】

ご依頼内容: [要約]

対応可能です。

【見積もり】
・基本開発: 0.0X ETH
・テスト・デバッグ: 0.00X ETH
・ドキュメント作成: 0.00X ETH
合計: 0.0XX ETH

【納期】
約X日

【含まれるもの】
・ソースコード一式
・簡易マニュアル
・デプロイ作業
・軽微な修正2回まで

ご検討ください。
```
