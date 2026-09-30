import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch();
const results = [],
  errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  let products = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    nombre: `Producto ${String(i + 1).padStart(2, "0")}`,
    categoria: i % 2 ? "Accesorios" : "Papelería",
    precio: 1500,
    costo: 500,
    stock: 30,
  }));
  let events = [
    {
      id: 7,
      nombre: "Encuentro IAM",
      fecha: "2026-09-29",
      descripcion: "Ventas del encuentro",
      activo: true,
    },
  ];
  let sales = [70, 71].map((id) => ({
    id,
    fecha: "2026-09-29T15:30:00Z",
    total: 3000,
    ganancia: 2000,
    evento_id: 7,
    evento_nombre: "Encuentro IAM",
    metodoPago: "efectivo",
    efectivo: 3000,
    debe: false,
    detalles: [
      {
        id: id * 10,
        producto_id: 1,
        nombre: "Producto 01",
        cantidad: 2,
        subtotal: 3000,
        ganancia: 2000,
        costo: 500,
      },
    ],
  }));
  let loadError = false,
    saveError = false,
    failDeleteId = 0,
    postedSales = [];
  await page.route("**/api/**", async (r) => {
    const req = r.request(),
      path = new URL(req.url()).pathname,
      method = req.method();
    const reply = (json, status = 200) => r.fulfill({ status, json });
    if (method === "GET") {
      if (loadError) return reply({ error: "No disponible" }, 503);
      if (path === "/api/productos") return reply(products);
      if (path === "/api/eventos") return reply(events);
      if (path === "/api/ventas") return reply(sales);
      if (path.endsWith("/estadisticas"))
        return reply({
          totalVentas: 2,
          ingresosTotales: 6000,
          gananciaTotales: 4000,
          topProductos: [
            {
              producto_id: 1,
              nombre: "Producto 01",
              cantidad: 4,
              subtotal: 6000,
            },
          ],
        });
    }
    if (saveError) return reply({ error: "No se pudo guardar la prueba" }, 500);
    if (path === "/api/productos" && method === "POST") {
      products.push({
        id: 50,
        nombre: "Producto nuevo",
        categoria: "Accesorios",
        precio: 2500,
        costo: 1000,
        stock: 10,
      });
      return reply(products.at(-1), 201);
    }
    if (path.startsWith("/api/productos/") && method === "PUT") {
      const id = Number(path.split("/").at(-1));
      products = products.map((p) =>
        p.id === id ? { ...p, precio: 2500 } : p,
      );
      return reply(products.find((p) => p.id === id));
    }
    if (path === "/api/eventos" && method === "POST") {
      const e = { ...req.postDataJSON(), id: 8, activo: true };
      events.push(e);
      return reply(e, 201);
    }
    if (path.startsWith("/api/eventos/") && method === "PUT") {
      const id = Number(path.split("/").at(-1));
      events = events.map((e) =>
        e.id === id ? { ...e, ...req.postDataJSON() } : e,
      );
      return reply(events.find((e) => e.id === id));
    }
    if (path === "/api/ventas" && method === "POST") {
      postedSales.push(req.postDataJSON());
      return reply({ ok: true, ventaId: 100 }, 201);
    }
    if (path.startsWith("/api/ventas/") && method === "PUT") {
      const id = Number(path.split("/").at(-1));
      sales = sales.map((s) =>
        s.id === id ? { ...s, ...req.postDataJSON() } : s,
      );
      return reply(sales.find((s) => s.id === id));
    }
    if (path.startsWith("/api/ventas/") && method === "DELETE") {
      const id = Number(path.split("/").at(-1));
      if (id === failDeleteId)
        return reply({ error: "No se pudo eliminar" }, 500);
      sales = sales.filter((s) => s.id !== id);
      return reply({ ok: true });
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  });
  await page.goto("http://127.0.0.1:3000");
  for (let i = 1; i <= 12; i++)
    await page
      .getByRole("button", {
        name: `Agregar Producto ${String(i).padStart(2, "0")}`,
        exact: true,
      })
      .click();
  for (const size of [
    { width: 1366, height: 768 },
    { width: 1024, height: 600 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(100);
    const box = await page.locator(".checkout").boundingBox();
    assert.ok(
      box.y >= 0 && box.y + box.height <= size.height,
      `Checkout outside viewport ${JSON.stringify({ size, box })}`,
    );
    assert.ok(
      await page
        .locator(".order-scroll")
        .evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    await page
      .locator(".order-scroll")
      .evaluate((el) => (el.scrollTop = el.scrollHeight));
    for (const label of ["Efectivo", "Transferencia"]) {
      const payment = page
        .locator(".fixed-payment")
        .getByRole("button", { name: label, exact: true });
      const bounds = await payment.boundingBox();
      assert.ok(
        bounds.y >= 0 && bounds.y + bounds.height <= size.height,
        `Payment hidden: ${label}`,
      );
    }
    const after = await page.locator(".checkout").boundingBox();
    assert.ok(after.y + after.height <= size.height);
    results.push({ test: "checkout visible with 12 products", ...size });
  }
  await page.screenshot({
    path: "docs/all-pages-sales-desktop.png",
    fullPage: false,
  });
  await page.locator(".checkout").click();
  await page
    .getByRole("status")
    .filter({ hasText: "Venta registrada correctamente" })
    .waitFor();
  assert.equal(postedSales.length, 1);
  assert.equal(postedSales[0].items.length, 12);
  const routes = ["/productos", "/editar-productos", "/eventos", "/historial"];
  for (const route of routes) {
    await page.goto("http://127.0.0.1:3000" + route);
    await page.locator("h1").waitFor();
    if (route != "/productos")
      await page.locator(".record-list article").first().waitFor();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `overflow ${route} ${width}`,
      );
      if (width !== 320)
        await page.screenshot({
          path: `docs/all-pages-${route.slice(1)}-${width}.png`,
          fullPage: false,
        });
    }
    results.push({ test: "responsive page", route });
  }
  await page.goto("http://127.0.0.1:3000/productos");
  await page
    .getByLabel("Nombre del producto", { exact: true })
    .fill("Producto nuevo");
  await page.getByLabel("Precio de venta ($)", { exact: true }).fill("2500");
  await page.getByLabel("Costo ($)", { exact: true }).fill("1000");
  await page.getByLabel("Stock inicial", { exact: true }).fill("10");
  await page
    .getByRole("button", { name: "Guardar producto", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Producto agregado correctamente" })
    .waitFor();
  results.push({ test: "create product", pass: true });
  await page.goto("http://127.0.0.1:3000/editar-productos");
  const inventory = page.getByRole("article", {
    name: "Producto 01",
    exact: true,
  });
  await inventory.getByRole("button", { name: "Editar producto" }).click();
  await inventory
    .getByLabel("Precio de venta ($)", { exact: true })
    .fill("9000");
  await inventory
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  assert.ok((await inventory.innerText()).includes("1.500,00"));
  assert.ok(!(await inventory.innerText()).includes("9.000,00"));
  await inventory.getByRole("button", { name: "Editar producto" }).click();
  await inventory
    .getByLabel("Precio de venta ($)", { exact: true })
    .fill("2500");
  saveError = true;
  await inventory.getByRole("button", { name: "Guardar cambios" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "No se pudo guardar" })
    .waitFor();
  assert.equal(
    await inventory
      .getByLabel("Precio de venta ($)", { exact: true })
      .inputValue(),
    "2500",
  );
  saveError = false;
  await inventory.getByRole("button", { name: "Guardar cambios" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Cambios guardados" })
    .waitFor();
  results.push({
    test: "edit / cancel / failed save / retry product",
    pass: true,
  });
  await page.goto("http://127.0.0.1:3000/eventos");
  await page.getByRole("button", { name: "Crear evento", exact: true }).click();
  await page
    .getByLabel("Nombre del evento", { exact: true })
    .fill("Nuevo encuentro");
  await page.getByLabel("Fecha", { exact: true }).fill("2026-09-20");
  await page.getByRole("button", { name: "Guardar evento" }).click();
  await page.getByRole("status").filter({ hasText: "Evento creado" }).waitFor();
  const event = page.getByRole("article", {
    name: "Nuevo encuentro",
    exact: true,
  });
  await event.getByRole("button", { name: "Editar evento" }).click();
  await page
    .getByLabel("Nombre del evento", { exact: true })
    .fill("Encuentro editado");
  await page.getByRole("button", { name: "Guardar evento" }).click();
  const edited = page.getByRole("article", {
    name: "Encuentro editado",
    exact: true,
  });
  await edited.getByRole("button", { name: "Desactivar", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Evento desactivado" })
    .waitFor();
  await edited.getByRole("button", { name: "Ver resultados" }).click();
  await edited.getByText("Productos más vendidos", { exact: true }).waitFor();
  results.push({
    test: "event create / edit / deactivate / results",
    pass: true,
  });
  await page.goto("http://127.0.0.1:3000/historial");
  await page.getByRole("article", { name: "Venta 70", exact: true }).waitFor();
  const sale = page.getByRole("article", { name: "Venta 70", exact: true });
  await sale.getByRole("button", { name: "Editar cobro" }).click();
  await sale
    .getByLabel("Medio de pago", { exact: true })
    .selectOption("transferencia");
  await sale.getByLabel("El cliente queda debiendo").check();
  await sale.getByRole("button", { name: "Guardar cambios" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Datos de cobro actualizados" })
    .waitFor();
  assert.ok((await sale.innerText()).includes("Pago pendiente"));
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar Excel", exact: true })
    .click();
  assert.ok((await downloaded).suggestedFilename().endsWith(".xlsx"));
  await page.getByLabel("Seleccionar las 2 ventas visibles").check();
  failDeleteId = 71;
  await page
    .getByRole("button", { name: "Eliminar seleccionadas (2)" })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Las restantes siguen en el historial" })
    .waitFor();
  assert.equal(
    await page.getByRole("article", { name: "Venta 70", exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("article", { name: "Venta 71", exact: true }).count(),
    1,
  );
  results.push({
    test: "payment edit / Excel / partial failed deletion",
    pass: true,
  });
  loadError = true;
  await page.goto("http://127.0.0.1:3000/editar-productos");
  await page
    .getByRole("button", { name: "Volver a intentar", exact: true })
    .waitFor();
  loadError = false;
  await page
    .getByRole("button", { name: "Volver a intentar", exact: true })
    .click();
  await page.locator(".record-list article").first().waitFor();
  results.push({ test: "load error / retry", pass: true });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "docs/all-pages-checks.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
