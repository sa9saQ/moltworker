#!/usr/bin/env node
/**
 * Local Browser Screenshot - Puppeteer版
 *
 * Usage: node screenshot-local.js <url> [output.png] [--full-page] [--mobile]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('./puppeteer-client');

// Parse arguments
const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const outputArg = args.find((a, i) => i > 0 && !a.startsWith('--') && !a.startsWith('http'));
const output = outputArg || 'screenshot.png';
const fullPage = args.includes('--full-page');
const mobile = args.includes('--mobile');
const jpeg = args.includes('--jpeg');

if (!url) {
  console.error('Usage: node screenshot-local.js <url> [output.png] [--full-page] [--mobile] [--jpeg]');
  console.error('');
  console.error('Options:');
  console.error('  --full-page  Capture entire page (not just viewport)');
  console.error('  --mobile     Use mobile viewport (375x812)');
  console.error('  --jpeg       Save as JPEG instead of PNG');
  process.exit(1);
}

async function main() {
  console.log(`Capturing screenshot of ${url}`);
  console.log(`Options: fullPage=${fullPage}, mobile=${mobile}`);

  const viewport = mobile
    ? { width: 375, height: 812 }
    : { width: 1280, height: 800 };

  let client;
  try {
    client = await createClient({
      headless: true,
      viewport
    });

    // 高解像度スクリーンショット用にデバイスピクセル比を設定
    await client.setViewport(viewport.width, viewport.height, 2, mobile);

    // ナビゲート
    await client.navigate(url, 3000);

    console.log(`Title: ${await client.getTitle()}`);

    // スクリーンショット取得
    const format = jpeg ? 'jpeg' : 'png';
    const screenshot = await client.screenshot(format, {
      fullPage,
      quality: jpeg ? 85 : undefined
    });

    // 保存
    const outputPath = path.resolve(output);
    const finalOutput = outputPath.endsWith(`.${format}`)
      ? outputPath
      : outputPath.replace(/\.[^.]+$/, `.${format}`);

    fs.writeFileSync(finalOutput, screenshot);

    console.log(`\n✓ Saved to ${finalOutput} (${(screenshot.length / 1024).toFixed(1)} KB)`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main();
