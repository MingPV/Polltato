import { browser } from "k6/browser";
import { check } from "k6";

export const options = {
  ext: {
    loadimpact: {
      projectID: 6362853,
      name: "Frontend Poll 5 Target Columbus",
      distribution: {
        columbus: { loadZone: "amazon:us:columbus", percent: 100 },
      },
    },
  },
  summaryTrendStats: ["avg", "min", "med", "max", "p(75)", "p(90)", "p(95)"],
  scenarios: {
    browser: {
      executor: "ramping-vus",
      exec: "browserTest",
      startVUs: 1,
      stages: [
        { duration: "60s", target: 5 }, // ramp up
        { duration: "60s", target: 5 }, // hold
        { duration: "60s", target: 0 }, // ramp down
      ],
      gracefulRampDown: "30s",
      gracefulStop: "60s",
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
  },
  thresholds: {
    checks: ["rate>=0.95"],
  },
};

const FRONTEND_URL =
  "http://3.101.106.150/poll/b218693a-7905-4071-927b-ab007112e9d6";

export async function browserTest() {
  const page = await browser.newPage();
  let successInLoad = false;
  try {
    // Navigate with increased timeout and safer waitUntil
    console.log(`Navigating to: ${FRONTEND_URL}`);
    await page.goto(FRONTEND_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Check for the heading
    const pollHeader = page.locator("h1");
    await pollHeader.waitFor({ state: "visible", timeout: 15000 });
    const headerText = await pollHeader.textContent();
    const isHeaderCorrect = headerText.includes(
      "Poll #b218693a-7905-4071-927b-ab007112e9d6",
    );

    // Check for the QR Code image and its display status (width > 0)
    const pollQRCode = page.locator('img[alt="Poll QR code"]');
    await pollQRCode.waitFor({ state: "visible", timeout: 15000 });

    // Evaluate naturalWidth in the browser context
    const imageWidth = await pollQRCode.evaluate((img) => img.naturalWidth);

    successInLoad = isHeaderCorrect && imageWidth > 0;
    if (!successInLoad) {
      console.warn(
        `Validation failed: Header: ${isHeaderCorrect}, ImgWidth: ${imageWidth}`,
      );
    }
  } catch (err) {
    console.error(`Browser test failed: ${err} | Message: ${err.message}`);
    successInLoad = false;
  } finally {
    await page.close();
  }

  check(successInLoad, {
    "The poll page is loaded and image is displayed": (val) => val === true,
  });
}
