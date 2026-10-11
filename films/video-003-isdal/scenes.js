// scenes.js — ice-dossier scene compositions for video-003-isdal
window.SCENES = (() => {
const INK = C.ink, PAP = C.paper, STEEL = C.steel, RED = C.red, AMB = C.amber, BLUE = C.blue, ICE = C.ice;

// ---------- shared drawing blocks ----------
function bgFill(col, opt = {}) { rect(world, 0, 0, W, H, col, { o: opt.o == null ? 1 : opt.o }); }
function mountains(parent, baseY, col, o = 1) {
  path(parent, `M0,${baseY} L0,${baseY-140} L150,${baseY-320} L290,${baseY-190} L430,${baseY-390} L560,${baseY-240} L700,${baseY-420} L840,${baseY-230} L980,${baseY-360} L1120,${baseY-200} L1280,${baseY-330} L1430,${baseY-180} L1580,${baseY-300} L1720,${baseY-150} L1920,${baseY-260} L1920,${baseY} Z`, 'none', 0, { fill: col, o });
}
function contourMap(parent, cx, cy, s, opt = {}) {
  const g = el('g', { transform: `translate(${cx},${cy}) scale(${s})`, opacity: opt.o == null ? 1 : opt.o }, parent);
  const rings = [
    [-260, -40, 200, 150], [-210, -18, 160, 112], [-165, 2, 122, 80], [-125, 20, 88, 52],
    [40, -30, 230, 160], [90, -6, 180, 116], [135, 16, 132, 76], [175, 34, 90, 42],
  ];
  for (const [dx, dy, rx, ry] of rings) {
    el('ellipse', { cx: dx, cy: dy, rx, ry, fill: 'none', stroke: C.blue, 'stroke-width': 1.6, opacity: .55 }, g);
  }
  path(g, 'M-95,-120 C-40,-60 -30,40 -70,120 L-10,150 C30,40 20,-70 -60,-135 Z', 'none', 0, { fill: 'rgba(62,108,147,0.14)' });
  T(g, -150, -196, 'ULRIKEN', 17, C.steel, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  T(g, 165, -200, 'FLØYEN', 17, C.steel, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  T(g, 22, 190, 'ISDALEN — «THE ICE VALLEY»', 16, RED, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  return g;
}
function suitcase(parent, x, y, s, opt = {}) {
  const g = el('g', { transform: `translate(${x},${y}) scale(${s})`, opacity: opt.o == null ? 1 : opt.o }, parent);
  rect(g, -170, -110, 340, 220, opt.open ? C.frost : C.paper2, { rx: 14, stroke: C.ink, sw: 3 });
  rect(g, -170, -110, 340, 40, C.ice, { rx: 14, stroke: C.ink, sw: 2.4 });
  line(g, -170, -70, 170, -70, C.ink, 2.4);
  rect(g, -34, -78, 26, 18, C.amber, { rx: 3, stroke: C.ink, sw: 1.6 });
  rect(g, 10, -78, 26, 18, C.amber, { rx: 3, stroke: C.ink, sw: 1.6 });
  path(g, 'M-40,-110 C-40,-146 40,-146 40,-110', 'none', 0, { fill: 'none', stroke: C.ink, sw: 6 });
  if (opt.cut !== false) {
    poly(g, [[120, 6], [150, -4], [150, 26]], C.steel, 1.4, { fill: C.paper });
    line(g, 96, -8, 96, 30, RED, 3);
    T(g, 96, 52, 'LABEL CUT', 12, RED, { f: F.mono, w: 700, a: 'middle', ls: 1.5 });
  }
  return g;
}
function bust(parent, cx, cy, h, col, opt = {}) {
  const g = el('g', { transform: `translate(${cx},${cy})`, opacity: opt.o == null ? 1 : opt.o }, parent);
  const s = h / 300;
  path(g, 'M0,-150 C55,-150 78,-108 74,-58 C71,-26 82,-14 108,-2 C150,16 168,44 172,96 L174,150 L-174,150 L-172,96 C-168,44 -150,16 -108,-2 C-82,-14 -71,-26 -74,-58 C-78,-108 -55,-150 0,-150 Z',
    'none', 0, { fill: col, transform: `scale(${s})` });
  if (opt.hair !== false) path(g, 'M-72,-64 C-84,-120 -46,-158 0,-158 C46,-158 84,-120 72,-64 C64,-96 40,-112 0,-112 C-40,-112 -64,-96 -72,-64 Z', 'none', 0, { fill: opt.hairCol || col, transform: `scale(${s})`, o: .55 });
  return g;
}
function pillRow(parent, x, y, n, col, opt = {}) {
  const g = el('g', {}, parent);
  for (let i = 0; i < n; i++) {
    const px = x + i * 34;
    const u = opt.stagger ? clamp((opt.lt - (i * .04)) / .3, 0, 1) : 1;
    if (u <= 0) continue;
    el('ellipse', { cx: px, cy: y, rx: 13, ry: 9, fill: col, opacity: u }, g);
    line(g, px - 6, y - 3, px + 6, y - 3, 'rgba(255,255,255,0.5)', 2, { o: u });
  }
  return g;
}
function evidenceRow(parent, x, y, label, lt, delay, opt = {}) {
  const u = ease(seg(lt, delay, delay + .5));
  if (u <= 0) return;
  const g = el('g', { opacity: u, transform: `translate(${x + (1 - u) * -30},${y})` }, parent);
  rect(g, 0, -21, label.length * 11.5 + 24, 42, C.cream, { rx: 6, stroke: C.line, sw: 1.2 });
  T(g, 12, 7, label, 17, INK, { f: F.sans, w: 700 });
  return g;
}
function verdictCard(parent, x, y, w, h, head, col, lt, delay) {
  const u = ease(seg(lt, delay, delay + .55));
  if (u <= 0) return null;
  const g = el('g', { opacity: u, transform: `translate(${x},${y + (1 - u) * 26})` }, parent);
  rect(g, 0, 0, w, h, C.cream, { rx: 10, stroke: col, sw: 2.5 });
  rect(g, 0, 0, w, 56, col, { rx: 10 });
  rect(g, 0, 28, w, 28, col);
  T(g, w / 2, 38, head, 22, C.cream, { f: F.mono, w: 700, a: 'middle', ls: 3 });
  return g;
}

// ================= S1 — COLD OPEN =================
function S1(sc, lt, t) {
  bgFill(C.night);
  const g = el('g', {}, world);
  const defs = document.querySelector('#stage defs');
  if (!defs.querySelector('#skyG')) {
    const gr = document.createElementNS(NS, 'linearGradient');
    gr.id = 'skyG'; gr.setAttribute('x1', 0); gr.setAttribute('y1', 0); gr.setAttribute('x2', 0); gr.setAttribute('y2', 1);
    for (const [o, c] of [[0, '#0C141F'], [.55, '#12202E'], [1, '#1B2F42']]) {
      const st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', o); st.setAttribute('stop-color', c); gr.appendChild(st);
    }
    defs.appendChild(gr);
  }
  rect(g, 0, 0, W, H, 'url(#skyG)');
  mountains(g, 1080, '#0F1B29', .9);
  mountains(g, 1160, '#0A121D', 1);
  circ(g, 1500, 200, 130, 'rgba(214,226,234,0.10)');
  circ(g, 1500, 200, 58, 'rgba(214,226,234,0.28)');
  const qg = el('g', { transform: `translate(1500,200)`, opacity: seg(lt, 1.4, 2.1) }, g);
  el('circle', { cx: 0, cy: 0, r: 92, fill: 'none', stroke: RED, 'stroke-width': 5, opacity: .9 }, qg);
  el('line', { x1: 0, y1: -122, x2: 0, y2: -70, stroke: RED, 'stroke-width': 5 }, qg);
  el('line', { x1: 0, y1: 70, x2: 0, y2: 122, stroke: RED, 'stroke-width': 5 }, qg);
  el('line', { x1: -122, y1: 0, x2: -70, y2: 0, stroke: RED, 'stroke-width': 5 }, qg);
  el('line', { x1: 70, y1: 0, x2: 122, y2: 0, stroke: RED, 'stroke-width': 5 }, qg);
  T(qg, 0, 20, '?', 110, RED, { f: F.serif, w: 700, a: 'middle' });
  const u1 = ease(seg(lt, .8, 1.6));
  const tg = el('g', { opacity: u1, transform: `translate(${960},${470}) scale(${lerp(1.06, 1, u1)})` }, g);
  T(tg, 0, 0, 'THE ISDAL WOMAN', 104, PAP, { f: F.serif, w: 700, ls: 2, a: 'middle' });
  line(tg, -330, 40, 330, 40, RED, 4);
  T(tg, 0, 96, 'THE WOMAN WHO ERASED HER OWN IDENTITY', 31, ICE, { f: F.sans, w: 700, ls: 4, a: 'middle' });
  const chips = ['8 FALSE IDENTITIES', 'A CODED NOTEBOOK', 'EVERY LABEL REMOVED'];
  chips.forEach((s, i) => {
    const u = ease(seg(lt, 2.2 + i * .38, 2.7 + i * .38));
    if (u <= 0) return;
    const cg = el('g', { opacity: u, transform: `translate(${-660 + i * 330},${160 + (1 - u) * 20})` }, tg);
    rect(cg, 0, -20, s.length * 12.2 + 30, 40, 'rgba(184,204,216,0.14)', { rx: 5, stroke: ICE, sw: 1.2 });
    T(cg, 15, 6, s, 16, ICE, { f: F.mono, w: 700, ls: 1.5 });
  });
  const u4 = ease(seg(lt, 3.4, 3.9));
  if (u4 > 0) {
    const fg = el('g', { opacity: u4, transform: `translate(0,${(1 - u4) * 18})` }, g);
    T(fg, 96, 1044, 'OPUSCAR STUDIO · EXHIBIT FILM NO. 003', 16, STEEL, { f: F.mono, ls: 3 });
    T(fg, 1824, 1044, 'CASE 134/70 · BERGEN', 16, STEEL, { f: F.mono, a: 'end', ls: 3 });
  }
  window.EV.push({ t: t - lt + .5, type: 'whoosh' }, { t: t - lt + .85, type: 'stamp' });
}

// ================= S2 — FILE 003 =================
function S2(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .5, 1.2));
  const fg = el('g', { opacity: u, transform: `translate(${960 + (1-u)*60},${560}) rotate(${lerp(3, -1.5, u)})` }, g);
  rect(fg, -430, -250, 860, 520, C.frost, { rx: 14, stroke: C.ink, sw: 2.5 });
  rect(fg, -430, -290, 300, 60, C.ice, { rx: 8, stroke: C.ink, sw: 2 });
  T(fg, -280, -252, 'BERGEN POLITI', 24, INK, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  const us = seg(lt, 1.35, 1.75);
  if (us > 0) {
    const sg = el('g', { opacity: us, transform: `translate(60,-60) rotate(-8) scale(${lerp(1.6, 1, pop(us))})`, filter: 'url(#stampInk)' }, fg);
    rect(sg, -240, -70, 480, 140, 'none', { stroke: RED, sw: 7, rx: 8 });
    T(sg, 0, -8, 'CASE 134/70', 56, RED, { f: F.mono, w: 700, a: 'middle', ls: 4 });
    T(sg, 0, 42, 'ISDALEN · BERGEN', 24, RED, { f: F.mono, w: 700, a: 'middle', ls: 3 });
    window.EV.push({ t: t - lt + 1.35, type: 'stamp' });
  }
  const rows = [['STATUS', 'OPEN — 50+ YEARS'], ['SUBJECT', 'UNIDENTIFIED WOMAN'], ['VERDICT 1971', 'PROBABLE SUICIDE'], ['REOPENED', '2016 — STILL UNSOLVED']];
  rows.forEach((r, i) => {
    const u2 = ease(seg(lt, 1.9 + i * .3, 2.3 + i * .3));
    if (u2 <= 0) return;
    const rg = el('g', { opacity: u2 }, fg);
    line(rg, -370, -110 + i * 84, 370, -110 + i * 84, C.line, 1);
    T(rg, -370, -122 + i * 84, r[0], 19, STEEL, { f: F.mono, w: 700, ls: 2 });
    T(rg, -120, -122 + i * 84, r[1], 24, i === 3 ? RED : INK, { f: F.serif, w: 700 });
  });
}

// ================= S3 — NOVEMBER 29 =================
function S3(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u0 = ease(seg(lt, .4, .9));
  const dg = el('g', { opacity: u0, transform: `translate(${330 + (1-u0)*-40},210) rotate(-2)` }, g);
  card(dg, 0, 0, 560, 130, {});
  T(dg, 280, 52, 'SUNDAY', 22, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 6 });
  T(dg, 280, 100, '29 NOVEMBER 1970', 40, INK, { f: F.serif, w: 700, a: 'middle' });
  const u1 = ease(seg(lt, 1.0, 1.8));
  const mg = contourMap(g, 1150, 520, 1.08 * (lerp(1.15, 1, u1)), { o: u1 });
  pin(mg, -35, 40, RED);
  const u2 = seg(lt, 1.9, 3.3);
  const pts = [[-320, 260], [-220, 170], [-120, 110], [-60, 40], [-38, 42]];
  if (u2 > 0) {
    const vis = Math.max(2, Math.floor(pts.length * u2));
    poly(mg, pts.slice(0, vis), INK, 3.5, { dash: '2 12', cap: 'round' });
    if (u2 < 1) circ(mg, pts[vis - 1][0], pts[vis - 1][1], 7, INK);
  }
  T(mg, -250, 235, 'MORNING HIKE — FATHER & TWO DAUGHTERS', 16, INK, { f: F.sans, w: 700 });
  const u3 = ease(seg(lt, 3.4, 3.9));
  if (u3 > 0) {
    const fcg = el('g', { opacity: u3, transform: `translate(180,760)` }, g);
    rect(fcg, 0, 0, 1560, 190, C.ink, { rx: 12 });
    T(fcg, 40, 64, 'AMONG THE ROCKS — THE BODY OF A WOMAN, LYING ON HER BACK.', 31, PAP, { f: F.serif, w: 700 });
    T(fcg, 40, 122, 'A SMALL FIRE NEARBY. HER FACE COULD NOT BE RECOGNISED. THE POLICE WERE CALLED.', 26, ICE, { f: F.sans });
    T(fcg, 40, 164, 'THE VALLEY IS ALSO NICKNAMED «DEATH VALLEY» — A NAME IT HAD HELD FOR CENTURIES.', 22, STEEL, { f: F.sans, i: 1 });
  }
}

// ================= S4 — THE VALLEY FLOOR =================
function S4(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const items = [
    'LIQUEUR BOTTLE (EMPTY)', '2 WATER BOTTLES', 'PASSPORT HOLDER — EMPTY',
    'RUBBER BOOTS', 'WOOLLEN JUMPER', 'SCARF', 'NYLON STOCKINGS',
    'UMBRELLA', 'PURSE', 'MATCHBOX', 'WATCH', '2 EARRINGS · 1 RING',
  ];
  items.forEach((s, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    evidenceRow(g, 70 + col * 470, 210 + row * 92, s, lt, .4 + i * .14);
  });
  const u1 = ease(seg(lt, 2.1, 2.7));
  if (u1 > 0) {
    const eg = el('g', { opacity: u1, transform: `translate(120,560)` }, g);
    rect(eg, 0, 0, 760, 300, C.ink, { rx: 12 });
    T(eg, 36, 62, 'TRACES OF BURNED PAPER AROUND THE BODY', 27, PAP, { f: F.serif, w: 700 });
    T(eg, 36, 116, 'A FUR HAT BENEATH HER LATER TESTED', 26, ICE, { f: F.sans });
    T(eg, 36, 154, 'POSITIVE FOR PETROL.', 26, ICE, { f: F.sans });
    el('ellipse', { cx: 620, cy: 200, rx: 92, ry: 34, fill: 'none', stroke: AMB, 'stroke-width': 3 }, eg);
    el('ellipse', { cx: 620, cy: 168, rx: 52, ry: 42, fill: 'none', stroke: AMB, 'stroke-width': 3 }, eg);
    T(eg, 620, 262, 'PETROL — FOUND', 15, AMB, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  }
  const u2 = ease(seg(lt, 2.9, 3.5));
  if (u2 > 0) {
    const sg = el('g', { opacity: u2, transform: `translate(1000,560)` }, g);
    rect(sg, 0, 0, 800, 300, C.cream, { rx: 12, stroke: RED, sw: 2.5 });
    T(sg, 400, 66, 'THE SIGNATURE DETAIL', 24, RED, { f: F.mono, w: 700, a: 'middle', ls: 3 });
    tornLabel(sg, 130, 130, 210, -3); tornLabel(sg, 460, 170, 210, 2);
    T(sg, 400, 232, 'LABELS AND NAME-TAGS REMOVED OR RUBBED AWAY', 23, INK, { f: F.sans, w: 700, a: 'middle' });
    T(sg, 400, 272, 'NOT LOST. REMOVED.', 30, RED, { f: F.serif, w: 700, a: 'middle', ls: 2 });
    window.EV.push({ t: t - lt + 2.9, type: 'stamp' });
  }
}

// ================= S5 — WHAT THE BODY SAID =================
function S5(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const hg = el('g', { opacity: ease(seg(lt, .4, .9)) }, g);
  card(hg, 70, 120, 1780, 130, {});
  T(hg, 110, 175, 'POST-MORTEM — GADES INSTITUTE, BERGEN', 30, INK, { f: F.serif, w: 700 });
  T(hg, 110, 218, 'AUTOPSY FINDINGS AS RECORDED IN 1970', 20, STEEL, { f: F.mono, ls: 2 });
  stamp(hg, 1690, 185, 'CASE 134/70', 22, RED, { ang: -5 });
  const u1 = ease(seg(lt, 1.0, 1.6));
  if (u1 > 0) {
    const cg = el('g', { opacity: u1, transform: `translate(70,320)` }, g);
    rect(cg, 0, 0, 860, 180, C.ink, { rx: 12 });
    T(cg, 36, 60, 'CAUSE OF DEATH', 22, AMB, { f: F.mono, w: 700, ls: 3 });
    T(cg, 36, 116, 'SLEEPING TABLETS  +  CARBON MONOXIDE', 33, PAP, { f: F.serif, w: 700 });
    T(cg, 36, 156, 'COMBINED — AS RECORDED BY PATHOLOGISTS', 19, STEEL, { f: F.sans });
  }
  const u2 = ease(seg(lt, 1.7, 2.2));
  if (u2 > 0) {
    const pg = el('g', { opacity: u2, transform: `translate(990,320)` }, g);
    rect(pg, 0, 0, 860, 180, C.cream, { rx: 12, stroke: C.line, sw: 1.5 });
    T(pg, 36, 52, 'FENEMAL TABLETS IN HER BLOOD', 22, INK, { f: F.mono, w: 700, ls: 1.5 });
    pillRow(pg, 40, 100, 24, BLUE, { stagger: 1, lt: lt - 1.7 });
    T(pg, 36, 156, 'THE EQUIVALENT OF 50 – 70 PILLS · TWELVE MORE FOUND BESIDE THE BODY', 20, STEEL, { f: F.sans, w: 700 });
  }
  const rows = [
    ['SOOT IN HER AIRWAYS', 'SHE WAS STILL ALIVE AS THE FIRE REACHED HER', RED],
    ['BRUISE ON THE NECK', 'A FALL — OR A BLOW. THE REPORT COULD NOT SAY WHICH.', AMB],
    ['DENTAL WORK: DISTINCTIVE', 'TEETH AND JAW REMOVED FOR EXAMINATION — KEPT SEPARATE EVER SINCE', STEEL],
  ];
  rows.forEach((r, i) => {
    const u3 = ease(seg(lt, 2.5 + i * .55, 3.05 + i * .55));
    if (u3 <= 0) return;
    const rg = el('g', { opacity: u3, transform: `translate(${70 + (1 - u3) * -30},${580 + i * 140})` }, g);
    rect(rg, 0, 0, 1780, 110, i === 2 ? C.frost : C.cream, { rx: 10, stroke: r[2], sw: 2 });
    rect(rg, 0, 0, 14, 110, r[2], { rx: 4 });
    T(rg, 44, 46, r[0], 26, INK, { f: F.mono, w: 700, ls: 1.5 });
    T(rg, 44, 88, r[1], 24, STEEL, { f: F.sans });
  });
}

// ================= S6 — THE SUITCASES =================
function S6(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  T(g, 960, 200, 'FOUND 3 DAYS LATER — BERGEN RAILWAY STATION', 26, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 3, o: ease(seg(lt, .3, .8)) });
  const u1 = ease(seg(lt, .7, 1.4));
  suitcase(g, 560, 490, 1.0 * lerp(1.1, 1, u1), { o: u1 });
  suitcase(g, 1360, 490, 1.0 * lerp(1.1, 1, u1), { o: u1, cut: true });
  T(g, 560, 730, 'SUITCASE No.1 — CLOTHING · SHOES · WIGS', 19, INK, { f: F.sans, w: 700, a: 'middle', o: u1 });
  T(g, 1360, 730, 'SUITCASE No.2 — MAKE-UP · CREAMS · GLASSES', 19, INK, { f: F.sans, w: 700, a: 'middle', o: u1 });
  const inv = ['WIGS', 'ECZEMA CREAM', 'MAPS & TIMETABLES', 'COINS: BE · GB · CH', 'GLASSES — FINGERPRINTS MATCHED'];
  inv.forEach((s, i) => evidenceRow(g, 130 + i * 355, 830, s, lt, 1.5 + i * .18));
  const u2 = seg(lt, 2.6, 3.1);
  if (u2 > 0) {
    const dg = el('g', { opacity: ease(u2), transform: `translate(1360,945) scale(${lerp(1.4, 1, pop(u2))})` }, g);
    rect(dg, -280, -46, 560, 92, C.ink, { rx: 10 });
    T(dg, 0, 14, 'SEWN IN THE LINING: 500 DM', 30, AMB, { f: F.mono, w: 700, a: 'middle', ls: 1.5 });
    window.EV.push({ t: t - lt + 2.6, type: 'thud' });
  }
  T(g, 960, 1035, 'AND AGAIN — EVERY IDENTIFICATION MARK ON EVERY ITEM, CUT AWAY OR FILED OFF.', 25, RED, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 3.3, 3.9)) });
}

// ================= S7 — ROOM 407 =================
function S7(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .4, 1.0));
  const lg = el('g', { opacity: u, transform: `translate(120,150) rotate(${lerp(-2, -1, u)})` }, g);
  card(lg, 0, 0, 900, 560, {});
  T(lg, 40, 66, 'HOTEL HORDAHEIMEN — BERGEN', 30, INK, { f: F.serif, w: 700 });
  T(lg, 40, 104, 'GUEST REGISTER · NOVEMBER 1970', 18, STEEL, { f: F.mono, ls: 2 });
  const kg = el('g', { transform: `translate(720,320) rotate(8)` }, lg);
  rect(kg, -90, -60, 180, 120, C.ink, { rx: 10 });
  rect(kg, -12, -84, 24, 30, 'none', { stroke: C.ink, sw: 8, rx: 8 });
  T(kg, 0, 16, '407', 52, AMB, { f: F.mono, w: 700, a: 'middle' });
  const rows = [['CHECK-IN', 'MID-NOVEMBER 1970'], ['ROOM', '407'], ['PAYMENT', 'CASH — FULL BILL'], ['CHECK-OUT', '23 NOVEMBER — ASKED FOR A TAXI']];
  rows.forEach((r, i) => {
    const u2 = ease(seg(lt, 1.1 + i * .25, 1.5 + i * .25));
    if (u2 <= 0) return;
    const rg = el('g', { opacity: u2 }, lg);
    line(rg, 40, 170 + i * 86, 860, 170 + i * 86, C.line, 1);
    T(rg, 40, 156 + i * 86, r[0], 18, STEEL, { f: F.mono, w: 700, ls: 2 });
    T(rg, 260, 156 + i * 86, r[1], 26, INK, { f: F.serif, w: 700 });
  });
  stamp(lg, 460, 500, 'LAST SEEN ALIVE — 23 NOV', 21, RED, { ang: -4, o: seg(lt, 2.3, 2.8) });
  const u3 = ease(seg(lt, 1.4, 2.0));
  if (u3 > 0) {
    const wg = el('g', { opacity: u3, transform: `translate(1140,${170 + (1 - u3) * 30})` }, g);
    card(wg, 0, 0, 680, 540, {});
    T(wg, 340, 60, 'AS THE STAFF DESCRIBED HER', 22, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 2 });
    const rows2 = [['HEIGHT', '≈ 1.63 M  (5 FT 4)'], ['HAIR', 'DARK BROWN'], ['EYES', 'SMALL, BROWN'], ['MANNER', 'KEPT TO HER ROOM'], ['DEMEANOUR', '“ON GUARD”'], ['COVER STORY', 'SALESWOMAN / ANTIQUITIES DEALER'], ['NOTED BY WITNESSES', 'WIGS · SMELL OF GARLIC']];
    rows2.forEach((r, i) => {
      T(wg, 40, 120 + i * 58, r[0], 16, STEEL, { f: F.mono, w: 700, ls: 1.5 });
      T(wg, 300, 120 + i * 58, r[1], 22, INK, { f: F.sans, w: 700 });
    });
  }
  T(g, 960, 1000, 'WHAT HAPPENED IN THE SIX DAYS AFTER 23 NOVEMBER IS NOT RECORDED ANYWHERE.', 27, RED, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 3.1, 3.7)) });
}

// ================= S8 — THE ALIASES =================
function S8(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const names = [
    ['GENEVIEVE LANCIER', 'LEUVEN'], ['CLAUDIA TIELT', 'BRUSSELS'], ['CLAUDIA NIELSEN', 'BRUSSELS'],
    ['VERA JARLE', 'ANTWERP'], ['FENELLA LORCK', '—'], ['ELISABETH LEENHOWER', 'OSTEND'],
    ['ALEXIA ZARNE-MERCHEZ', 'BRUSSELS'], ['CLAUDIA TIELT (II)', 'BRUSSELS'],
  ];
  names.forEach((n, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const u = ease(seg(lt, .5 + i * .22, 1.0 + i * .22));
    if (u <= 0) return;
    const ng = el('g', { opacity: u, transform: `translate(${90 + col * 455},${250 + row * 320 + (1 - u) * 24}) rotate(${(i % 3 - 1) * 1.2})` }, g);
    card(ng, 0, 0, 410, 240, {});
    T(ng, 205, 56, 'HOTEL REGISTRATION', 14, STEEL, { f: F.mono, a: 'middle', ls: 2 });
    T(ng, 30, 116, n[0], 24, INK, { f: F.serif, w: 700 });
    T(ng, 30, 152, 'OF ' + n[1], 18, STEEL, { f: F.mono });
    line(ng, 30, 178, 380, 178, C.line, 1.2);
    T(ng, 30, 210, 'NATIONALITY: BELGIAN', 17, BLUE, { f: F.mono, w: 700, ls: 1 });
    pin(ng, 380, 20, i % 2 ? RED : C.blue);
  });
  T(g, 480, 950, 'FORMS WRITTEN IN FRENCH AND GERMAN', 22, INK, { f: F.sans, w: 700, a: 'middle', o: ease(seg(lt, 2.6, 3.1)) });
  T(g, 1440, 950, 'ALMOST EVERY STREET NAME: FALSE', 22, RED, { f: F.sans, w: 700, a: 'middle', o: ease(seg(lt, 2.9, 3.4)) });
  T(g, 960, 1010, 'MANY OF THE NAMES WERE SAINTS\u2019 NAMES — DEVOTION, HABIT, OR A PRIVATE JOKE. NEVER ESTABLISHED.', 22, STEEL, { f: F.sans, i: 1, a: 'middle', o: ease(seg(lt, 3.2, 3.7)) });
}

// ================= S9 — THE NOTEBOOK =================
function S9(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .4, 1.0));
  const ng = el('g', { opacity: u, transform: `translate(${310},${110})` }, g);
  rect(ng, 0, 0, 1300, 560, C.cream, { rx: 10, stroke: C.line, sw: 1.5 });
  line(ng, 650, 0, 650, 560, C.line, 2);
  for (let i = 1; i < 10; i++) { line(ng, 40, i * 52, 610, i * 52, C.line, .8, { o: .6 }); line(ng, 690, i * 52, 1260, i * 52, C.line, .8, { o: .6 }); }
  const rnd = R(11);
  for (let r = 0; r < 5; r++) {
    let s = ''; for (let k = 0; k < 14; k++) s += String.fromCharCode(65 + Math.floor(rnd() * 26));
    T(ng, 46, 60 + r * 52, s, 26, INK, { f: F.mono, ls: 6, o: ease(seg(lt, .8 + r * .12, 1.15 + r * .12)) });
  }
  const decoded = [['C 7 — 12.10', 'OSLO'], ['D 3 — 24.10', 'TRONDHEIM'], ['E 9 — 21.11', 'STAVANGER'], ['F 2 — 18.11', 'BERGEN'], ['G 5 — 11.70', 'PARIS ?']];
  decoded.forEach((d, i) => {
    const u2 = ease(seg(lt, 1.9 + i * .3, 2.3 + i * .3));
    if (u2 <= 0) return;
    const dg = el('g', { opacity: u2 }, ng);
    T(dg, 700, 60 + i * 52, d[0], 26, RED, { f: F.mono, w: 700, ls: 3 });
    T(dg, 980, 60 + i * 52, '→  ' + d[1], 26, INK, { f: F.serif, w: 700 });
    line(dg, 700, 70 + i * 52, 1260, 70 + i * 52, C.line, .8, { o: .6 });
  });
  T(ng, 650, 540, 'ENTRIES IN CODE — DECODED BY POLICE TO DATES AND PLACE NAMES', 17, STEEL, { f: F.sans, a: 'middle', w: 700, o: ease(seg(lt, 2.2, 2.7)) });
  const u3 = ease(seg(lt, 3.0, 3.6));
  if (u3 > 0) {
    const vg = el('g', { opacity: u3, transform: `translate(0,${680 + (1 - u3) * 24})` }, g);
    rect(vg, 260, 0, 660, 190, C.ink, { rx: 12 });
    T(vg, 590, 62, 'WHAT IT ESTABLISHES', 20, AMB, { f: F.mono, w: 700, a: 'middle', ls: 2 });
    T(vg, 590, 118, 'A ROUTE.', 44, PAP, { f: F.serif, w: 700, a: 'middle' });
    rect(vg, 1000, 0, 660, 190, C.cream, { rx: 12, stroke: C.line, sw: 1.5 });
    T(vg, 1330, 62, 'WHAT IT DOES NOT', 20, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 2 });
    T(vg, 1330, 118, 'A REASON.', 44, RED, { f: F.serif, w: 700, a: 'middle' });
    T(vg, 960, 232, 'THE PATTERN OF A PERSON MANAGING HER OWN SECRECY — AND NOTHING MORE.', 24, STEEL, { f: F.sans, a: 'middle', o: seg(lt, 3.8, 4.2) });
  }
}

// ================= S10 — THE TRAVEL TRAIL =================
function S10(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .4, 1.1));
  const pg = el('g', { opacity: u, transform: `translate(${840},${150 + (1 - u) * 26})` }, g);
  card(pg, 0, 0, 960, 800, {});
  T(pg, 480, 56, 'NORWAY — RECONSTRUCTED ROUTE', 20, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 3 });
  const ng = el('g', { transform: `translate(480,420) scale(0.72)` }, pg);
  path(ng, 'M-330,320 C-300,180 -260,60 -180,-60 C-120,-150 -60,-240 40,-300 C120,-345 220,-360 320,-330 C360,-318 356,-280 320,-262 C240,-226 180,-190 150,-120 C120,-50 90,40 30,120 C-30,200 -140,300 -240,330 Z', C.blue, 3.5, { fill: C.frost });
  const pathPts = [[-60, 60], [-140, 180], [90, 40], [130, -140], [-60, 60]];
  const cities = [['OSLO', 90, 40, 1], ['TRONDHEIM', 130, -140, 1], ['STAVANGER', -140, 180, -1], ['BERGEN', -60, 60, -1]];
  const order = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const u2 = seg(lt, 1.2, 3.0);
  if (u2 > 0) {
    const n = u2 * 4;
    for (let i = 0; i < Math.floor(n); i++) {
      const [a, b] = order[i];
      path(ng, `M${pathPts[a][0]},${pathPts[a][1]} Q${(pathPts[a][0]+pathPts[b][0])/2 + 40},${(pathPts[a][1]+pathPts[b][1])/2 - 40} ${pathPts[b][0]},${pathPts[b][1]}`, RED, 4.5, { dash: '9 11' });
    }
    const fr = n - Math.floor(n);
    if (fr > 0 && Math.floor(n) < 4) {
      const [a, b] = order[Math.floor(n)];
      const qx = (pathPts[a][0]+pathPts[b][0])/2 + 40, qy = (pathPts[a][1]+pathPts[b][1])/2 - 40;
      const mx = lerp(lerp(pathPts[a][0], qx, fr), lerp(qx, pathPts[b][0], fr), fr);
      const my = lerp(lerp(pathPts[a][1], qy, fr), lerp(qy, pathPts[b][1], fr), fr);
      circ(ng, mx, my, 11, RED);
    }
  }
  cities.forEach((c) => {
    circ(ng, c[1], c[2], 9, INK);
    T(ng, c[1] + (c[3] > 0 ? 20 : -20), c[2] + 7, c[0], 26, INK, { f: F.mono, w: 700, a: c[3] > 0 ? 'start' : 'end' });
  });
  const ig = el('g', { opacity: ease(seg(lt, 3.0, 3.5)) }, pg);
  rect(ig, 60, 690, 840, 76, C.ink, { rx: 8 });
  T(ig, 480, 740, 'PLUS AT LEAST ONE TRIP THROUGH PARIS', 26, PAP, { f: F.serif, w: 700, a: 'middle', ls: 1 });
  const wits = [
    ['GERMAN — OVERHEARD WITH A MAN, A BERGEN HOTEL', RED, 1.5],
    ['FLEMISH · BROKEN ENGLISH — OTHER WITNESSES', STEEL, 1.85],
    ['STAVANGER — A SHOE SALESMAN SOLD HER THE RUBBER BOOTS', AMB, 2.2],
    ['SHE CHANGED ROOMS AFTER CHECKING-IN — WATCHED THE STREET', STEEL, 2.55],
  ];
  wits.forEach((w) => {
    const u3 = ease(seg(lt, w[2], w[2] + .45));
    if (u3 <= 0) return;
    const wg = el('g', { opacity: u3, transform: `translate(${90},${300 + wits.indexOf(w) * 130 + (1 - u3) * 22})` }, g);
    rect(wg, 0, 0, 700, 100, C.cream, { rx: 10, stroke: w[1], sw: 2 });
    rect(wg, 0, 0, 14, 100, w[1], { rx: 4 });
    Wrap(wg, 44, 42, w[0], 21, INK, { maxw: 620, lh: 27, f: F.sans, w: 700 });
  });
  T(g, 440, 1000, 'EVERY HABIT POINTED THE SAME DIRECTION:', 24, INK, { f: F.sans, w: 700, a: 'middle', o: ease(seg(lt, 3.3, 3.8)) });
  T(g, 440, 1040, 'A WOMAN PRACTISED AT NOT BEING FOUND.', 27, RED, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 3.5, 4.0)) });
}

// ================= S11 — THE VERDICT OF 1971 =================
function S11(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  T(g, 960, 220, 'THE INVESTIGATION RAN FOR MONTHS — INTERPOL CIRCULATED THE SKETCHES ACROSS EUROPE.', 27, INK, { f: F.sans, w: 700, a: 'middle', o: ease(seg(lt, .4, .9)) });
  T(g, 960, 275, 'NO MISSING-PERSON REPORT MATCHED. NO FAMILY EVER CAME FORWARD.', 24, STEEL, { f: F.sans, a: 'middle', o: ease(seg(lt, .8, 1.3)) });
  const us = seg(lt, 1.4, 1.9);
  if (us > 0) {
    const sg = el('g', { opacity: us, transform: `translate(960,430) rotate(-5) scale(${lerp(1.8, 1, pop(us))})`, filter: 'url(#stampInk)' }, g);
    rect(sg, -430, -80, 860, 160, 'none', { stroke: RED, sw: 9, rx: 10 });
    T(sg, 0, -6, 'PROBABLE SUICIDE', 58, RED, { f: F.mono, w: 700, a: 'middle', ls: 5 });
    T(sg, 0, 48, 'BERGEN POLICE — CASE CLOSED, 1971', 22, RED, { f: F.mono, w: 700, a: 'middle', ls: 2 });
    window.EV.push({ t: t - lt + 1.4, type: 'stamp' });
  }
  const u2 = ease(seg(lt, 2.4, 3.0));
  if (u2 > 0) {
    const bg = el('g', { opacity: u2, transform: `translate(330,${600 + (1 - u2) * 26})` }, g);
    rect(bg, 0, 0, 1260, 220, C.frost, { rx: 12, stroke: C.line, sw: 1.5 });
    T(bg, 630, 62, '5 FEBRUARY 1971 — MØLLENDAL CEMETERY, BERGEN', 26, INK, { f: F.serif, w: 700, a: 'middle' });
    T(bg, 630, 118, 'A ZINC COFFIN, CHOSEN TO PRESERVE HER FOR THE DAY SHE MIGHT BE NAMED.', 23, STEEL, { f: F.sans, a: 'middle' });
    T(bg, 630, 168, 'SIXTEEN POLICE OFFICERS ATTENDED A WOMAN NOBODY COULD CALL BY NAME.', 23, STEEL, { f: F.sans, a: 'middle' });
    const cg = el('g', { transform: `translate(1220,110)` }, bg);
    rect(cg, -14, -6, 28, 52, C.ice, { rx: 4, stroke: C.steel, sw: 1.5 });
    const fl = 1 + Math.sin(t * 6.3) * .12;
    el('ellipse', { cx: 0, cy: -22, rx: 9 * fl, ry: 16 * fl, fill: AMB, opacity: .9 }, cg);
    circ(cg, 0, -40, 3, RED, { o: .5 });
  }
  T(g, 960, 940, 'THE VERDICT SETTLED THE FILE. IT NEVER SETTLED THE ARGUMENT.', 30, RED, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 3.4, 4.0)) });
}

// ================= S12 — THEORY: SUICIDE =================
function theoryFrame(sc, lt, letter, label) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .35, .9));
  const tg = el('g', { opacity: u, transform: `translate(${160 + (1 - u) * -40},250)` }, g);
  circ(tg, 80, 0, 74, 'none', { stroke: RED, sw: 5 });
  T(tg, 80, 30, letter, 78, RED, { f: F.serif, w: 700, a: 'middle' });
  T(tg, 190, 16, 'THEORY', 20, STEEL, { f: F.mono, w: 700, ls: 6 });
  T(tg, 190, 66, label, 44, INK, { f: F.serif, w: 700 });
  return g;
}
function S12(sc, lt, t) {
  const g = theoryFrame(sc, lt, 'A', 'SUICIDE — THE OFFICIAL VERDICT');
  const colA = verdictCard(g, 160, 420, 800, 480, 'WHAT SUPPORTS IT', C.steel, lt, .9);
  if (colA) {
    const rows = ['THE TOXICOLOGY SUPPORTS A SELF-ADMINISTERED OVERDOSE', 'THE SCENE HELD NO WEAPON AND NO SIGN OF STRUGGLE', 'THE ERASED IDENTITY FITS A PERSON PREPARING TO DISAPPEAR', 'LABELS CUT · CASH PAID · FALSE NAMES — THE LOGISTICS OF NOT BEING TRACED'];
    rows.forEach((r, i) => {
      const u = ease(seg(lt, 1.3 + i * .35, 1.8 + i * .35));
      if (u <= 0) return;
      const rg = el('g', { opacity: u }, colA);
      circ(rg, 56, 108 + i * 88, 7, C.steel);
      Wrap(rg, 86, 118 + i * 88, r, 22, INK, { maxw: 640, lh: 30, f: F.sans, w: 700 });
    });
  }
  const colB = verdictCard(g, 1030, 420, 760, 480, 'WHAT IT DOES NOT ANSWER', RED, lt, 2.8);
  if (colB) {
    const rows = ['WHY TRAVEL A THOUSAND KILOMETRES TO DIE IN A VALLEY?', 'WHY KEEP A NOTEBOOK OF DATES NO ONE WAS MEANT TO READ?', 'IT EXPLAINS THE METHOD — NOT THE PLANNING.'];
    rows.forEach((r, i) => {
      const u = ease(seg(lt, 3.2 + i * .4, 3.7 + i * .4));
      if (u <= 0) return;
      const rg = el('g', { opacity: u }, colB);
      T(rg, 48, 122 + i * 108, '—', 26, RED, { f: F.mono, w: 700 });
      Wrap(rg, 86, 118 + i * 108, r, 22, INK, { maxw: 600, lh: 30, f: F.sans, w: 700 });
    });
  }
}

// ================= S13 — THEORY: SECOND PERSON =================
function S13(sc, lt, t) {
  const g = theoryFrame(sc, lt, 'B', 'A SECOND PERSON?');
  const c1 = verdictCard(g, 160, 400, 800, 300, '1991 — AN ANONYMOUS TAXI DRIVER', C.steel, lt, .9);
  if (c1) {
    Wrap(c1, 48, 130, 'HE SAID THAT ON THAT NOVEMBER DAY, A MAN JOINED THE WOMAN IN HIS CAB FOR THE RIDE TO THE RAILWAY STATION. THE DRIVER WHO TOOK HER WAS NEVER FORMALLY IDENTIFIED.', 23, INK, { maxw: 700, lh: 33, f: F.sans });
    T(c1, 48, 268, 'UNVERIFIED — ANONYMOUS ACCOUNT', 18, RED, { f: F.mono, w: 700, ls: 2 });
  }
  const c2 = verdictCard(g, 1030, 400, 760, 300, '2005 — A FLØYEN HIKER\u2019S MEMORY', C.steel, lt, 1.6);
  if (c2) {
    Wrap(c2, 48, 130, 'FIVE DAYS BEFORE THE BODY WAS FOUND: THE WOMAN, DRESSED FOR THE CITY, WALKING AHEAD OF TWO MEN IN COATS. HE SAID HE WAS TOLD TO FORGET IT.', 23, INK, { maxw: 660, lh: 33, f: F.sans });
    T(c2, 48, 268, 'NO FORMAL RECORD WAS MADE AT THE TIME', 18, RED, { f: F.mono, w: 700, ls: 2 });
  }
  const u = ease(seg(lt, 2.4, 3.0));
  if (u > 0) {
    const sg = el('g', { opacity: u * .85 }, g);
    bust(sg, 1500, 930, 270, C.steel, { o: 1 });
    bust(sg, 1740, 950, 250, C.steel, { o: .7 });
  }
  const u3 = ease(seg(lt, 3.6, 4.2));
  if (u3 > 0) {
    const fg = el('g', { opacity: u3, transform: `translate(160,760)` }, g);
    rect(fg, 0, 0, 800, 190, C.cream, { rx: 10, stroke: AMB, sw: 2.5 });
    T(fg, 40, 70, 'NONE OF THIS IS EVIDENCE OF MURDER.', 27, INK, { f: F.serif, w: 700 });
    T(fg, 40, 130, 'IT IS EVIDENCE OF PEOPLE WHO WERE NEVER FOUND —', 24, STEEL, { f: F.sans });
    T(fg, 40, 166, 'AND OF A SCENE THAT ALWAYS ALLOWED MORE THAN ONE STORY.', 24, STEEL, { f: F.sans });
  }
}

// ================= S14 — THEORY: ESPIONAGE =================
function S14(sc, lt, t) {
  const g = theoryFrame(sc, lt, 'C', 'ESPIONAGE — THE STORY EVERYONE HAS HEARD');
  const u1 = ease(seg(lt, .9, 1.5));
  if (u1 > 0) {
    const bg = el('g', { opacity: u1, transform: `translate(160,400)` }, g);
    rect(bg, 0, 0, 900, 460, C.ink, { rx: 12 });
    T(bg, 40, 62, 'THE CONTEXT: 1970 — HEIGHT OF THE COLD WAR', 22, AMB, { f: F.mono, w: 700, ls: 1.5 });
    T(bg, 40, 122, 'A NATO COUNTRY. FALSE NAMES. CODES.', 27, PAP, { f: F.serif, w: 700 });
    T(bg, 40, 170, 'DISCIPLINE. SILENCE.', 27, PAP, { f: F.serif, w: 700 });
    path(bg, 'M40,320 C180,260 320,250 460,290 C560,318 640,300 700,270 L700,410 L40,410 Z', 'none', 0, { fill: 'rgba(94,134,168,0.25)' });
    T(bg, 60, 300, 'MISSILE TESTING AREAS ON THE COAST', 17, ICE, { f: F.mono, w: 700 });
    const u2 = ease(seg(lt, 1.7, 2.2));
    if (u2 > 0) {
      const fg = el('g', { opacity: u2 }, bg);
      circ(fg, 560, 300, 9, RED);
      T(fg, 560, 340, 'A FISHERMAN PLACED HER NEAR ONE SUCH ZONE', 16, RED, { f: F.mono, w: 700, a: 'middle' });
    }
  }
  const u3 = ease(seg(lt, 2.4, 3.0));
  if (u3 > 0) {
    const ng = el('g', { opacity: u3, transform: `translate(1120,400)` }, g);
    rect(ng, 0, 0, 680, 460, C.cream, { rx: 12, stroke: RED, sw: 2.5 });
    T(ng, 340, 66, 'WHAT THE FILE DOES NOT CONTAIN', 21, RED, { f: F.mono, w: 700, a: 'middle', ls: 1.5 });
    const rows = ['NOT ONE DOCUMENT PLACING HER IN ANY INTELLIGENCE SERVICE', 'NOT ONE WITNESS NAMING AN AGENCY', 'BERGEN POLICE NEVER ADOPTED THE SPY THEORY'];
    rows.forEach((r, i) => {
      const u4 = ease(seg(lt, 2.7 + i * .35, 3.15 + i * .35));
      if (u4 <= 0) return;
      const rg = el('g', { opacity: u4 }, ng);
      line(rg, 40, 118 + i * 100, 640, 118 + i * 100, C.line, 1);
      Wrap(rg, 40, 132 + i * 100, r, 21, INK, { maxw: 590, lh: 29, f: F.sans, w: 700 });
    });
  }
  T(g, 960, 950, 'A STORY THAT FITS THE SHAPE OF THE CLUES — HOLD IT LIGHTLY.', 27, RED, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 3.6, 4.2)) });
}

// ================= S15 — THE REOPENING =================
function S15(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  stamp(g, 480, 260, 'REOPENED — 2016', 30, BLUE, { ang: -3, o: ease(seg(lt, .5, 1.0)) });
  T(g, 960, 400, 'BERGEN POLICE REOPENED THE CASE. THE MEDIA BROUGHT NEW ATTENTION.', 28, INK, { f: F.sans, w: 700, a: 'middle', o: ease(seg(lt, .9, 1.4)) });
  const rnd = R(23);
  for (let i = 0; i < 6; i++) {
    const u = ease(seg(lt, 1.5 + i * .18, 1.95 + i * .18));
    if (u <= 0) continue;
    const col = i % 4, row = Math.floor(i / 4);
    const sg = el('g', { opacity: u, transform: `translate(${560 + col * 280},${560 + row * 330 + (1 - u) * 20})` }, g);
    card(sg, -110, -140, 220, 290, {});
    bust(sg, 0, 30, 170 * (0.9 + rnd() * .2), C.steel, { o: .8, hairCol: C.ink });
    T(sg, 0, 130, 'SKETCH ' + (i + 1), 15, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  }
  const u3 = ease(seg(lt, 3.0, 3.6));
  if (u3 > 0) {
    const pg = el('g', { opacity: u3, transform: `translate(0,${950 + (1 - u3) * 20})` }, g);
    rect(pg, 260, -44, 1400, 88, C.ink, { rx: 10 });
    T(pg, 960, 12, 'NRK COMMISSIONED SIX NEW SKETCHES — SHOWN TO PEOPLE WHO HAD ACTUALLY SEEN HER.', 26, PAP, { f: F.sans, w: 700, a: 'middle' });
  }
  T(g, 1660, 560, 'THE BBC + NRK PODCAST\n«DEATH IN ICE VALLEY»\nBROUGHT LISTERS\u2019 LEADS WORLDWIDE', 20, STEEL, { f: F.mono, a: 'middle', o: ease(seg(lt, 3.4, 4.0)) });
}

// ================= S16 — THE SCIENCE =================
function S16(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  const u = ease(seg(lt, .4, 1.0));
  const mg = el('g', { opacity: u, transform: `translate(420,${430}) scale(${lerp(1.12, 1, u)})` }, g);
  card(mg, -330, -260, 660, 520, {});
  T(mg, 0, -212, 'ISOTOPE ANALYSIS OF HER TEETH', 21, STEEL, { f: F.mono, w: 700, a: 'middle', ls: 2 });
  path(mg, 'M-280,-40 C-240,-160 -120,-220 0,-200 C140,-180 240,-100 260,20 C270,120 200,200 80,220 C-60,240 -220,180 -270,60 Z', C.blue, 3, { fill: C.frost });
  const born = ease(seg(lt, 1.0, 1.5));
  if (born > 0) {
    circ(mg, 90, -60, 11 * lerp(1.6, 1, pop(born)), RED);
    T(mg, 90, -84, 'BORN ≈ 1930 — IN OR NEAR NUREMBERG', 17, RED, { f: F.mono, w: 700, a: 'middle' });
  }
  const moved = ease(seg(lt, 1.6, 2.1));
  if (moved > 0) {
    path(mg, `M90,-60 C20,-40 -80,-10 -170,-30`, RED, 3.5, { dash: '7 8' });
    circ(mg, -170, -30, 10, AMB);
    T(mg, -170, -56, 'CHILDHOOD: FRANCE / THE BORDER REGION', 16, INK, { f: F.mono, w: 700, a: 'middle' });
  }
  const cards = [
    ['HANDWRITING', 'EARLIER ANALYSIS: EDUCATED IN FRANCE OR A NEIGHBOURING COUNTRY', C.steel, 1.9],
    ['mtDNA H24', 'A MATERNAL LINE FOUND IN SOUTH-EASTERN EUROPE OR SOUTH-WESTERN ASIA', C.blue, 2.3],
    ['THE DENTIST', 'DENTAL WORK MATCHED CENTRAL/SOUTHERN EUROPE, EAST ASIA — OR SOUTH AMERICA', AMB, 2.7],
  ];
  cards.forEach((cd, i) => {
    const u3 = ease(seg(lt, cd[3], cd[3] + .5));
    if (u3 <= 0) return;
    const cg = el('g', { opacity: u3, transform: `translate(${920},${250 + i * 200 + (1 - u3) * 24})` }, g);
    rect(cg, 0, 0, 880, 160, C.cream, { rx: 10, stroke: cd[2], sw: 2 });
    rect(cg, 0, 0, 14, 160, cd[2], { rx: 4 });
    T(cg, 44, 52, cd[0], 24, INK, { f: F.mono, w: 700, ls: 2 });
    Wrap(cg, 44, 92, cd[1], 21, STEEL, { maxw: 790, lh: 28, f: F.sans, w: 700 });
  });
  T(g, 960, 990, 'THE DNA DOE PROJECT\u2019S COLLEEN FITZPATRICK JOINED THE EFFORT — THE FILE NOW HAS MODERN SCIENCE BEHIND IT.', 23, STEEL, { f: F.sans, a: 'middle', o: ease(seg(lt, 3.4, 3.9)) });
}

// ================= S17 — WHAT REMAINS UNKNOWN =================
function S17(sc, lt, t) {
  bgFill(PAP);
  const g = sceneFrame(sc, lt);
  T(g, 960, 190, 'STRIP AWAY FIFTY YEARS OF FOLKLORE — THE CLAIM LEDGER', 28, INK, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, .3, .8)) });
  const cols = [
    ['CONFIRMED', C.steel, .8, [
      'THE MEDICAL CAUSE OF DEATH', 'THE DATES AND THE HOTELS', 'THE ALIASES AND THE CODED NOTEBOOK',
      'THE 1971 VERDICT: PROBABLE SUICIDE', 'THE 2016 REOPENING — STILL UNSOLVED',
    ]],
    ['DISPUTED', AMB, 1.6, [
      'THE NECK INJURY — FALL OR BLOW?', 'THE TWO-MEN SIGHTING OF 2005', 'THE TAXI PASSENGER OF 1991',
      'WHETHER A SECOND PERSON WAS EVER THERE',
    ]],
    ['UNKNOWN', RED, 2.4, [
      'HER NAME', 'HER HOME COUNTRY — LIKELY SOUTHERN GERMANY OR THE FRENCH BORDER, NEVER PROVEN',
      'WHY SHE ERASED HER IDENTITY', 'WHETHER ANYONE HELPED HER DIE — OR HELPED HER ERASE',
    ]],
  ];
  cols.forEach((c, ci) => {
    const [head, col, delay, rows] = c;
    const u = ease(seg(lt, delay, delay + .5));
    if (u <= 0) return;
    const cg = el('g', { opacity: u, transform: `translate(${70 + ci * 610},${250 + (1 - u) * 26})` }, g);
    rect(cg, 0, 0, 560, 700, C.cream, { rx: 12, stroke: col, sw: 2.5 });
    rect(cg, 0, 0, 560, 64, col, { rx: 12 });
    rect(cg, 0, 34, 560, 30, col);
    T(cg, 280, 43, head, 26, C.cream, { f: F.mono, w: 700, a: 'middle', ls: 5 });
    rows.forEach((r, i) => {
      const u2 = ease(seg(lt, delay + .4 + i * .22, delay + .9 + i * .22));
      if (u2 <= 0) return;
      const rg = el('g', { opacity: u2 }, cg);
      const yy = 120 + i * 118;
      circ(rg, 44, yy - 8, 6, col);
      Wrap(rg, 70, yy, r, 21, INK, { maxw: 440, lh: 28, f: F.sans, w: 700 });
      line(rg, 40, yy + 52, 520, yy + 52, C.line, 1, { o: .6 });
    });
  });
}

// ================= S18 — CLOSE =================
function S18(sc, lt, t) {
  bgFill(C.night);
  const g = el('g', {}, world);
  const defs = document.querySelector('#stage defs');
  if (!defs.querySelector('#skyG2')) {
    const gr = document.createElementNS(NS, 'linearGradient');
    gr.id = 'skyG2'; gr.setAttribute('x1', 0); gr.setAttribute('y1', 0); gr.setAttribute('x2', 0); gr.setAttribute('y2', 1);
    for (const [o, c] of [[0, '#0C141F'], [.6, '#12202E'], [1, '#1B2F42']]) {
      const st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', o); st.setAttribute('stop-color', c); gr.appendChild(st);
    }
    defs.appendChild(gr);
  }
  rect(g, 0, 0, W, H, 'url(#skyG2)');
  mountains(g, 1180, '#0F1B29', .8);
  const u0 = ease(seg(lt, .4, 1.0));
  const cnd = el('g', { opacity: u0, transform: `translate(660,740)` }, g);
  rect(cnd, -16, -8, 32, 60, C.ice, { rx: 4, stroke: STEEL, sw: 1.5, o: .9 });
  const fl = 1 + Math.sin(t * 6.1) * .13;
  el('ellipse', { cx: 0, cy: -26, rx: 10 * fl, ry: 18 * fl, fill: AMB, opacity: .95 }, cnd);
  circ(cnd, 0, -46, 90, 'rgba(201,162,39,0.07)');
  T(g, 960, 300, 'SHE LIES IN A ZINC COFFIN IN BERGEN —', 40, PAP, { f: F.serif, w: 700, a: 'middle', o: ease(seg(lt, 1.0, 1.6)) });
  T(g, 960, 366, 'IN GROUND THAT HAS HELD HER FOR OVER FIFTY YEARS.', 34, ICE, { f: F.serif, i: 1, a: 'middle', o: ease(seg(lt, 1.5, 2.1)) });
  const u1 = ease(seg(lt, 2.4, 3.0));
  if (u1 > 0) {
    const sg = el('g', { opacity: u1, transform: `translate(960,540) rotate(-3) scale(${lerp(1.5, 1, pop(u1))})`, filter: 'url(#stampInk)' }, g);
    rect(sg, -350, -60, 700, 120, 'none', { stroke: RED, sw: 7, rx: 8 });
    T(sg, 0, 12, 'CASE STATUS: OPEN', 48, RED, { f: F.mono, w: 700, a: 'middle', ls: 4 });
    window.EV.push({ t: t - lt + 2.4, type: 'stamp' });
  }
  T(g, 960, 668, 'SOMEWHERE THERE MAY BE A NAME ON A PAGE THAT NO ONE HAS CHECKED.', 25, STEEL, { f: F.sans, a: 'middle', o: ease(seg(lt, 3.0, 3.6)) });
  const u2 = ease(seg(lt, 4.2, 4.8));
  if (u2 > 0) {
    const eg = el('g', { opacity: u2 }, g);
    T(eg, 960, 822, 'THE ISDAL WOMAN', 50, PAP, { f: F.serif, w: 700, a: 'middle', ls: 3 });
    T(eg, 960, 870, 'THE WOMAN WHO ERASED HER OWN IDENTITY', 23, ICE, { f: F.mono, a: 'middle', ls: 4 });
    T(eg, 960, 918, 'FULL SOURCE LIST IN THE DESCRIPTION · OPUSCAR STUDIO 2026', 18, STEEL, { f: F.mono, a: 'middle', ls: 2 });
  }
}

// ---------- precomputed foley event table (read by core/render/events.mjs) ----------
(() => {
  const EVX = [];
  for (const sc of TL.scenes) EVX.push({ t: sc.t0 + .06, type: 'whoosh' });
  const at = (sid, off, type) => { const sc = TL.scenes.find(s => s.id === sid); if (sc) EVX.push({ t: sc.t0 + off, type }); };
  at('S1', 0.85, 'stamp'); at('S2', 1.35, 'stamp'); at('S4', 2.9, 'stamp');
  at('S6', 2.6, 'thud'); at('S11', 1.4, 'stamp'); at('S18', 2.4, 'stamp');
  EVX.sort((a, b) => a.t - b.t);
  window.EV = EVX;
})();

return { _default: (sc, lt) => { bgFill(PAP); sceneFrame(sc, lt); },
         S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18 };
})();
