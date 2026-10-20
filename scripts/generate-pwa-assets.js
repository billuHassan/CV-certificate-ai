import fs from "fs";
import path from "path";
import zlib from "zlib";

const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#2dd4bf" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bg-grad)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#6366f1" stroke-width="4" stroke-opacity="0.3" />

  <!-- Shield Core -->
  <g transform="translate(48, 32)">
    <path
      d="M208 40 L352 92 V208 C352 292 288 356 208 388 C128 356 64 292 64 208 V92 Z"
      fill="#1e1b4b"
      fill-opacity="0.7"
      stroke="url(#shield-grad)"
      stroke-width="14"
      filter="url(#glow)"
    />

    <!-- Stylized R / Career Trajectory -->
    <path
      d="M144 120 H216 C242 120 264 136 264 162 C264 188 242 204 216 204 H144 V120 Z"
      stroke="#38bdf8"
      stroke-width="22"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M144 120 V290"
      stroke="#818cf8"
      stroke-width="22"
      stroke-linecap="round"
    />
    <path
      d="M204 204 L288 290"
      stroke="#2dd4bf"
      stroke-width="24"
      stroke-linecap="round"
    />

    <!-- Upward Spark Star -->
    <path
      d="M290 100 L300 130 L330 140 L300 150 L290 180 L280 150 L250 140 L280 130 Z"
      fill="#38bdf8"
    />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, "icon.svg"), svgContent);
console.log("Wrote public/icon.svg");

// 2. High-fidelity Programmatic PNG Generator
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function renderCVCraftPng(size, isMaskable = false) {
  const rowBytes = size * 4;
  const rawData = Buffer.alloc(size * (rowBytes + 1));
  let offset = 0;

  const cx = size / 2;
  const cy = size / 2;
  const scale = isMaskable ? 0.72 : 0.88;
  const rCorner = size * 0.22;

  for (let y = 0; y < size; y++) {
    rawData[offset++] = 0; // Filter 0
    for (let x = 0; x < size; x++) {
      let r = 15;
      let g = 23;
      let b = 42; // #0f172a slate-900
      let a = 255;

      // Gradient background
      const gradY = y / size;
      const gradX = x / size;
      r = Math.round(15 + gradY * 15 + gradX * 5);
      g = Math.round(23 + gradY * 10 + gradX * 10);
      b = Math.round(42 + gradY * 35 + gradX * 25);

      if (!isMaskable) {
        // Rounded squircle cutout
        const dx = Math.max(Math.abs(x - cx) - (cx - rCorner), 0);
        const dy = Math.max(Math.abs(y - cy) - (cy - rCorner), 0);
        const distToCorner = Math.sqrt(dx * dx + dy * dy);
        if (distToCorner > rCorner) {
          a = 0; // transparent outside rounded corner
        }
      }

      if (a > 0) {
        // Draw Shield & R icon scaled to center
        const nx = (x - cx) / (cx * scale); // -1 to 1
        const ny = (y - cy) / (cy * scale); // -1 to 1

        // Shield boundary check
        // Top: ny between -0.8 and 0.1
        // Bottom curve: ny between 0.1 and 0.85 with narrowing |nx|
        const inShieldTop = ny >= -0.75 && ny <= 0.1 && Math.abs(nx) <= 0.65;
        const widthAtNy = 0.65 * (1 - Math.pow(Math.max(0, (ny - 0.1) / 0.75), 1.6));
        const inShieldBottom = ny > 0.1 && ny <= 0.85 && Math.abs(nx) <= widthAtNy;

        if (inShieldTop || inShieldBottom) {
          // Shield body glow
          r = Math.round(30 + nx * 20);
          g = Math.round(27 + ny * 20);
          b = Math.round(75 + ny * 40);

          // Shield Border
          const borderDist = Math.abs(Math.abs(nx) - (ny <= 0.1 ? 0.65 : widthAtNy));
          if (borderDist < 0.08 || Math.abs(ny - (-0.75 + Math.abs(nx) * 0.15)) < 0.06) {
            // Teal/Indigo glow border
            r = 99;
            g = 102;
            b = 241; // indigo-500
            if (nx > 0) {
              r = 45;
              g = 212;
              b = 191; // teal-400
            }
          }

          // Draw "R" spine
          if (nx >= -0.32 && nx <= -0.18 && ny >= -0.45 && ny <= 0.5) {
            r = 129;
            g = 140;
            b = 248; // indigo-400
          }

          // Draw "R" loop
          const inLoopOuter = nx >= -0.32 && nx <= 0.28 && ny >= -0.45 && ny <= 0.05;
          const inLoopInner = nx >= -0.16 && nx <= 0.12 && ny >= -0.32 && ny <= -0.08;
          if (inLoopOuter && !inLoopInner) {
            r = 56;
            g = 189;
            b = 248; // sky-400
          }

          // Draw "R" leg (diagonal)
          const legSlope = (ny - (-0.02)) / 0.45;
          const legNx = -0.05 + legSlope * 0.32;
          if (ny >= 0.0 && ny <= 0.48 && Math.abs(nx - legNx) <= 0.09) {
            r = 45;
            g = 212;
            b = 191; // teal-400
          }

          // Spark Star (top-right of shield)
          const starDx = Math.abs(nx - 0.38);
          const starDy = Math.abs(ny - (-0.52));
          if ((starDx < 0.08 && starDy < 0.025) || (starDy < 0.08 && starDx < 0.025)) {
            r = 250;
            g = 250;
            b = 255;
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk("IHDR", ihdrData);
  const idat = makeChunk("IDAT", idatData);
  const iend = makeChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Write the required PWA assets
fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), renderCVCraftPng(192, false));
console.log("Wrote public/pwa-192x192.png");

fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), renderCVCraftPng(512, false));
console.log("Wrote public/pwa-512x512.png");

fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), renderCVCraftPng(512, true));
console.log("Wrote public/pwa-maskable-512x512.png");

fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), renderCVCraftPng(180, false));
console.log("Wrote public/apple-touch-icon.png");

// Also create a 32x32 favicon.ico (valid PNG inside or direct PNG)
fs.writeFileSync(path.join(publicDir, "favicon.ico"), renderCVCraftPng(32, false));
console.log("Wrote public/favicon.ico");
