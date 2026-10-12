// Render the 4 vertical shorts (shorts.html?which=X) to out/shorts_<X>_v2.mp4.
// Usage:
//   node render_shorts.mjs <filmDir> <A|B|C|D> [--fps 24] [--out file.mp4] [--qc t1,t2,...]
//   --qc renders single frames at the given times into out/qc_<X>_<t>.png (fast check)
// Uses this repo's core static server + browser launcher (core/render/).
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { serve, pageURL } from '../../core/render/serve.mjs';
import { EXE, ARGS } from '../../core/render/browser.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const film = path.resolve(args[0]);
const which = (args[1] || 'A').toUpperCase();
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 24);
const out = path.resolve(opt('--out', path.join(film, 'out', `shorts_${which}_v2.mp4`)));
const qc = opt('--qc', null);

const { port } = await serve(ROOT);
pageURL(ROOT, port, film);            // registers the /@film/ mount for this film dir
const browser = await chromium.launch({ executablePath: EXE, args: ARGS });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto(`http://127.0.0.1:${port}/@film/shorts.html?which=${which}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const DUR = await page.evaluate(() => window.DUR);
console.log(`short ${which}: DUR=${DUR.toFixed(3)}s fps=${FPS}`);

async function shoot(t, file) {
  await page.evaluate(tt => window.render(tt), t);
  await page.screenshot({ path: file, type: 'png' });
  console.log('qc', file);
}
if (qc) {
  const dir = path.join(film, 'out');
  fs.mkdirSync(dir, { recursive: true });
  for (const ts of qc.split(',')) await shoot(+ts, path.join(dir, `qc_${which}_${String(+ts).replace('.', '_')}.png`));
  await browser.close(); process.exit(0);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-nostdin', '-f', 'image2pipe', '-framerate', String(FPS),
  '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
const N = Math.round(DUR * FPS);
for (let f = 0; f < N; f++) {
  await page.evaluate(t => window.render(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 120 === 0) console.log(`${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s ${(f / ((Date.now() - t0) / 1000 + 1e-9)).toFixed(2)}fps`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('DONE', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
