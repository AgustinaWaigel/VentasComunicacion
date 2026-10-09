import { useEffect, useRef, useState } from "react";
import {
  PageHeader,
  Feedback,
  ListState,
  FieldError,
  money,
  dateLabel,
  searchText,
} from "../components/AdminUI";
import { useApiList, requestJson, errorMessage } from "../hooks/useApiList";
import { useConfirm } from "../hooks/useConfirm";
import { validarImporte } from "../utils/validar";
import { exportarVentas } from "../utils/exportarVentas";
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
  const [errorEfectivo, setErrorEfectivo] = useState("");
  const busy = useRef(false);
  const { confirmar, dialogo } = useConfirm();
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
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy.current) return;
    const problema =
      draft.metodoPago === "transferencia"
        ? ""
        : validarImporte(draft.efectivo ?? 0);
    setErrorEfectivo(problema);
    if (problema) return;
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
      !(await confirmar({
        titulo:
          ids.length === 1
            ? `¿Eliminar la venta #${ids[0]}?`
            : `¿Eliminar ${ids.length} ventas?`,
        texto:
          "Se borran del historial y dejan de contar en los totales. No se puede deshacer.",
        accion: ids.length === 1 ? "Eliminar venta" : `Eliminar ${ids.length} ventas`,
        peligro: true,
      })) ||
      busy.current
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
  const download = async (name: string, items: Venta[]) => {
    if (exporting) return;
    setExporting(true);
    setActionError("");
    try {
      await exportarVentas(name, items);
    } catch {
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
          onClick={() =>
            void download(
              filtroEvento === "general"
                ? "Ventas generales"
                : eventosApi.data.find((e) => String(e.id) === filtroEvento)
                    ?.nombre || "Todos los eventos",
              ventasFiltradas,
            )
          }
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
          <div className="surface table-surface">
            <table className="inventory-table sales-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <span className="sr-only">Seleccionar</span>
                  </th>
                  <th>Venta</th>
                  <th>Productos</th>
                  <th className="col-category">Evento</th>
                  <th>Cobro</th>
                  <th className="col-number col-profit">Ganancia</th>
                  <th className="col-number">Total</th>
                  <th className="col-actions">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              {ventasFiltradas.map((v) => (
                <tbody
                  key={v.id}
                  className={`inventory-record sale-record ${draft?.id === v.id ? "is-editing" : ""} ${selected.has(v.id) ? "is-selected" : ""}`}
                >
                  <tr>
                    <td className="col-check">
                      <input
                        aria-label={`Seleccionar venta ${v.id}`}
                        type="checkbox"
                        checked={selected.has(v.id)}
                        disabled={saving}
                        onChange={() => toggle(v.id)}
                      />
                    </td>
                    <th scope="row" className="sale-id">
                      #{v.id}
                      <small>
                        {dateLabel(v.fecha)} ·{" "}
                        {new Date(v.fecha).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </th>
                    <td className="sale-items">
                      <ul>
                        {v.detalles.map((d) => (
                          <li key={d.id}>
                            <b>{d.cantidad} ×</b> {d.nombre}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="col-category">
                      {v.evento_nombre || "Venta general"}
                    </td>
                    <td className="sale-pay">
                      {v.metodoPago === "transferencia"
                        ? "Transferencia"
                        : "Efectivo"}
                      {v.debe && (
                        <span className="state-tag pending">Pago pendiente</span>
                      )}
                    </td>
                    <td className="col-number col-profit">
                      {money(v.ganancia)}
                    </td>
                    <td className="col-number inventory-price">
                      {money(v.total)}
                    </td>
                    <td className="col-actions">
                      <button
                        className="secondary"
                        aria-label={`Editar cobro de la venta ${v.id}`}
                        disabled={saving || draft !== null}
                        onClick={() => {
                          setDraft({ ...v });
                          setErrorEfectivo("");
                          setActionError("");
                          setMensaje("");
                        }}
                      >
                        Editar cobro
                      </button>
                      <button
                        className="danger-button"
                        aria-label={`Eliminar venta ${v.id}`}
                        disabled={saving || draft !== null}
                        onClick={() => void remove([v.id])}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  {draft?.id === v.id && (
                    <tr className="inventory-edit">
                      <td colSpan={8}>
                  <form onSubmit={save} noValidate>
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
                            aria-invalid={!!errorEfectivo}
                            value={draft.efectivo || 0}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                efectivo: Number(e.target.value),
                              })
                            }
                          />
                          <FieldError message={errorEfectivo} />
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
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        </>
      )}
      {dialogo}
    </div>
  );
}
