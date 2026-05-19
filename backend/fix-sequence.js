"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prismaClient_1 = __importDefault(require("./src/utils/prismaClient"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Sincronizando secuencias de IDs en la base de datos...');
            // Producto
            yield prismaClient_1.default.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Producto"', 'id'), coalesce(max(id),0) + 1, false) FROM "Producto";`);
            console.log('✅ Secuencia de Producto sincronizada');
            // Evento
            yield prismaClient_1.default.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Evento"', 'id'), coalesce(max(id),0) + 1, false) FROM "Evento";`);
            console.log('✅ Secuencia de Evento sincronizada');
            // Venta
            yield prismaClient_1.default.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Venta"', 'id'), coalesce(max(id),0) + 1, false) FROM "Venta";`);
            console.log('✅ Secuencia de Venta sincronizada');
            // DetalleVenta
            yield prismaClient_1.default.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"DetalleVenta"', 'id'), coalesce(max(id),0) + 1, false) FROM "DetalleVenta";`);
            console.log('✅ Secuencia de DetalleVenta sincronizada');
            console.log('Todas las secuencias fueron actualizadas exitosamente.');
        }
        catch (error) {
            console.error('Error al sincronizar secuencias:', error);
        }
        finally {
            yield prismaClient_1.default.$disconnect();
        }
    });
}
main();
