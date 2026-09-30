import { useEffect, useRef, useState, type ReactNode } from "react";
import { API_BASE_URL } from "../config/api";
export const money = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export const dateLabel = (value: string) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString("es-AR");
export const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}
export function Feedback({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  const noticeRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) noticeRef.current?.scrollIntoView({ block: "nearest" });
  }, [message]);
  return message ? (
    <p
      ref={noticeRef}
      role={error ? "alert" : "status"}
      className={`notice ${error ? "error" : "success"}`}
    >
      {message}
    </p>
  ) : null;
}
export function ListState({
  loading,
  error,
  empty,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  onRetry: () => void;
  children?: ReactNode;
}) {
  if (error)
    return (
      <div className="empty-state" role="alert">
        <h2>No pudimos cargar la información</h2>
        <p>{error}</p>
        <button className="secondary" onClick={onRetry}>
          Volver a intentar
        </button>
      </div>
    );
  if (loading)
    return (
      <div className="empty-state" role="status">
        <h2>Cargando información</h2>
        <p>Estamos consultando los datos actualizados.</p>
      </div>
    );
  if (empty) return <div className="empty-state">{children}</div>;
  return null;
}
export function ProductThumb({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="inventory-photo">
      {image && !failed ? (
        <img
          src={`${API_BASE_URL}/uploads/${encodeURIComponent(image)}`}
          alt={name}
          width="80"
          height="80"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>Sin foto</span>
      )}
    </div>
  );
}
