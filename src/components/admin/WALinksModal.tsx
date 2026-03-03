import { useMemo, useState } from "react";

import { Check, Copy, MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";

import { Guest } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Filter = "all" | "pending" | "no-phone";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  eventSlug: string;
}

function buildMessage(name: string, url: string): string {
  return `¡Hola ${name}!\n\nTe invitamos cordialmente a nuestra boda.\n\nAccede a tu invitación digital aquí: ${url}\n\n¡Esperamos celebrar contigo este día tan especial!`;
}

function buildWAUrl(phone: string, message: string): string {
  let p = phone.replace(/\D/g, "");
  if (!p.startsWith("57")) p = "57" + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

const WALinksModal = ({ open, onOpenChange, guests, eventSlug }: Props) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const base = `${window.location.origin}/${eventSlug}`;

  const filtered = useMemo(() => {
    if (filter === "pending")  return guests.filter(g => !g.confirmed);
    if (filter === "no-phone") return guests.filter(g => !g.phone?.trim());
    return guests;
  }, [guests, filter]);

  const copyLink = (guest: Guest) => {
    const url = `${base}?code=${guest.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyAll = () => {
    const text = filtered
      .map(g => `${g.name}: ${base}?code=${g.code}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      toast.success(`${filtered.length} links copiados`);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  const filterBtns: { key: Filter; label: string }[] = [
    { key: "all",      label: `Todos (${guests.length})` },
    { key: "pending",  label: `No confirmados (${guests.filter(g => !g.confirmed).length})` },
    { key: "no-phone", label: `Sin teléfono (${guests.filter(g => !g.phone?.trim()).length})` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Links de invitación por WhatsApp</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Copiar todo */}
        <div className="flex items-center justify-between gap-2 py-1 border-b">
          <p className="text-xs text-muted-foreground">
            {filtered.length} invitado(s) — haz clic en WA para abrir chat, o copia el link individualmente.
          </p>
          <Button size="sm" variant="outline" onClick={copyAll} disabled={filtered.length === 0}>
            {copiedAll ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            Copiar todos los links
          </Button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No hay invitados en este filtro.</p>
          )}
          {filtered.map(guest => {
            const url     = `${base}?code=${guest.code}`;
            const message = buildMessage(guest.name, url);
            const hasPhone = !!guest.phone?.trim();

            return (
              <div
                key={guest.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/40"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{guest.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{guest.code}</span>
                    {guest.confirmed
                      ? <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 py-0">Confirmado</Badge>
                      : <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300 py-0">Pendiente</Badge>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{url}</p>
                  {hasPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{guest.phone}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => copyLink(guest)}
                    title="Copiar link"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === guest.id
                      ? <Check className="h-4 w-4 text-green-600" />
                      : <Copy className="h-4 w-4" />}
                  </button>
                  {hasPhone && (
                    <button
                      onClick={() => window.open(buildWAUrl(guest.phone!, message), "_blank")}
                      title="Abrir en WhatsApp"
                      className="p-1.5 rounded hover:bg-green-50 text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WALinksModal;
