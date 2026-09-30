import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true });
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const results = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  // Only real reads. All writes below are intercepted, never sent to PostgreSQL.
  await page.route("**/api/ventas", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.goto(base);
  await page.locator(".product-card").first().waitFor({ timeout: 20000 });
  await page.waitForFunction(
    () => performance.getEntriesByName("iam:productos-visibles").length > 0,
  );
  results.push({
    test: "real product load",
    count: await page.locator(".product-card").count(),
    timing: await page.evaluate(() =>
      performance
        .getEntriesByName("iam:productos-visibles")
        .map((e) => Math.round(e.duration)),
    ),
  });
  await page.screenshot({ path: "docs/ventas-desktop.png", fullPage: true });
  for (const route of [
    "/productos",
    "/editar-productos",
    "/eventos",
    "/historial",
  ]) {
    await page.goto(base + route);
    await page.locator("h1").waitFor({ timeout: 20000 });
    results.push({
      test: "screen",
      route,
      heading: await page.locator("h1").innerText(),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Mobile overflow: ${route}`,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const productos = [
    {
      id: 1,
      nombre: "Mate y bombilla",
      categoria: "Accesorios",
      precio: 11000,
      costo: 5000,
      stock: 3,
      imagen: "missing.png",
    },
    {
      id: 2,
      nombre: "Sticker",
      categoria: "Papelería",
      precio: 500,
      costo: 200,
      stock: 10,
    },
    { id: 3, nombre: "Agotado", precio: 100, costo: 50, stock: 0 },
  ];
  let mode = "ok",
    posts = [],
    saleError = false;
  await page.unroute("**/api/ventas");
  await page.route("**/api/productos", (r) =>
    r.fulfill({
      status: mode === "error" ? 500 : 200,
      json: mode === "empty" ? [] : productos,
    }),
  );
  await page.route("**/api/eventos", (r) =>
    r.fulfill({
      json: [
        { id: 7, nombre: "Encuentro IAM", fecha: "2026-09-28", activo: true },
      ],
    }),
  );
  await page.route("**/api/ventas", async (r) => {
    assert.equal(r.request().method(), "POST");
    posts.push(r.request().postDataJSON());
    await new Promise((resolve) => setTimeout(resolve, 200));
    await r.fulfill({
      status: saleError ? 500 : 201,
      json: saleError
        ? { error: "Stock insuficiente" }
        : { ok: true, ventaId: 900 },
    });
  });
  await page.goto(base);
  const mate = page
    .locator(".product-card")
    .filter({ hasText: "Mate y bombilla" });
  await mate
    .getByRole("button", { name: "Agregar Mate y bombilla", exact: true })
    .click();
  await page.locator(".checkout").evaluate((el) => {
    el.click();
    el.click();
  });
  await page
    .getByRole("status")
    .filter({ hasText: "Venta registrada correctamente" })
    .waitFor();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].items[0].cantidad, 1);
  assert.equal(posts[0].total, 11000);
  assert.equal(posts[0].metodoPago, "efectivo");
  assert.equal(posts[0].evento_id, 7);
  results.push({ test: "two clicks / one POST / cash / event", pass: true });
  await mate
    .getByRole("button", { name: "Agregar Mate y bombilla", exact: true })
    .click();
  await mate
    .getByRole("button", { name: "Agregar Mate y bombilla", exact: true })
    .click();
  assert.equal(await page.locator(".order-items li").count(), 1);
  await page
    .getByLabel("Cantidad de Mate y bombilla", { exact: true })
    .fill("3");
  assert.equal(await mate.getByRole("button").isDisabled(), true);
  await page
    .getByLabel("Cantidad de Mate y bombilla", { exact: true })
    .fill("4");
  assert.equal(
    await page
      .getByLabel("Cantidad de Mate y bombilla", { exact: true })
      .inputValue(),
    "3",
  );
  await page.getByLabel("Recibido", { exact: false }).fill("40000");
  assert.match(await page.locator(".change-due").innerText(), /7.000/);
  await page
    .getByRole("button", { name: "Transferencia", exact: true })
    .click();
  await page.getByLabel("El cliente queda debiendo").check();
  await page.locator(".checkout").click();
  await page
    .getByRole("status")
    .filter({ hasText: "Venta registrada correctamente" })
    .waitFor();
  assert.equal(posts[1].items[0].cantidad, 3);
  assert.equal(posts[1].metodoPago, "transferencia");
  assert.equal(posts[1].debe, true);
  results.push({
    test: "merged quantities / stock limit / change / transfer / debt",
    pass: true,
  });
  saleError = true;
  await mate
    .getByRole("button", { name: "Agregar Mate y bombilla", exact: true })
    .click();
  await page.locator(".checkout").click();
  await page
    .getByRole("alert")
    .filter({ hasText: "No se pudo registrar" })
    .waitFor();
  assert.equal(await page.locator(".order-items li").count(), 1);
  results.push({ test: "failed sale preserves items", pass: true });
  mode = "error";
  await page.reload();
  await page.getByRole("button", { name: "Volver a intentar" }).waitFor();
  mode = "ok";
  await page.getByRole("button", { name: "Volver a intentar" }).click();
  await mate.waitFor();
  mode = "empty";
  await page.reload();
  await page.getByText("No hay productos cargados", { exact: true }).waitFor();
  mode = "ok";
  await page.reload();
  await page.getByRole("searchbox").fill("inexistente");
  await page.getByText("No encontramos ese producto").waitFor();
  results.push({ test: "load error / retry / empty / search", pass: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await mate
    .getByRole("button", { name: "Agregar Mate y bombilla", exact: true })
    .click();
  assert.equal(await page.locator(".mobile-order button").isVisible(), true);
  saleError = false;
  const before = posts.length;
  await page.locator(".mobile-order button").click();
  await page
    .getByRole("status")
    .filter({ hasText: "Venta registrada correctamente" })
    .waitFor();
  assert.equal(posts.length, before + 1);
  await page.screenshot({ path: "docs/ventas-mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page.reload();
  await mate.waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  results.push({
    test: "mobile two clicks / 390px and 320px no overflow",
    pass: true,
  });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "docs/browser-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
