/**
 * Generación y descarga de CSV.
 *
 * Sin librería a propósito: exportar es formatear texto, y `papaparse` solo
 * compensa al *parsear* entrada ajena. Ver INVESTIGACION_TECNICA_2026.md §7.
 */

/** Escapa una celda: comillas dobladas y siempre entrecomillado. */
function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** Convierte una matriz de filas en texto CSV. */
export function toCsv(rows: unknown[][]): string {
  return rows.map(row => row.map(escapeCell).join(",")).join("\n");
}

/**
 * Descarga las filas como archivo CSV.
 *
 * Lleva BOM (``) porque sin él Excel abre el UTF-8 como Latin-1 y
 * destroza los acentos — que en una lista de invitados están por todas partes.
 */
export function downloadCsv(filename: string, rows: unknown[][]): void {
  const blob = new Blob(["\ufeff" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
