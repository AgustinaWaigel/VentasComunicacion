import { useRef, useState } from "react";
import type { Evento } from "../types";
import {
  PageHeader,
  Feedback,
  ListState,
  dateLabel,
  money,
  searchText,
} from "../components/AdminUI";
import { useApiList, requestJson, errorMessage } from "../hooks/useApiList";
interface Stats {
  totalVentas: number;
  ingresosTotales: number;
  gananciaTotales: number;
  topProductos: {
    producto_id: number;
    nombre: string;
    cantidad: number;
    subtotal: number;
  }[];
}
export default function Eventos() {
  const {
    data: eventos,
    setData: setEventos,
    loading,
    error,
    reload,
  } = useApiList<Evento>("/api/eventos");
  const [draft, setDraft] = useState<{
    id?: number;
    nombre: string;
    fecha: string;
    descripcion: string;
  } | null>(null);
  const [busqueda, setBusqueda] = useState(""),
    [estado, setEstado] = useState("todos");
  const [mensaje, setMensaje] = useState(""),
    [saveError, setSaveError] = useState(""),
    [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [stats, setStats] = useState<Record<number, Stats>>({}),
    [expanded, setExpanded] = useState<number | null>(null),
    [statsLoading, setStatsLoading] = useState(false),
    [statsError, setStatsError] = useState("");
  const statsRequest = useRef(0);
  const filtered = eventos
    .filter(
      (e) =>
        searchText(e.nombre).includes(searchText(busqueda)) &&
        (estado === "todos" || e.activo === (estado === "activos")),
    )
    .sort((a, b) => b.id - a.id);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy.current) return;
    if (!draft.nombre.trim()) {
      setSaveError("Ingresá el nombre del evento.");
      return;
    }
    busy.current = true;
    setSaving(true);
    setSaveError("");
    setMensaje("");
    try {
      const item = await requestJson<Evento>(
        draft.id ? `/api/eventos/${draft.id}` : "/api/eventos",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: draft.nombre.trim(),
            fecha: draft.fecha,
            descripcion: draft.descripcion,
          }),
        },
      );
      setEventos((prev) =>
        draft.id
          ? prev.map((e) => (e.id === item.id ? item : e))
          : [item, ...prev],
      );
      setMensaje(
        draft.id ? "Evento actualizado." : "Evento creado correctamente.",
      );
      setDraft(null);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const toggle = async (evento: Evento) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const item = await requestJson<Evento>(`/api/eventos/${evento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...evento, activo: !evento.activo }),
      });
      setEventos((prev) => prev.map((e) => (e.id === item.id ? item : e)));
      setMensaje(
        item.activo
          ? "Evento activado. Ya se puede elegir al vender."
          : "Evento desactivado. Sus ventas se conservan en el historial.",
      );
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const loadStats = async (id: number) => {
    const request = ++statsRequest.current;
    setExpanded(id);
    setStatsLoading(true);
    setStatsError("");
    try {
      const data = await requestJson<Stats>(`/api/eventos/${id}/estadisticas`);
      if (request === statsRequest.current)
        setStats((prev) => ({ ...prev, [id]: data }));
    } catch (e) {
      if (request === statsRequest.current) setStatsError(errorMessage(e));
    } finally {
      if (request === statsRequest.current) setStatsLoading(false);
    }
  };
  return (
    <div className="management-page">
      <PageHeader
        title="Eventos"
        description="Organizá las ventas por encuentro y consultá sus resultados."
      >
        <button
          className="primary"
          disabled={saving}
          onClick={() => {
            setDraft({ nombre: "", fecha: "", descripcion: "" });
            setSaveError("");
          }}
        >
          Crear evento
        </button>
      </PageHeader>
      <Feedback message={mensaje} />
      <Feedback message={saveError} error />
      {draft && (
        <form className="surface event-form" onSubmit={save}>
          <h2>{draft.id ? "Editar evento" : "Nuevo evento"}</h2>
          <p className="section-help">El nombre y la fecha son obligatorios.</p>
          <fieldset disabled={saving}>
            <div className="form-grid">
              <label>
                Nombre del evento
                <input
                  autoFocus
                  required
                  value={draft.nombre}
                  onChange={(e) =>
                    setDraft({ ...draft, nombre: e.target.value })
                  }
                  placeholder="Por ejemplo, Encuentro IAM"
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  required
                  value={draft.fecha}
                  onChange={(e) =>
                    setDraft({ ...draft, fecha: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Descripción <span className="optional">(opcional)</span>
              <textarea
                rows={3}
                value={draft.descripcion}
                onChange={(e) =>
                  setDraft({ ...draft, descripcion: e.target.value })
                }
              />
            </label>
            <div className="record-actions">
              <button className="primary" type="submit">
                {saving ? "Guardando…" : "Guardar evento"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setDraft(null)}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}
      <div className="filter-bar">
        <label>
          Buscar evento
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre del encuentro"
          />
        </label>
        <label>
          Estado
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="todos">Todos los eventos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </label>
        <span className="result-count">{filtered.length} eventos</span>
      </div>
      <ListState
        loading={loading}
        error={error}
        empty={!filtered.length}
        onRetry={reload}
      >
        <h2>
          {eventos.length ? "No hay coincidencias" : "Todavía no hay eventos"}
        </h2>
        <p>
          {eventos.length
            ? "Probá otro nombre o estado."
            : "Creá un evento para organizar las próximas ventas."}
        </p>
      </ListState>
      {!loading && !error && (
        <div className="record-list">
          {filtered.map((evento) => (
            <article
              key={evento.id}
              className="surface event-record"
              aria-label={evento.nombre}
            >
              <div className="record-heading">
                <div className="event-date">
                  <span>{dateLabel(evento.fecha)}</span>
                </div>
                <div className="record-title">
                  <h2>{evento.nombre}</h2>
                  <p>{evento.descripcion || "Sin descripción"}</p>
                </div>
                <span className={`state-tag ${evento.activo ? "" : "neutral"}`}>
                  {evento.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="record-actions">
                <button
                  className="secondary"
                  disabled={saving}
                  onClick={() => {
                    setDraft({
                      id: evento.id,
                      nombre: evento.nombre,
                      fecha: evento.fecha.slice(0, 10),
                      descripcion: evento.descripcion || "",
                    });
                    setSaveError("");
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Editar evento
                </button>
                <button
                  className="secondary"
                  disabled={saving}
                  onClick={() => void toggle(evento)}
                >
                  {evento.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  className="text-button"
                  aria-expanded={expanded === evento.id}
                  onClick={() => {
                    if (expanded === evento.id) {
                      ++statsRequest.current;
                      setExpanded(null);
                      setStatsLoading(false);
                    } else void loadStats(evento.id);
                  }}
                >
                  {expanded === evento.id
                    ? "Ocultar resultados"
                    : "Ver resultados"}
                </button>
              </div>
              {expanded === evento.id && (
                <section
                  className="event-results"
                  aria-label={`Resultados de ${evento.nombre}`}
                >
                  {statsLoading ? (
                    <p role="status">Consultando resultados…</p>
                  ) : statsError ? (
                    <div role="alert">
                      <p>{statsError}</p>
                      <button
                        className="secondary"
                        onClick={() => void loadStats(evento.id)}
                      >
                        Reintentar resultados
                      </button>
                    </div>
                  ) : (
                    stats[evento.id] && (
                      <>
                        <dl className="record-facts">
                          <div>
                            <dt>Ventas</dt>
                            <dd>{stats[evento.id].totalVentas}</dd>
                          </div>
                          <div>
                            <dt>Ingresos</dt>
                            <dd>{money(stats[evento.id].ingresosTotales)}</dd>
                          </div>
                          <div>
                            <dt>Ganancia</dt>
                            <dd>{money(stats[evento.id].gananciaTotales)}</dd>
                          </div>
                        </dl>
                        <h3>Productos más vendidos</h3>
                        {!stats[evento.id].topProductos.length ? (
                          <p className="section-help">
                            Aún no hay ventas en este evento.
                          </p>
                        ) : (
                          <ul className="stat-products">
                            {stats[evento.id].topProductos.map((p) => (
                              <li key={p.producto_id}>
                                <span>
                                  {p.nombre}
                                  <small>{p.cantidad} unidades</small>
                                </span>
                                <strong>{money(p.subtotal)}</strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )
                  )}
                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
