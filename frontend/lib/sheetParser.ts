import * as XLSX from "xlsx";

export interface ParsedSheet {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function parseExcelFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // take the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
        });

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        resolve({ columns, rows });
      } catch (err) {
        reject(new Error("Failed to parse file"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}