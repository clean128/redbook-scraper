import { createObjectCsvWriter } from "csv-writer";
import PQueue from "p-queue";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CONFIG, buildQuery } from "./config.js";
import { launchStealthBrowser } from "./utils/browser.js";
import { getRotatingProxy } from "./utils/proxy.js";
import { solveCaptcha } from "./utils/solver.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const SEEN_FILE = path.join(DATA_DIR, "seen.txt");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });

const csvWriter = createObjectCsvWriter({
  path: CONFIG.OUTPUT_FILE,
  header: [
    { id: "title", title: "Title" },
    { id: "price", title: "Price" },
    { id: "year", title: "Year" },
    { id: "make", title: "Make" },
    { id: "model", title: "Model" },
    { id: "odometer", title: "Odometer" },
    { id: "engine", title: "Engine" },
    { id: "transmission", title: "Transmission" },
    { id: "fuel", title: "Fuel Type" },
    { id: "vin", title: "VIN" },
    { id: "url", title: "URL" },
  ],
  append: true,
});

const seenUrls = new Set(
  fs.existsSync(SEEN_FILE)
    ? fs.readFileSync(SEEN_FILE, "utf-8").split("\n").filter(Boolean)
    : []
);
let scrapedCount = 0;

async function scrapeDetail(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForLoadState("networkidle"); // Handle dynamic loads
    await page.waitForTimeout(3000 + Math.random() * 4000);

    if ((await page.locator("text=DataDome").count()) > 0) {
      logger.warn(`DataDome blocked: ${url}`);
      await solveCaptcha(page);
      await page.waitForTimeout(5000);
    }

    const data = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel)?.innerText?.trim() || "";
      return {
        title: get("h1") || get('[data-testid="vehicle-title"]'),
        price: get('[data-testid="price"]') || get(".price-value"),
        year: get('[data-testid="year"]') || get(".year-spec"),
        make: get('[data-testid="make"]') || get(".make-spec"),
        model: get('[data-testid="model"]') || get(".model-spec"),
        odometer: get('[data-testid="odometer"]') || get(".odometer-km"),
        engine: get('[data-testid="engine"]') || get(".engine-size"),
        transmission:
          get('[data-testid="transmission"]') || get(".transmission-type"),
        fuel: get('[data-testid="fuel"]') || get(".fuel-type"),
        vin: get('[data-testid="vin"]') || get(".vin-number"),
        url: window.location.href,
      };
    });

    if (data.title) {
      await csvWriter.writeRecords([data]);
      fs.appendFileSync(SEEN_FILE, url + "\n");
      scrapedCount++;
      logger.info(
        `Scraped ${scrapedCount}/${CONFIG.TARGET_LISTINGS}: ${data.title}`
      );
      return true;
    }
  } catch (err) {
    logger.error(`Failed ${url}: ${err.message}`);
  }
  return false;
}

async function scrapeResultsPage(page, baseUrl, currentPage = 1) {
  const url = `${baseUrl}&page=${currentPage}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForLoadState("networkidle"); // Wait for JS-loaded results

  if ((await page.locator("text=DataDome").count()) > 0) {
    await solveCaptcha(page);
    await page.waitForTimeout(5000);
  }

  // Extract listing URLs from results cards (updated selectors based on /results structure)
  const links = await page.$$eval(
    '.search-result-card a[href*="/cars/details/"], .listing-item a[href*="/cars/details/"]',
    (els) =>
      els.map((el) => el.href).filter((h) => h.includes("/cars/details/"))
  );

  // Check for next page
  const hasNext =
    (await page
      .locator('.pagination-next:not(.disabled), a[aria-label="Next"]')
      .count()) > 0;
  return { links: [...new Set(links)], hasNext };
}

async function main() {
  const queue = new PQueue({ concurrency: CONFIG.CONCURRENCY });

  for (const make of CONFIG.MAKES) {
    for (let i = 0; i < CONFIG.YEARS_START.length; i++) {
      const yearStart = CONFIG.YEARS_START[i];
      const yearEnd = CONFIG.YEARS_END[i];
      if (scrapedCount >= CONFIG.TARGET_LISTINGS) break;

      const q = buildQuery(make, yearStart, yearEnd);
      const baseUrl = `https://www.redbook.com.au/cars/results?q=${encodeURIComponent(
        q
      )}`;

      let currentPage = 1;
      while (scrapedCount < CONFIG.TARGET_LISTINGS) {
        const { context, browser } = await launchStealthBrowser(
          getRotatingProxy()
        );
        const page = await context.newPage();

        const { links, hasNext } = await scrapeResultsPage(
          page,
          baseUrl,
          currentPage
        );
        await context.close();
        await browser.close();

        for (const url of links) {
          if (seenUrls.has(url) || scrapedCount >= CONFIG.TARGET_LISTINGS)
            continue;
          seenUrls.add(url);

          queue.add(async () => {
            const { context, browser } = await launchStealthBrowser(
              getRotatingProxy()
            );
            const detailPage = await context.newPage();
            await scrapeDetail(detailPage, url);
            await context.close();
            await browser.close();
          });
        }

        if (!hasNext || links.length === 0) break;
        currentPage++;
        await new Promise((r) =>
          setTimeout(
            r,
            CONFIG.DELAY_MIN +
              Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN)
          )
        );
      }

      await new Promise((r) => setTimeout(r, 5000 + Math.random() * 5000)); // Delay between filters
    }
    if (scrapedCount >= CONFIG.TARGET_LISTINGS) break;
  }

  await queue.onIdle();
  logger.info(`Scraping complete! Total: ${scrapedCount}`);
}

main().catch((err) => logger.error("Fatal error:", err));
