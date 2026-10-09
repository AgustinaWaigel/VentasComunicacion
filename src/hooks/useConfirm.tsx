import { useCallback, useEffect, useRef, useState } from "react";

interface Pregunta {
  titulo: string;
  texto?: string;
  accion: string;
  peligro?: boolean;
}

// Cuadro de confirmación propio: `await confirmar({...})` devuelve true o false.
export function useConfirm() {
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const confirmar = useCallback(
    (p: Pregunta) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setPregunta(p);
      }),
    [],
  );
  const responder = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPregunta(null);
  };
  useEffect(() => {
    if (pregunta && !ref.current?.open) ref.current?.showModal();
  }, [pregunta]);
  useEffect(() => () => resolver.current?.(false), []);
  const dialogo = pregunta && (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        responder(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) responder(false);
      }}
    >
      <div className="confirm-body">
        <h2 id="confirm-title">{pregunta.titulo}</h2>
        {pregunta.texto && <p>{pregunta.texto}</p>}
        <div className="confirm-actions">
          <button
            className="secondary"
            autoFocus
            onClick={() => responder(false)}
          >
            Cancelar
          </button>
          <button
            className={pregunta.peligro ? "danger-solid" : "primary"}
            onClick={() => responder(true)}
          >
            {pregunta.accion}
          </button>
        </div>
      </div>
    </dialog>
  );
  return { confirmar, dialogo };
}
