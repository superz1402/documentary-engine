// Range renderer for sandboxed environments: renders frames [start,end) of a demo
// in ONE process lifetime (resumable across invocations), writing seg_<id>.mp4 parts.
// Usage: node render_range.mjs <demo> <startFrame> <endFrame> --fps 24 --workers 2 --dir out/segs
// Parts are concatenated later with ffmpeg concat.
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { openDemo } from '/home/z/my-project/opuscar/core/render/page.mjs';

const args = process.argv.slice(2);
const dir = args[0];
const start = +args[1], end = +args[2];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 24), WK = +opt('--workers', 2);
const segDir = path.resolve(opt('--dir', path.join(dir, 'out', 'segs')));
fs.mkdirSync(segDir, { recursive: true });
const outBase = path.join(segDir, `seg_${String(start).padStart(6, '0')}_${String(end).padStart(6, '0')}`);
const done = fs.existsSync(outBase + '.mp4');
if (done) { console.log('already done', outBase + '.mp4'); process.exit(0); }

const TOTAL = end - start, per = Math.ceil(TOTAL / WK), t0 = Date.now();
const procs = new Set();
const cleanup = () => { for (const p of procs) p.kill('SIGKILL'); };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(128 + (sig === 'SIGINT' ? 2 : 15)); });

let failed = null;
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = start + w * per, b = Math.min(end, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(dir, {});
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', `${outBase}_w${w}.part.mp4`], { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
  procs.add(ff); ff.on('close', () => procs.delete(ff));
  let dead = null; let done; const closed = new Promise(r => { done = r; });
  ff.on('close', code => done(code));
  ff.on('error', e => { dead = e.message; done(-1); });
  ff.stdin.on('error', () => { dead ??= 'ffmpeg closed input'; });
  for (let f = a; f < b && !dead; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), closed]);
    if ((f - a) % 120 === 0) console.log(`w${w} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s ${(((f - a + 1) / ((Date.now() - t0) / 1000))).toFixed(2)}fps`);
  }
  ff.stdin.end(); const code = await closed; await browser.close();
  if (dead || code !== 0) { failed = `worker ${w}: ${dead || code}`; }
}));
if (failed) { console.error('FAILED', failed); process.exit(1); }
// concat worker parts for this range
const list = path.join(segDir, `list_${start}_${end}.txt`);
fs.writeFileSync(list, [...Array(WK)].map((_, w) => {
  const a = start + w * per, b = Math.min(end, a + per); return a < b ? `file '${outBase}_w${w}.part.mp4'` : null;
}).filter(Boolean).join('\n'));
const { execFileSync } = await import('child_process');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', outBase + '.mp4'], { cwd: segDir });
[...Array(WK)].map((_, w) => { try { fs.unlinkSync(`${outBase}_w${w}.part.mp4`); } catch {} });
console.log('RANGE DONE', outBase + '.mp4', TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
