export type Errores = Record<string, string>;

const MAX_IMPORTE = 99_999_999;
const mismoTexto = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
const aNumero = (v: string | number) =>
  typeof v === "number" ? v : v.trim() === "" ? NaN : Number(v);

export function validarImporte(
  valor: string | number,
  { permiteCero = true } = {},
): string {
  const n = aNumero(valor);
  if (Number.isNaN(n)) return "Ingresá un importe.";
  if (!Number.isFinite(n)) return "Ingresá un número válido.";
  if (n < 0) return "No puede ser negativo.";
  if (!permiteCero && n === 0) return "Tiene que ser mayor a cero.";
  if (n > MAX_IMPORTE) return "El importe es demasiado alto.";
  if (Math.round(n * 100) !== n * 100) return "Usá hasta dos decimales.";
  return "";
}

export function validarProducto(
  d: {
    nombre: string;
    categoria?: string;
    precio: string | number;
    costo: string | number;
  },
  otrosNombres: string[] = [],
): Errores {
  const e: Errores = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = "Ingresá el nombre del producto.";
  else if (nombre.length > 80) e.nombre = "Usá hasta 80 caracteres.";
  else if (otrosNombres.some((n) => mismoTexto(n, nombre)))
    e.nombre = "Ya hay un producto con ese nombre.";
  if ((d.categoria ?? "").trim().length > 40)
    e.categoria = "Usá hasta 40 caracteres.";
  const precio = validarImporte(d.precio, { permiteCero: false });
  if (precio) e.precio = precio;
  const costo = validarImporte(d.costo);
  if (costo) e.costo = costo;
  return e;
}

export function validarImagen(file: File): string {
  if (!file.type.startsWith("image/")) return "El archivo no es una imagen.";
  if (file.size > 5 * 1024 * 1024) return "La imagen supera los 5 MB.";
  return "";
}

export function validarEvento(
  d: { nombre: string; fecha: string; descripcion: string },
  otrosNombres: string[] = [],
): Errores {
  const e: Errores = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = "Ingresá el nombre del evento.";
  else if (nombre.length > 80) e.nombre = "Usá hasta 80 caracteres.";
  else if (otrosNombres.some((n) => mismoTexto(n, nombre)))
    e.nombre = "Ya hay un evento con ese nombre.";
  if (!d.fecha) e.fecha = "Elegí la fecha del evento.";
  else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha) ||
    Number.isNaN(new Date(d.fecha).getTime())
  )
    e.fecha = "La fecha no es válida.";
  if (d.descripcion.length > 500)
    e.descripcion = "Usá hasta 500 caracteres.";
  return e;
}
