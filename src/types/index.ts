export interface ItemCarrito {
    producto_id: number;
    nombre: string;
    cantidad: number;
    subtotal: number;
    ganancia: number;
}

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    costo: number;
    stock: number;
    imagen?: string;
}

export interface Evento {
    id: number;
    nombre: string;
    fecha: string;
    descripcion?: string;
    activo: boolean;
}

export interface Venta {
    id: number;
    fecha: string;
    total: number;
    ganancia: number;
    metodoPago?: string;
    efectivo?: number;
    debe?: boolean;
    evento_id?: number;
}
