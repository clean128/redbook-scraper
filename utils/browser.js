// utils/browser.js (ADD: Referer & Random UA)
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { CONFIG } from "../config.js";

chromium.use(StealthPlugin());

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

let browserCount = 0;

export async function launchStealthBrowser(proxyUrl = null) {
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const randomViewport = {
    width: 1366 + Math.floor(Math.random() * 200),
    height: 768 + Math.floor(Math.random() * 200),
  };

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--ignore-certificate-errors",
      `--user-agent=${randomUA}`,
    ],
    proxy: proxyUrl ? { server: proxyUrl } : undefined,
  });

  const context = await browser.newContext({
    viewport: randomViewport,
    userAgent: randomUA,
    locale: "en-US",
    javaScriptEnabled: true,
    bypassCSP: true,
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/", // Spoof referer
    },
  });

  // Route to abort heavy resources (but not during test - comment if needed)
  // await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot,mp4,webm}', route => route.abort());

  await context.addInitScript(() => {
    // Enhanced stealth
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    window.chrome = { runtime: {} };
  });

  console.log(
    `Stealth browser launched #${++browserCount} (UA: ${randomUA.substring(
      0,
      50
    )}...)`
  );
  return { browser, context };
}
