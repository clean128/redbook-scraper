// test-query.js (FIXED: Handles DataDome Hang)
import { launchStealthBrowser } from "./utils/browser.js";
import { getRotatingProxy } from "./utils/proxy.js";
import { solveCaptcha } from "./utils/solver.js";
import { buildQuery } from "./config.js";

(async () => {
  const q = buildQuery("Ford", 2022);
  const url = `https://www.redbook.com.au/cars/results?q=${encodeURIComponent(
    q
  )}`;

  console.log("Launching stealth browser...");
  const { context, browser } = await launchStealthBrowser(getRotatingProxy());

  try {
    const page = await context.newPage();

    console.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120000, // Increased to 2min for DataDome
    });

    // IMMEDIATE DataDome check & solve (before any waits)
    const isDataDome =
      (await page
        .locator('text=DataDome, [id*="datadome"], .datadome-challenge')
        .count()) > 0 ||
      (await page.locator("title").innerText()) === "DataDome"; // Adjust title check if needed
    if (isDataDome) {
      console.log("DataDome detected early! Solving...");
      const solved = await solveCaptcha(page);
      if (solved) {
        console.log("CAPTCHA solved, refreshing...");
        await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
      } else {
        console.log(
          "CAPTCHA solve failed - using free proxy or manual next time."
        );
      }
    }

    // Now wait for results (with timeout & fallback)
    try {
      await page.waitForSelector(
        '.search-result-card, .listing-item, [data-testid="results"], main',
        {
          timeout: 30000,
          state: "visible",
        }
      );
      console.log("Results container loaded!");
    } catch (waitErr) {
      console.log(
        "Results wait failed (likely still blocked):",
        waitErr.message
      );
      // Fallback: Extract any visible text for debug
      const bodyText = await page.textContent("body");
      console.log("Page snippet:", bodyText.substring(0, 500) + "...");
    }

    // Screenshot (with extended timeout)
    const screenshotPath = "test-results.png";
    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: true, // Full page to capture interstitial
        timeout: 30000,
      });
      console.log(
        `Screenshot saved: ${screenshotPath} (check for DataDome page)`
      );
    } catch (screenshotErr) {
      console.warn(
        "Screenshot timeout - page might be frozen:",
        screenshotErr.message
      );
    }

    // Extract basics
    const title = await page.title();
    const listingCount = await page
      .locator('.search-result-card, .listing-item, a[href*="/details/"]')
      .count();
    console.log(`Page Title: ${title}`);
    console.log(`Detected Listings: ${listingCount}`);

    // Debug: Save HTML snippet if needed
    const htmlSnippet = await page.content().then((c) => c.substring(0, 2000));
    console.log("HTML start:", htmlSnippet);
  } catch (err) {
    console.error("Fatal error details:", err.name, err.message);
    console.error("Full stack:", err.stack);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
