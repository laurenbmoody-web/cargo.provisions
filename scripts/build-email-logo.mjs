// Generates public/email-logo.png — the cream Cargo lockup on transparent,
// sized for the branded magic-link email header (displayed on a navy band).
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const CREAM = '#F0EDE8';
const RUST = '#E8915A';
const W = 720;
const H = 210;

const jakarta = fs.readFileSync('/tmp/ogfonts/PlusJakartaSans.ttf');
const logoRaw = fs.readFileSync('public/Centered_Logo.svg', 'utf8');
const logoInner = logoRaw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const lockupW = 380;
const scale = lockupW / 1536;
const lockupX = (W - lockupW) / 2;
const lockupY = 36;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="cream"><feFlood flood-color="${CREAM}" result="c"/><feComposite in="c" in2="SourceGraphic" operator="in"/></filter>
  </defs>
  <g filter="url(#cream)" transform="translate(${lockupX} ${lockupY}) scale(${scale})">${logoInner}</g>
  <text x="${W / 2}" y="178" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="700" font-size="34" letter-spacing="11" fill="${RUST}">PROVISIONS</text>
</svg>`;

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: { fontBuffers: [jakarta], defaultFontFamily: 'Plus Jakarta Sans', loadSystemFonts: false },
}).render().asPng();
fs.writeFileSync('public/email-logo.png', png);
console.log('wrote public/email-logo.png', png.length, 'bytes');
