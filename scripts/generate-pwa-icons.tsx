/**
 * Generates PWA PNG icons from the Zenith Ribbon mark (same geometry as icon.tsx).
 * Run: npx tsx scripts/generate-pwa-icons.tsx
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import React from "react";
import { ImageResponse } from "next/og";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

const RIBBON = (
  <svg width="100%" height="100%" viewBox="0 0 44 44" fill="none">
    <rect x="2" y="2" width="40" height="40" rx="12" fill="#2A3444" />
    <path
      d="M10 31.2C10 29.57 11.32 28.25 12.95 28.25H22.1C23.05 28.25 23.93 27.79 24.48 27L28.85 20.7C29.4 19.91 30.28 19.45 31.23 19.45H32.55C34.18 19.45 35.5 20.77 35.5 22.4C35.5 24.03 34.18 25.35 32.55 25.35H31.7C30.75 25.35 29.87 25.81 29.32 26.6L24.95 32.9C24.4 33.69 23.52 34.15 22.57 34.15H12.95C11.32 34.15 10 32.83 10 31.2Z"
      fill="#8EB4FF"
    />
    <path
      d="M12.5 23.85C12.5 22.36 13.71 21.15 15.2 21.15H23.35C24.22 21.15 25.03 20.73 25.55 20.01L28.95 15.25C29.47 14.53 30.28 14.1 31.15 14.1H32.1C33.59 14.1 34.8 15.31 34.8 16.8C34.8 18.29 33.59 19.5 32.1 19.5H31.4C30.53 19.5 29.72 19.92 29.2 20.64L25.8 25.4C25.28 26.12 24.47 26.55 23.6 26.55H15.2C13.71 26.55 12.5 25.34 12.5 23.85Z"
      fill="#6E93B8"
    />
    <path
      d="M15.2 16.55C15.2 15.22 16.27 14.15 17.6 14.15H24.55C25.34 14.15 26.07 13.77 26.54 13.12L28.55 10.35C29.02 9.7 29.75 9.32 30.54 9.32H31.2C32.53 9.32 33.6 10.39 33.6 11.72C33.6 13.05 32.53 14.12 31.2 14.12H30.75C29.96 14.12 29.23 14.5 28.76 15.15L26.75 17.92C26.28 18.57 25.55 18.95 24.76 18.95H17.6C16.27 18.95 15.2 17.88 15.2 16.55Z"
      fill="#5A7FA8"
    />
    <circle cx="33.15" cy="11.1" r="3.45" fill="#E08A67" />
  </svg>
);

function iconElement(size: number, maskable: boolean) {
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.12);
  const mark = size - pad * 2;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#171B26",
      }}
    >
      <div
        style={{
          width: mark,
          height: mark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(mark * 0.22),
          overflow: "hidden",
        }}
      >
        {RIBBON}
      </div>
    </div>
  );
}

async function writeIcon(filename: string, size: number, maskable: boolean) {
  const response = new ImageResponse(iconElement(size, maskable), {
    width: size,
    height: size,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(join(outDir, filename), buffer);
  console.log(`Wrote ${filename} (${buffer.length} bytes)`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  await writeIcon("icon-192.png", 192, false);
  await writeIcon("icon-512.png", 512, false);
  await writeIcon("maskable-512.png", 512, true);
  console.log("PWA icons generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
