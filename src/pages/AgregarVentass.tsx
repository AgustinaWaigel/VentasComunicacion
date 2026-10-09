import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useConfirm } from "../hooks/useConfirm";
import type { ItemCarrito } from "../types";

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
  imagen?: string;
}
interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  activo: boolean;
}
type MetodoPago = "efectivo" | "transferencia";
// evento null = todavía no se eligió: usa el evento activo más reciente.
// clave identifica la venta ante el servidor: un reintento no la duplica.
interface VentaAbierta {
  id: number;
  clave: string;
  numero: number;
  nombre: string;
  items: ItemCarrito[];
  metodoPago: MetodoPago;
  efectivo: number;
  debe: boolean;
  evento: number | "" | null;
}
interface Aviso {
  tipo: "ok" | "error" | "info";
  titulo: string;
  texto: string;
  historial?: boolean;
}

const CLAVE_VENTAS = "iam.ventas-abiertas.v1";
const formatoEntero = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const formatoDecimal = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const moneda = (n: number) =>
  (Number.isInteger(n) ? formatoEntero : formatoDecimal).format(n);
const normalizar = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase()
    .trim();

const MAX_UNIDADES = 999;
const nuevaClave = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let ultimoId = Date.now();
const crearVenta = (
  numero: number,
  evento: VentaAbierta["evento"] = null,
): VentaAbierta => ({
  id: ++ultimoId,
  clave: nuevaClave(),
  numero,
  nombre: "",
  items: [],
  metodoPago: "efectivo",
  efectivo: 0,
  debe: false,
  evento,
});
const linea = (p: Producto, cantidad: number): ItemCarrito => ({
  producto_id: p.id,
  nombre: p.nombre,
  cantidad,
  subtotal: p.precio * cantidad,
  ganancia: (p.precio - p.costo) * cantidad,
});
const etiqueta = (v: VentaAbierta) => v.nombre.trim() || `Venta ${v.numero}`;
const unidadesDe = (v: VentaAbierta) =>
  v.items.reduce((s, i) => s + i.cantidad, 0);
const totalDe = (v: VentaAbierta) => v.items.reduce((s, i) => s + i.subtotal, 0);
const siguienteNumero = (ventas: VentaAbierta[]) =>
  Math.max(0, ...ventas.map((v) => v.numero)) + 1;

// Recalcula cada línea con el precio actual y quita productos que ya no existen.
const reconciliar = (ventas: VentaAbierta[], productos: Producto[]) =>
  ventas.map((v) => ({
    ...v,
    items: v.items.flatMap((i) => {
      const p = productos.find((p) => p.id === i.producto_id);
      return p && p.precio > 0
        ? [linea(p, Math.min(i.cantidad, MAX_UNIDADES))]
        : [];
    }),
  }));

const leerVentas = (): { ventas: VentaAbierta[]; activa: number } => {
  try {
    const data = JSON.parse(localStorage.getItem(CLAVE_VENTAS) ?? "null");
    const ventas: VentaAbierta[] = (Array.isArray(data?.ventas) ? data.ventas : [])
      .filter(
        (v: VentaAbierta) =>
          Number.isFinite(v?.id) &&
          Array.isArray(v.items) &&
          v.items.every(
            (i) => Number.isFinite(i?.producto_id) && i.cantidad > 0,
          ),
      )
      .map((v: VentaAbierta, index: number) => ({
        ...crearVenta(index + 1),
        ...v,
        nombre: typeof v.nombre === "string" ? v.nombre : "",
        metodoPago: v.metodoPago === "transferencia" ? "transferencia" : "efectivo",
        efectivo: Number(v.efectivo) > 0 ? Number(v.efectivo) : 0,
        debe: v.debe === true,
      }));
    if (ventas.length) {
      ultimoId = Math.max(ultimoId, ...ventas.map((v) => v.id));
      return { ventas, activa: Number(data.activa) || ventas[0].id };
    }
  } catch {
    // Almacenamiento bloqueado o dañado: se empieza con una venta limpia.
  }
  const venta = crearVenta(1);
  return { ventas: [venta], activa: venta.id };
};

function Foto({
  producto,
  prioritaria,
}: {
  producto: Producto;
  prioritaria: boolean;
}) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className="product-photo">
      {producto.imagen && !fallo ? (
        <img
          src={`${API_BASE_URL}/uploads/${encodeURIComponent(producto.imagen)}`}
          alt=""
          width="96"
          height="96"
          loading={prioritaria ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFallo(true)}
        />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
          <path
            d="m9 15 15-8 15 8v18l-15 8-15-8V15Zm0 0 15 8 15-8M24 23v18M17 11l15 8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
}

const IconoMas = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconoMenos = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12h14" />
  </svg>
);
const IconoCerrar = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m6 6 12 12M6 18 18 6" />
  </svg>
);

export default function AgregarVentas() {
  const [inicial] = useState(leerVentas);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ventas, setVentas] = useState(inicial.ventas);
  const [activaId, setActivaId] = useState(inicial.activa);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorEventos, setErrorEventos] = useState(false);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [intentoEventos, setIntentoEventos] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [demora, setDemora] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const busquedaRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const ventasRef = useRef(ventas);
  const enviando = useRef(false);
  const peticion = useRef<AbortController | null>(null);
  const { confirmar: preguntar, dialogo } = useConfirm();

  // Los manejadores leen ventasRef para no pisarse entre toques seguidos.
  const guardar = useCallback((next: VentaAbierta[]) => {
    ventasRef.current = next;
    setVentas(next);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE_VENTAS,
        JSON.stringify({ ventas, activa: activaId }),
      );
    } catch {
      // Sin almacenamiento las ventas abiertas no sobreviven a una recarga.
    }
  }, [ventas, activaId]);

  useEffect(() => {
    if (!aviso || aviso.tipo === "error") return;
    const timer = window.setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(timer);
  }, [aviso]);

  useEffect(() => {
    if (panelAbierto) panelRef.current?.focus();
  }, [panelAbierto]);

  const cargarProductos = useCallback(async () => {
    peticion.current?.abort();
    const controller = new AbortController();
    peticion.current = controller;
    const timeout = window.setTimeout(() => controller.abort("timeout"), 65000);
    const start = performance.now();
    setDemora(false);
    const espera = window.setTimeout(() => setDemora(true), 8000);
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(
          "El servidor no pudo devolver los productos. Volvé a intentar en unos momentos.",
        );
      const data: Producto[] = await res.json();
      if (!Array.isArray(data)) throw new Error("Formato");
      if (peticion.current !== controller) return;
      setProductos(data);
      const antes = ventasRef.current;
      const ajustadas = reconciliar(antes, data);
      guardar(ajustadas);
      if (
        ajustadas.some(
          (v, i) =>
            unidadesDe(v) !== unidadesDe(antes[i]) ||
            totalDe(v) !== totalDe(antes[i]),
        )
      )
        setAviso({
          tipo: "info",
          titulo: "Se actualizaron las ventas abiertas",
          texto:
            "Cambió un precio o se quitó un producto. Revisá los totales antes de cobrar.",
        });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          performance.measure("iam:productos-visibles", {
            start,
            end: performance.now(),
          });
        }),
      );
    } catch (cause) {
      if (controller.signal.aborted && controller.signal.reason !== "timeout")
        return;
      setError(
        controller.signal.reason === "timeout"
          ? "El servidor no respondió a tiempo. Volvé a intentar."
          : !navigator.onLine
            ? "No hay conexión. Revisá internet y volvé a intentar."
            : cause instanceof Error && cause.message.startsWith("El servidor")
              ? cause.message
              : "No pudimos conectar con el servidor. Volvé a intentar.",
      );
    } finally {
      clearTimeout(timeout);
      clearTimeout(espera);
      if (peticion.current === controller) {
        setCargando(false);
        setDemora(false);
      }
    }
  }, [guardar]);
  useEffect(() => {
    void cargarProductos();
    return () => peticion.current?.abort();
  }, [cargarProductos]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);
    let mounted = true;
    setCargandoEventos(true);
    setErrorEventos(false);
    fetch(`${API_BASE_URL}/api/eventos`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Evento[]) => {
        if (mounted)
          setEventos(data.filter((e) => e.activo).sort((a, b) => b.id - a.id));
      })
      .catch(() => {
        if (mounted) setErrorEventos(true);
      })
      .finally(() => {
        clearTimeout(timer);
        if (mounted) setCargandoEventos(false);
      });
    return () => {
      mounted = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [intentoEventos]);

  const activa = ventas.find((v) => v.id === activaId) ?? ventas[0];
  const carrito = activa.items;
  const total = totalDe(activa);
  const unidades = unidadesDe(activa);
  const eventoDe = (v: VentaAbierta) =>
    v.evento === "" || eventos.some((e) => e.id === v.evento)
      ? (v.evento as number | "")
      : (eventos[0]?.id ?? "");
  const eventoActivo = eventoDe(activa);
  const bloqueado = guardando || cargando || !!error;
  const noSePuedeCobrar =
    !carrito.length || bloqueado || cargandoEventos || errorEventos;

  const editarActiva = (cambio: Partial<VentaAbierta>) =>
    guardar(
      ventasRef.current.map((v) =>
        v.id === activa.id ? { ...v, ...cambio } : v,
      ),
    );
  const cambiarCantidad = (p: Producto, cantidad: number) => {
    if (
      enviando.current ||
      !Number.isInteger(cantidad) ||
      cantidad < 0 ||
      cantidad > MAX_UNIDADES ||
      p.precio <= 0
    )
      return;
    const venta = ventasRef.current.find((v) => v.id === activa.id);
    if (!venta) return;
    const otros = venta.items.filter((i) => i.producto_id !== p.id);
    editarActiva({
      items: !cantidad
        ? otros
        : venta.items.some((i) => i.producto_id === p.id)
          ? venta.items.map((i) =>
              i.producto_id === p.id ? linea(p, cantidad) : i,
            )
          : [...venta.items, linea(p, cantidad)],
    });
  };
  const abrirVenta = () => {
    const actual = ventasRef.current;
    const libre = actual.find((v) => !v.items.length && !v.nombre.trim());
    if (libre) return setActivaId(libre.id);
    const venta = crearVenta(siguienteNumero(actual), activa.evento);
    guardar([...actual, venta]);
    setActivaId(venta.id);
  };
  const descartar = async (id: number) => {
    const venta = ventasRef.current.find((v) => v.id === id);
    if (!venta) return;
    const u = unidadesDe(venta);
    if (
      u &&
      !(await preguntar({
        titulo: `¿Descartar ${etiqueta(venta)}?`,
        texto: `Se van a quitar ${u} ${u === 1 ? "unidad" : "unidades"} por ${moneda(totalDe(venta))}. No queda guardada en el historial.`,
        accion: "Descartar venta",
        peligro: true,
      }))
    )
      return;
    const actual = ventasRef.current;
    const indice = actual.findIndex((v) => v.id === id);
    if (indice < 0) return;
    const resto = actual.filter((v) => v.id !== id);
    const next = resto.length ? resto : [crearVenta(1, venta.evento)];
    guardar(next);
    if (activa.id === id) setActivaId(next[Math.min(indice, next.length - 1)].id);
  };

  const categorias = [
    "Todos",
    ...new Set(
      productos.map((p) => p.categoria?.trim()).filter((c): c is string => !!c),
    ),
  ];
  const filtrados = productos
    .filter(
      (p) =>
        normalizar(p.nombre).includes(normalizar(busqueda)) &&
        (categoria === "Todos" || p.categoria?.trim() === categoria),
    )
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
        numeric: true,
      }),
    );
  const confirmar = async () => {
    const venta = ventasRef.current.find((v) => v.id === activa.id);
    if (enviando.current || !venta || noSePuedeCobrar) return;
    const totalVenta = totalDe(venta);
    if (
      venta.metodoPago === "efectivo" &&
      venta.efectivo > 0 &&
      venta.efectivo < totalVenta &&
      !venta.debe
    ) {
      setAviso({
        tipo: "error",
        titulo: "Lo recibido no alcanza",
        texto: `Faltan ${moneda(totalVenta - venta.efectivo)}. Corregí el monto recibido o marcá que el cliente queda debiendo.`,
      });
      return;
    }
    enviando.current = true;
    setGuardando(true);
    setAviso(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    const evento = eventoDe(venta);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ventas`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: venta.clave,
          items: venta.items,
          total: totalVenta,
          metodoPago: venta.metodoPago,
          efectivo: venta.metodoPago === "efectivo" ? venta.efectivo : 0,
          debe: venta.debe,
          ...(evento !== "" ? { evento_id: evento } : {}),
        }),
      });
      if (!res.ok) {
        const detalle = await res
          .json()
          .then((d) => (typeof d?.error === "string" ? d.error : ""))
          .catch(() => "");
        setAviso({
          tipo: "error",
          titulo: "La venta no se registró",
          texto: `No se pudo registrar la venta. ${detalle ? `${detalle}.` : "Volvé a intentar en unos segundos."}`,
        });
        return;
      }
      const resto = ventasRef.current.filter((v) => v.id !== venta.id);
      const next = resto.length ? resto : [crearVenta(1, venta.evento)];
      guardar(next);
      setActivaId(next[0].id);
      setBusqueda("");
      setPanelAbierto(false);
      setAviso({
        tipo: "ok",
        titulo: "Venta registrada",
        texto: resto.length
          ? `Venta registrada correctamente. Seguís con ${etiqueta(next[0])}.`
          : "Venta registrada correctamente. Ya podés cargar la siguiente.",
      });
    } catch {
      setAviso({
        tipo: "error",
        titulo: "No sabemos si la venta se guardó",
        texto:
          "Se cortó la conexión. Volvé a tocar Registrar venta: si ya había quedado guardada, no se carga de nuevo.",
        historial: true,
      });
    } finally {
      clearTimeout(timeout);
      enviando.current = false;
      setGuardando(false);
    }
  };

  return (
    <div className={`sales-page ${panelAbierto ? "sheet-open" : ""}`}>
      <h1 className="sr-only">Registrar venta</h1>
      <nav className="sale-tabs" aria-label="Ventas abiertas">
        {ventas.map((v) => {
          const u = unidadesDe(v);
          return (
            <div
              key={v.id}
              className={`sale-tab ${v.id === activa.id ? "is-active" : ""}`}
            >
              <button
                className="sale-tab-main"
                aria-current={v.id === activa.id ? "true" : undefined}
                disabled={guardando}
                onClick={() => setActivaId(v.id)}
              >
                <b>{etiqueta(v)}</b>
                <small>
                  {u ? `${u} u. · ${moneda(totalDe(v))}` : "Sin productos"}
                </small>
              </button>
              {ventas.length > 1 && (
                <button
                  className="sale-tab-close"
                  aria-label={`Descartar ${etiqueta(v)}`}
                  disabled={guardando}
                  onClick={() => void descartar(v.id)}
                >
                  <IconoCerrar />
                </button>
              )}
            </div>
          );
        })}
        <button
          className="sale-new"
          aria-label="Abrir otra venta"
          disabled={guardando}
          onClick={abrirVenta}
        >
          <IconoMas />
          <span>Otra venta</span>
        </button>
      </nav>
      <div className="shop-layout">
        <section
          aria-labelledby="catalogo-title"
          className="catalog"
          aria-busy={cargando}
        >
          <h2 id="catalogo-title" className="sr-only">
            Productos
          </h2>
          <div className="catalog-tools">
            <div className="search-row">
              <label className="search-box">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m16 16 5 5" />
                </svg>
                <input
                  ref={busquedaRef}
                  type="search"
                  aria-label="Buscar productos"
                  placeholder="Buscar producto…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    className="clear-search"
                    aria-label="Borrar búsqueda"
                    onClick={() => {
                      setBusqueda("");
                      busquedaRef.current?.focus();
                    }}
                  >
                    Borrar
                  </button>
                )}
              </label>
              {cargando && productos.length > 0 ? (
                <span className="catalog-count stock-update" role="status">
                  Actualizando…
                </span>
              ) : (
                productos.length > 0 && (
                  <span className="catalog-count">
                    {filtrados.length === productos.length
                      ? `${productos.length} productos`
                      : `${filtrados.length} de ${productos.length}`}
                  </span>
                )
              )}
            </div>
            {categorias.length > 1 && (
              <div className="category-list" aria-label="Categorías">
                {categorias.map((c) => (
                  <button
                    key={c}
                    aria-pressed={categoria === c}
                    onClick={() => setCategoria(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {error && productos.length > 0 && (
              <div className="notice error" role="alert">
                <p>{error} Los precios pueden estar desactualizados.</p>
                <button
                  className="secondary"
                  onClick={() => void cargarProductos()}
                >
                  Volver a intentar
                </button>
              </div>
            )}
          </div>
          <div className="catalog-scroll">
            {cargando && !productos.length ? (
              <div className="product-loading" role="status">
                <p>
                  {demora
                    ? "El servidor está tardando en responder. Seguimos intentando cargar los productos."
                    : "Consultando precios y disponibilidad…"}
                </p>
                <div aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="product-skeleton">
                      <i />
                      <i />
                      <i />
                    </div>
                  ))}
                </div>
              </div>
            ) : error && !productos.length ? (
              <div className="empty-state" role="alert">
                <h3>No pudimos cargar los productos</h3>
                <p>{error}</p>
                <button
                  className="primary"
                  onClick={() => void cargarProductos()}
                >
                  Volver a intentar
                </button>
              </div>
            ) : !filtrados.length ? (
              <div className="empty-state">
                <h3>
                  {productos.length
                    ? "No encontramos ese producto"
                    : "No hay productos cargados"}
                </h3>
                <p>
                  {productos.length
                    ? "Probá con otro nombre o categoría."
                    : "Cargalos desde Agregar producto para empezar a vender."}
                </p>
                {productos.length > 0 && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setBusqueda("");
                      setCategoria("Todos");
                    }}
                  >
                    Ver todos los productos
                  </button>
                )}
              </div>
            ) : (
              <table className="product-table">
                <thead>
                  <tr>
                    <th className="col-photo">
                      <span className="sr-only">Foto</span>
                    </th>
                    <th>Producto</th>
                    <th className="col-category">Categoría</th>
                    <th className="col-price">Precio</th>
                    <th className="col-action">
                      <span className="sr-only">Cantidad en esta venta</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                {filtrados.map((p, index) => {
                  const enCarrito =
                    carrito.find((i) => i.producto_id === p.id)?.cantidad ?? 0;
                  const tope = bloqueado || enCarrito >= MAX_UNIDADES;
                  return (
                    <tr
                      key={p.id}
                      className={`product-card ${enCarrito ? "in-sale" : ""}`}
                      aria-label={p.nombre}
                    >
                      <td className="col-photo">
                        <Foto
                          key={`${p.id}-${p.imagen}`}
                          producto={p}
                          prioritaria={index < 8}
                        />
                      </td>
                      <th scope="row" className="product-name">
                        {p.nombre}
                      </th>
                      <td className="product-category col-category">
                        {p.categoria?.trim() || "—"}
                      </td>
                      <td className="product-price">{moneda(p.precio)}</td>
                      <td className="product-action">
                        {enCarrito ? (
                          <div className="row-stepper">
                            <button
                              aria-label={`Restar ${p.nombre}`}
                              disabled={bloqueado}
                              onClick={() => cambiarCantidad(p, enCarrito - 1)}
                            >
                              <IconoMenos />
                            </button>
                            <span
                              key={enCarrito}
                              aria-label={`${enCarrito} en esta venta`}
                            >
                              {enCarrito}
                            </span>
                            <button
                              aria-label={`Agregar ${p.nombre}`}
                              disabled={tope}
                              onClick={() => cambiarCantidad(p, enCarrito + 1)}
                            >
                              <IconoMas />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-button"
                            aria-label={`Agregar ${p.nombre}`}
                            disabled={tope || p.precio <= 0}
                            onClick={() => cambiarCantidad(p, 1)}
                          >
                            <span>
                              {p.precio <= 0 ? "Sin precio" : "Agregar"}
                            </span>
                            {p.precio > 0 && <IconoMas />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <aside
          ref={panelRef}
          className={`order-panel ${panelAbierto ? "is-open" : ""}`}
          id="pedido"
          aria-labelledby="pedido-title"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPanelAbierto(false);
          }}
        >
          <div className="order-heading">
            <div className="order-title">
              <h2 id="pedido-title">{etiqueta(activa)}</h2>
              <span className="order-units">
                {unidades} {unidades === 1 ? "unidad" : "unidades"}
              </span>
              {carrito.length > 0 && (
                <button
                  className="text-button"
                  disabled={guardando}
                  onClick={() => void descartar(activa.id)}
                >
                  {ventas.length > 1 ? "Descartar" : "Vaciar"}
                </button>
              )}
              <button
                className="sheet-close"
                onClick={() => setPanelAbierto(false)}
              >
                Seguir agregando
              </button>
            </div>
            <div className="order-fields">
              <div>
                <label className="field-label" htmlFor="evento">
                  Evento
                </label>
                <select
                  id="evento"
                  value={eventoActivo}
                  disabled={guardando || cargandoEventos}
                  onChange={(e) =>
                    editarActiva({
                      evento: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                >
                  <option value="">
                    {cargandoEventos ? "Cargando eventos…" : "Venta general"}
                  </option>
                  {eventos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="referencia">
                  Para quién
                </label>
                <input
                  id="referencia"
                  type="text"
                  maxLength={24}
                  autoComplete="off"
                  placeholder="Opcional"
                  value={activa.nombre}
                  disabled={guardando}
                  onChange={(e) => editarActiva({ nombre: e.target.value })}
                />
              </div>
            </div>
            {errorEventos && (
              <div className="notice error" role="alert">
                No se cargaron los eventos.{" "}
                <button
                  className="text-button"
                  onClick={() => setIntentoEventos((i) => i + 1)}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
          <div
            className="order-scroll"
            tabIndex={0}
            role="region"
            aria-label="Productos de esta venta"
          >
            {!carrito.length ? (
              <div className="order-empty">
                <h3>Todavía no hay productos</h3>
                <p>Tocá Agregar en un producto para sumarlo a esta venta.</p>
              </div>
            ) : (
              <ul className="order-items">
                {carrito.map((i) => {
                  const p = productos.find((p) => p.id === i.producto_id);
                  const maximo = MAX_UNIDADES;
                  return (
                    <li key={i.producto_id}>
                      <div className="order-item-top">
                        <h3>{i.nombre}</h3>
                        <strong>{moneda(i.subtotal)}</strong>
                      </div>
                      <div className="order-item-bottom">
                        <div className="quantity">
                          <button
                            aria-label={`Quitar una unidad de ${i.nombre}`}
                            disabled={bloqueado}
                            onClick={() =>
                              p && cambiarCantidad(p, i.cantidad - 1)
                            }
                          >
                            <IconoMenos />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maximo}
                            aria-label={`Cantidad de ${i.nombre}`}
                            value={i.cantidad}
                            disabled={bloqueado}
                            onChange={(e) => {
                              if (p && Number(e.target.value) >= 1)
                                cambiarCantidad(p, Number(e.target.value));
                            }}
                          />
                          <button
                            aria-label={`Agregar una unidad de ${i.nombre}`}
                            disabled={bloqueado || i.cantidad >= maximo}
                            onClick={() =>
                              p && cambiarCantidad(p, i.cantidad + 1)
                            }
                          >
                            <IconoMas />
                          </button>
                        </div>
                        {p && i.cantidad > 1 && (
                          <span className="unit-price">
                            {moneda(p.precio)} c/u
                          </span>
                        )}
                        <button
                          className="text-button"
                          aria-label={`Quitar ${i.nombre} de la venta`}
                          disabled={guardando}
                          onClick={() =>
                            editarActiva({
                              items: carrito.filter(
                                (x) => x.producto_id !== i.producto_id,
                              ),
                            })
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <fieldset className="payment-options" disabled={guardando}>
              <legend className="sr-only">Vuelto y deuda</legend>
              {activa.metodoPago === "efectivo" && (
                <div className="received">
                  <label className="field-label" htmlFor="efectivo">
                    Recibido{" "}
                    <span className="muted">(opcional, para el vuelto)</span>
                  </label>
                  <input
                    id="efectivo"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="$ 0"
                    value={activa.efectivo || ""}
                    onChange={(e) =>
                      editarActiva({
                        efectivo: Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                </div>
              )}
              <label className="debt-label">
                <input
                  type="checkbox"
                  checked={activa.debe}
                  onChange={(e) => editarActiva({ debe: e.target.checked })}
                />
                El cliente queda debiendo
              </label>
            </fieldset>
            {carrito.length > 0 && (
              <p className="sale-profit">
                Ganancia estimada:{" "}
                {moneda(carrito.reduce((s, i) => s + i.ganancia, 0))}
              </p>
            )}
          </div>
          <div className="order-footer">
            <fieldset className="fixed-payment" disabled={guardando}>
              <legend className="sr-only">Medio de pago</legend>
              <div className="payment-toggle">
                <button
                  type="button"
                  aria-pressed={activa.metodoPago === "efectivo"}
                  onClick={() => editarActiva({ metodoPago: "efectivo" })}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  aria-pressed={activa.metodoPago === "transferencia"}
                  onClick={() => editarActiva({ metodoPago: "transferencia" })}
                >
                  Transferencia
                </button>
              </div>
            </fieldset>
            <div className="order-total">
              <span>
                Total
                {activa.debe && <em>Queda debiendo</em>}
              </span>
              <strong>{moneda(total)}</strong>
            </div>
            {activa.metodoPago === "efectivo" &&
              activa.efectivo > 0 &&
              carrito.length > 0 && (
                <p
                  className={`change-due ${activa.efectivo < total ? "is-short" : ""}`}
                >
                  <span>{activa.efectivo >= total ? "Vuelto" : "Faltan"}</span>
                  <strong>{moneda(Math.abs(activa.efectivo - total))}</strong>
                </p>
              )}
            <button
              className="primary checkout"
              disabled={noSePuedeCobrar}
              onClick={() => void confirmar()}
            >
              {guardando ? "Registrando…" : "Registrar venta"}
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </button>
          </div>
        </aside>
      </div>
      <div className="mobile-order">
        <button
          className="mobile-summary"
          aria-expanded={panelAbierto}
          aria-controls="pedido"
          onClick={() => setPanelAbierto(true)}
        >
          <b>
            {unidades
              ? `${unidades} u. · ${moneda(total)}`
              : `${etiqueta(activa)} sin productos`}
          </b>
          <small>
            Ver detalle · {activa.metodoPago}
            {activa.debe ? " · debe" : ""}
          </small>
        </button>
        <button
          className="primary"
          disabled={noSePuedeCobrar}
          onClick={() => void confirmar()}
        >
          {guardando ? "Registrando…" : "Registrar venta"}
        </button>
      </div>
      {aviso && (
        <div
          className={`sale-feedback notice ${aviso.tipo === "error" ? "error" : aviso.tipo === "ok" ? "success" : ""}`}
          role={aviso.tipo === "error" ? "alert" : "status"}
        >
          <div>
            <strong>{aviso.titulo}</strong>
            <p>{aviso.texto}</p>
            {aviso.historial && (
              <a href="/historial" target="_blank" rel="noreferrer">
                Consultar historial (otra pestaña)
              </a>
            )}
          </div>
          <button
            className="feedback-close"
            aria-label="Cerrar aviso"
            onClick={() => setAviso(null)}
          >
            <IconoCerrar />
          </button>
        </div>
      )}
      {dialogo}
    </div>
  );
}
