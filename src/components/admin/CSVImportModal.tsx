import { useRef, useState } from "react";

import { Download, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CSVRow {
  code: string;
  name: string;
  email: string;
  phone: string;
  maxGuests: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: { code: string; reason: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_HEADERS = "code,name,email,phone,maxGuests";
const TEMPLATE_EXAMPLE = [
  "ABC123,Juan García,juan@ejemplo.com,+57 300 1234567,2",
  "XYZ456,María López,,,1",
  "DEF789,Carlos Ruiz,,+57 310 9876543,3",
].join("\n");

function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detect if first line is headers
  const firstLower = lines[0].toLowerCase().replace(/\s/g, "");
  const hasHeader = firstLower.startsWith("code") || firstLower.startsWith("código");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .filter(l => l.trim())
    .map(line => {
      // Simple CSV split respecting quoted fields
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cols.push(current); current = ""; continue; }
        current += ch;
      }
      cols.push(current);
      return {
        code:      (cols[0] ?? "").trim(),
        name:      (cols[1] ?? "").trim(),
        email:     (cols[2] ?? "").trim(),
        phone:     (cols[3] ?? "").trim(),
        maxGuests: (cols[4] ?? "1").trim() || "1",
      };
    })
    .filter(r => r.code || r.name); // drop empty rows
}

const CSVImportModal = ({ open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDownloadTemplate = () => {
    const content = TEMPLATE_HEADERS + "\n" + TEMPLATE_EXAMPLE;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-invitados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al importar");
      }
      const data: ImportResult = await res.json();
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      if (data.created > 0) toast.success(`${data.created} invitado(s) importado(s)`);
      if (data.skipped > 0) toast(`${data.skipped} omitido(s) por código duplicado`, { icon: "⚠️" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar invitados desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Format description */}
          <div className="rounded-md bg-muted p-4 text-sm space-y-1">
            <p className="font-medium">Formato del archivo CSV:</p>
            <p className="font-mono text-xs text-muted-foreground">{TEMPLATE_HEADERS}</p>
            <ul className="text-muted-foreground list-disc list-inside text-xs mt-1 space-y-0.5">
              <li><span className="font-medium">code</span> — obligatorio, único por evento (ej: ABC123)</li>
              <li><span className="font-medium">name</span> — obligatorio (nombre del invitado)</li>
              <li><span className="font-medium">email, phone</span> — opcionales</li>
              <li><span className="font-medium">maxGuests</span> — opcional, por defecto 1</li>
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Descargar plantilla
            </Button>
          </div>

          {/* File picker */}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {fileName || "Seleccionar archivo CSV"}
            </Button>
            {rows.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {rows.length} fila(s) detectada(s)
              </p>
            )}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Vista previa {rows.length > 5 ? `(primeras 5 de ${rows.length})` : ""}
              </p>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {["Código", "Nombre", "Email", "Teléfono", "Cupos"].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                        <td className="px-2 py-1 font-mono">{r.code || <span className="text-destructive">vacío</span>}</td>
                        <td className="px-2 py-1">{r.name || <span className="text-destructive">vacío</span>}</td>
                        <td className="px-2 py-1 text-muted-foreground">{r.email || "—"}</td>
                        <td className="px-2 py-1 text-muted-foreground">{r.phone || "—"}</td>
                        <td className="px-2 py-1">{r.maxGuests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-md border p-4 space-y-2">
              <p className="font-medium text-sm">Resultado de la importación</p>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600 font-semibold">✓ {result.created} creados</span>
                {result.skipped > 0 && (
                  <span className="text-yellow-600 font-semibold">⚠ {result.skipped} omitidos (duplicados)</span>
                )}
                {result.errors.length > 0 && (
                  <span className="text-destructive font-semibold">✗ {result.errors.length} errores</span>
                )}
              </div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e.code}: {e.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result ? "Cerrar" : "Cancelar"}
            </Button>
            {!result && (
              <Button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
              >
                {importing ? "Importando..." : `Importar ${rows.length > 0 ? rows.length + " invitados" : ""}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
