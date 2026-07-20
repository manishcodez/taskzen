/**
 * Static verification of PWA assets (no DB writes).
 * npx tsx scripts/verify-pwa.ts
 */

import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const root = process.cwd();
  const icons = [
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/maskable-512.png",
  ];

  for (const relative of icons) {
    const path = join(root, relative);
    assert(existsSync(path), `Missing icon: ${relative}`);
    const size = statSync(path).size;
    assert(size > 500, `Icon too small (likely corrupt): ${relative} (${size} bytes)`);
    console.log(`PASS icon exists: ${relative} (${size} bytes)`);
  }

  const swPath = join(root, "public/sw.js");
  assert(existsSync(swPath), "Missing public/sw.js");
  const sw = readFileSync(swPath, "utf8");
  assert(sw.includes("/api/"), "SW should explicitly mention /api/ exclusion logic");
  assert(sw.includes("isApiRequest") || sw.includes("/api/"), "SW must skip API caching");
  assert(!/JWT_SECRET|DATABASE_URL|GOOGLE_CLIENT_SECRET|RESEND_API_KEY/.test(sw), "SW must not contain secrets");
  assert(sw.includes("/offline"), "SW should precache offline shell");
  console.log("PASS service worker present and privacy-safe");

  const manifestPath = join(root, "src/app/manifest.ts");
  assert(existsSync(manifestPath), "Missing src/app/manifest.ts");
  const manifestSrc = readFileSync(manifestPath, "utf8");
  assert(manifestSrc.includes('name: "Taskzen"') || manifestSrc.includes("name: APP_NAME"), "Manifest name");
  assert(manifestSrc.includes('display: "standalone"'), "Manifest display standalone");
  assert(manifestSrc.includes('start_url: "/"'), "Manifest start_url");
  assert(manifestSrc.includes("icon-192.png"), "Manifest 192 icon");
  assert(manifestSrc.includes("icon-512.png"), "Manifest 512 icon");
  assert(manifestSrc.includes("maskable"), "Manifest maskable icon");
  console.log("PASS manifest source valid");

  const offlinePage = join(root, "src/app/(public)/offline/page.tsx");
  assert(existsSync(offlinePage), "Missing offline page");
  const offlineSrc = readFileSync(offlinePage, "utf8");
  assert(offlineSrc.toLowerCase().includes("offline"), "Offline page content");
  assert(!offlineSrc.includes("saved successfully"), "Offline page must not claim data saved");
  console.log("PASS offline page present");

  const register = join(root, "src/components/pwa/pwa-register.tsx");
  assert(existsSync(register), "Missing PwaRegister");
  console.log("PASS SW registration component present");

  console.log("\nverify-pwa: ALL CHECKS PASSED");
}

main();
