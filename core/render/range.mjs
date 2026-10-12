// Range renderer for sandboxed / time-limited hosts: renders frames [start,end)
// of a film in ONE process lifetime, resumable across invocations, writing
// out/segs/seg_<start>_<end>.mp4 parts that get concatenated later with
// `ffmpeg -f concat`.
//
// Usage:
//   node core/render/range.mjs <filmDir> <startFrame> <endFrame> [--fps 24] [--workers 2] [--size 1920x1080]
//   node core/render/range.mjs films/video-003-isdal 0 2500
//
// The film page must expose window.READY, window.render(t) and window.DUR.
// A range whose .mp4 already exists is skipped, so a crashed run resumes by
// simply re-running the same command (drive it from a loop of chunk commands).
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo } from './page.mjs';

const args = process.argv.slice(2);
const dir = args[0];
const start = +args[1], end = +args[2];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 24), WK = +opt('--workers', 2);
const size = opt('--size', null);
const [SW, SH] = size ? size.split('x').map(Number) : [1920, 1080];
const segDir = path.resolve(opt('--dir', path.join(dir, 'out', 'segs')));
fs.mkdirSync(segDir, { recursive: true });
if (!(end > start) || !(FPS > 0)) { console.error('usage: node core/render/range.mjs <filmDir> <startFrame> <endFrame> [--fps 24] [--workers 2] [--size WxH]'); process.exit(2); }
const outBase = path.join(segDir, `seg_${String(start).padStart(6, '0')}_${String(end).padStart(6, '0')}`);
if (fs.existsSync(outBase + '.mp4')) { console.log('already done', outBase + '.mp4'); process.exit(0); }

const TOTAL = end - start, per = Math.ceil(TOTAL / WK), t0 = Date.now();
let failed = null;
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = start + w * per, b = Math.min(end, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(dir, { w: SW, h: SH });
  // cwd = segDir + relative names: '#'/'?' in paths never confuse ffmpeg
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-nostdin', '-f', 'image2pipe', '-framerate', String(FPS),
    '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p',
    `seg_${String(start).padStart(6, '0')}_${String(end).padStart(6, '0')}_w${w}.part.mp4`],
    { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
  let dead = null, code0 = null;
  const closed = new Promise(r => { ff.on('close', c => { code0 = c; r(); }); });
  ff.on('error', e => { dead = e.code === 'ENOENT' ? 'ffmpeg is not installed (or not on PATH)' : e.message; });
  ff.stdin.on('error', () => { dead ??= 'ffmpeg closed its input early'; });
  for (let f = a; f < b && !dead; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), closed]);
    if ((f - a) % 120 === 0) console.log(`w${w} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s ${(f - a + 1) / ((Date.now() - t0) / 1000 + 1e-9) >> 0}fps`);
  }
  ff.stdin.end(); await closed; await browser.close();
  if (dead || code0 !== 0) failed = `worker ${w}: ${dead || 'exit code ' + code0}`;
}));
if (failed) { console.error('FAILED', failed); process.exit(1); }
const list = path.join(segDir, `list_${start}_${end}.txt`);
fs.writeFileSync(list, [...Array(WK)].map((_, w) => {
  const a = start + w * per, b = Math.min(end, a + per);
  return a < b ? `file '${outBase}_w${w}.part.mp4'` : null;
}).filter(Boolean).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-nostdin', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', outBase + '.mp4'], { cwd: segDir });
[...Array(WK)].forEach((_, w) => { try { fs.unlinkSync(`${outBase}_w${w}.part.mp4`); } catch {} });
console.log('RANGE DONE', outBase + '.mp4', TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
