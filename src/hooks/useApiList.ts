import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(65000),
  });
  if (!res.ok) {
    let message = "No se pudo completar la operación. Volvé a intentar.";
    try {
      const data = await res.json();
      if (typeof data.error === "string") message = data.error;
    } catch {
      /* Keep the readable fallback. */
    }
    throw new Error(message);
  }
  return res.json();
}
export const errorMessage = (e: unknown) =>
  e instanceof Error && e.name !== "TypeError" && e.name !== "TimeoutError"
    ? e.message
    : "No pudimos conectar con el servidor. Revisá la conexión y volvé a intentar.";
export function useApiList<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort("timeout"), 65000);
    let active = true;
    setLoading(true);
    setError("");
    requestJson<T[]>(path, { signal: controller.signal })
      .then((items) => {
        if (!Array.isArray(items))
          throw new Error(
            "La respuesta no tiene el formato esperado. Volvé a intentar.",
          );
        if (active) setData(items);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [path, version]);
  return { data, setData, loading, error, reload };
}
