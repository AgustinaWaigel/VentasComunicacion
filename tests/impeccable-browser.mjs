import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch();
const result = [];
try {
  const page = await browser.newPage();
  const products = [
    {
      id: 1,
      nombre:
        "Señalador de Comunicación IAM con un nombre especialmente largo para comprobar lectura",
      categoria: "Papelería",
      precio: 11000,
      costo: 2000,
      stock: 3,
      imagen: "missing.png",
    },
    { id: 2, nombre: "Llavero", precio: 1500, costo: 500, stock: 4 },
  ];
  let delay = 0,
    posts = [],
    fail = false;
  await page.route("**/api/productos", async (r) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    await r.fulfill({ json: products });
  });
  await page.route("**/api/eventos", (r) =>
    r.fulfill({
      json: [
        { id: 7, nombre: "Encuentro IAM", activo: true, fecha: "2026-09-28" },
      ],
    }),
  );
  await page.route("**/api/ventas", async (r) => {
    posts.push(r.request().postDataJSON());
    await r.fulfill({ status: fail ? 500 : 201, json: { ok: !fail } });
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:3000");
    await page.locator(".product-card").first().waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.getByRole("searchbox").fill("senalador");
    assert.equal(await page.locator(".product-card").count(), 1);
    await page.getByRole("button", { name: "Borrar búsqueda" }).click();
    assert.equal(
      await page
        .getByRole("searchbox")
        .evaluate((e) => document.activeElement === e),
      true,
    );
    await page
      .getByRole("button", { name: "Agregar Llavero", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".order-items li").count(), 1);
    if (width < 850) {
      const box = await page.locator("#evento").boundingBox();
      assert.ok(box.y < 450);
      await page
        .getByLabel("Medio de pago móvil")
        .selectOption("transferencia");
      assert.equal(
        await page
          .getByRole("button", { name: "Transferencia", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      if (width === 390)
        await page.screenshot({
          path: "docs/impeccable-mobile-sale.png",
          fullPage: false,
        });
    } else {
      await page.screenshot({
        path: "docs/impeccable-desktop-sale.png",
        fullPage: false,
      });
    }
    delay = 700;
    await page
      .locator(width < 850 ? ".mobile-order button" : ".checkout")
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Venta registrada correctamente" })
      .waitFor();
    assert.equal(
      await page.locator(".product-card").count(),
      2,
      "Refresh must preserve visible products",
    );
    await page.locator(".stock-update").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Cerrar aviso" }).click();
    delay = 0;
    result.push({
      width,
      overflow: false,
      keyboard: true,
      accentSearch: true,
      refreshPreservesProducts: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page
    .getByRole("button", { name: "Agregar Llavero", exact: true })
    .click();
  fail = true;
  await page.locator(".mobile-order button").click();
  const alert = page.getByRole("alert");
  await alert.waitFor();
  const rect = await alert.boundingBox();
  assert.ok(rect.y >= 0 && rect.y + rect.height < 844);
  assert.equal(await page.locator(".order-items li").count(), 1);
  result.push({
    mobileSaleErrorVisible: true,
    retainsSale: true,
    posts: posts.length,
  });
  const contrast = await page.evaluate(() => {
    const lum = (rgb) =>
      rgb
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const parse = (x) =>
      x
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
    return [
      ".product-info h3",
      ".product-price",
      ".availability",
      ".product-category",
      ".search-box input",
    ].map((selector) => {
      const el = document.querySelector(selector),
        cs = getComputedStyle(el);
      let bgEl = el,
        bg;
      do {
        bg = getComputedStyle(bgEl).backgroundColor;
        bgEl = bgEl.parentElement;
      } while (bg === "rgba(0, 0, 0, 0)" && bgEl);
      const fg = selector.includes("input")
        ? getComputedStyle(el, "::placeholder").color
        : cs.color;
      const a = lum(parse(fg)),
        b = lum(parse(bg));
      return {
        selector,
        ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2),
      };
    });
  });
  assert.ok(contrast.every((x) => x.ratio >= 4.5));
  result.push({ contrast });
  fs.writeFileSync(
    "docs/impeccable-checks.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
