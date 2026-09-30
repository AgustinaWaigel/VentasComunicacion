import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Feedback,
  ListState,
  ProductThumb,
  money,
  searchText,
} from "../components/AdminUI";
import { useApiList, requestJson, errorMessage } from "../hooks/useApiList";
interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
}
export default function EditarProductos() {
  const {
    data: productos,
    setData: setProductos,
    loading,
    error,
    reload,
  } = useApiList<Producto>("/api/productos");
  const [busqueda, setBusqueda] = useState(""),
    [categoria, setCategoria] = useState("");
  const [draft, setDraft] = useState<Producto | null>(null),
    [image, setImage] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState(""),
    [saveError, setSaveError] = useState(""),
    [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const filtered = productos.filter(
    (p) =>
      searchText(p.nombre).includes(searchText(busqueda)) &&
      (!categoria || p.categoria === categoria),
  );
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy.current) return;
    if (
      !draft.nombre.trim() ||
      draft.precio < 0 ||
      draft.costo < 0 ||
      draft.stock < 0 ||
      !Number.isInteger(draft.stock)
    ) {
      setSaveError("Revisá el nombre, los precios y el stock.");
      return;
    }
    busy.current = true;
    setSaving(true);
    setSaveError("");
    setMensaje("");
    const body = new FormData();
    Object.entries({
      nombre: draft.nombre,
      categoria: draft.categoria || "",
      precio: String(draft.precio),
      costo: String(draft.costo),
      stock: String(draft.stock),
    }).forEach(([k, v]) => body.append(k, v));
    if (image) body.append("imagen", image);
    try {
      const item = await requestJson<Producto>(`/api/productos/${draft.id}`, {
        method: "PUT",
        body,
      });
      setProductos((prev) => prev.map((p) => (p.id === item.id ? item : p)));
      setDraft(null);
      setImage(null);
      setMensaje("Cambios guardados correctamente.");
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const remove = async (p: Producto) => {
    if (
      busy.current ||
      !confirm(`¿Eliminar “${p.nombre}”? Esta acción no se puede deshacer.`)
    )
      return;
    busy.current = true;
    setSaving(true);
    setSaveError("");
    setMensaje("");
    try {
      await requestJson(`/api/productos/${p.id}`, { method: "DELETE" });
      setProductos((prev) => prev.filter((x) => x.id !== p.id));
      setMensaje("Producto eliminado.");
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <div className="management-page">
      <PageHeader
        title="Productos"
        description="Revisá precios y disponibilidad. Editá los datos sin perder de vista el producto."
      >
        <Link className="primary" to="/productos">
          Agregar producto
        </Link>
      </PageHeader>
      <Feedback message={mensaje} />
      <Feedback message={saveError} error />
      <div className="filter-bar">
        <label>
          Buscar producto
          <input
            type="search"
            placeholder="Nombre del producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <label>
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {[
              ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <span className="result-count">{filtered.length} productos</span>
      </div>
      <ListState
        loading={loading}
        error={error}
        empty={!filtered.length}
        onRetry={reload}
      >
        <h2>
          {productos.length
            ? "No hay coincidencias"
            : "Todavía no hay productos"}
        </h2>
        <p>
          {productos.length
            ? "Probá otro nombre o quitá los filtros."
            : "Agregá el primer producto para empezar a vender."}
        </p>
        {productos.length > 0 && (
          <button
            className="secondary"
            onClick={() => {
              setBusqueda("");
              setCategoria("");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </ListState>
      {!loading && !error && (
        <div className="record-list">
          {filtered.map((p) => (
            <article
              className="surface inventory-record"
              key={p.id}
              aria-label={p.nombre}
            >
              <div className="record-heading">
                <ProductThumb key={p.imagen} image={p.imagen} name={p.nombre} />
                <div className="record-title">
                  <h2>{p.nombre}</h2>
                  <p>{p.categoria || "Sin categoría"}</p>
                </div>
                <span className={`state-tag ${p.stock > 0 ? "" : "neutral"}`}>
                  {p.stock > 0 ? `${p.stock} disponibles` : "Sin stock"}
                </span>
              </div>
              {draft?.id === p.id ? (
                <form onSubmit={save}>
                  <fieldset disabled={saving} className="inline-edit">
                    <div className="form-grid">
                      <label>
                        Nombre
                        <input
                          required
                          value={draft.nombre}
                          onChange={(e) =>
                            setDraft({ ...draft, nombre: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Categoría
                        <input
                          value={draft.categoria || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, categoria: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-grid three">
                      {(["precio", "costo", "stock"] as const).map((key) => (
                        <label key={key}>
                          {key === "precio"
                            ? "Precio de venta ($)"
                            : key === "costo"
                              ? "Costo ($)"
                              : "Stock"}
                          <input
                            type="number"
                            required
                            min="0"
                            step={key === "stock" ? "1" : "0.01"}
                            value={draft[key]}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                [key]: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label>
                      Cambiar imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (
                            file &&
                            (!file.type.startsWith("image/") ||
                              file.size > 5 * 1024 * 1024)
                          ) {
                            setSaveError("Elegí una imagen de hasta 5 MB.");
                            e.target.value = "";
                            return;
                          }
                          setImage(file || null);
                        }}
                      />
                    </label>
                    <div className="record-actions">
                      <button className="primary" type="submit">
                        {saving ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setDraft(null);
                          setImage(null);
                          setSaveError("");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </fieldset>
                </form>
              ) : (
                <>
                  <dl className="record-facts">
                    <div>
                      <dt>Precio de venta</dt>
                      <dd>{money(p.precio)}</dd>
                    </div>
                    <div>
                      <dt>Costo</dt>
                      <dd>{money(p.costo)}</dd>
                    </div>
                    <div>
                      <dt>Ganancia por unidad</dt>
                      <dd>{money(p.precio - p.costo)}</dd>
                    </div>
                  </dl>
                  <div className="record-actions">
                    <button
                      className="secondary"
                      disabled={saving || draft !== null}
                      onClick={() => {
                        setDraft({ ...p });
                        setImage(null);
                        setSaveError("");
                        setMensaje("");
                      }}
                    >
                      Editar producto
                    </button>
                    <button
                      className="danger-button"
                      disabled={saving || draft !== null}
                      onClick={() => void remove(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
