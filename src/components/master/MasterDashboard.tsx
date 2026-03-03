import React, { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";

import { DEFAULT_ASSETS } from "@/context/AssetContext";
import { DEFAULT_THEME, SERIF_PRESETS } from "@/context/ThemeContext";
import { AdminUser, AssetMap, EventWithStats, GalleryPhoto, SectionsConfig, ThemeConfig, TimelineItem } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUpload from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalStats {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  confirmedGuests: number;
  totalAccesses: number;
}

interface EventFormData {
  slug: string;
  groomName: string;
  brideName: string;
  eventDate: string;
  rsvpDeadline: string;
  isActive: boolean;
  // Venues
  ceremonyTime: string;
  ceremonyName: string;
  ceremonyAddress: string;
  ceremonyMapsUrl: string;
  receptionTime: string;
  receptionName: string;
  receptionAddress: string;
  receptionMapsUrl: string;
  venueName: string;
  venueAddress: string;
  // Texts
  verseText: string;
  verseReference: string;
  heroMessage: string;
  giftMessage: string;
  dressCode: string;
  dressCodeLabel: string;
  dressCodeLadies: string;
  dressCodeGentlemen: string;
  // Families
  parentsBride: string;
  parentsGroom: string;
  godparents: string;
  bridesmaids: string;
  groomsmen: string;
  // Contact & Assets
  groomPhone: string;
  bridePhone: string;
  groomWAMessage: string;
  brideWAMessage: string;
  heroPhotoUrl: string;
  photo2Url: string;
  photo3Url: string;
  audioUrl: string;
  // Section-specific
  announcementText: string;
  timeline: TimelineItem[];
  // Assets
  assets: AssetMap;
  // Theme
  theme: ThemeConfig;
  // Gallery
  gallery: GalleryPhoto[];
  // Sections
  sections: SectionsConfig;
  // RSVP mode
  rsvpMode: "whatsapp" | "form";
  // Labels
  labels: Record<string, string>;
}

interface ClientAdminRow {
  id: string;
  email: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyForm: EventFormData = {
  slug: "", groomName: "", brideName: "", eventDate: "", rsvpDeadline: "",
  isActive: true, ceremonyTime: "", ceremonyName: "", ceremonyAddress: "",
  ceremonyMapsUrl: "", receptionTime: "", receptionName: "", receptionAddress: "",
  receptionMapsUrl: "", venueName: "", venueAddress: "", verseText: "",
  verseReference: "", heroMessage: "", giftMessage: "", dressCode: "",
  dressCodeLabel: "", dressCodeLadies: "", dressCodeGentlemen: "",
  parentsBride: "", parentsGroom: "", godparents: "", bridesmaids: "",
  groomsmen: "", groomPhone: "", bridePhone: "", groomWAMessage: "",
  brideWAMessage: "", heroPhotoUrl: "", photo2Url: "", photo3Url: "",
  audioUrl: "", announcementText: "", timeline: [], gallery: [],
  sections: { showVerse: true, showNames: true, showPhotos: true, showFamily: true, showVenues: true, showTimeline: true, showGifts: true, showGallery: true },
  rsvpMode: "whatsapp",
  assets: {}, theme: {}, labels: {},
};

function eventToForm(ev: EventWithStats): EventFormData {
  return {
    slug: ev.slug,
    groomName: ev.groomName,
    brideName: ev.brideName,
    eventDate: ev.eventDate ? ev.eventDate.slice(0, 10) : "",
    rsvpDeadline: ev.rsvpDeadline ? ev.rsvpDeadline.slice(0, 10) : "",
    isActive: ev.isActive,
    ceremonyTime: ev.ceremonyTime || "",
    ceremonyName: ev.config?.ceremony?.name || "",
    ceremonyAddress: ev.config?.ceremony?.address || "",
    ceremonyMapsUrl: ev.config?.ceremony?.mapsUrl || "",
    receptionTime: ev.receptionTime || "",
    receptionName: ev.config?.reception?.name || "",
    receptionAddress: ev.config?.reception?.address || "",
    receptionMapsUrl: ev.config?.reception?.mapsUrl || "",
    venueName: ev.venueName || "",
    venueAddress: ev.venueAddress || "",
    verseText: ev.config?.verse?.text || "",
    verseReference: ev.config?.verse?.reference || "",
    heroMessage: ev.config?.heroMessage || "",
    giftMessage: ev.config?.giftMessage || "",
    dressCode: ev.dressCode || "",
    dressCodeLabel: ev.config?.dressCode?.label || "",
    dressCodeLadies: ev.config?.dressCode?.ladies || "",
    dressCodeGentlemen: ev.config?.dressCode?.gentlemen || "",
    parentsBride: ev.config?.parents?.bride?.join("\n") || "",
    parentsGroom: ev.config?.parents?.groom?.join("\n") || "",
    godparents: ev.config?.godparents?.join("\n") || "",
    bridesmaids: ev.config?.bridesmaids?.join("\n") || "",
    groomsmen: ev.config?.groomsmen?.join("\n") || "",
    groomPhone: ev.groomPhone || "",
    bridePhone: ev.bridePhone || "",
    groomWAMessage: ev.groomWAMessage || "",
    brideWAMessage: ev.brideWAMessage || "",
    heroPhotoUrl: ev.heroPhotoUrl || "",
    photo2Url: ev.photo2Url || "",
    photo3Url: ev.photo3Url || "",
    audioUrl: ev.audioUrl || "",
    announcementText: ev.config?.announcementText || "",
    timeline: ev.config?.timeline ?? [],
    gallery: ev.config?.gallery ?? [],
    sections: {
      showVerse:    ev.config?.sections?.showVerse    ?? true,
      showNames:    ev.config?.sections?.showNames    ?? true,
      showPhotos:   ev.config?.sections?.showPhotos   ?? true,
      showFamily:   ev.config?.sections?.showFamily   ?? true,
      showVenues:   ev.config?.sections?.showVenues   ?? true,
      showTimeline: ev.config?.sections?.showTimeline ?? true,
      showGifts:    ev.config?.sections?.showGifts    ?? true,
      showGallery:  ev.config?.sections?.showGallery  ?? true,
    },
    rsvpMode: (ev.config?.rsvpMode === "form" ? "form" : "whatsapp") as "whatsapp" | "form",
    assets: (ev.assets as AssetMap) ?? {},
    theme: (ev.theme as ThemeConfig) ?? {},
    labels: (ev.config?.labels as Record<string, string>) ?? {},
  };
}

const ASSET_LABELS: Record<string, string> = {
  background:   "Fondo de pantalla",
  cornerFlower: "Flor esquina",
  bouquet:      "Ramo central",
  sideBouquet:  "Ramo lateral",
  flowers:      "Flores decorativas",
  tornPaper:    "Hoja rasgada",
  church:       "Icono iglesia",
  glasses:      "Icono copas / brindis",
  dinner:       "Icono cena",
  reception:    "Icono recepción",
  waltz:        "Icono vals",
  decorLine:    "Línea decorativa (itinerario)",
  gift:         "Icono regalo",
  envelope:     "Icono sobre",
  entryBg:      "Fondo pantalla de entrada",
  infoBg:       "Fondo pantalla de confirmación",
};

// ─── EventFormModal ───────────────────────────────────────────────────────────

interface EventFormModalProps {
  open: boolean;
  editingEvent: EventWithStats | null;
  onClose: () => void;
  onSaved: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ open, editingEvent, onClose, onSaved }) => {
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const bulkInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(editingEvent ? eventToForm(editingEvent) : emptyForm);
  }, [editingEvent, open]);

  // Cargar Google Font para el preview cuando cambia el selector
  useEffect(() => {
    const fontSerif = form.theme.fontSerif?.trim();
    if (!fontSerif || !SERIF_PRESETS.includes(fontSerif)) return;
    const id = `gfont-${fontSerif.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontSerif.replace(/ /g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
  }, [form.theme.fontSerif]);

  const set = (field: keyof EventFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !editingEvent?.id) return;
    if (bulkInputRef.current) bulkInputRef.current.value = "";

    setBulkUploading(true);
    setBulkProgress({ done: 0, total: files.length });

    const uploaded: { id: string; url: string; caption: string }[] = [];
    await Promise.all(
      files.map(async file => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("eventId", editingEvent.id);
        fd.append("assetType", "gallery");
        try {
          const res = await fetch("/api/master/upload", {
            method: "POST",
            credentials: "include",
            body: fd,
          });
          const data = await res.json();
          if (res.ok && data.url) {
            uploaded.push({ id: crypto.randomUUID(), url: data.url, caption: "" });
          }
        } catch { /* skip failed file */ }
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
      })
    );

    if (uploaded.length) {
      setForm(prev => ({ ...prev, gallery: [...prev.gallery, ...uploaded] }));
    }
    setBulkUploading(false);
    setBulkProgress({ done: 0, total: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingEvent
        ? `/api/master/events/${editingEvent.id}`
        : "/api/master/events";
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(editingEvent ? "Evento actualizado" : "Evento creado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? `Editar: ${editingEvent.slug}` : "Crear nuevo evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-6 mb-1">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="venues">Locales</TabsTrigger>
              <TabsTrigger value="texts">Textos</TabsTrigger>
              <TabsTrigger value="families">Familias</TabsTrigger>
              <TabsTrigger value="timeline">Itinerario</TabsTrigger>
              <TabsTrigger value="sections">Secciones</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="labels">Etiquetas</TabsTrigger>
              <TabsTrigger value="gallery">Galería</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="decor">Decoración</TabsTrigger>
              <TabsTrigger value="tema">Tema</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
            </TabsList>

            {/* ── Tab: Básico ─────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={set("slug")} placeholder="jimena-juan" required />
                </div>
                <div className="space-y-1">
                  <Label>Activo</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="isActive" className="text-sm">Evento activo (público)</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nombre del novio *</Label>
                  <Input value={form.groomName} onChange={set("groomName")} placeholder="Juan" required />
                </div>
                <div className="space-y-1">
                  <Label>Nombre de la novia *</Label>
                  <Input value={form.brideName} onChange={set("brideName")} placeholder="Jimena" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fecha del evento *</Label>
                  <Input type="date" value={form.eventDate} onChange={set("eventDate")} required />
                </div>
                <div className="space-y-1">
                  <Label>Límite RSVP</Label>
                  <Input type="date" value={form.rsvpDeadline} onChange={set("rsvpDeadline")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Modo de confirmación de asistencia</Label>
                <div className="flex gap-6">
                  {(["whatsapp", "form"] as const).map(mode => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rsvpMode"
                        value={mode}
                        checked={form.rsvpMode === mode}
                        onChange={() => setForm(f => ({ ...f, rsvpMode: mode }))}
                        className="accent-primary"
                      />
                      <span className="text-sm">
                        {mode === "whatsapp" ? "WhatsApp (botones)" : "Formulario in-app"}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  «Formulario in-app» permite que el invitado confirme directamente en la invitación sin salir de la app.
                </p>
              </div>
            </TabsContent>

            {/* ── Tab: Locales ────────────────────────────── */}
            <TabsContent value="venues" className="space-y-6 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Ceremonia</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Hora</Label>
                      <Input value={form.ceremonyTime} onChange={set("ceremonyTime")} placeholder="6:00 PM" />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del lugar</Label>
                      <Input value={form.ceremonyName} onChange={set("ceremonyName")} placeholder="Iglesia de San Pedro" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Dirección</Label>
                    <Input value={form.ceremonyAddress} onChange={set("ceremonyAddress")} placeholder="Calle 123, Ciudad" />
                  </div>
                  <div className="space-y-1">
                    <Label>URL de Google Maps</Label>
                    <Input value={form.ceremonyMapsUrl} onChange={set("ceremonyMapsUrl")} placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recepción</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Hora</Label>
                      <Input value={form.receptionTime} onChange={set("receptionTime")} placeholder="8:00 PM" />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del lugar</Label>
                      <Input value={form.receptionName} onChange={set("receptionName")} placeholder="Salón de Eventos" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Dirección</Label>
                    <Input value={form.receptionAddress} onChange={set("receptionAddress")} placeholder="Calle 456, Ciudad" />
                  </div>
                  <div className="space-y-1">
                    <Label>URL de Google Maps</Label>
                    <Input value={form.receptionMapsUrl} onChange={set("receptionMapsUrl")} placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Textos ─────────────────────────────── */}
            <TabsContent value="texts" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Versículo</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Texto del versículo</Label>
                    <Textarea value={form.verseText} onChange={set("verseText")} rows={3} placeholder="El amor es paciente, es bondadoso..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Referencia</Label>
                    <Input value={form.verseReference} onChange={set("verseReference")} placeholder="1 Corintios 13:4-7" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Texto del anuncio (Sección 1)</Label>
                <Input value={form.announcementText} onChange={set("announcementText")} placeholder="¡NOS CASAMOS!" />
              </div>
              <div className="space-y-1">
                <Label>Mensaje heroico</Label>
                <Textarea value={form.heroMessage} onChange={set("heroMessage")} rows={4} placeholder="Con la bendición de Dios y nuestras familias..." />
              </div>
              <div className="space-y-1">
                <Label>Mensaje de regalos</Label>
                <Textarea value={form.giftMessage} onChange={set("giftMessage")} rows={3} placeholder="Si deseas hacernos un regalo..." />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Código de vestimenta</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Etiqueta</Label>
                    <Input value={form.dressCodeLabel} onChange={set("dressCodeLabel")} placeholder="Formal" />
                  </div>
                  <div className="space-y-1">
                    <Label>Señoras</Label>
                    <Input value={form.dressCodeLadies} onChange={set("dressCodeLadies")} placeholder="Vestido largo" />
                  </div>
                  <div className="space-y-1">
                    <Label>Caballeros</Label>
                    <Input value={form.dressCodeGentlemen} onChange={set("dressCodeGentlemen")} placeholder="Traje oscuro" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Familias ───────────────────────────── */}
            <TabsContent value="families" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">Escribe un nombre por línea en cada campo.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Padres de la novia</Label>
                  <Textarea value={form.parentsBride} onChange={set("parentsBride")} rows={4} placeholder={"Sr. Padre de la Novia\nSra. Madre de la Novia"} />
                </div>
                <div className="space-y-1">
                  <Label>Padres del novio</Label>
                  <Textarea value={form.parentsGroom} onChange={set("parentsGroom")} rows={4} placeholder={"Sr. Padre del Novio\nSra. Madre del Novio"} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Padrinos</Label>
                <Textarea value={form.godparents} onChange={set("godparents")} rows={4} placeholder={"Padrino 1\nPadrino 2"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Damas de honor</Label>
                  <Textarea value={form.bridesmaids} onChange={set("bridesmaids")} rows={4} placeholder={"Dama 1\nDama 2"} />
                </div>
                <div className="space-y-1">
                  <Label>Chambelanes</Label>
                  <Textarea value={form.groomsmen} onChange={set("groomsmen")} rows={4} placeholder={"Chambelán 1\nChambelán 2"} />
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Itinerario ─────────────────────────── */}
            <TabsContent value="timeline" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Define los eventos del itinerario. Iconos disponibles: <code>church</code>, <code>glasses</code>, <code>dinner</code>, <code>reception</code>, <code>waltz</code>.
              </p>
              <div className="space-y-3">
                {form.timeline.map((item, idx) => (
                  <div key={item.id} className="border rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Hora</Label>
                        <Input
                          value={item.time}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            timeline: prev.timeline.map((t, i) => i === idx ? { ...t, time: e.target.value } : t),
                          }))}
                          placeholder="6:00 PM"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Etiqueta</Label>
                        <Input
                          value={item.label}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            timeline: prev.timeline.map((t, i) => i === idx ? { ...t, label: e.target.value } : t),
                          }))}
                          placeholder="CEREMONIA"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Icono</Label>
                        <Input
                          value={item.icon}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            timeline: prev.timeline.map((t, i) => i === idx ? { ...t, icon: e.target.value } : t),
                          }))}
                          placeholder="church"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        type="button" size="sm" variant="ghost"
                        disabled={idx === 0}
                        onClick={() => setForm(prev => {
                          const tl = [...prev.timeline];
                          const tmp = tl[idx - 1]!; tl[idx - 1] = tl[idx]!; tl[idx] = tmp;
                          return { ...prev, timeline: tl };
                        })}
                      >↑</Button>
                      <Button
                        type="button" size="sm" variant="ghost"
                        disabled={idx === form.timeline.length - 1}
                        onClick={() => setForm(prev => {
                          const tl = [...prev.timeline];
                          const tmp = tl[idx + 1]!; tl[idx + 1] = tl[idx]!; tl[idx] = tmp;
                          return { ...prev, timeline: tl };
                        })}
                      >↓</Button>
                      <Button
                        type="button" size="sm" variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          timeline: prev.timeline.filter((_, i) => i !== idx),
                        }))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    timeline: [...prev.timeline, { id: crypto.randomUUID(), time: "", label: "", icon: "church" }],
                  }))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar evento
                </Button>
              </div>
            </TabsContent>

            {/* ── Tab: Secciones ──────────────────────────── */}
            <TabsContent value="sections" className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                Activa o desactiva secciones de la invitación. Por defecto todas están activas.
              </p>
              {(
                [
                  { key: "showVerse",    label: "Versículo",               desc: "Sección 1 — versículo bíblico y anuncio" },
                  { key: "showNames",    label: "Nombres & mensaje",        desc: "Sección 3 — nombres de los novios y mensaje heroico" },
                  { key: "showPhotos",   label: "Fotos decorativas",        desc: "Secciones 2, 4 y foto principal full-bleed" },
                  { key: "showGallery",  label: "Galería",                  desc: "Nuestra Historia — galería de fotos" },
                  { key: "showFamily",   label: "Familias & padrinos",      desc: "Sección 5 — padres, padrinos, damas y caballeros" },
                  { key: "showVenues",   label: "Lugares & vestimenta",     desc: "Sección 6 — ceremonia, recepción y dress code" },
                  { key: "showTimeline", label: "Itinerario",               desc: "Sección 7 — cronograma del día" },
                  { key: "showGifts",    label: "Regalos & confirmación",   desc: "Sección 8 — sugerencia de regalos y RSVP" },
                ] as { key: keyof SectionsConfig; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`section-${key}`}
                    checked={form.sections[key]}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      sections: { ...prev.sections, [key]: e.target.checked },
                    }))}
                    className="h-4 w-4 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor={`section-${key}`} className="cursor-pointer flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </label>
                </div>
              ))}
            </TabsContent>

            {/* ── Tab: Etiquetas ──────────────────────────── */}
            <TabsContent value="labels" className="space-y-6 pt-4">
              <p className="text-xs text-muted-foreground">
                Personaliza todos los textos de la invitación. Dejar en blanco usa el texto por defecto.
              </p>

              {/* Helper para el input de label */}
              {(
                [
                  {
                    section: "Pantalla de entrada",
                    fields: [
                      { key: "entryTitle",     label: "Título principal",         placeholder: "¡NOS ENCANTARÍA QUE SEAS PARTE DE ESTE DÍA TAN ESPECIAL!" },
                      { key: "entrySubtitle",  label: "Subtítulo / instrucción",  placeholder: "Ingresa tu código para continuar:" },
                      { key: "entryButton",    label: "Botón ver invitación",     placeholder: "Ver Invitación" },
                      { key: "entrySavedCode", label: "Mensaje código guardado",  placeholder: "Código guardado anteriormente" },
                    ],
                  },
                  {
                    section: "Pantalla de info invitado",
                    fields: [
                      { key: "infoConfirmed",         label: "Badge confirmado",              placeholder: "Asistencia Confirmada" },
                      { key: "infoConfirmedMessage",  label: "Mensaje si confirmado",         placeholder: "¡Gracias por confirmar tu asistencia! Te esperamos en nuestra boda." },
                      { key: "infoPendingMessage",    label: "Mensaje si no confirmado",      placeholder: "¡Esperamos que puedan compartir esta fiesta junto a nosotros!" },
                      { key: "infoGuestsLabel",       label: "Etiqueta N° de invitados",      placeholder: "N° de Invitados:" },
                      { key: "infoStatusTitle",       label: "Título estado confirmaciones",  placeholder: "Estado de Confirmaciones" },
                      { key: "infoMainGuest",         label: "Etiqueta invitado principal",   placeholder: "Invitado principal:" },
                      { key: "infoCompanions",        label: "Etiqueta acompañantes",         placeholder: "Acompañantes confirmados:" },
                      { key: "infoTotal",             label: "Etiqueta total confirmados",    placeholder: "Total confirmados:" },
                      { key: "infoContinueButton",    label: "Botón (confirmado)",            placeholder: "Volver a ver invitación" },
                      { key: "infoViewButton",        label: "Botón (no confirmado)",         placeholder: "Ver Invitación Completa" },
                    ],
                  },
                  {
                    section: "Sección 5 — Familias",
                    fields: [
                      { key: "familyTitle",    label: "Título familias",          placeholder: "Con la bendición de Dios y de nuestros padres" },
                      { key: "companionTitle", label: "Título padrinos/honor",    placeholder: "Y en compañía de nuestros padrinos, damas y caballeros de honor" },
                      { key: "brideParents",   label: "Etiqueta padres novia",    placeholder: "Padres de la novia" },
                      { key: "groomParents",   label: "Etiqueta padres novio",    placeholder: "Padres del novio" },
                      { key: "godparents",     label: "Etiqueta padrinos",        placeholder: "Padrinos" },
                      { key: "bridesmaids",    label: "Etiqueta damas de honor",  placeholder: "Damas de honor" },
                      { key: "groomsmen",      label: "Etiqueta caballeros",      placeholder: "Caballeros de honor" },
                    ],
                  },
                  {
                    section: "Sección 6 — Lugares & Vestimenta",
                    fields: [
                      { key: "ceremony",     label: "Etiqueta ceremonia",     placeholder: "CEREMONIA" },
                      { key: "reception",    label: "Etiqueta recepción",     placeholder: "RECEPCIÓN" },
                      { key: "viewLocation", label: "Botón ver ubicación",    placeholder: "Ver ubicación" },
                      { key: "dressCode",    label: "Etiqueta dress code",    placeholder: "Código de vestimenta:" },
                      { key: "ladies",       label: "Etiqueta ellas",         placeholder: "ELLAS:" },
                      { key: "gentlemen",    label: "Etiqueta ellos",         placeholder: "ELLOS:" },
                    ],
                  },
                  {
                    section: "Sección 7 — Itinerario",
                    fields: [
                      { key: "timelineTitle", label: "Título del itinerario", placeholder: "Itinerario" },
                    ],
                  },
                  {
                    section: "Sección 8 — Regalos & RSVP",
                    fields: [
                      { key: "gifts",      label: "Título regalos",          placeholder: "SUGERENCIA DE REGALOS" },
                      { key: "envelope",   label: "Etiqueta lluvia sobres",  placeholder: "LLUVIA DE SOBRES" },
                      { key: "confirm",    label: "Título confirmar",        placeholder: "CONFIRMAR ASISTENCIA" },
                      { key: "groomLabel", label: "Botón novio",             placeholder: "Novio" },
                      { key: "brideLabel", label: "Botón novia",             placeholder: "Novia" },
                      { key: "deadline",   label: "Texto fecha límite",      placeholder: "* Fecha límite para confirmar:" },
                      { key: "closed",     label: "Texto cerrado",           placeholder: "(Cerrado)" },
                      { key: "closing",    label: "Mensaje cierre",          placeholder: "ESPERAMOS CONTAR CON SU PRESENCIA" },
                      { key: "thanks",     label: "Texto gracias",           placeholder: "Muchas Gracias!" },
                    ],
                  },
                  {
                    section: "Galería — Nuestra Historia",
                    fields: [
                      { key: "galleryTitle", label: "Título de la galería", placeholder: "Nuestra Historia" },
                    ],
                  },
                ] as { section: string; fields: { key: string; label: string; placeholder: string }[] }[]
              ).map(group => (
                <div key={group.section}>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    {group.section}
                  </h3>
                  <div className="space-y-2">
                    {group.fields.map(({ key, label, placeholder }) => (
                      <div key={key} className="grid grid-cols-[180px_1fr] gap-3 items-center">
                        <Label className="text-xs text-right leading-tight">{label}</Label>
                        <Input
                          value={form.labels[key] ?? ""}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            labels: { ...prev.labels, [key]: e.target.value },
                          }))}
                          placeholder={placeholder}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ── Tab: Galería ─────────────────────────────── */}
            <TabsContent value="gallery" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Fotos de la galería "Nuestra Historia". Se muestran en orden, en 2 columnas masonry.
              </p>

              {/* Bulk upload */}
              <div className="flex items-center gap-3">
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleBulkUpload}
                  disabled={!editingEvent?.id}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={bulkUploading || !editingEvent?.id}
                  onClick={() => bulkInputRef.current?.click()}
                  className="flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {bulkUploading
                    ? `Subiendo ${bulkProgress.done}/${bulkProgress.total}...`
                    : "Subir varias fotos"}
                </Button>
                {!editingEvent?.id && (
                  <p className="text-xs text-muted-foreground">Guarda el evento primero para subir fotos.</p>
                )}
              </div>

              <div className="space-y-3">
                {form.gallery.map((photo, idx) => (
                  <div key={photo.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex gap-3 items-start">
                      {photo.url && (
                        <img src={photo.url} alt="" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                      )}
                      <div className="flex-1 space-y-2">
                        <FileUpload
                          label="Foto"
                          value={photo.url}
                          onChange={url => setForm(prev => ({
                            ...prev,
                            gallery: prev.gallery.map((p, i) => i === idx ? { ...p, url } : p),
                          }))}
                          accept="image"
                          assetType="gallery"
                          eventId={editingEvent?.id}
                        />
                        <div className="space-y-1">
                          <Label className="text-xs">Pie de foto (opcional)</Label>
                          <Input
                            value={photo.caption ?? ""}
                            onChange={e => setForm(prev => ({
                              ...prev,
                              gallery: prev.gallery.map((p, i) => i === idx ? { ...p, caption: e.target.value } : p),
                            }))}
                            placeholder="Ej: En nuestro primer viaje juntos"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        type="button" size="sm" variant="ghost"
                        disabled={idx === 0}
                        onClick={() => setForm(prev => {
                          const g = [...prev.gallery];
                          const tmp = g[idx - 1]!; g[idx - 1] = g[idx]!; g[idx] = tmp;
                          return { ...prev, gallery: g };
                        })}
                      >↑</Button>
                      <Button
                        type="button" size="sm" variant="ghost"
                        disabled={idx === form.gallery.length - 1}
                        onClick={() => setForm(prev => {
                          const g = [...prev.gallery];
                          const tmp = g[idx + 1]!; g[idx + 1] = g[idx]!; g[idx] = tmp;
                          return { ...prev, gallery: g };
                        })}
                      >↓</Button>
                      <Button
                        type="button" size="sm" variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          gallery: prev.gallery.filter((_, i) => i !== idx),
                        }))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    gallery: [...prev.gallery, { id: crypto.randomUUID(), url: "", caption: "" }],
                  }))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar foto
                </Button>
              </div>
            </TabsContent>

            {/* ── Tab: Fotos ──────────────────────────────── */}
            <TabsContent value="photos" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Fotos y audio del evento. Las pantallas de entrada y confirmación también usan sus propios fondos.
              </p>
              <FileUpload
                label="Foto principal (Sección 1 + portada)"
                value={form.heroPhotoUrl}
                onChange={url => setForm(prev => ({ ...prev, heroPhotoUrl: url }))}
                accept="image"
                assetType="hero-photo"
                eventId={editingEvent?.id}
              />
              <FileUpload
                label="Foto secundaria (Sección 2)"
                value={form.photo2Url}
                onChange={url => setForm(prev => ({ ...prev, photo2Url: url }))}
                accept="image"
                assetType="photo2"
                eventId={editingEvent?.id}
              />
              <FileUpload
                label="Foto terciaria (Sección 4)"
                value={form.photo3Url}
                onChange={url => setForm(prev => ({ ...prev, photo3Url: url }))}
                accept="image"
                assetType="photo3"
                eventId={editingEvent?.id}
              />
              <FileUpload
                label="Fondo pantalla de entrada (código)"
                value={(form.assets as Record<string, string>).entryBg ?? ""}
                onChange={url => setForm(prev => ({ ...prev, assets: { ...prev.assets, entryBg: url } }))}
                accept="image"
                assetType="asset"
                eventId={editingEvent?.id}
              />
              <FileUpload
                label="Fondo pantalla de confirmación"
                value={(form.assets as Record<string, string>).infoBg ?? ""}
                onChange={url => setForm(prev => ({ ...prev, assets: { ...prev.assets, infoBg: url } }))}
                accept="image"
                assetType="asset"
                eventId={editingEvent?.id}
              />
              <FileUpload
                label="Audio / canción"
                value={form.audioUrl}
                onChange={url => setForm(prev => ({ ...prev, audioUrl: url }))}
                accept="audio"
                assetType="audio"
                eventId={editingEvent?.id}
              />
            </TabsContent>

            {/* ── Tab: Decoración ──────────────────────────── */}
            <TabsContent value="decor" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Iconos y gráficos decorativos de la plantilla. Sin imagen usa el default de la plantilla.
              </p>
              {(Object.keys(DEFAULT_ASSETS).filter(k => k !== "entryBg" && k !== "infoBg") as (keyof AssetMap)[]).map(key => (
                <FileUpload
                  key={key}
                  label={ASSET_LABELS[key] ?? key}
                  value={(form.assets as Record<string, string>)[key] ?? ""}
                  onChange={url => setForm(prev => ({ ...prev, assets: { ...prev.assets, [key]: url } }))}
                  accept="image"
                  assetType="asset"
                  eventId={editingEvent?.id}
                />
              ))}
            </TabsContent>

            {/* ── Tab: Tema ───────────────────────────────── */}
            <TabsContent value="tema" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Personaliza los colores y la fuente especial de la invitación. Dejar en blanco usa el valor por defecto.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { field: "primaryColor", label: "Color primario", hint: `default: ${DEFAULT_THEME.primaryColor}` },
                    { field: "accentColor",  label: "Color acento",   hint: `default: ${DEFAULT_THEME.accentColor}` },
                    { field: "actionColor",  label: "Color botones",  hint: `default: ${DEFAULT_THEME.actionColor}` },
                    { field: "textColor",    label: "Color texto",    hint: `default: ${DEFAULT_THEME.textColor}` },
                  ] as { field: keyof ThemeConfig; label: string; hint: string }[]
                ).map(({ field, label, hint }) => (
                  <div key={field} className="space-y-1">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(form.theme[field] as string) || DEFAULT_THEME[field]}
                        onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, [field]: e.target.value } }))}
                        className="h-9 w-12 rounded border cursor-pointer"
                      />
                      <Input
                        value={(form.theme[field] as string) || ""}
                        onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, [field]: e.target.value } }))}
                        placeholder={hint}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label>Fuente serif (textos principales)</Label>
                <select
                  value={form.theme.fontSerif || ""}
                  onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, fontSerif: e.target.value } }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Serif del sistema (default)</option>
                  {SERIF_PRESETS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Se aplica a todos los textos de la invitación.</p>
              </div>
              <div className="space-y-1">
                <Label>Fuente especial (cursiva — CSS font-family)</Label>
                <Input
                  value={form.theme.fontSpecial || ""}
                  onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, fontSpecial: e.target.value } }))}
                  placeholder={`default: ${DEFAULT_THEME.fontSpecial}`}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Ej: <code>"Dancing Script", cursive</code></p>
              </div>
              {/* Preview */}
              {(() => {
                const primary  = (form.theme.primaryColor as string) || DEFAULT_THEME.primaryColor;
                const accent   = (form.theme.accentColor  as string) || DEFAULT_THEME.accentColor;
                const action   = (form.theme.actionColor  as string) || DEFAULT_THEME.actionColor;
                const text     = (form.theme.textColor    as string) || DEFAULT_THEME.textColor;
                const font     = form.theme.fontSpecial || DEFAULT_THEME.fontSpecial;
                const serif    = form.theme.fontSerif ? `"${form.theme.fontSerif}", serif` : "ui-serif, Georgia, serif";
                return (
                  <div className="rounded-lg border overflow-hidden shadow-sm">
                    <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: accent }}>
                      <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: primary }}>Vista previa</span>
                    </div>
                    <div className="p-5 space-y-4" style={{ backgroundColor: primary }}>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: accent, fontFamily: serif }}>
                          ¡NOS CASAMOS!
                        </p>
                        <p className="text-4xl font-bold tracking-wide" style={{ color: accent, fontFamily: serif }}>
                          J &amp; J
                        </p>
                        <p className="text-xs italic" style={{ color: accent, opacity: 0.75, fontFamily: serif }}>
                          22 de Noviembre, 2025
                        </p>
                      </div>
                      <div className="h-px w-2/3 mx-auto" style={{ backgroundColor: accent, opacity: 0.3 }} />
                      <div className="text-center space-y-1">
                        <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: accent, fontFamily: serif }}>
                          CEREMONIA
                        </p>
                        <p className="text-[11px]" style={{ color: text, fontFamily: serif }}>
                          Iglesia La Medalla Milagrosa
                        </p>
                      </div>
                      <div className="h-px w-2/3 mx-auto" style={{ backgroundColor: accent, opacity: 0.3 }} />
                      <div className="text-center space-y-3">
                        <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: accent, fontFamily: serif }}>
                          CONFIRMAR ASISTENCIA
                        </p>
                        <button
                          type="button"
                          className="px-5 py-1.5 rounded-full text-white text-xs font-medium"
                          style={{ backgroundColor: action }}
                        >
                          Novio &nbsp;·&nbsp; Novia
                        </button>
                        <p className="text-3xl" style={{ color: accent, fontFamily: font }}>
                          Muchas Gracias!
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* ── Tab: Contacto ───────────────────────────── */}
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Teléfonos & WhatsApp</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Teléfono del novio</Label>
                    <Input value={form.groomPhone} onChange={set("groomPhone")} placeholder="+57 300 0000000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono de la novia</Label>
                    <Input value={form.bridePhone} onChange={set("bridePhone")} placeholder="+57 300 0000000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label>Mensaje WA – Novio</Label>
                    <Textarea value={form.groomWAMessage} onChange={set("groomWAMessage")} rows={3} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mensaje WA – Novia</Label>
                    <Textarea value={form.brideWAMessage} onChange={set("brideWAMessage")} rows={3} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingEvent ? "Guardar cambios" : "Crear evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── ClientAdminModal ─────────────────────────────────────────────────────────

interface ClientAdminModalProps {
  open: boolean;
  event: EventWithStats | null;
  onClose: () => void;
}

const ClientAdminModal: React.FC<ClientAdminModalProps> = ({ open, event, onClose }) => {
  const [admins, setAdmins] = useState<ClientAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  // Password reset
  const [changingPwdFor, setChangingPwdFor] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const loadAdmins = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/master/events`, { credentials: "include" });
      const data: EventWithStats[] = await res.json();
      const found = data.find(e => e.id === event.id);
      setAdmins(found?.clientAdmins || []);
    } catch {
      toast.error("Error cargando admins");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (open && event) loadAdmins();
    else {
      setAdmins([]); setEmail(""); setName(""); setPassword("");
      setChangingPwdFor(null); setNewPwd("");
    }
  }, [open, event, loadAdmins]);

  const handleChangePassword = async (adminId: string) => {
    if (newPwd.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`/api/master/client-admins/${adminId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPwd }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }
      toast.success("Contraseña actualizada");
      setChangingPwdFor(null);
      setNewPwd("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/master/events/${event.id}/client-admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear admin");
      }
      toast.success("Admin creado");
      setEmail(""); setName(""); setPassword("");
      loadAdmins();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm("¿Eliminar este admin?")) return;
    try {
      const res = await fetch(`/api/master/client-admins/${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Admin eliminado");
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch {
      toast.error("Error al eliminar admin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Admins – {event?.slug}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* List of existing admins */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Admins actuales</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin admins asignados.</p>
            ) : (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div key={admin.id} className="rounded border text-sm">
                    <div className="flex items-center justify-between p-2">
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-muted-foreground text-xs">{admin.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setChangingPwdFor(changingPwdFor === admin.id ? null : admin.id);
                            setNewPwd("");
                          }}
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {changingPwdFor === admin.id && (
                      <div className="px-2 pb-2 flex gap-2 items-center border-t pt-2">
                        <Input
                          type="password"
                          value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          placeholder="Nueva contraseña (mín. 8 caracteres)"
                          className="flex-1 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleChangePassword(admin.id)}
                          disabled={savingPwd || newPwd.length < 8}
                        >
                          {savingPwd ? "..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => { setChangingPwdFor(null); setNewPwd(""); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create new admin */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Agregar admin</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" required />
              </div>
              <div className="space-y-1">
                <Label>Contraseña</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={saving}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  {saving ? "Creando..." : "Crear admin"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── MasterDashboard ──────────────────────────────────────────────────────────

interface MasterDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

const MasterDashboard: React.FC<MasterDashboardProps> = ({ user, onLogout }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithStats | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState<EventWithStats | null>(null);

  const loadData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [evRes, stRes] = await Promise.all([
        fetch("/api/master/events", { credentials: "include" }),
        fetch("/api/master/stats", { credentials: "include" }),
      ]);
      if (evRes.ok) setEvents(await evRes.json());
      if (stRes.ok) setStats(await stRes.json());
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    onLogout();
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (ev: EventWithStats) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  const handleManageAdmins = (ev: EventWithStats) => {
    setSelectedEventForAdmin(ev);
    setShowAdminModal(true);
  };

  const handleToggleActive = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !ev.isActive }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success(`Evento ${ev.isActive ? "desactivado" : "activado"}`);
      loadData();
    } catch {
      toast.error("Error al cambiar estado del evento");
    }
  };

  const handleDeleteEvent = async (ev: EventWithStats) => {
    if (!confirm(`¿Eliminar el evento "${ev.slug}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/master/events/${ev.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Evento eliminado");
      loadData();
    } catch {
      toast.error("Error al eliminar evento");
    }
  };

  const handleDuplicateEvent = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al duplicar");
      toast.success(`Evento duplicado como "${ev.slug}-copia"`);
      loadData();
    } catch {
      toast.error("Error al duplicar evento");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between py-2 sm:py-0 gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold leading-tight">
                Master Panel
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {user.name} · master
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 space-y-6">
        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.activeEvents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invitados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmedGuests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accesos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalAccesses}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <Button onClick={handleCreateEvent} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo evento
            </Button>
          </div>

          {loadingEvents ? (
            <p className="text-sm text-muted-foreground">Cargando eventos...</p>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay eventos creados. Crea el primero.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map(ev => (
                <Card key={ev.id} className={!ev.isActive ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-base">{ev.brideName} &amp; {ev.groomName}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{ev.slug}</p>
                      </div>
                      <Badge variant={ev.isActive ? "default" : "secondary"}>
                        {ev.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Stats row */}
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {ev.stats.totalGuests} invitados
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {ev.stats.confirmedGuests} confirmados
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(ev.eventDate).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                    {/* Client admins */}
                    {ev.clientAdmins.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users2 className="h-3 w-3" />
                        {ev.clientAdmins.map(a => a.name).join(", ")}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(ev)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageAdmins(ev)}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Admins
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(ev)}
                        className="flex items-center gap-1"
                      >
                        {ev.isActive
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Eye className="h-3.5 w-3.5" />}
                        {ev.isActive ? "Desactivar" : "Activar"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateEvent(ev)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(ev)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <EventFormModal
        open={showEventModal}
        editingEvent={editingEvent}
        onClose={() => setShowEventModal(false)}
        onSaved={loadData}
      />
      <ClientAdminModal
        open={showAdminModal}
        event={selectedEventForAdmin}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
};

export default MasterDashboard;
