// Generates every SVG in assets/. Run with: node scripts/build.js
// Fonts (Orbitron, JetBrains Mono; SIL OFL) are subset to ASCII and embedded,
// so the art renders the same on every device.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets');
const font = (f) => fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64');

const C = {
  bg: '#0b0a10',
  panel: '#13111c',
  line: '#2a2438',
  red: '#ff3b5c',
  fuchsia: '#eb459e',
  pink: '#f48fb1',
  lav: '#b39ddb',
  purple: '#7c4dff',
  green: '#57f287',
  text: '#f0eef6',
  dim: '#8a8499',
};

// Embed only the faces a file actually uses.
const fontCss = (body) => {
  const faces = [];
  if (body.includes('class="orb')) faces.push(`@font-face{font-family:'Orb';src:url(data:font/woff2;base64,${font('orb900.woff2')}) format('woff2');font-weight:900}`);
  if (/class="mono(?! b)/.test(body)) faces.push(`@font-face{font-family:'JBM';src:url(data:font/woff2;base64,${font('jbm400.woff2')}) format('woff2');font-weight:400}`);
  if (body.includes('class="mono b')) faces.push(`@font-face{font-family:'JBM';src:url(data:font/woff2;base64,${font('jbm700.woff2')}) format('woff2');font-weight:700}`);
  return `<style>
${faces.join('\n')}
.orb{font-family:'Orb','Arial Black',sans-serif;font-weight:900}
.mono{font-family:'JBM',Consolas,'DejaVu Sans Mono',monospace}
.b{font-weight:700}
</style>`;
};

// JetBrains Mono advance width is 600/1000 em.
const charW = (size) => size * 0.6;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = (n) => Math.round(n * 100) / 100;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const svg = (w, h, label, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">\n${fontCss(body)}\n${body}\n</svg>\n`;

// Gradient that slides sideways forever; ids must be unique per file.
const flowGradient = (id, w, dur = '6s') => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0" spreadMethod="repeat">
<stop offset="0" stop-color="${C.red}"/><stop offset=".25" stop-color="${C.fuchsia}"/><stop offset=".5" stop-color="${C.lav}"/><stop offset=".75" stop-color="${C.purple}"/><stop offset="1" stop-color="${C.red}"/>
<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="${w} 0" dur="${dur}" repeatCount="indefinite"/>
</linearGradient>`;

// Light that runs around a rounded frame.
const runner = (w, h, rx, grad, dur = '8s') => {
  const per = Math.round(2 * (w + h));
  return `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="none" stroke="url(#${grad})" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${Math.round(per * 0.14)} ${per}" pathLength="${per}">
<animate attributeName="stroke-dashoffset" from="0" to="-${per}" dur="${dur}" repeatCount="indefinite"/></rect>`;
};

// Discrete keyTimes animation helper: list of [time(s), value] for a cycle of T seconds.
const steps = (attr, frames, T, extra = '') => {
  const kt = frames.map(([t]) => (t / T).toFixed(4)).join(';');
  const vals = frames.map(([, v]) => v).join(';');
  return `<animate attributeName="${attr}" values="${vals}" keyTimes="${kt}" dur="${T}s" repeatCount="indefinite" calcMode="discrete"${extra}/>`;
};

// ---------------------------------------------------------------- hero
function hero() {
  const W = 900, H = 380, HZ = 282, CX = W / 2;
  const rand = rng(7);
  const parts = [];

  parts.push(`<defs>
${flowGradient('tg', W, '5s')}
${flowGradient('fr', W, '8s')}
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}"/><stop offset=".5" stop-color="${C.fuchsia}"/><stop offset="1" stop-color="${C.purple}"/></linearGradient>
<radialGradient id="g1"><stop offset="0" stop-color="${C.fuchsia}" stop-opacity=".45"/><stop offset="1" stop-color="${C.fuchsia}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2"><stop offset="0" stop-color="${C.purple}" stop-opacity=".45"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></radialGradient>
<linearGradient id="floorfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="1"/><stop offset=".45" stop-color="${C.bg}" stop-opacity=".2"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></linearGradient>
<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.pink}" stop-opacity="0"/><stop offset=".5" stop-color="${C.pink}" stop-opacity=".09"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/></linearGradient>
<pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".35"/></pattern>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<clipPath id="sky"><rect width="${W}" height="${HZ}"/></clipPath>
<clipPath id="slice1"><rect x="0" y="96" width="${W}" height="14"/></clipPath>
<clipPath id="slice2"><rect x="0" y="128" width="${W}" height="10"/></clipPath>
<mask id="sunmask"><rect width="${W}" height="${H}" fill="#fff"/>${
    [0, 1, 2, 3, 4, 5].map((i) => `<rect x="0" y="${208 + i * 13}" width="${W}" height="${2 + i * 1.3}" fill="#000"/>`).join('')
  }</mask>
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${C.bg}"/>`);

  // ambient glows
  parts.push(`<circle cx="170" cy="70" r="300" fill="url(#g1)"><animate attributeName="opacity" values=".6;1;.6" dur="7s" repeatCount="indefinite"/></circle>
<circle cx="760" cy="330" r="320" fill="url(#g2)"><animate attributeName="opacity" values="1;.55;1" dur="9s" repeatCount="indefinite"/></circle>`);

  // stars
  for (let i = 0; i < 70; i++) {
    const x = r2(rand() * W), y = r2(rand() * (HZ - 10)), r = r2(0.5 + rand() * 1.3);
    const d = r2(2 + rand() * 4), b = r2(-rand() * d);
    const col = [C.text, C.pink, C.lav][Math.floor(rand() * 3)];
    parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"><animate attributeName="opacity" values=".15;1;.15" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`);
  }

  // shooting star
  parts.push(`<g opacity="0"><line x1="0" y1="0" x2="-90" y2="-30" stroke="${C.pink}" stroke-width="2" stroke-linecap="round"/><circle r="2.2" fill="#fff"/>
<animateTransform attributeName="transform" type="translate" values="620 30;860 110" dur="9s" keyTimes="0;1" repeatCount="indefinite" calcMode="spline" keySplines=".2 .6 .4 1"/>
<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.04;.1;1" dur="9s" repeatCount="indefinite"/></g>`);

  // sun on the horizon
  parts.push(`<g clip-path="url(#sky)" opacity=".42"><circle cx="${CX}" cy="${HZ}" r="118" fill="url(#sun)" mask="url(#sunmask)"/>
<circle cx="${CX}" cy="${HZ}" r="118" fill="url(#sun)" mask="url(#sunmask)" filter="url(#soft)" opacity=".7"/></g>`);

  // grid floor
  const floor = [];
  for (let xb = -1500; xb <= W + 1500; xb += 90) {
    floor.push(`<line x1="${r2(CX + (xb - CX) * 0.04)}" y1="${HZ}" x2="${xb}" y2="${H}"/>`);
  }
  const N = 8, dur = 3.2;
  for (let i = 0; i < N; i++) {
    floor.push(`<line x1="0" x2="${W}" y1="${HZ}" y2="${HZ}"><animate attributeName="y1" values="${HZ};${H + 4}" dur="${dur}s" begin="${r2(-i * dur / N)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".55 0 1 .45"/><animate attributeName="y2" values="${HZ};${H + 4}" dur="${dur}s" begin="${r2(-i * dur / N)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".55 0 1 .45"/></line>`);
  }
  parts.push(`<g stroke="${C.purple}" stroke-width="1.2" opacity=".75">${floor.join('')}</g>
<rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#floorfade)"/>
<line x1="0" x2="${W}" y1="${HZ}" y2="${HZ}" stroke="${C.fuchsia}" stroke-width="2" filter="url(#glow)"/>`);

  // title with glitch layers. Glitch bursts near the end of each 4s cycle.
  const T = 4;
  const jitter = (a) => steps('transform', [[0, '0 0'], [3.2, `${a} 0`], [3.28, `${-a * 0.6} 0`], [3.36, `${a * 0.4} 0`], [3.44, `${-a} 0`], [3.52, '0 0']], T).replace('animate ', 'animateTransform type="translate" ');
  const flash = steps('opacity', [[0, 0], [3.2, 0.85], [3.52, 0]], T);
  const title = (attrs) => `<text x="${CX}" y="132" text-anchor="middle" class="orb" font-size="84" letter-spacing="6" ${attrs}>DEADLY-7</text>`;
  parts.push(`<g>
${title(`fill="${C.red}" opacity="0"`).replace('</text>', `${flash}${jitter(7)}</text>`)}
${title(`fill="${C.purple}" opacity="0"`).replace('</text>', `${flash}${jitter(-7)}</text>`)}
${title('fill="url(#tg)" filter="url(#glow)"')}
<g clip-path="url(#slice1)" opacity="0">${title(`fill="${C.text}"`)}${flash.replace('0.85', '1')}${jitter(16)}</g>
<g clip-path="url(#slice2)" opacity="0">${title(`fill="${C.pink}"`)}${flash.replace('0.85', '1')}${jitter(-12)}</g>
</g>`);

  // subtitle
  parts.push(`<text x="${CX}" y="176" text-anchor="middle" class="mono b" font-size="15" letter-spacing="5" fill="${C.lav}">LY RIZZLER  ·  DISCORD BOT DEVELOPER</text>`);

  // typed tagline inside a chip
  const tag = "> I'm the conqueror of my fate";
  const fs_ = 17, cw = charW(fs_), tw = tag.length * cw, tx = r2(CX - tw / 2), ty = 222;
  const TT = 9, t0 = 0.6, per = 0.075, del = 0.03;
  const typed = [[0, 0]];
  for (let i = 1; i <= tag.length; i++) typed.push([t0 + i * per, r2(i * cw)]);
  const holdEnd = t0 + tag.length * per + 4.5;
  for (let i = tag.length - 1; i >= 0; i--) typed.push([holdEnd + (tag.length - i) * del, r2(i * cw)]);
  parts.push(`<clipPath id="tagclip"><rect x="${tx}" y="${ty - 20}" width="0" height="28">${steps('width', typed, TT)}</rect></clipPath>
<rect x="${r2(tx - 18)}" y="${ty - 23}" width="${r2(tw + 40)}" height="34" rx="17" fill="${C.bg}" fill-opacity=".72" stroke="${C.fuchsia}" stroke-opacity=".5"/>
<text x="${tx}" y="${ty}" class="mono" font-size="${fs_}" fill="${C.pink}" textLength="${r2(tw)}" lengthAdjust="spacingAndGlyphs" clip-path="url(#tagclip)">${esc(tag)}</text>
<rect x="${tx}" y="${ty - 15}" width="2.5" height="19" fill="${C.fuchsia}">${steps('x', typed.map(([t, v]) => [t, r2(tx + v + 1)]), TT)}<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1s" repeatCount="indefinite"/></rect>`);

  // HUD corners and labels
  const L = 22, m = 16;
  const corner = (x, y, sx, sy) => `<path d="M${x} ${y + sy * L}V${y}H${x + sx * L}" fill="none" stroke="${C.lav}" stroke-width="2" opacity=".7"/>`;
  parts.push(corner(m, m, 1, 1), corner(W - m, m, -1, 1), corner(m, H - m, 1, -1), corner(W - m, H - m, -1, -1));
  parts.push(`<text x="44" y="36" class="mono" font-size="11" letter-spacing="2" fill="${C.dim}">GITHUB.COM/DEADLY-7</text>
<g transform="translate(${W - 44} 36)"><text text-anchor="end" class="mono b" font-size="11" letter-spacing="2" fill="${C.pink}">ONLINE</text>
<circle cx="-66" cy="-4" r="4" fill="${C.green}"><animate attributeName="opacity" values="1;.25;1" dur="1.4s" repeatCount="indefinite"/></circle></g>`);

  // scanlines and sweeping scan bar
  parts.push(`<rect width="${W}" height="${H}" fill="url(#lines)"/>
<rect x="0" y="-80" width="${W}" height="80" fill="url(#scan)"><animate attributeName="y" values="-80;${H}" dur="6s" repeatCount="indefinite"/></rect>
</g>
${runner(W, H, 18, 'fr')}`);

  return svg(W, H, "DEADLY-7. Ly Rizzler, Discord bot developer. I'm the conqueror of my fate.", parts.join('\n'));
}

// ---------------------------------------------------------------- terminal
function terminal() {
  const W = 900, fs_ = 15, cw = charW(fs_), LH = 25, X = 28, Y0 = 78;
  const prompt = [['deadly-7', C.fuchsia], [' ~ ', C.lav], ['$ ', C.text]];
  const promptLen = prompt.reduce((n, [s]) => n + s.length, 0);
  const kv = (k, v) => ({ out: [[k.padEnd(9), C.lav], [v, C.text]] });
  const lines = [
    { cmd: 'whoami' },
    { out: [['Ly Rizzler', C.pink], [' (deadly-7). I build Discord bots.', C.text]] },
    { cmd: 'cat ~/projects/miyu' },
    kv('name', 'Miyu, a music + community bot (private)'),
    kv('stack', 'Node.js 22 · discord.js v14 · Lavalink v4 · SQLite'),
    kv('music', 'YouTube · YouTube Music · Spotify · SoundCloud'),
    kv('filters', '11 presets: bass boost, nightcore, vaporwave, 8D...'),
    kv('guard', 'antinuke · raid detection · automod · ban list'),
    kv('uptime', '24/7 mode, sessions restored after a restart'),
    { cmd: 'echo $MOTTO' },
    { out: [["I'm the conqueror of my fate.", C.fuchsia]], bold: true },
    { cmd: '', final: true },
  ];
  const H = Y0 + lines.length * LH + 18;
  const T = 22, END = T - 0.8, per = 0.06;

  const body = [];
  let t = 0.8;
  lines.forEach((ln, i) => {
    const y = Y0 + i * LH;
    const show = steps('opacity', [[0, 0], [t, 1], [END, 0]], T);
    if (ln.cmd !== undefined) {
      let x = X;
      const spans = prompt.map(([s, col]) => { const o = `<tspan fill="${col}">${esc(s)}</tspan>`; x += s.length * cw; return o; }).join('');
      body.push(`<text x="${X}" y="${y}" class="mono b" font-size="${fs_}" opacity="0" xml:space="preserve">${spans}${show}</text>`);
      const cx = X + promptLen * cw;
      if (ln.final) {
        body.push(`<rect x="${r2(cx)}" y="${y - 14}" width="${r2(cw)}" height="18" fill="${C.pink}" opacity="0">${steps('opacity', [[0, 0], [t, 1], [END, 0]], T)}</rect>
<rect x="${r2(cx)}" y="${y - 14}" width="${r2(cw)}" height="18" fill="${C.panel}" opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.5;.5;1" dur="1.1s" repeatCount="indefinite"/></rect>`);
        return;
      }
      t += 0.35;
      const frames = [[0, 0]];
      for (let c = 1; c <= ln.cmd.length; c++) frames.push([t + c * per, r2(c * cw)]);
      frames.push([END, 0]);
      body.push(`<clipPath id="c${i}"><rect x="${r2(cx)}" y="${y - 17}" width="0" height="24">${steps('width', frames, T)}</rect></clipPath>
<text x="${r2(cx)}" y="${y}" class="mono" font-size="${fs_}" fill="${C.text}" textLength="${r2(ln.cmd.length * cw)}" lengthAdjust="spacingAndGlyphs" clip-path="url(#c${i})" xml:space="preserve">${esc(ln.cmd)}</text>`);
      t += ln.cmd.length * per + 0.45;
    } else {
      const spans = ln.out.map(([s, col]) => `<tspan fill="${col}">${esc(s)}</tspan>`).join('');
      body.push(`<text x="${X}" y="${y}" class="mono${ln.bold ? ' b' : ''}" font-size="${fs_}" opacity="0" xml:space="preserve">${spans}${show}</text>`);
      t += 0.14;
      if (!lines[i + 1] || lines[i + 1].cmd !== undefined) t += 0.5;
    }
  });
  if (t > END - 4) throw new Error(`terminal script too long: ${t}s`);

  const dots = [C.red, C.fuchsia, C.purple].map((c, i) => `<circle cx="${26 + i * 20}" cy="20" r="6" fill="${c}"/>`).join('');
  const out = `<defs>${flowGradient('fr', W, '8s')}
<clipPath id="win"><rect width="${W}" height="${H}" rx="14"/></clipPath>
<pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".22"/></pattern>
<radialGradient id="g" cx=".85" cy="0" r="1"><stop offset="0" stop-color="${C.purple}" stop-opacity=".18"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></radialGradient></defs>
<g clip-path="url(#win)">
<rect width="${W}" height="${H}" fill="${C.panel}"/>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect width="${W}" height="40" fill="#1a1726"/><line x1="0" x2="${W}" y1="40" y2="40" stroke="${C.line}"/>
${dots}
<text x="${W / 2}" y="25" text-anchor="middle" class="mono" font-size="13" fill="${C.dim}">deadly-7@miyu: ~</text>
${body.join('\n')}
<rect width="${W}" height="${H}" fill="url(#lines)"/>
</g>
${runner(W, H, 14, 'fr', '10s')}`;
  return svg(W, H, "Terminal: whoami. Ly Rizzler (deadly-7), I build Discord bots. Miyu: a private music and community bot on Node.js 22, discord.js v14, Lavalink v4 and SQLite. Music from YouTube, YouTube Music, Spotify and SoundCloud, 11 filter presets, antinuke, raid detection, automod, 24/7 mode. Motto: I'm the conqueror of my fate.", out);
}

// ---------------------------------------------------------------- features
function features() {
  const W = 900, CW = 438, CH = 200, G = 24, H = CH * 2 + G;
  const cards = [
    { n: '01', title: 'MUSIC', lines: ['YouTube · YT Music · Spotify', 'SoundCloud · 11 filter presets', 'lyrics · playlists · 24/7 mode'], art: artMusic },
    { n: '02', title: 'GUARD', lines: ['antinuke · raid detection', 'automod · warnings · cases', 'cross-server ban list'], art: artGuard },
    { n: '03', title: 'COMMUNITY', lines: ['leveling with role rewards', 'tickets · birthdays · economy', 'giveaways · trivia · wordle'], art: artCommunity },
    { n: '04', title: 'FAILOVER', lines: ['probes every Lavalink node', 'moves players off a dead node', 'queue, position, filters kept'], art: artFailover },
  ];
  const parts = [`<defs>${flowGradient('tg', W, '6s')}
<linearGradient id="bar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${C.purple}"/><stop offset=".6" stop-color="${C.fuchsia}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
<linearGradient id="xp" x1="0" x2="1"><stop offset="0" stop-color="${C.purple}"/><stop offset="1" stop-color="${C.fuchsia}"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`];
  cards.forEach((c, i) => {
    const x = (i % 2) * (CW + G), y = Math.floor(i / 2) * (CH + G);
    parts.push(`<g transform="translate(${x} ${y})">
<rect x="1" y="1" width="${CW - 2}" height="${CH - 2}" rx="16" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>
<rect x="1" y="1" width="${CW - 2}" height="${CH - 2}" rx="16" fill="none" stroke="url(#tg)" stroke-width="2" stroke-dasharray="90 1200" pathLength="1200"><animate attributeName="stroke-dashoffset" from="${-i * 300}" to="${-i * 300 - 1200}" dur="9s" repeatCount="indefinite"/></rect>
<rect x="20" y="20" width="150" height="${CH - 40}" rx="12" fill="${C.bg}" stroke="${C.line}"/>
<g transform="translate(20 20)">${c.art(150, CH - 40)}</g>
<text x="194" y="54" class="mono b" font-size="12" letter-spacing="2" fill="${C.dim}">${c.n} //</text>
<text x="194" y="84" class="orb" font-size="24" letter-spacing="2" fill="url(#tg)">${c.title}</text>
${c.lines.map((l, j) => `<text x="194" y="${118 + j * 24}" class="mono" font-size="12" fill="${j === 0 ? C.text : C.lav}">${esc(l)}</text>`).join('\n')}
</g>`);
  });
  return svg(W, H, 'Miyu features. Music: YouTube, YouTube Music, Spotify, SoundCloud, 11 filter presets, lyrics, playlists, 24/7 mode. Guard: antinuke, raid detection, automod, warnings, cases, cross-server ban list. Community: leveling with role rewards, tickets, birthdays, economy, giveaways, trivia, wordle. Failover: probes every Lavalink node and moves players off a dead node with queue, position and filters kept.', parts.join('\n'));
}

function artMusic(w, h) {
  const n = 11, bw = 7, gap = 5, total = n * bw + (n - 1) * gap, x0 = (w - total) / 2, base = h - 34;
  const rand = rng(11);
  const bars = [];
  for (let i = 0; i < n; i++) {
    const hs = Array.from({ length: 6 }, () => Math.round(10 + rand() * 70));
    hs.push(hs[0]);
    const d = r2(1 + rand() * 0.8);
    const ys = hs.map((v) => base - v).join(';');
    bars.push(`<rect x="${r2(x0 + i * (bw + gap))}" width="${bw}" rx="3.5" fill="url(#bar)" y="${base - hs[0]}" height="${hs[0]}"><animate attributeName="height" values="${hs.join(';')}" dur="${d}s" repeatCount="indefinite"/><animate attributeName="y" values="${ys}" dur="${d}s" repeatCount="indefinite"/></rect>`);
  }
  return `${bars.join('')}
<line x1="18" x2="${w - 18}" y1="${base + 14}" y2="${base + 14}" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
<line x1="18" x2="18" y1="${base + 14}" y2="${base + 14}" stroke="${C.fuchsia}" stroke-width="3" stroke-linecap="round"><animate attributeName="x2" values="18;${w - 18}" dur="8s" repeatCount="indefinite"/></line>
<circle cx="18" cy="${base + 14}" r="5" fill="${C.text}" filter="url(#glow)"><animate attributeName="cx" values="18;${w - 18}" dur="8s" repeatCount="indefinite"/></circle>`;
}

function artGuard(w, h) {
  const cx = w / 2, top = 18, sw = 84, sh = 106;
  const d = `M${cx} ${top}L${cx + sw / 2} ${top + 16}V${top + 50}C${cx + sw / 2} ${top + 80} ${cx + 18} ${top + sh - 8} ${cx} ${top + sh}C${cx - 18} ${top + sh - 8} ${cx - sw / 2} ${top + 80} ${cx - sw / 2} ${top + 50}V${top + 16}Z`;
  const T = 4;
  return `<clipPath id="shield"><path d="${d}"/></clipPath>
<path d="${d}" fill="${C.purple}" fill-opacity=".12" stroke="${C.lav}" stroke-width="2.5"/>
<g clip-path="url(#shield)"><rect x="0" width="${w}" height="14" fill="${C.fuchsia}" opacity=".45"><animate attributeName="y" values="${top - 14};${top + sh}" dur="2s" repeatCount="indefinite"/></rect></g>
<path d="M${cx - 18} ${top + 54}l12 12 24 -26" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" filter="url(#glow)">
<animate attributeName="stroke-dashoffset" values="1;1;0;0;1" keyTimes="0;.25;.4;.9;1" dur="${T}s" repeatCount="indefinite"/></path>
<circle cx="${cx}" cy="${top + 56}" r="50" fill="none" stroke="${C.fuchsia}" stroke-width="2" opacity="0"><animate attributeName="r" values="40;70" dur="${T}s" begin="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="${T}s" begin="1.6s" repeatCount="indefinite"/></circle>
<text x="${cx}" y="${h - 12}" text-anchor="middle" class="mono b" font-size="11" letter-spacing="2" fill="${C.green}">PROTECTED</text>`;
}

function artCommunity(w, h) {
  const T = 3.6, bx = 18, by = 92, bw = w - 36;
  const sparks = [0, 1, 2, 3, 4].map((i) => {
    const x = 34 + i * 20;
    return `<circle cx="${x}" cy="80" r="2.5" fill="${[C.pink, C.lav, C.fuchsia][i % 3]}" opacity="0"><animate attributeName="cy" values="84;84;30" keyTimes="0;.62;1" dur="${T}s" begin="${i * 0.08}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;.62;.7;1" dur="${T}s" begin="${i * 0.08}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  return `<text x="${bx}" y="40" class="mono b" font-size="12" fill="${C.dim}">LVL</text>
<text x="${bx + 32}" y="40" class="orb" font-size="22" fill="${C.text}">6${steps('opacity', [[0, 1], [T * 0.64, 0]], T)}</text>
<text x="${bx + 32}" y="40" class="orb" font-size="22" fill="${C.pink}" opacity="0">7${steps('opacity', [[0, 0], [T * 0.64, 1]], T)}</text>
<text x="${w - 18}" y="40" text-anchor="end" class="mono" font-size="11" fill="${C.lav}">XP</text>
<rect x="${bx}" y="${by - 30}" width="${bw}" height="10" rx="5" fill="${C.line}"/>
<rect x="${bx}" y="${by - 30}" width="0" height="10" rx="5" fill="url(#xp)" filter="url(#glow)"><animate attributeName="width" values="0;${bw};${bw}" keyTimes="0;.62;1" dur="${T}s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1;0 0 1 1"/></rect>
${sparks}
<text x="${w / 2}" y="${by + 30}" text-anchor="middle" class="orb" font-size="15" letter-spacing="2" fill="${C.fuchsia}" opacity="0" filter="url(#glow)">LEVEL UP!${steps('opacity', [[0, 0], [T * 0.64, 1], [T * 0.97, 0]], T)}</text>
<text x="${w / 2}" y="${h - 12}" text-anchor="middle" class="mono" font-size="11" fill="${C.dim}">+ role reward</text>`;
}

function artFailover(w, h) {
  const T = 6, px = 112, py = h / 2;
  const nodes = [36, 80, 124].map((y, i) => ({ x: 34, y, i }));
  // node B serves until it drops at 40%, node C takes over at 50%
  const linkB = `<line x1="${px}" y1="${py}" x2="34" y2="80" stroke="${C.fuchsia}" stroke-width="2.5"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.4;.4;1" dur="${T}s" repeatCount="indefinite" calcMode="discrete"/></line>`;
  const linkC = `<line x1="${px}" y1="${py}" x2="34" y2="124" stroke="${C.green}" stroke-width="2.5" opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.5;1" dur="${T}s" repeatCount="indefinite" calcMode="discrete"/></line>`;
  const pktB = `<circle r="3.5" fill="#fff" filter="url(#glow)"><animate attributeName="cx" values="34;${px}" dur=".8s" repeatCount="indefinite"/><animate attributeName="cy" values="80;${py}" dur=".8s" repeatCount="indefinite"/>${steps('opacity', [[0, 1], [T * 0.4, 0]], T)}</circle>`;
  const pktC = `<circle r="3.5" fill="#fff" opacity="0" filter="url(#glow)"><animate attributeName="cx" values="34;${px}" dur=".8s" repeatCount="indefinite"/><animate attributeName="cy" values="124;${py}" dur=".8s" repeatCount="indefinite"/>${steps('opacity', [[0, 0], [T * 0.5, 1]], T)}</circle>`;
  const nodeEls = nodes.map((n) => {
    const fill = n.i === 1
      ? `${C.green}">${steps('fill', [[0, C.green], [T * 0.4, C.red], [T * 0.92, C.green]], T)}</circle>`
      : `${C.green}"/>`;
    return `<line x1="${px}" y1="${py}" x2="${n.x}" y2="${n.y}" stroke="${C.line}" stroke-width="2"/>
<circle cx="${n.x}" cy="${n.y}" r="13" fill="${C.panel}" stroke="${C.lav}" stroke-width="1.5"/>
<circle cx="${n.x}" cy="${n.y}" r="5" fill="${fill}`;
  }).join('\n');
  return `${nodeEls}
${linkB}${linkC}${pktB}${pktC}
<circle cx="${px}" cy="${py}" r="18" fill="${C.purple}" fill-opacity=".25" stroke="${C.fuchsia}" stroke-width="2"/>
<path d="M${px - 5} ${py - 8}l13 8-13 8z" fill="${C.text}"/>
<circle cx="${px}" cy="${py}" r="18" fill="none" stroke="${C.fuchsia}" opacity="0"><animate attributeName="r" values="18;34" dur="${T}s" begin="${T * 0.5}s" repeatCount="indefinite" keyTimes="0;.15" calcMode="spline" keySplines=".2 .8 .4 1" fill="freeze"/><animate attributeName="opacity" values=".9;0;0" keyTimes="0;.15;1" dur="${T}s" begin="${T * 0.5}s" repeatCount="indefinite"/></circle>
<text x="34" y="${h - 4}" text-anchor="middle" class="mono" font-size="9" fill="${C.dim}">NODES</text>
<text x="${px}" y="${h - 4}" text-anchor="middle" class="mono" font-size="9" fill="${C.dim}">PLAYER</text>`;
}

// ---------------------------------------------------------------- section headers
function section(n, label) {
  const W = 900, H = 64;
  const lx = 104 + label.length * 24;
  return svg(W, H, `${n}. ${label}`, `<defs>${flowGradient('tg', W, '6s')}
<linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="${lx}" x2="${W}" y1="0" y2="0"><stop offset="0" stop-color="${C.fuchsia}" stop-opacity=".8"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></linearGradient>
<filter id="glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<text x="2" y="46" class="orb" font-size="40" fill="none" stroke="${C.lav}" stroke-width="1.2" opacity=".55">${n}</text>
<text x="84" y="42" class="orb" font-size="26" letter-spacing="3" fill="url(#tg)">${esc(label)}</text>
<line x1="${lx}" x2="${W - 4}" y1="33" y2="33" stroke="url(#fade)" stroke-width="2"/>
<circle cy="33" r="3.5" fill="#fff" filter="url(#glow)"><animate attributeName="cx" values="${lx};${W - 40}" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".5 0 .5 1"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.8;1" dur="3s" repeatCount="indefinite"/></circle>
<rect x="${W - 14}" y="27" width="12" height="12" fill="none" stroke="${C.fuchsia}" stroke-width="2" transform="rotate(45 ${W - 8} 33)"/>`);
}

// ---------------------------------------------------------------- footer
function footer() {
  const W = 900, H = 170;
  const wave = (amp, phase, yb) => {
    const pts = [];
    for (let x = 0; x <= W; x += 30) pts.push(`${x} ${r2(yb + amp * Math.sin((x / W) * Math.PI * 4 + phase))}`);
    return 'M' + pts.join(' L');
  };
  const waves = [[C.red, 14, 0, 0.5], [C.fuchsia, 18, 1.4, 0.6], [C.purple, 12, 2.6, 0.7], [C.lav, 9, 3.8, 0.35]].map(([col, a, p, op], i) =>
    `<path fill="none" stroke="${col}" stroke-width="2" opacity="${op}" d="${wave(a, p, 52)}"><animate attributeName="d" values="${wave(a, p, 52)};${wave(-a, p + 1, 52)};${wave(a, p, 52)}" dur="${5 + i}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/></path>`
  ).join('\n');
  return svg(W, H, "The conqueror of my fate. deadly-7, thanks for stopping by.", `<defs>${flowGradient('tg', W, '6s')}
<filter id="glow" x="-10%" y="-100%" width="120%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#glow)">${waves}</g>
<text x="${W / 2}" y="122" text-anchor="middle" class="orb" font-size="20" letter-spacing="7" fill="url(#tg)">THE CONQUEROR OF MY FATE</text>
<text x="${W / 2}" y="152" text-anchor="middle" class="mono" font-size="12" letter-spacing="3" fill="${C.dim}">DEADLY-7  ·  THANKS FOR STOPPING BY</text>`);
}

// ---------------------------------------------------------------- write
const files = {
  'hero.svg': hero(),
  'terminal.svg': terminal(),
  'features.svg': features(),
  'footer.svg': footer(),
  'sec-whoami.svg': section('01', 'WHOAMI'),
  'sec-miyu.svg': section('02', 'MIYU'),
  'sec-onair.svg': section('03', 'ON AIR'),
  'sec-arsenal.svg': section('04', 'ARSENAL'),
  'sec-grid.svg': section('05', 'THE GRID'),
  'sec-contact.svg': section('06', 'CONTACT'),
};
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log(`${name.padEnd(18)} ${(content.length / 1024).toFixed(1)} KB`);
}
