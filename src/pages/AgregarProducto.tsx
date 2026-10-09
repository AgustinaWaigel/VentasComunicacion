import { useEffect, useRef, useState } from "react";
import {
  PageHeader,
  Feedback,
  FieldError,
  money,
} from "../components/AdminUI";
import {
  validarImagen,
  validarProducto,
  type Errores,
} from "../utils/validar";
import { errorMessage, requestJson } from "../hooks/useApiList";
export default function AgregarProducto() {
  const [nombre, setNombre] = useState(""),
    [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState(""),
    [costo, setCosto] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [imagen, setImagen] = useState<File | null>(null),
    [preview, setPreview] = useState("");
  const [mensaje, setMensaje] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const busy = useRef(false),
    fileRef = useRef<HTMLInputElement>(null),
    nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!imagen) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(imagen);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen]);
  const clearImage = () => {
    setImagen(null);
    if (fileRef.current) fileRef.current.value = "";
  };
  const clear = () => {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setCosto("");
    setErrores({});
    clearImage();
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const encontrados = validarProducto({ nombre, categoria, precio, costo });
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setMensaje("");
      setError("Revisá los campos marcados antes de guardar.");
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    setMensaje("");
    const body = new FormData();
    Object.entries({
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      precio,
      costo,
    }).forEach(([key, value]) => body.append(key, value));
    if (imagen) body.append("imagen", imagen);
    try {
      await requestJson("/api/productos", { method: "POST", body });
      clear();
      setMensaje("Producto agregado correctamente. Ya podés cargar otro.");
      nameRef.current?.focus();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <div className="management-page">
      <PageHeader
        title="Agregar producto"
        description="Cargá los datos y la foto para tenerlo listo al registrar una venta."
      />
      <Feedback message={mensaje} />
      <Feedback message={error} error />
      <form onSubmit={submit} className="product-form surface" noValidate>
        <fieldset disabled={saving}>
          <div className="form-columns">
            <section className="form-section">
              <h2>Datos del producto</h2>
              <p className="section-help">
                Nombre, precio y costo son obligatorios.
              </p>
              <label>
                Nombre del producto
                <input
                  ref={nameRef}
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Por ejemplo, Llavero IAM"
                  autoComplete="off"
                  maxLength={80}
                  aria-invalid={!!errores.nombre}
                />
                <FieldError message={errores.nombre} />
              </label>
              <label>
                Categoría <span className="optional">(opcional)</span>
                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  list="categorias"
                  placeholder="Elegí o escribí una categoría"
                  maxLength={40}
                  aria-invalid={!!errores.categoria}
                />
                <FieldError message={errores.categoria} />
                <datalist id="categorias">
                  {[
                    "Stickers",
                    "Accesorios",
                    "Decoración",
                    "Llaveros",
                    "Otros",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </datalist>
              </label>
              <div className="form-grid">
                <label>
                  Precio de venta ($)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0,00"
                    aria-invalid={!!errores.precio}
                  />
                  <FieldError message={errores.precio} />
                </label>
                <label>
                  Costo ($)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="0,00"
                    aria-invalid={!!errores.costo}
                  />
                  <FieldError message={errores.costo} />
                </label>
              </div>
              {(precio || costo) && (
                <div className="calculation">
                  <span>Ganancia por unidad</span>
                  <strong>{money(Number(precio) - Number(costo))}</strong>
                  <small>
                    {Number(costo) > 0
                      ? `${(((Number(precio) - Number(costo)) / Number(costo)) * 100).toFixed(1)}% sobre el costo`
                      : "Costo no ingresado"}
                  </small>
                </div>
              )}
              {Number(costo) > Number(precio) && (
                <p className="notice">
                  El costo supera el precio: este producto se venderá con
                  pérdida.
                </p>
              )}
            </section>
            <section className="form-section">
              <h2>Foto del producto</h2>
              <p className="section-help">
                Opcional. Una imagen ayuda a reconocerlo al vender.
              </p>
              <div className={`upload-preview ${preview ? "has-image" : ""}`}>
                {preview ? (
                  <img src={preview} alt="Vista previa del producto" />
                ) : (
                  <p>La foto aparecerá acá.</p>
                )}
              </div>
              <label>
                Elegir imagen
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const problema = validarImagen(file);
                    setErrores((prev) => ({ ...prev, imagen: problema }));
                    if (problema) {
                      e.target.value = "";
                      return;
                    }
                    setImagen(file);
                  }}
                />
                <FieldError message={errores.imagen} />
              </label>
              <p className="section-help">
                JPG, PNG u otro formato de imagen. Máximo 5 MB.
              </p>
              {imagen && (
                <button
                  className="text-button"
                  type="button"
                  onClick={clearImage}
                >
                  Quitar imagen
                </button>
              )}
            </section>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary">
              {saving ? "Guardando…" : "Guardar producto"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                clear();
                setError("");
                setMensaje("");
              }}
            >
              Limpiar formulario
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
