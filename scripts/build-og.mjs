// One-off generator for the 1200×630 social share image.
// Composes the existing Cargo lockup (recoloured cream for the navy bg) +
// terracotta PROVISIONS + tagline, then rasterises to a real PNG via resvg.
//   node scripts/build-og.mjs
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const W = 1200;
const H = 630;
const NAVY = '#262A53';
const NAVY_DEEP = '#1B1E3D';
const CREAM = '#F0EDE8';
const RUST = '#E8915A'; // lighter terracotta for contrast on navy (matches hero <em>)

const jakarta = fs.readFileSync('/tmp/ogfonts/PlusJakartaSans.ttf');

// Inline the real wordmark lockup (swirl + "cargo"), stripped of its outer <svg>.
const logoRaw = fs.readFileSync('public/Centered_Logo.svg', 'utf8');
const logoInner = logoRaw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const LOGO_VB_W = 1536;
const LOGO_VB_H = 228.749995;

const lockupW = 560;
const scale = lockupW / LOGO_VB_W;
const lockupH = LOGO_VB_H * scale;
const lockupX = (W - lockupW) / 2;
const lockupY = 168;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <filter id="cream" x="-5%" y="-5%" width="110%" height="110%">
      <feFlood flood-color="${CREAM}" result="c"/>
      <feComposite in="c" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- real Cargo lockup, recoloured cream to read on navy -->
  <g filter="url(#cream)" transform="translate(${lockupX} ${lockupY}) scale(${scale})">${logoInner}</g>

  <text x="${W / 2}" y="350" text-anchor="middle"
    font-family="Plus Jakarta Sans" font-weight="700" font-size="46"
    letter-spacing="14" fill="${RUST}">PROVISIONS</text>

  <text x="${W / 2}" y="446" text-anchor="middle"
    font-family="Plus Jakarta Sans" font-weight="500" font-size="36" fill="${CREAM}">
    The simple provisioning list for superyacht chefs
  </text>

  <text x="${W / 2}" y="566" text-anchor="middle"
    font-family="Plus Jakarta Sans" font-weight="600" font-size="22"
    letter-spacing="2" fill="#9b98ad">cargoprovisions.netlify.app</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: { fontBuffers: [jakarta], defaultFontFamily: 'Plus Jakarta Sans', loadSystemFonts: false },
  background: NAVY_DEEP,
});
const png = resvg.render().asPng();
fs.writeFileSync('public/og-image.png', png);
console.log('wrote public/og-image.png', png.length, 'bytes');

// ---- App icons: cream Cargo mark on a navy rounded square ----
const markRaw = fs.readFileSync('public/cargo-mark.svg', 'utf8');
const markInner = markRaw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function icon(size) {
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${NAVY_DEEP}"/></linearGradient>
      <filter id="cream"><feFlood flood-color="${CREAM}" result="c"/><feComposite in="c" in2="SourceGraphic" operator="in"/></filter>
    </defs>
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)"/>
    <g filter="url(#cream)"><svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="193 196 631 631">${markInner}</svg></g>
  </svg>`;
  const r = new Resvg(svgIcon, { fitTo: { mode: 'width', value: size } });
  return r.render().asPng();
}

for (const s of [192, 512, 180]) {
  const name = s === 180 ? 'apple-touch-icon.png' : `icon-${s}.png`;
  const buf = icon(s);
  fs.writeFileSync(`public/${name}`, buf);
  console.log('wrote public/' + name, buf.length, 'bytes');
}
