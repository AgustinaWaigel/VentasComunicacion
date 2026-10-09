export interface VentaExportable {
  id: number;
  fecha: string;
  total: number;
  metodoPago?: string;
  debe?: boolean;
  evento_nombre?: string;
  detalles: {
    producto_id: number;
    nombre: string;
    cantidad: number;
    subtotal: number;
    ganancia: number;
    costo: number;
  }[];
}

type Celda = string | number | null;
const PESOS = '"$" #,##0.00';
const PORCENTAJE = "0.0%";
const porNombre = (a: string, b: string) =>
  a.localeCompare(b, "es", { sensitivity: "base", numeric: true });

// Libro con tres hojas: Resumen, Por producto (para repartir costos) y Detalle.
// El costo es el del día de la venta: sale de la ganancia que quedó guardada
// (subtotal − ganancia), no del costo que el producto tiene hoy.
export async function exportarVentas(
  titulo: string,
  ventas: VentaExportable[],
) {
  if (!ventas.length) return;
  const XLSX = await import("xlsx");

  const hoja = (
    filas: Celda[][],
    anchos: number[],
    formatos: Record<number, string> = {},
  ) => {
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws["!cols"] = anchos.map((wch) => ({ wch }));
    filas.forEach((fila, r) =>
      fila.forEach((valor, c) => {
        const celda = ws[XLSX.utils.encode_cell({ r, c })];
        if (celda && typeof valor === "number" && formatos[c])
          celda.z = formatos[c];
      }),
    );
    return ws;
  };

  const ordenadas = [...ventas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );
  const fechaDe = (v: VentaExportable) =>
    new Date(v.fecha).toLocaleDateString("es-AR");

  // Detalle: una fila por producto vendido, con su costo y su ganancia.
  const detalle: Celda[][] = [
    [
      "N° venta",
      "Fecha",
      "Hora",
      "Evento",
      "Producto",
      "Cantidad",
      "Precio unitario",
      "Subtotal",
      "Costo unitario",
      "Costo total",
      "Ganancia",
      "Forma de pago",
      "Estado",
    ],
  ];
  const productos = new Map<
    number,
    {
      nombre: string;
      cantidad: number;
      ingresos: number;
      costo: number;
      costoActual: number;
    }
  >();
  let unidades = 0,
    ingresos = 0,
    costoTotal = 0,
    efectivo = 0,
    transferencia = 0,
    pendiente = 0;

  for (const v of ordenadas) {
    const pago = v.metodoPago === "transferencia" ? "Transferencia" : "Efectivo";
    if (pago === "Transferencia") transferencia += v.total;
    else efectivo += v.total;
    if (v.debe) pendiente += v.total;
    for (const d of v.detalles) {
      const costo = d.subtotal - d.ganancia;
      detalle.push([
        v.id,
        fechaDe(v),
        new Date(v.fecha).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        v.evento_nombre || "Venta general",
        d.nombre,
        d.cantidad,
        d.cantidad ? d.subtotal / d.cantidad : 0,
        d.subtotal,
        d.cantidad ? costo / d.cantidad : 0,
        costo,
        d.ganancia,
        pago,
        v.debe ? "Debe" : "Pagado",
      ]);
      const p = productos.get(d.producto_id) ?? {
        nombre: d.nombre,
        cantidad: 0,
        ingresos: 0,
        costo: 0,
        costoActual: d.costo,
      };
      p.cantidad += d.cantidad;
      p.ingresos += d.subtotal;
      p.costo += costo;
      productos.set(d.producto_id, p);
      unidades += d.cantidad;
      ingresos += d.subtotal;
      costoTotal += costo;
    }
  }
  const ultimaFila = detalle.length;
  detalle.push([
    "TOTAL",
    null,
    null,
    null,
    null,
    unidades,
    null,
    ingresos,
    null,
    costoTotal,
    ingresos - costoTotal,
    null,
    null,
  ]);
  const wsDetalle = hoja(
    detalle,
    [10, 12, 8, 30, 34, 10, 16, 14, 16, 14, 14, 16, 10],
    { 6: PESOS, 7: PESOS, 8: PESOS, 9: PESOS, 10: PESOS },
  );
  wsDetalle["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: ultimaFila - 1, c: 12 },
    }),
  };

  // Por producto: cuánto se vendió, cuánto costó y cuánto dejó cada uno.
  const porProducto: Celda[][] = [
    [
      "Producto",
      "Unidades vendidas",
      "Costo unitario (día de la venta)",
      "Costo total",
      "Ingresos",
      "Ganancia",
      "Margen sobre la venta",
      "Costo unitario cargado hoy",
      "Observación",
    ],
    ...[...productos.values()]
      .sort((a, b) => porNombre(a.nombre, b.nombre))
      .map((p): Celda[] => {
        const unitario = p.cantidad ? p.costo / p.cantidad : 0;
        return [
          p.nombre,
          p.cantidad,
          unitario,
          p.costo,
          p.ingresos,
          p.ingresos - p.costo,
          p.ingresos ? (p.ingresos - p.costo) / p.ingresos : 0,
          p.costoActual,
          Math.abs(unitario - p.costoActual) > 0.005
            ? "El costo cambió después de estas ventas"
            : null,
        ];
      }),
    [
      "TOTAL",
      unidades,
      null,
      costoTotal,
      ingresos,
      ingresos - costoTotal,
      ingresos ? (ingresos - costoTotal) / ingresos : 0,
      null,
      null,
    ],
  ];
  const wsProductos = hoja(porProducto, [36, 18, 30, 16, 16, 16, 22, 26, 38], {
    2: PESOS,
    3: PESOS,
    4: PESOS,
    5: PESOS,
    6: PORCENTAJE,
    7: PESOS,
  });

  const desde = fechaDe(ordenadas[0]),
    hasta = fechaDe(ordenadas[ordenadas.length - 1]);
  const resumen: Celda[][] = [
    ["Ventas — Comunicación IAM Paraná", null],
    [titulo, null],
    ["Período", desde === hasta ? desde : `${desde} al ${hasta}`],
    ["Exportado el", new Date().toLocaleString("es-AR")],
    [],
    ["Ventas registradas", ordenadas.length],
    ["Unidades vendidas", unidades],
    [],
    ["Ingresos", ingresos],
    ["Costo de lo vendido (al día de cada venta)", costoTotal],
    ["Ganancia", ingresos - costoTotal],
    [],
    ["Cobrado en efectivo", efectivo],
    ["Cobrado por transferencia", transferencia],
    ["Pendiente de cobro (ventas marcadas como deuda)", pendiente],
  ];
  const wsResumen = hoja(resumen, [48, 24]);
  // Las dos primeras cifras del resumen son cantidades; el resto, pesos.
  resumen.forEach((fila, r) => {
    const celda = wsResumen[XLSX.utils.encode_cell({ r, c: 1 })];
    if (celda && typeof fila[1] === "number" && r > 6) celda.z = PESOS;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
  XLSX.utils.book_append_sheet(wb, wsProductos, "Por producto");
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");
  const archivo = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  XLSX.writeFile(
    wb,
    `ventas_${archivo || "todas"}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
