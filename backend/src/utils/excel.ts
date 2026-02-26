import fs from "fs";
import * as XLSX from "xlsx";

export function leerExcel(filePath: string, sheet = "Hoja1"): any[] {
  if (!fs.existsSync(filePath)) return [];
  const workbook = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet] || {}, { defval: "" });
  return data;
}

export function guardarExcel(filePath: string, data: any[], sheet = "Hoja1") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filePath);
}

export function asegurarExcel(filePath: string, sheet = "Hoja1") {
  if (!fs.existsSync(filePath)) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, filePath);
  }
}
