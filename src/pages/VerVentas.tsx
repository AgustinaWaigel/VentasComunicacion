import { useEffect, useRef, useState } from "react";
import {
  PageHeader,
  Feedback,
  ListState,
  money,
  dateLabel,
  searchText,
} from "../components/AdminUI";
import { useApiList, requestJson, errorMessage } from "../hooks/useApiList";
interface DetalleVenta {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  subtotal: number;
  ganancia: number;
  nombre: string;
  costo: number;
}
interface Venta {
  id: number;
  fecha: string;
  total: number;
  ganancia: number;
  detalles: DetalleVenta[];
  metodoPago?: string;
  efectivo?: number;
  debe?: boolean;
  evento_id?: number;
  evento_nombre?: string;
  evento_fecha?: string;
}
interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  activo: boolean;
}
export default function VerVentas() {
  const {
    data: ventas,
    setData: setVentas,
    loading,
    error,
    reload,
  } = useApiList<Venta>("/api/ventas");
  const eventosApi = useApiList<Evento>("/api/eventos");
  const [filtroNombre, setFiltroNombre] = useState(""),
    [filtroEvento, setFiltroEvento] = useState("");
  const initialEvent = useRef(false);
  useEffect(() => {
    if (!eventosApi.loading && !initialEvent.current) {
      initialEvent.current = true;
      if (eventosApi.data.length) {
        const latest = eventosApi.data.reduce((a, b) =>
          new Date(a.fecha) > new Date(b.fecha) ? a : b,
        );
        setFiltroEvento(String(latest.id));
      }
    }
  }, [eventosApi.loading, eventosApi.data]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState<Venta | null>(null),
    [saving, setSaving] = useState(false),
    [exporting, setExporting] = useState(false);
  const [mensaje, setMensaje] = useState(""),
    [actionError, setActionError] = useState("");
  const busy = useRef(false);
  const ventasFiltradas = ventas.filter(
    (v) =>
      (!filtroNombre ||
        v.detalles.some((d) =>
          searchText(d.nombre).includes(searchText(filtroNombre)),
        )) &&
      (!filtroEvento ||
        (filtroEvento === "general"
          ? !v.evento_id
          : String(v.evento_id) === filtroEvento)),
  );
  const total = ventasFiltradas.reduce((s, v) => s + v.total, 0),
    ganancia = ventasFiltradas.reduce((s, v) => s + v.ganancia, 0);
  const cash = ventasFiltradas.reduce(
    (s, v) => s + (v.metodoPago === "transferencia" ? 0 : v.total),
    0,
  );
  const groups = Array.from(
    new Set(ventasFiltradas.map((v) => v.evento_id || 0)),
  ).map((id) => ({
    id,
    name:
      ventasFiltradas.find((v) => (v.evento_id || 0) === id)?.evento_nombre ||
      "Venta general",
    items: ventasFiltradas.filter((v) => (v.evento_id || 0) === id),
  }));
  const selectAll = () =>
    setSelected(
      selected.size === ventasFiltradas.length
        ? new Set()
        : new Set(ventasFiltradas.map((v) => v.id)),
    );
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy.current) return;
    busy.current = true;
    setSaving(true);
    setActionError("");
    setMensaje("");
    try {
      const result = await requestJson<Partial<Venta>>(
        `/api/ventas/${draft.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metodoPago: draft.metodoPago,
            efectivo: draft.efectivo || 0,
            debe: !!draft.debe,
          }),
        },
      );
      setVentas((prev) =>
        prev.map((v) =>
          v.id === draft.id
            ? {
                ...v,
                metodoPago: result.metodoPago ?? draft.metodoPago,
                efectivo: result.efectivo ?? draft.efectivo,
                debe: result.debe ?? draft.debe,
              }
            : v,
        ),
      );
      setDraft(null);
      setMensaje("Datos de cobro actualizados.");
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const remove = async (ids: number[]) => {
    if (
      busy.current ||
      !ids.length ||
      !confirm(
        `¿Eliminar ${ids.length === 1 ? "esta venta" : `${ids.length} ventas`}? Se devolverán las unidades al stock.`,
      )
    )
      return;
    busy.current = true;
    setSaving(true);
    setActionError("");
    setMensaje("");
    const deleted: number[] = [];
    try {
      for (const id of ids) {
        await requestJson(`/api/ventas/${id}`, { method: "DELETE" });
        deleted.push(id);
      }
      setMensaje(
        `${deleted.length} ${deleted.length === 1 ? "venta eliminada" : "ventas eliminadas"}.`,
      );
    } catch (e) {
      setActionError(
        `${deleted.length ? `Se eliminaron ${deleted.length} ventas. ` : ""}${errorMessage(e)} Las restantes siguen en el historial.`,
      );
    } finally {
      setVentas((prev) => prev.filter((v) => !deleted.includes(v.id)));
      setSelected(
        (prev) => new Set([...prev].filter((id) => !deleted.includes(id))),
      );
      busy.current = false;
      setSaving(false);
    }
  };
  const exportarExcelEvento = async (
    nombreEvento: string,
    ventasDelEvento: Venta[],
  ) => {
    if (ventasDelEvento.length === 0) return;

    const XLSX = await import("xlsx");
    const filas: Record<string, string | number>[] = [];

    // Fila de cabecera del informe
    filas.push({
      "N° Venta": "N° Venta",
      Fecha: "Fecha",
      Hora: "Hora",
      Producto: "Producto",
      Cantidad: "Cantidad",
      "Precio unitario ($)": "Precio unitario ($)",
      "Subtotal ($)": "Subtotal ($)",
      "Forma de pago": "Forma de pago",
      "Estado deuda": "Estado deuda",
    });

    let totalGeneral = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;

    // Objeto para agrupar costos por producto
    const costosPorProducto: {
      [key: string]: { nombre: string; cantidad: number; costo: number };
    } = {};

    ventasDelEvento.forEach((venta) => {
      const fecha = new Date(venta.fecha);
      const fechaStr = fecha.toLocaleDateString("es-AR");
      const horaStr = fecha.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formaPago =
        venta.metodoPago === "transferencia" ? "Transferencia" : "Efectivo";
      const deuda = venta.debe ? "Debe" : "Al dia";

      venta.detalles.forEach((d) => {
        const precioUnitario = d.cantidad > 0 ? d.subtotal / d.cantidad : 0;

        filas.push({
          "N° Venta": venta.id,
          Fecha: fechaStr,
          Hora: horaStr,
          Producto: d.nombre,
          Cantidad: d.cantidad,
          "Precio unitario ($)": precioUnitario.toFixed(2),
          "Subtotal ($)": d.subtotal.toFixed(2),
          "Forma de pago": formaPago,
          "Estado deuda": deuda,
        });

        // Agrupar costos por producto (costo unitario × cantidad)
        if (!costosPorProducto[d.producto_id]) {
          costosPorProducto[d.producto_id] = {
            nombre: d.nombre,
            cantidad: 0,
            costo: 0,
          };
        }
        costosPorProducto[d.producto_id].cantidad += d.cantidad;
        costosPorProducto[d.producto_id].costo += d.costo * d.cantidad;
      });

      totalGeneral += venta.total;
      if (venta.metodoPago === "transferencia") {
        totalTransferencia += venta.total;
      } else {
        totalEfectivo += venta.total;
      }
    });

    // Fila vacía de separador
    filas.push({});

    // Totales resumen
    filas.push({
      "N° Venta": "",
      Fecha: "",
      Hora: "",
      Producto: "TOTAL GENERAL",
      Cantidad: "",
      "Precio unitario ($)": "",
      "Subtotal ($)": totalGeneral.toFixed(2),
      "Forma de pago": "",
      "Estado deuda": "",
    });
    filas.push({
      "N° Venta": "",
      Fecha: "",
      Hora: "",
      Producto: "Total Efectivo",
      Cantidad: "",
      "Precio unitario ($)": "",
      "Subtotal ($)": totalEfectivo.toFixed(2),
      "Forma de pago": "Efectivo",
      "Estado deuda": "",
    });
    filas.push({
      "N° Venta": "",
      Fecha: "",
      Hora: "",
      Producto: "Total Transferencia",
      Cantidad: "",
      "Precio unitario ($)": "",
      "Subtotal ($)": totalTransferencia.toFixed(2),
      "Forma de pago": "Transferencia",
      "Estado deuda": "",
    });

    // Fila vacía de separador
    filas.push({});

    // Resumen de costos por producto
    filas.push({
      "N° Venta": "",
      Fecha: "",
      Hora: "",
      Producto: "RESUMEN DE COSTOS POR PRODUCTO",
      Cantidad: "",
      "Precio unitario ($)": "",
      "Subtotal ($)": "",
      "Forma de pago": "",
      "Estado deuda": "",
    });

    filas.push({
      "N° Venta": "",
      Fecha: "",
      Hora: "",
      Producto: "Producto",
      Cantidad: "Cantidad",
      "Precio unitario ($)": "Costo Total",
      "Subtotal ($)": "",
      "Forma de pago": "",
      "Estado deuda": "",
    });

    // Agregar cada producto al resumen
    Object.values(costosPorProducto).forEach((prod) => {
      filas.push({
        "N° Venta": "",
        Fecha: "",
        Hora: "",
        Producto: prod.nombre,
        Cantidad: prod.cantidad,
        "Precio unitario ($)": prod.costo.toFixed(2),
        "Subtotal ($)": "",
        "Forma de pago": "",
        "Estado deuda": "",
      });
    });

    // Crear libro
    const ws = XLSX.utils.json_to_sheet(filas, { skipHeader: true });
    ws["!cols"] = [
      { wch: 10 }, // N° Venta
      { wch: 12 }, // Fecha
      { wch: 8 }, // Hora
      { wch: 28 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 20 }, // Precio unitario
      { wch: 14 }, // Subtotal
      { wch: 16 }, // Forma de pago
      { wch: 14 }, // Estado deuda
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");

    const nombreArchivo = `ventas_${nombreEvento.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  const download = async (name: string, items: Venta[]) => {
    if (exporting) return;
    setExporting(true);
    setActionError("");
    try {
      await exportarExcelEvento(name, items);
    } catch (e) {
      setActionError("No se pudo descargar el Excel. Volvé a intentar.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="management-page">
      <PageHeader
        title="Historial de ventas"
        description="Consultá los cobros, revisá cada venta y descargá tus informes."
      >
        <button
          className="primary"
          disabled={exporting || loading || !!error || !ventasFiltradas.length}
          onClick={() => void download("ventas_filtradas", ventasFiltradas)}
        >
          {exporting ? "Preparando Excel…" : "Exportar Excel"}
        </button>
      </PageHeader>
      <Feedback message={mensaje} />
      <Feedback message={actionError} error />
      {eventosApi.error && (
        <div className="notice error" role="alert">
          No pudimos cargar los eventos para filtrar.{" "}
          <button className="text-button" onClick={eventosApi.reload}>
            Reintentar eventos
          </button>
        </div>
      )}
      <div className="filter-bar">
        <label>
          Buscar por producto
          <input
            type="search"
            value={filtroNombre}
            placeholder="Nombre de un producto vendido"
            onChange={(e) => {
              setFiltroNombre(e.target.value);
              setSelected(new Set());
            }}
          />
        </label>
        <label>
          Evento
          <select
            value={filtroEvento}
            disabled={eventosApi.loading}
            onChange={(e) => {
              setFiltroEvento(e.target.value);
              setSelected(new Set());
            }}
          >
            <option value="">Todos los eventos</option>
            <option value="general">
              Ventas generales / campamento anterior
            </option>
            {eventosApi.data.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!loading && !error && (
        <dl className="summary-strip">
          <div>
            <dt>Ventas</dt>
            <dd>{ventasFiltradas.length}</dd>
          </div>
          <div>
            <dt>Ingresos</dt>
            <dd>{money(total)}</dd>
          </div>
          <div>
            <dt>Ganancia</dt>
            <dd>{money(ganancia)}</dd>
          </div>
          <div>
            <dt>Efectivo / transferencia</dt>
            <dd className="split-amount">
              {money(cash)}
              <small>{money(total - cash)}</small>
            </dd>
          </div>
        </dl>
      )}
      {groups.length > 1 && (
        <details className="event-breakdown surface">
          <summary>Resumen por evento</summary>
          <div className="event-summary-list">
            {groups.map((g) => (
              <div key={g.id}>
                <span>
                  <strong>{g.name}</strong>
                  <small>
                    {g.items.length} ventas ·{" "}
                    {money(g.items.reduce((s, v) => s + v.total, 0))}
                  </small>
                </span>
                <button
                  className="secondary"
                  disabled={exporting}
                  onClick={() => void download(g.name, g.items)}
                >
                  Exportar evento
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
      <ListState
        loading={loading}
        error={error}
        empty={!ventasFiltradas.length}
        onRetry={reload}
      >
        <h2>
          {ventas.length
            ? "No hay ventas con estos filtros"
            : "Todavía no hay ventas"}
        </h2>
        <p>
          {ventas.length
            ? "Probá otro producto o elegí todos los eventos."
            : "Las ventas registradas aparecerán acá."}
        </p>
        {ventas.length > 0 && (
          <button
            className="secondary"
            onClick={() => {
              setFiltroNombre("");
              setFiltroEvento("");
              setSelected(new Set());
            }}
          >
            Limpiar filtros
          </button>
        )}
      </ListState>
      {!loading && !error && ventasFiltradas.length > 0 && (
        <>
          <div className="selection-bar">
            <label>
              <input
                type="checkbox"
                checked={selected.size === ventasFiltradas.length}
                onChange={selectAll}
                disabled={saving}
              />
              Seleccionar las {ventasFiltradas.length} ventas visibles
            </label>
            {selected.size > 0 && (
              <button
                className="danger-button"
                disabled={saving || draft !== null}
                onClick={() => void remove([...selected])}
              >
                Eliminar seleccionadas ({selected.size})
              </button>
            )}
          </div>
          <div className="record-list">
            {ventasFiltradas.map((v) => (
              <article
                className="surface sale-record"
                key={v.id}
                aria-label={`Venta ${v.id}`}
              >
                <div className="record-heading">
                  <label className="sale-select">
                    <input
                      aria-label={`Seleccionar venta ${v.id}`}
                      type="checkbox"
                      checked={selected.has(v.id)}
                      disabled={saving}
                      onChange={() => toggle(v.id)}
                    />
                    <span>Venta #{v.id}</span>
                  </label>
                  <div className="record-title">
                    <p>
                      {dateLabel(v.fecha)} ·{" "}
                      {new Date(v.fecha).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <h2>{v.evento_nombre || "Venta general"}</h2>
                  </div>
                  <span className={`state-tag ${v.debe ? "pending" : ""}`}>
                    {v.debe ? "Pago pendiente" : "Al día"}
                  </span>
                </div>
                <div className="sale-line-items">
                  {v.detalles.map((d) => (
                    <div key={d.id}>
                      <span>
                        {d.nombre}
                        <small>
                          {d.cantidad} ×{" "}
                          {money(d.cantidad ? d.subtotal / d.cantidad : 0)}
                        </small>
                      </span>
                      <strong>{money(d.subtotal)}</strong>
                    </div>
                  ))}
                </div>
                <dl className="record-facts">
                  <div>
                    <dt>Total</dt>
                    <dd>{money(v.total)}</dd>
                  </div>
                  <div>
                    <dt>Ganancia</dt>
                    <dd>{money(v.ganancia)}</dd>
                  </div>
                  <div>
                    <dt>Medio de pago</dt>
                    <dd>
                      {v.metodoPago === "transferencia"
                        ? "Transferencia"
                        : "Efectivo"}
                    </dd>
                  </div>
                </dl>
                {draft?.id === v.id ? (
                  <form onSubmit={save}>
                    <fieldset disabled={saving} className="inline-edit">
                      <div className="form-grid">
                        <label>
                          Medio de pago
                          <select
                            aria-label="Medio de pago"
                            value={draft.metodoPago || "efectivo"}
                            onChange={(e) =>
                              setDraft({ ...draft, metodoPago: e.target.value })
                            }
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                          </select>
                        </label>
                        <label>
                          Efectivo recibido
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.efectivo || 0}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                efectivo: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={!!draft.debe}
                          onChange={(e) =>
                            setDraft({ ...draft, debe: e.target.checked })
                          }
                        />
                        El cliente queda debiendo
                      </label>
                      <div className="record-actions">
                        <button className="primary" type="submit">
                          {saving ? "Guardando…" : "Guardar cambios"}
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => setDraft(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </fieldset>
                  </form>
                ) : (
                  <div className="record-actions">
                    <button
                      className="secondary"
                      disabled={saving || draft !== null}
                      onClick={() => {
                        setDraft({ ...v });
                        setActionError("");
                        setMensaje("");
                      }}
                    >
                      Editar cobro
                    </button>
                    <button
                      className="danger-button"
                      disabled={saving || draft !== null}
                      onClick={() => void remove([v.id])}
                    >
                      Eliminar venta
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
