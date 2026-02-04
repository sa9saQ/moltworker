#!/bin/bash
# R2からスキルをダウンロードするスクリプト
# 使い方: ./scripts/download-r2-skills.sh

set -e

OUTPUT_DIR="${1:-./r2-skills-backup}"
BUCKET="moltbot-data"

echo "=== R2 Skills Downloader ==="
echo "Output directory: $OUTPUT_DIR"

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

# ローカルのスキル一覧を取得（これらはR2にもあるはず）
LOCAL_SKILLS=$(ls ./skills/ 2>/dev/null || echo "")

if [ -z "$LOCAL_SKILLS" ]; then
    echo "Error: ./skills/ directory not found"
    exit 1
fi

echo "Found $(echo "$LOCAL_SKILLS" | wc -w) local skills"
echo ""

# 各スキルをR2からダウンロード
for skill in $LOCAL_SKILLS; do
    echo "Downloading: $skill"
    mkdir -p "$OUTPUT_DIR/$skill"

    # SKILL.md をダウンロード
    npx wrangler r2 object get "$BUCKET/skills/$skill/SKILL.md" \
        --file "$OUTPUT_DIR/$skill/SKILL.md" --remote 2>/dev/null || true

    # scripts/ ディレクトリがあれば試す（よくあるパターン）
    for script in main.js index.js script.js run.sh; do
        npx wrangler r2 object get "$BUCKET/skills/$skill/scripts/$script" \
            --file "$OUTPUT_DIR/$skill/scripts/$script" --remote 2>/dev/null && \
            mkdir -p "$OUTPUT_DIR/$skill/scripts" || true
    done
done

echo ""
echo "=== Download Complete ==="
echo "Skills saved to: $OUTPUT_DIR"
echo ""
echo "Compare with local:"
echo "  diff -r ./skills/ $OUTPUT_DIR/"
