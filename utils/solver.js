// utils/solver.js (ENHANCED: Generic DataDome Handler)
import axios from "axios";
import { CONFIG } from "../config.js";

export async function solveCaptcha(page) {
  if (!CONFIG.CAPTCHA_KEY) {
    console.log("No CAPTCHA key - trying passive wait...");
    await page.waitForTimeout(10000); // Let JS challenge auto-resolve
    return (await page.locator("main, .results").count()) > 0; // Check if resolved
  }

  // Detect type: reCAPTCHA or DataDome JS
  const hasRecaptcha =
    (await page
      .locator("#g-recaptcha, textarea[g-recaptcha-response]")
      .count()) > 0;
  if (hasRecaptcha) {
    // Your existing 2Captcha code here...
    const sitekey =
      (await page.locator("#g-recaptcha").getAttribute("data-sitekey")) ||
      (await page.locator("[data-dom]").getAttribute("data-dom"));
    const pageUrl = page.url();

    try {
      const res = await axios.get("http://2captcha.com/in.php", {
        params: {
          key: CONFIG.CAPTCHA_KEY,
          method: "userrecaptcha",
          googlekey: sitekey,
          pageurl: pageUrl,
        },
      });
      if (!res.data.includes("OK")) return false;
      const captchaId = res.data.split("|")[1];

      for (let i = 0; i < 30; i++) {
        // Poll longer
        await new Promise((r) => setTimeout(r, 5000));
        const result = await axios.get("http://2captcha.com/res.php", {
          params: { key: CONFIG.CAPTCHA_KEY, action: "get", id: captchaId },
        });
        if (result.data.includes("OK")) {
          const token = result.data.split("|")[1];
          await page.evaluate((t) => {
            const ta = document.querySelector("textarea#g-recaptcha-response");
            if (ta) ta.innerHTML = t;
            // Trigger submit if needed
            const submitBtn = document.querySelector(
              'button[type="submit"], .challenge-submit'
            );
            if (submitBtn) submitBtn.click();
          }, token);
          await page.waitForTimeout(3000);
          return true;
        }
      }
    } catch (e) {
      console.error("2Captcha failed:", e.message);
    }
    return false;
  } else {
    // Generic DataDome: Wait for auto-challenge or click "Continue"
    console.log("Non-reCAPTCHA challenge detected - waiting 15s + click...");
    await page.waitForTimeout(15000);
    try {
      await page.click(
        'button:visible:has-text("Continue"), .datadome-continue, [role="button"]',
        { timeout: 5000 }
      );
      await page.waitForTimeout(5000);
    } catch {} // Ignore if no button
    return (await page.locator("main, .results").count()) > 0;
  }
}
