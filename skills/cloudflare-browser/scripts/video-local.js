#!/usr/bin/env node
/**
 * Local Browser Video Capture - Puppeteer版
 *
 * Usage: node video-local.js "url1,url2,url3" [output.mp4] [--fps 10] [--scroll]
 *
 * Requires: ffmpeg installed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('./puppeteer-client');

// Parse args
const args = process.argv.slice(2);
const urlArg = args.find(a => !a.startsWith('--') && !a.endsWith('.mp4'));
const outputArg = args.find(a => a.endsWith('.mp4'));
const output = outputArg || 'output.mp4';
const fps = args.includes('--fps') ? parseInt(args[args.indexOf('--fps') + 1]) : 10;
const doScroll = args.includes('--scroll');

if (!urlArg) {
  console.error('Usage: node video-local.js "url1,url2,url3" [output.mp4] [--fps 10] [--scroll]');
  console.error('');
  console.error('Options:');
  console.error('  --fps N    Frame rate (default: 10)');
  console.error('  --scroll   Scroll down and capture more frames');
  console.error('');
  console.error('Requires: ffmpeg installed');
  process.exit(1);
}

// Check ffmpeg
try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
} catch {
  console.error('Error: ffmpeg not found. Install with: sudo apt install ffmpeg');
  process.exit(1);
}

const urls = urlArg.split(',').map(u => u.trim());
const framesDir = `/tmp/local-video-frames-${Date.now()}`;
fs.mkdirSync(framesDir, { recursive: true });

async function main() {
  console.log(`Creating video from ${urls.length} URL(s)`);
  console.log(`Output: ${output}, FPS: ${fps}, Scroll: ${doScroll}\n`);

  let client;
  let frameNum = 0;

  async function captureFrames(count, delayMs = 100) {
    for (let i = 0; i < count; i++) {
      const screenshot = await client.screenshot('png');
      const filename = `frame_${String(frameNum).padStart(5, '0')}.png`;
      fs.writeFileSync(path.join(framesDir, filename), screenshot);
      frameNum++;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  try {
    client = await createClient({
      headless: true,
      viewport: { width: 1280, height: 720 }
    });

    for (const url of urls) {
      console.log(`→ ${url}`);
      await client.navigate(url, 4000);

      // Capture frames
      await captureFrames(15);

      if (doScroll) {
        await client.scroll(300);
        await captureFrames(10);
        await client.scroll(300);
        await captureFrames(10);
      }
    }

    await client.close();
    console.log(`\n✓ Captured ${frameNum} frames`);

    // Encode with ffmpeg
    console.log('Encoding video...');
    const outputPath = path.resolve(output);
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 "${outputPath}"`,
      { stdio: 'pipe' }
    );

    // Cleanup
    fs.rmSync(framesDir, { recursive: true });

    const stats = fs.statSync(outputPath);
    console.log(`✓ Video saved to ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);

  } catch (err) {
    console.error('Error:', err.message);
    if (client) await client.close();
    process.exit(1);
  }
}

main();
