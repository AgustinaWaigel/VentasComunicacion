import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Feedback,
  ListState,
  ProductThumb,
  FieldError,
  money,
  searchText,
} from "../components/AdminUI";
import { useApiList, requestJson, errorMessage } from "../hooks/useApiList";
import { useConfirm } from "../hooks/useConfirm";
import {
  validarImagen,
  validarProducto,
  type Errores,
} from "../utils/validar";
interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
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
  const [errores, setErrores] = useState<Errores>({});
  const busy = useRef(false);
  const { confirmar, dialogo } = useConfirm();
  const filtered = productos
    .filter(
      (p) =>
        searchText(p.nombre).includes(searchText(busqueda)) &&
        (!categoria || p.categoria === categoria),
    )
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
        numeric: true,
      }),
    );
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy.current) return;
    const encontrados = validarProducto(
      draft,
      productos.filter((p) => p.id !== draft.id).map((p) => p.nombre),
    );
    setErrores((prev) => ({ imagen: prev.imagen, ...encontrados }));
    if (Object.keys(encontrados).length) {
      setSaveError("Revisá los campos marcados antes de guardar.");
      return;
    }
    busy.current = true;
    setSaving(true);
    setSaveError("");
    setMensaje("");
    const body = new FormData();
    Object.entries({
      nombre: draft.nombre.trim(),
      categoria: (draft.categoria || "").trim(),
      precio: String(draft.precio),
      costo: String(draft.costo),
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
      !(await confirmar({
        titulo: `¿Eliminar “${p.nombre}”?`,
        texto:
          "Deja de aparecer para vender y en el catálogo. No se puede deshacer.",
        accion: "Eliminar producto",
        peligro: true,
      })) ||
      busy.current
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
        description="Corregí nombres, precios y fotos. Los cambios se ven al instante al vender."
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
      {!loading && !error && filtered.length > 0 && (
        <div className="surface table-surface">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="col-photo">
                  <span className="sr-only">Foto</span>
                </th>
                <th>Producto</th>
                <th className="col-category">Categoría</th>
                <th className="col-number">Precio</th>
                <th className="col-number col-cost">Costo</th>
                <th className="col-number col-profit">Ganancia</th>
                <th className="col-actions">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            {filtered.map((p) => (
              <tbody
                key={p.id}
                className={`inventory-record ${draft?.id === p.id ? "is-editing" : ""}`}
              >
                <tr>
                  <td className="col-photo">
                    <ProductThumb
                      key={p.imagen}
                      image={p.imagen}
                      name={p.nombre}
                    />
                  </td>
                  <th scope="row" className="inventory-name">
                    {p.nombre}
                  </th>
                  <td className="col-category">{p.categoria || "—"}</td>
                  <td className="col-number inventory-price">
                    {money(p.precio)}
                  </td>
                  <td className="col-number col-cost">{money(p.costo)}</td>
                  <td className="col-number col-profit">
                    {money(p.precio - p.costo)}
                  </td>
                  <td className="col-actions">
                    <button
                      className="secondary"
                      aria-label={`Editar producto ${p.nombre}`}
                      disabled={saving || draft !== null}
                      onClick={() => {
                        setDraft({ ...p });
                        setImage(null);
                        setErrores({});
                        setSaveError("");
                        setMensaje("");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="danger-button"
                      aria-label={`Eliminar ${p.nombre}`}
                      disabled={saving || draft !== null}
                      onClick={() => void remove(p)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
                {draft?.id === p.id && (
                  <tr className="inventory-edit">
                    <td colSpan={7}>
                <form onSubmit={save} noValidate>
                  <fieldset disabled={saving} className="inline-edit">
                    <div className="form-grid">
                      <label>
                        Nombre
                        <input
                          required
                          maxLength={80}
                          aria-invalid={!!errores.nombre}
                          value={draft.nombre}
                          onChange={(e) =>
                            setDraft({ ...draft, nombre: e.target.value })
                          }
                        />
                        <FieldError message={errores.nombre} />
                      </label>
                      <label>
                        Categoría
                        <input
                          maxLength={40}
                          aria-invalid={!!errores.categoria}
                          value={draft.categoria || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, categoria: e.target.value })
                          }
                        />
                        <FieldError message={errores.categoria} />
                      </label>
                    </div>
                    <div className="form-grid">
                      {(["precio", "costo"] as const).map((key) => (
                        <label key={key}>
                          {key === "precio" ? "Precio de venta ($)" : "Costo ($)"}
                          <input
                            type="number"
                            inputMode="decimal"
                            required
                            min="0"
                            step="0.01"
                            aria-invalid={!!errores[key]}
                            value={draft[key]}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                [key]: Number(e.target.value),
                              })
                            }
                          />
                          <FieldError message={errores[key]} />
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
                          const problema = file ? validarImagen(file) : "";
                          setErrores((prev) => ({ ...prev, imagen: problema }));
                          if (problema) {
                            e.target.value = "";
                            return;
                          }
                          setImage(file || null);
                        }}
                      />
                      <FieldError message={errores.imagen} />
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
                          setErrores({});
                        }}
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
      )}
      {dialogo}
    </div>
  );
}
