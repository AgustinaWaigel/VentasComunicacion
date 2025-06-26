import type { ItemCarrito } from "../types";

interface Props {
  mostrar: boolean;
  carrito: ItemCarrito[];
  total: number;
  efectivo: number;
  setEfectivo: (valor: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  metodoPago: "efectivo" | "transferencia";
  setMetodoPago: (m: "efectivo" | "transferencia") => void;
  debe: boolean;
  setDebe: (valor: boolean) => void;
}

export default function ModalResumenVenta({
  mostrar,
  carrito,
  total,
  efectivo,
  setEfectivo,
  onClose,
  onConfirm,
  metodoPago,
  setMetodoPago,
  debe,
  setDebe,
}: Props) {
  if (!mostrar) return null;

  const vuelto = efectivo - total;
  const puedeConfirmar = true; // Siempre se puede confirmar, el efectivo es solo para calcular vuelto

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">🧾 Resumen de Venta</h3>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Lista de productos compacta */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Productos:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {carrito.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                  <span className="text-gray-700">{item.nombre} × {item.cantidad}</span>
                  <span className="font-semibold text-green-600">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total destacado */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-blue-800">
              💰 Total: ${total.toFixed(2)}
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💳 Método de pago:
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as "efectivo" | "transferencia")}
              className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">📱 Transferencia</option>
            </select>
          </div>

          {/* Efectivo recibido */}
          {metodoPago === "efectivo" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💵 Efectivo recibido (opcional - solo para calcular vuelto):
              </label>
              <input
                type="number"
                value={efectivo}
                onChange={(e) => setEfectivo(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                min={0}
                placeholder="0.00"
              />
              
              {efectivo > 0 && (
                <div className="mt-2 p-2 rounded-lg text-sm">
                  {efectivo >= total ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-2 rounded">
                      💚 Vuelto: ${vuelto.toFixed(2)}
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 text-blue-600 p-2 rounded">
                      ℹ️ Con ${efectivo.toFixed(2)} faltarían ${(total - efectivo).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checkbox debe */}
          <label className="flex items-center gap-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <input
              type="checkbox"
              checked={debe}
              onChange={(e) => setDebe(e.target.checked)}
              className="rounded"
            />
            <span>📝 El cliente queda debiendo</span>
          </label>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!puedeConfirmar}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all transform hover:scale-105"
            >
              ✅ Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
