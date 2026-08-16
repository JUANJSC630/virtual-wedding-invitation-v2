import React, { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  FileUp,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";

import { DEFAULT_ASSETS } from "@/context/AssetContext";
import { DEFAULT_THEME, SERIF_PRESETS } from "@/context/ThemeContext";
import { buildLegacyLayout } from "@/blocks/legacyLayout";
import { BlockInstance } from "@/blocks/types";
import { compressImage } from "@/lib/compressImage";
import { EVENT_TYPES, getHonoreesNames } from "@/lib/honorees";
import { EventDetail } from "@/components/master/EventDetail";
import { LayoutBuilder } from "@/components/master/LayoutBuilder";
import { eventBasicSchema, extractZodErrors } from "@/lib/schemas";
import CSVImportModal from "@/components/admin/CSVImportModal";
import { AdminUser, AssetMap, EventTypeSlug, EventWithStats, GalleryPhoto, Honoree, SectionsConfig, ThemeConfig, TimelineItem } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  // Multi-ocasión (Fase C)
  eventType: EventTypeSlug;
  honorees: Honoree[];
  eventTitle: string;
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
  // Secciones dinámicas (Fase B)
  layout: BlockInstance[];
}

interface ClientAdminRow {
  id: string;
  email: string;
  name: string;
}

// ─── Color palettes ───────────────────────────────────────────────────────────

interface ColorPalette {
  name: string;
  primaryColor: string;
  accentColor: string;
  actionColor: string;
  textColor: string;
}

const COLOR_PALETTES: ColorPalette[] = [
  { name: "Navy + Gold",        primaryColor: "#162b4e", accentColor: "#bfa15a", actionColor: "#466691", textColor: "#bfa15a" },
  { name: "Blush + Rosa",       primaryColor: "#f5e6e0", accentColor: "#c4887f", actionColor: "#b06f65", textColor: "#4a3030" },
  { name: "Sage + Marfil",      primaryColor: "#f8f5f0", accentColor: "#7d9b76", actionColor: "#5a7a53", textColor: "#3d4a38" },
  { name: "Borgoña + Champán",  primaryColor: "#3d1a24", accentColor: "#d4b896", actionColor: "#8b3a52", textColor: "#d4b896" },
  { name: "Azul Pizarra + Plata", primaryColor: "#2c3e5c", accentColor: "#c0c8d4", actionColor: "#5b7fa6", textColor: "#c0c8d4" },
  { name: "Terracota + Beige",  primaryColor: "#f5ede4", accentColor: "#c27755", actionColor: "#a05c3b", textColor: "#4a3520" },
  { name: "Negro + Oro",        primaryColor: "#1a1a1a", accentColor: "#d4af37", actionColor: "#8b6914", textColor: "#d4af37" },
  { name: "Lavanda + Blanco",   primaryColor: "#f8f5ff", accentColor: "#9b7cc8", actionColor: "#7b5aa6", textColor: "#3d2d5c" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyForm: EventFormData = {
  slug: "", eventType: "wedding", honorees: [], eventTitle: "",
  groomName: "", brideName: "", eventDate: "", rsvpDeadline: "",
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
  layout: buildLegacyLayout(undefined),
};

function eventToForm(ev: EventWithStats): EventFormData {
  return {
    slug: ev.slug,
    eventType: ev.config?.eventType ?? "wedding",
    honorees: ev.config?.honorees ?? [],
    eventTitle: ev.config?.eventTitle ?? "",
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
    // Materializa el layout desde el legacy si el evento aún no tiene uno,
    // para que el constructor de Diseño muestre las secciones actuales.
    layout: ev.config?.layout?.length ? ev.config.layout : buildLegacyLayout(ev.config?.sections),
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const originalSlug = React.useRef<string>("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const bulkInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormErrors({});
    const f = editingEvent ? eventToForm(editingEvent) : emptyForm;
    setForm(f);
    originalSlug.current = f.slug;
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
        const compressed = await compressImage(file, 1200);
        const fd = new FormData();
        fd.append("file", compressed);
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

    // Multi-ocasión: para eventos que no son boda, las columnas requeridas
    // groomName/brideName se rellenan con el primer protagonista, y se valida
    // que haya al menos un protagonista con nombre.
    let submission: EventFormData = form;
    if (form.eventType !== "wedding") {
      const names = form.honorees.map(h => h.name.trim()).filter(Boolean);
      if (names.length === 0) {
        setFormErrors({ honorees: "Agrega al menos un protagonista con nombre" });
        toast.error("Falta el nombre del protagonista en la pestaña Básico");
        return;
      }
      const filler = names[0]!;
      submission = { ...form, groomName: filler, brideName: filler };
    }

    // Validate basic fields before sending
    const parsed = eventBasicSchema.safeParse({
      slug: submission.slug,
      groomName: submission.groomName,
      brideName: submission.brideName,
      eventDate: submission.eventDate,
    });
    if (!parsed.success) {
      const errs = extractZodErrors(parsed.error);
      setFormErrors(errs);
      // Show a toast summary and switch to the basic tab visually
      toast.error("Revisa los campos en la pestaña Básico");
      return;
    }
    setFormErrors({});

    // Warn if slug changed on an existing active event with accesses
    if (
      editingEvent &&
      form.slug !== originalSlug.current &&
      editingEvent.stats.totalAccesses > 0
    ) {
      const ok = window.confirm(
        `⚠️ Estás cambiando el slug de "${originalSlug.current}" a "${form.slug}".\n\nEsto romperá todos los enlaces ya enviados a los invitados (${editingEvent.stats.totalAccesses} accesos registrados).\n\n¿Deseas continuar?`
      );
      if (!ok) return;
    }

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
        body: JSON.stringify(submission),
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

  // Multi-ocasión: cambiar el tipo reconstruye los protagonistas según los
  // roles de esa ocasión, preservando nombres ya escritos del mismo rol.
  const handleEventTypeChange = (type: EventTypeSlug) => {
    setForm(prev => {
      const roles = EVENT_TYPES[type].honoreeRoles;
      const honorees: Honoree[] =
        type === "wedding"
          ? []
          : roles.map(r => ({
              role: r.role,
              label: r.label,
              name: prev.honorees.find(h => h.role === r.role)?.name ?? "",
            }));
      return { ...prev, eventType: type, honorees };
    });
    setFormErrors(p => { const n = { ...p }; delete n.honorees; return n; });
  };

  const setHonoreeName = (index: number, name: string) => {
    setForm(prev => ({
      ...prev,
      honorees: prev.honorees.map((h, i) => (i === index ? { ...h, name } : h)),
    }));
    setFormErrors(p => { const n = { ...p }; delete n.honorees; return n; });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? `Editar: ${editingEvent.slug}` : "Crear nuevo evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              {[
                { v: "basic",    l: "Básico" },
                { v: "design",   l: "Diseño" },
                { v: "venues",   l: "Locales" },
                { v: "texts",    l: "Textos" },
                { v: "families", l: "Familias" },
                { v: "timeline", l: "Itinerario" },
                { v: "labels",   l: "Etiquetas" },
                { v: "gallery",  l: "Galería" },
                { v: "photos",   l: "Fotos" },
                { v: "decor",    l: "Decoración" },
                { v: "tema",     l: "Tema" },
                { v: "contact",  l: "Contacto" },
              ].map(t => (
                <TabsTrigger key={t.v} value={t.v} className="flex-none px-2.5 py-1.5 text-xs sm:text-sm">
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab: Básico ─────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={e => { set("slug")(e); setFormErrors(p => { const n = {...p}; delete n.slug; return n; }); }}
                    placeholder="jimena-juan"
                    className={formErrors.slug ? "border-destructive" : ""}
                  />
                  {formErrors.slug && <p className="text-xs text-destructive">{formErrors.slug}</p>}
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
              {/* Tipo de evento (multi-ocasión) */}
              <div className="space-y-1">
                <Label>Tipo de evento</Label>
                <select
                  value={form.eventType}
                  onChange={e => handleEventTypeChange(e.target.value as EventTypeSlug)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Object.entries(EVENT_TYPES).map(([slug, t]) => (
                    <option key={slug} value={slug}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Define los protagonistas y los textos por defecto de la invitación.</p>
              </div>

              {form.eventType === "wedding" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nombre del novio *</Label>
                    <Input
                      value={form.groomName}
                      onChange={e => { set("groomName")(e); setFormErrors(p => { const n = {...p}; delete n.groomName; return n; }); }}
                      placeholder="Juan"
                      className={formErrors.groomName ? "border-destructive" : ""}
                    />
                    {formErrors.groomName && <p className="text-xs text-destructive">{formErrors.groomName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Nombre de la novia *</Label>
                    <Input
                      value={form.brideName}
                      onChange={e => { set("brideName")(e); setFormErrors(p => { const n = {...p}; delete n.brideName; return n; }); }}
                      placeholder="Jimena"
                      className={formErrors.brideName ? "border-destructive" : ""}
                    />
                    {formErrors.brideName && <p className="text-xs text-destructive">{formErrors.brideName}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Protagonistas *</Label>
                  {form.honorees.map((h, i) => (
                    <div key={`${h.role}-${i}`} className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <Input
                        value={h.name}
                        onChange={e => setHonoreeName(i, e.target.value)}
                        placeholder={h.label}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{h.label}</span>
                    </div>
                  ))}
                  {formErrors.honorees && <p className="text-xs text-destructive">{formErrors.honorees}</p>}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fecha del evento *</Label>
                  <Input
                    type="date"
                    value={form.eventDate}
                    onChange={e => { set("eventDate")(e); setFormErrors(p => { const n = {...p}; delete n.eventDate; return n; }); }}
                    className={formErrors.eventDate ? "border-destructive" : ""}
                  />
                  {formErrors.eventDate && <p className="text-xs text-destructive">{formErrors.eventDate}</p>}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <TabsContent value="design" className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                Reordena, muestra/oculta, elimina y añade secciones de la invitación.
                El orden aquí es el orden en que se ven.
              </p>
              <LayoutBuilder
                blocks={form.layout}
                onChange={layout => setForm(prev => ({ ...prev, layout }))}
              />
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

              {/* Paletas predefinidas */}
              <div className="space-y-2">
                <Label>Paletas predefinidas</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {COLOR_PALETTES.map(palette => (
                    <button
                      key={palette.name}
                      type="button"
                      title={palette.name}
                      onClick={() => setForm(prev => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          primaryColor: palette.primaryColor,
                          accentColor:  palette.accentColor,
                          actionColor:  palette.actionColor,
                          textColor:    palette.textColor,
                        },
                      }))}
                      className="group flex flex-col items-start gap-1.5 rounded-lg border p-2 hover:border-primary hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex w-full gap-0.5 rounded overflow-hidden h-5">
                        <div className="flex-1" style={{ backgroundColor: palette.primaryColor }} />
                        <div className="flex-1" style={{ backgroundColor: palette.accentColor }} />
                        <div className="flex-1" style={{ backgroundColor: palette.actionColor }} />
                        <div className="flex-1" style={{ backgroundColor: palette.textColor }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground group-hover:text-foreground leading-tight">{palette.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Haz clic en una paleta para aplicarla. Puedes ajustar los colores individualmente después.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {/* Overlay + card opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Oscuridad del fondo</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {form.theme.overlayOpacity ?? DEFAULT_THEME.overlayOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={5}
                    value={form.theme.overlayOpacity ?? DEFAULT_THEME.overlayOpacity}
                    onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, overlayOpacity: Number(e.target.value) } }))}
                    className="w-full accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">Capa negra sobre la foto de fondo.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Tarjeta — color y opacidad</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {form.theme.cardOpacity ?? DEFAULT_THEME.cardOpacity}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.theme.cardBgColor || DEFAULT_THEME.cardBgColor}
                      onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, cardBgColor: e.target.value } }))}
                      className="h-8 w-10 rounded border cursor-pointer flex-shrink-0"
                      title="Color de fondo de la tarjeta"
                    />
                    <input
                      type="range"
                      min={10}
                      max={95}
                      step={5}
                      value={form.theme.cardOpacity ?? DEFAULT_THEME.cardOpacity}
                      onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, cardOpacity: Number(e.target.value) } }))}
                      className="flex-1 accent-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Color + opacidad de la tarjeta. Sube para más contraste.</p>
                </div>
              </div>

              {/* Input color + opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Recuadros interiores (input y cajas)</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {form.theme.inputOpacity ?? DEFAULT_THEME.inputOpacity}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.theme.inputBgColor || DEFAULT_THEME.inputBgColor}
                    onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, inputBgColor: e.target.value } }))}
                    className="h-8 w-10 rounded border cursor-pointer flex-shrink-0"
                    title="Color de fondo del input"
                  />
                  <input
                    type="range"
                    min={10}
                    max={95}
                    step={5}
                    value={form.theme.inputOpacity ?? DEFAULT_THEME.inputOpacity}
                    onChange={e => setForm(prev => ({ ...prev, theme: { ...prev.theme, inputOpacity: Number(e.target.value) } }))}
                    className="flex-1 accent-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Afecta el input de código y las cajas de info del invitado.</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Teléfono del novio</Label>
                    <Input value={form.groomPhone} onChange={set("groomPhone")} placeholder="+57 300 0000000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono de la novia</Label>
                    <Input value={form.bridePhone} onChange={set("bridePhone")} placeholder="+57 300 0000000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
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
  const [recentConfirmations, setRecentConfirmations] = useState<{
    id: string; name: string; confirmedAt: string;
    event: { slug: string; groomName: string; brideName: string };
  }[]>([]);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithStats | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState<EventWithStats | null>(null);
  // Ventana por evento (rediseño): al seleccionar, se muestra su panel dedicado.
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importEventId, setImportEventId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [evRes, stRes, rcRes] = await Promise.all([
        fetch(`/api/master/events${showArchived ? "?archived=1" : ""}`, { credentials: "include" }),
        fetch("/api/master/stats", { credentials: "include" }),
        fetch("/api/master/recent-confirmations", { credentials: "include" }),
      ]);
      if (evRes.ok) setEvents(await evRes.json());
      if (stRes.ok) setStats(await stRes.json());
      if (rcRes.ok) setRecentConfirmations(await rcRes.json());
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoadingEvents(false);
    }
  }, [showArchived]);

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

  const handleArchiveEvent = async (ev: EventWithStats) => {
    if (!confirm(`¿Archivar "${ev.slug}"? El evento dejará de ser accesible públicamente.`)) return;
    try {
      const res = await fetch(`/api/master/events/${ev.id}/archive`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Evento archivado");
      loadData();
    } catch {
      toast.error("Error al archivar evento");
    }
  };

  const handleUnarchiveEvent = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}/unarchive`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Evento restaurado");
      loadData();
    } catch {
      toast.error("Error al restaurar evento");
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
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onBack={() => setSelectedEvent(null)}
            onEdit={() => handleEditEvent(selectedEvent)}
            onManageAdmins={() => handleManageAdmins(selectedEvent)}
          />
        ) : (
        <>
        {/* Global KPIs — pulso general (secundario). El detalle real está en cada evento. */}
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

        {/* Insights section */}
        {!showArchived && events.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Próximos eventos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Próximos eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const now = new Date();
                  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const upcoming = events
                    .filter(ev => { const d = new Date(ev.eventDate); return d >= now && d <= in30; })
                    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                    .slice(0, 5);
                  if (upcoming.length === 0)
                    return <p className="text-sm text-muted-foreground text-center py-2">Sin eventos en los próximos 30 días</p>;
                  return upcoming.map(ev => {
                    const daysLeft = Math.ceil((new Date(ev.eventDate).getTime() - now.getTime()) / 86400000);
                    return (
                      <div key={ev.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{getHonoreesNames(ev)}</p>
                          <p className="text-xs text-muted-foreground">/{ev.slug}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {daysLeft === 0 ? "Hoy" : `${daysLeft}d`}
                        </Badge>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>

            {/* Ranking por confirmación */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  Ranking confirmaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.filter(ev => ev.stats.totalGuests > 0).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Sin datos aún</p>
                ) : (
                  events
                    .filter(ev => ev.stats.totalGuests > 0)
                    .sort((a, b) => (b.stats.confirmedGuests / b.stats.totalGuests) - (a.stats.confirmedGuests / a.stats.totalGuests))
                    .slice(0, 4)
                    .map((ev, idx) => {
                      const rate = Math.round((ev.stats.confirmedGuests / ev.stats.totalGuests) * 100);
                      return (
                        <div key={ev.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="text-muted-foreground font-mono shrink-0">#{idx + 1}</span>
                              <span className="truncate">{getHonoreesNames(ev)}</span>
                            </span>
                            <span className="font-semibold shrink-0 ml-2">{rate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>

            {/* Últimas confirmaciones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Últimas confirmaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentConfirmations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Sin confirmaciones aún</p>
                ) : (
                  recentConfirmations.slice(0, 5).map(rc => (
                    <div key={rc.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{rc.name}</p>
                        <p className="text-xs text-muted-foreground">/{rc.event.slug}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(rc.confirmedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Eventos</h2>
              <div className="flex rounded-lg border overflow-hidden text-xs">
                <button
                  onClick={() => setShowArchived(false)}
                  className={`px-3 py-1.5 transition-colors ${!showArchived ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setShowArchived(true)}
                  className={`px-3 py-1.5 transition-colors ${showArchived ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  Archivados
                </button>
              </div>
            </div>
            {!showArchived && (
              <Button onClick={handleCreateEvent} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo evento
              </Button>
            )}
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
                        <p className="font-semibold text-base">{getHonoreesNames(ev)}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{ev.slug}</p>
                      </div>
                      {ev.archivedAt
                        ? <Badge variant="outline" className="text-amber-600 border-amber-300">Archivado</Badge>
                        : <Badge variant={ev.isActive ? "default" : "secondary"}>{ev.isActive ? "Activo" : "Inactivo"}</Badge>
                      }
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
                    {/* Acciones: primarias visibles + resto en menú "Más" */}
                    <div className="flex items-center gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedEvent(ev)}
                        className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Abrir panel
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${ev.slug}?preview=1`, "_blank")}
                        className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                        title="Abrir vista previa de la invitación"
                      >
                        <MonitorSmartphone className="h-3.5 w-3.5" />
                        Vista previa
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="px-2" aria-label="Más acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditEvent(ev)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Editar invitación
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageAdmins(ev)}>
                            <Settings className="mr-2 h-4 w-4" /> Admins del evento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(ev)}>
                            {ev.isActive
                              ? <><EyeOff className="mr-2 h-4 w-4" /> Desactivar</>
                              : <><Eye className="mr-2 h-4 w-4" /> Activar</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateEvent(ev)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setImportEventId(ev.id); setShowImportModal(true); }}>
                            <FileUp className="mr-2 h-4 w-4" /> Importar CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {showArchived ? (
                            <DropdownMenuItem onClick={() => handleUnarchiveEvent(ev)}>
                              <Eye className="mr-2 h-4 w-4" /> Restaurar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchiveEvent(ev)} className="text-amber-600 focus:text-amber-700">
                              <EyeOff className="mr-2 h-4 w-4" /> Archivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(ev)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </>
        )}
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
      <CSVImportModal
        open={showImportModal}
        onOpenChange={open => { setShowImportModal(open); if (!open) setImportEventId(null); }}
        {...(importEventId ? { eventId: importEventId } : {})}
        onImported={loadData}
      />
    </div>
  );
};

export default MasterDashboard;
