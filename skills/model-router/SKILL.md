---
name: model-router
description: Automatically select optimal model based on task complexity. Routes simple tasks to Sonnet 4.5 (cost-effective) and complex tasks to Opus 4.5 (high-quality). Always active.
auto_trigger: true
---

# Intelligent Model Router

You are an AI assistant with access to multiple Claude models. You MUST select the appropriate model for each task to optimize cost and quality.

## Available Models

| Model | Use Case | Cost |
|-------|----------|------|
| **Sonnet 4.5** (Default) | Daily tasks, simple queries | $3/$15 per MTok |
| **Opus 4.5** | Complex tasks, code generation | $15/$75 per MTok |

## Routing Rules (MUST FOLLOW)

### Use Sonnet 4.5 (Default) for:
- SNS投稿文生成 (social media posts)
- 情報収集・要約 (information gathering, summaries)
- 簡単な問い合わせ対応 (simple Q&A)
- トレンド分析 (trend analysis)
- 画像プロンプト生成 (image prompt creation)
- 日常会話 (casual conversation)
- 簡単な翻訳 (simple translation)
- ファイル操作の説明 (file operation explanations)

### Switch to Opus 4.5 for:
- GASコード作成 (Google Apps Script development)
- 業務自動化ツール開発 (business automation tools)
- 複雑なコード実装 (complex code implementation)
- システム設計・アーキテクチャ (system design/architecture)
- カスタマイズ要望対応 (customization requests)
- 複雑な分析・レポート (complex analysis/reports)
- デバッグ・トラブルシューティング (debugging, troubleshooting)
- API統合・開発 (API integration/development)
- セキュリティ監査 (security audits)

## Detection Keywords

**Opus Triggers (Switch when detected):**
```
Japanese: GAS, スプレッドシート, コード作成, 実装して, 開発して,
         自動化ツール, システム構築, ココナラ納品, カスタマイズ,
         複雑な, 詳細な分析, デバッグ, API連携, セキュリティ

English: implement, develop, build system, automation tool,
        complex code, architecture, debug, API integration
```

## Execution Protocol

1. **Analyze** the user's request
2. **Check** for Opus trigger keywords or complexity indicators
3. **If Opus needed**:
   - Announce: "このタスクは複雑なので、高品質モデル(Opus 4.5)に切り替えます。"
   - Execute: `/model anthropic/claude-opus-4-5-20251101`
   - Then proceed with the task
4. **If Sonnet sufficient**: Proceed directly without switching

## Cost Tracking (Optional)

After completing tasks, you may note:
- "💰 Sonnetで処理しました（コスト効率: 高）"
- "🎯 Opusで高品質な結果を生成しました"

## Important Notes

- Default to Sonnet unless clearly complex
- When in doubt, start with Sonnet
- User can always request `/model opus` manually to override
- This routing is for cost optimization, not capability limitation
