// Renders the Sight Words PWA icons with headless Chromium (Playwright).
// Usage: npm run build:icons

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const OUT = path.join(ROOT, 'icons');
const FONT = fs.readFileSync(path.join(ROOT, 'fonts', 'andika-700.woff2')).toString('base64');

// scale: share of the canvas the flashcard occupies. Maskable icons keep it inside the central 80% safe zone.
const ICONS = [
  { file: 'apple-touch-icon.png', size: 180, scale: 0.74 },
  { file: 'icon-192.png', size: 192, scale: 0.74, rounded: true },
  { file: 'icon-512.png', size: 512, scale: 0.74, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.6 },
];

const html = ({ size, scale, rounded }) => {
  const w = size * scale;
  const h = w * 0.72;
  return `<!doctype html><html><head><style>
  @font-face { font-family: A; src: url(data:font/woff2;base64,${FONT}); font-weight: 700; }
  </style></head><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;border-radius:${rounded ? size * 0.22 : 0}px;
  background:linear-gradient(160deg,#3b82f6,#1d4ed8);display:grid;place-items:center;position:relative;overflow:hidden">
  <div style="position:absolute;width:${w}px;height:${h}px;background:#fde68a;border-radius:${w * 0.1}px;transform:rotate(-8deg) translate(-${w * 0.04}px,${w * 0.02}px)"></div>
  <div style="position:relative;width:${w}px;height:${h}px;background:#fff;border-radius:${w * 0.1}px;transform:rotate(4deg);
    box-shadow:0 ${size * 0.015}px ${size * 0.04}px rgba(0,0,0,.25);display:grid;place-items:center">
    <span style="font:700 ${h * 0.56}px/1 A;color:#1e293b">the</span>
    <span style="position:absolute;right:${-w * 0.08}px;top:${-w * 0.12}px;font-size:${w * 0.3}px;line-height:1">⭐</span>
  </div>
</div></body></html>`;
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(html(icon));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, icon.file), omitBackground: !!icon.rounded });
  console.log(`wrote icons/${icon.file}`);
}
await browser.close();
