import { chromium } from "@playwright/test";
import fs from "node:fs";
const label = process.argv[2] || "after";
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route("**/api/ventas", (r) =>
      r.request().method() === "POST" ? r.abort() : r.continue(),
    );
    for (let sample = 1; sample <= 3; sample++) {
      await page.goto("http://127.0.0.1:3000");
      await page.locator(".product-card").first().waitFor();
      await page.waitForFunction(
        () => performance.getEntriesByName("iam:productos-visibles").length,
      );
      results.push(
        await page.evaluate(
          ({ width, sample }) => ({
            width,
            sample,
            visibleMs: Math.round(
              performance.getEntriesByName("iam:productos-visibles").at(-1)
                .duration,
            ),
            api: performance
              .getEntriesByType("resource")
              .filter((e) => e.name.endsWith("/api/productos") && e.responseEnd)
              .map((e) => ({
                durationMs: Math.round(e.duration),
                ttfbMs: Math.round(e.responseStart - e.requestStart),
                server: e.serverTiming.map((t) => ({
                  name: t.name,
                  ms: t.duration,
                })),
              })),
          }),
          { width, sample },
        ),
      );
    }
    await page.close();
  }
  fs.writeFileSync(
    `docs/performance-${label}.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
