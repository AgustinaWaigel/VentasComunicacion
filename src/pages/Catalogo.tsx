import { useState } from "react";
import { PageHeader, ListState, money, searchText } from "../components/AdminUI";
import { useApiList } from "../hooks/useApiList";
import { API_BASE_URL } from "../config/api";

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  imagen?: string;
}
const SIN_CATEGORIA = "Otros productos";
const porNombre = (a: string, b: string) =>
  a.localeCompare(b, "es", { sensitivity: "base", numeric: true });

function Foto({ producto }: { producto: Producto }) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className="showcase-photo">
      {producto.imagen && !fallo ? (
        <img
          src={`${API_BASE_URL}/uploads/${encodeURIComponent(producto.imagen)}`}
          alt=""
          width="320"
          height="320"
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
        />
      ) : (
        <span>Sin foto</span>
      )}
    </div>
  );
}

export default function Catalogo() {
  const {
    data: productos,
    loading,
    error,
    reload,
  } = useApiList<Producto>("/api/productos");
  const [busqueda, setBusqueda] = useState(""),
    [categoria, setCategoria] = useState("");
  const categoriaDe = (p: Producto) => p.categoria?.trim() || SIN_CATEGORIA;
  const categorias = [...new Set(productos.map(categoriaDe))].sort((a, b) =>
    a === SIN_CATEGORIA ? 1 : b === SIN_CATEGORIA ? -1 : porNombre(a, b),
  );
  const visibles = productos
    .filter(
      (p) =>
        p.precio > 0 &&
        searchText(p.nombre).includes(searchText(busqueda)) &&
        (!categoria || categoriaDe(p) === categoria),
    )
    .sort((a, b) => porNombre(a.nombre, b.nombre));
  const grupos = categorias
    .map((c) => ({
      nombre: c,
      items: visibles.filter((p) => categoriaDe(p) === c),
    }))
    .filter((g) => g.items.length);
  return (
    <div className="management-page showcase-page">
      <PageHeader
        title="Catálogo"
        description="Todos los productos con su precio, para mostrar o consultar sin abrir una venta."
      >
        <button
          className="secondary"
          disabled={loading || !!error || !visibles.length}
          onClick={() => window.print()}
        >
          Imprimir catálogo
        </button>
      </PageHeader>
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
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <span className="result-count">{visibles.length} productos</span>
      </div>
      <ListState
        loading={loading}
        error={error}
        empty={!visibles.length}
        onRetry={reload}
      >
        <h2>
          {productos.length
            ? "No hay productos con ese filtro"
            : "Todavía no hay productos"}
        </h2>
        <p>
          {productos.length
            ? "Probá otro nombre o elegí todas las categorías."
            : "Cuando cargues productos van a aparecer acá."}
        </p>
        {productos.length > 0 && (
          <button
            className="secondary"
            onClick={() => {
              setBusqueda("");
              setCategoria("");
            }}
          >
            Ver todo el catálogo
          </button>
        )}
      </ListState>
      {!loading &&
        !error &&
        grupos.map((g) => (
          <section
            key={g.nombre}
            className="showcase-group"
            aria-label={g.nombre}
          >
            <h2>
              {g.nombre} <span>{g.items.length}</span>
            </h2>
            <ul className="showcase-grid">
              {g.items.map((p) => (
                <li key={p.id}>
                  <Foto key={p.imagen} producto={p} />
                  <h3>{p.nombre}</h3>
                  <p>{money(p.precio)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
