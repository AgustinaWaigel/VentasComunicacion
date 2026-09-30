import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { API_BASE_URL } from "../config/api";
import type { ItemCarrito } from "../types";

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
}
interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  activo: boolean;
}
const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});
const moneda = (n: number) => formatoMoneda.format(n);
const normalizar = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

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
          alt={producto.nombre}
          width="320"
          height="240"
          loading={prioritaria ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFallo(true)}
        />
      ) : (
        <div className="photo-placeholder">
          <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
            <path
              d="m9 15 15-8 15 8v18l-15 8-15-8V15Zm0 0 15 8 15-8M24 23v18M17 11l15 8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span>Foto no disponible</span>
        </div>
      )}
    </div>
  );
}

export default function AgregarVentas() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | "">("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorEventos, setErrorEventos] = useState(false);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [intentoEventos, setIntentoEventos] = useState(0);
  const [efectivo, setEfectivo] = useState(0);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "transferencia">(
    "efectivo",
  );
  const [debe, setDebe] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorVenta, setErrorVenta] = useState("");
  const [demora, setDemora] = useState(false);
  const busquedaRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const ajustar = () => {
      const espacio =
        window.innerHeight -
        Math.max(16, panel.getBoundingClientRect().top) -
        16;
      panel.style.setProperty("--panel-height", `${Math.max(200, espacio)}px`);
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    window.addEventListener("scroll", ajustar, { passive: true });
    const observer = new ResizeObserver(ajustar);
    document
      .querySelectorAll(".sale-context, .sales-heading")
      .forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("resize", ajustar);
      window.removeEventListener("scroll", ajustar);
      observer.disconnect();
    };
  }, []);
  const enviando = useRef(false);
  const peticion = useRef<AbortController | null>(null);

  const cargarProductos = useCallback(async () => {
    peticion.current?.abort();
    const controller = new AbortController();
    peticion.current = controller;
    const timeout = window.setTimeout(() => controller.abort("timeout"), 65000);
    const start = performance.now();
    setDemora(false);
    const aviso = window.setTimeout(() => setDemora(true), 8000);
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
      clearTimeout(aviso);
      if (peticion.current === controller) {
        setCargando(false);
        setDemora(false);
      }
    }
  }, []);
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
        const activos = data
          .filter((e) => e.activo)
          .sort((a, b) => b.id - a.id);
        if (mounted) {
          setEventos(activos);
          setEventoSeleccionado(activos[0]?.id ?? "");
        }
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

  const cambiarCantidad = (p: Producto, cantidad: number) => {
    if (
      enviando.current ||
      !Number.isInteger(cantidad) ||
      cantidad < 0 ||
      cantidad > p.stock ||
      p.precio <= 0
    )
      return;
    setCarrito((prev) => {
      const otros = prev.filter((i) => i.producto_id !== p.id);
      if (!cantidad) return otros;
      const item = {
        producto_id: p.id,
        nombre: p.nombre,
        cantidad,
        subtotal: p.precio * cantidad,
        ganancia: (p.precio - p.costo) * cantidad,
      };
      return prev.some((i) => i.producto_id === p.id)
        ? prev.map((i) => (i.producto_id === p.id ? item : i))
        : [...prev, item];
    });
    setMensaje("");
  };
  const total = carrito.reduce((s, i) => s + i.subtotal, 0);
  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const categorias = [
    "Todos",
    ...new Set(
      productos.map((p) => p.categoria?.trim()).filter((c): c is string => !!c),
    ),
  ];
  const filtrados = productos.filter(
    (p) =>
      normalizar(p.nombre).includes(normalizar(busqueda)) &&
      (categoria === "Todos" || p.categoria?.trim() === categoria),
  );
  const confirmar = async () => {
    if (
      enviando.current ||
      !carrito.length ||
      cargando ||
      error ||
      cargandoEventos ||
      errorEventos
    )
      return;
    enviando.current = true;
    setGuardando(true);
    setErrorVenta("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ventas`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito,
          total,
          metodoPago,
          efectivo: metodoPago === "efectivo" ? efectivo : 0,
          debe,
          ...(eventoSeleccionado !== ""
            ? { evento_id: eventoSeleccionado }
            : {}),
        }),
      });
      if (!res.ok) {
        setErrorVenta(
          "No se pudo registrar la venta. Revisá la disponibilidad antes de volver a confirmar.",
        );
        return;
      }
      setProductos((prev) =>
        prev.map((p) => ({
          ...p,
          stock: Math.max(
            0,
            p.stock -
              (carrito.find((i) => i.producto_id === p.id)?.cantidad ?? 0),
          ),
        })),
      );
      setCarrito([]);
      setEfectivo(0);
      setDebe(false);
      setMetodoPago("efectivo");
      setBusqueda("");
      setMensaje(
        "Venta registrada correctamente. Ya podés cargar la siguiente.",
      );
      void cargarProductos();
    } catch {
      setErrorVenta(
        "Se interrumpió la conexión. Consultá el historial antes de repetir la venta para evitar duplicarla.",
      );
    } finally {
      clearTimeout(timeout);
      enviando.current = false;
      setGuardando(false);
    }
  };
  return (
    <div className={`sales-page ${unidades ? "has-active-sale" : ""}`}>
      <section className="sales-heading">
        <div>
          <h1>Registrar venta</h1>
          <p>Buscá productos, cargá las cantidades y confirmá el cobro.</p>
        </div>
      </section>
      <section className="sale-context" aria-label="Evento de esta venta">
        {" "}
        <label className="field-label" htmlFor="evento">
          Evento de la venta
        </label>
        <select
          id="evento"
          value={eventoSeleccionado}
          disabled={guardando || cargandoEventos}
          onChange={(e) =>
            setEventoSeleccionado(e.target.value ? Number(e.target.value) : "")
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
        {errorEventos && (
          <div className="notice" role="alert">
            No se cargaron los eventos.{" "}
            <button
              className="text-button"
              onClick={() => setIntentoEventos((i) => i + 1)}
            >
              Reintentar
            </button>
          </div>
        )}
      </section>
      {(mensaje || errorVenta) && (
        <div
          className={`sale-feedback notice ${errorVenta ? "error" : "success"}`}
          role={errorVenta ? "alert" : "status"}
        >
          <div>
            <strong>
              {errorVenta ? "La venta necesita revisión" : "Venta registrada"}
            </strong>
            <p>{errorVenta || mensaje}</p>
            {errorVenta && (
              <a href="/historial" target="_blank" rel="noreferrer">
                Consultar historial (otra pestaña)
              </a>
            )}
          </div>
          <button
            aria-label="Cerrar aviso"
            onClick={() => {
              setMensaje("");
              setErrorVenta("");
            }}
          >
            Cerrar
          </button>
        </div>
      )}
      <div className="shop-layout">
        <section
          aria-labelledby="catalogo-title"
          className="catalog"
          aria-busy={cargando}
        >
          <div className="section-title">
            <div>
              <h2 id="catalogo-title">Productos</h2>
            </div>
            <span className="muted">
              {cargando ? "Consultando…" : `${productos.length} productos`}
            </span>
          </div>
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
              placeholder="Buscar por nombre de producto…"
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
          <label className="mobile-category">
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
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
          {cargando && productos.length > 0 && (
            <p className="stock-update" role="status">
              Actualizando disponibilidad…
            </p>
          )}
          {error && productos.length > 0 && (
            <div className="notice error" role="alert">
              <p>{error} Verificá el stock antes de continuar.</p>
              <button
                className="secondary"
                onClick={() => void cargarProductos()}
              >
                Volver a intentar
              </button>
            </div>
          )}
          {cargando && !productos.length ? (
            <div className="empty-state" role="status">
              <h3>Consultando productos</h3>
              <p>
                {demora
                  ? "El servidor está tardando en responder. Seguimos intentando cargar los productos."
                  : "Estamos verificando precios y disponibilidad."}
              </p>
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
                  : "Todavía no hay productos cargados."}
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
            <div className="product-grid">
              {filtrados.map((p, index) => {
                const enCarrito =
                  carrito.find((i) => i.producto_id === p.id)?.cantidad ?? 0;
                return (
                  <article
                    key={p.id}
                    className={`product-card ${enCarrito ? "in-sale" : ""}`}
                    aria-label={p.nombre}
                  >
                    <Foto
                      key={`${p.id}-${p.imagen}`}
                      producto={p}
                      prioritaria={index < 4}
                    />
                    <div className="product-info">
                      <p className="product-category">
                        {p.categoria || "Comunicación IAM"}
                      </p>
                      <h3>{p.nombre}</h3>
                      <p className="product-price">{moneda(p.precio)}</p>
                      <p
                        className={`availability ${p.stock <= 0 ? "unavailable" : ""}`}
                      >
                        {p.stock > 0
                          ? `${p.stock} disponibles${enCarrito ? ` · ${enCarrito} en esta venta` : ""}`
                          : "Sin stock por ahora"}
                      </p>
                      <button
                        className="add-button"
                        aria-label={`Agregar ${p.nombre}`}
                        disabled={
                          guardando ||
                          cargando ||
                          !!error ||
                          p.stock <= enCarrito ||
                          p.precio <= 0
                        }
                        onClick={() => cambiarCantidad(p, enCarrito + 1)}
                      >
                        <span>
                          {p.stock <= 0
                            ? "Sin stock"
                            : p.precio <= 0
                              ? "Precio no disponible"
                              : enCarrito >= p.stock
                                ? "Máximo agregado"
                                : "Agregar"}
                        </span>
                        <svg
                          aria-hidden="true"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside
          ref={panelRef}
          className="order-panel"
          id="pedido"
          aria-labelledby="pedido-title"
        >
          <div className="order-heading">
            <div className="section-title">
              <h2 id="pedido-title">Venta actual</h2>
              <span className="count-badge">{unidades}</span>
            </div>
            <p className="muted">Revisá los productos antes de cobrar.</p>
          </div>
          <div
            className="order-scroll"
            tabIndex={0}
            role="region"
            aria-label="Productos y opciones de cobro"
          >
            {!carrito.length ? (
              <div className="order-empty">
                <h3>Agregá el primer producto</h3>
                <p>Buscá un producto y tocá Agregar para comenzar.</p>
              </div>
            ) : (
              <ul className="order-items">
                {carrito.map((i) => (
                  <li key={i.producto_id}>
                    <div className="order-item-top">
                      <h3>{i.nombre}</h3>
                      <strong>{moneda(i.subtotal)}</strong>
                    </div>
                    <div className="order-item-bottom">
                      <div className="quantity">
                        <button
                          aria-label={`Quitar una unidad de ${i.nombre}`}
                          disabled={guardando || cargando || !!error}
                          onClick={() => {
                            const p = productos.find(
                              (p) => p.id === i.producto_id,
                            );
                            if (p) cambiarCantidad(p, i.cantidad - 1);
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={
                            productos.find((p) => p.id === i.producto_id)
                              ?.stock ?? i.cantidad
                          }
                          aria-label={`Cantidad de ${i.nombre}`}
                          value={i.cantidad}
                          disabled={guardando || cargando || !!error}
                          onChange={(e) => {
                            const p = productos.find(
                              (p) => p.id === i.producto_id,
                            );
                            if (p && Number(e.target.value) >= 1)
                              cambiarCantidad(p, Number(e.target.value));
                          }}
                        />
                        <button
                          aria-label={`Agregar una unidad de ${i.nombre}`}
                          disabled={
                            guardando ||
                            cargando ||
                            !!error ||
                            i.cantidad >=
                              (productos.find((p) => p.id === i.producto_id)
                                ?.stock ?? 0)
                          }
                          onClick={() => {
                            const p = productos.find(
                              (p) => p.id === i.producto_id,
                            );
                            if (p) cambiarCantidad(p, i.cantidad + 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-button"
                        aria-label={`Quitar ${i.nombre} de la venta`}
                        disabled={guardando}
                        onClick={() =>
                          setCarrito((prev) =>
                            prev.filter((x) => x.producto_id !== i.producto_id),
                          )
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <fieldset className="payment-options" disabled={guardando}>
              <legend>Vuelto y deuda</legend>
              {metodoPago === "efectivo" && (
                <>
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
                    value={efectivo || ""}
                    onChange={(e) =>
                      setEfectivo(Math.max(0, Number(e.target.value)))
                    }
                  />
                  {efectivo > 0 && (
                    <p className="change-due">
                      {efectivo >= total
                        ? `Vuelto: ${moneda(efectivo - total)}`
                        : `Faltan: ${moneda(total - efectivo)}`}
                    </p>
                  )}
                </>
              )}
              <label className="debt-label">
                <input
                  type="checkbox"
                  checked={debe}
                  onChange={(e) => setDebe(e.target.checked)}
                />
                El cliente queda debiendo
              </label>
            </fieldset>
            <p className="sale-profit">
              Ganancia estimada:{" "}
              {moneda(carrito.reduce((s, i) => s + i.ganancia, 0))}
            </p>
          </div>
          <div className="order-footer">
            <fieldset className="fixed-payment" disabled={guardando}>
              <legend>Medio de pago</legend>
              <div className="payment-toggle">
                <button
                  type="button"
                  aria-pressed={metodoPago === "efectivo"}
                  onClick={() => setMetodoPago("efectivo")}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  aria-pressed={metodoPago === "transferencia"}
                  onClick={() => setMetodoPago("transferencia")}
                >
                  Transferencia
                </button>
              </div>
            </fieldset>
            <div className="order-total">
              <span>Total</span>
              <strong>{moneda(total)}</strong>
            </div>
            <button
              className="primary checkout"
              disabled={
                !carrito.length ||
                guardando ||
                cargando ||
                !!error ||
                cargandoEventos ||
                errorEventos
              }
              onClick={() => void confirmar()}
            >
              {guardando ? "Registrando…" : "Registrar venta"}{" "}
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </button>
            <p className="checkout-note">
              Se registra con {metodoPago}
              {debe ? " · Pago pendiente" : ""}.
            </p>
          </div>
        </aside>
      </div>
      {unidades > 0 && (
        <div className="mobile-order">
          <label className="mobile-payment">
            Cobro
            <select
              aria-label="Medio de pago móvil"
              disabled={guardando}
              value={metodoPago}
              onChange={(e) =>
                setMetodoPago(e.target.value as "efectivo" | "transferencia")
              }
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
            {debe && <span>Pago pendiente</span>}
          </label>
          <a href="#pedido">
            {unidades} {unidades === 1 ? "unidad" : "unidades"} ·{" "}
            {moneda(total)}
            <small>Ver detalle · {metodoPago}</small>
          </a>
          <button
            disabled={
              guardando ||
              cargando ||
              !!error ||
              cargandoEventos ||
              errorEventos
            }
            onClick={() => void confirmar()}
          >
            {guardando ? "Registrando…" : "Registrar venta"}
          </button>
        </div>
      )}
    </div>
  );
}
