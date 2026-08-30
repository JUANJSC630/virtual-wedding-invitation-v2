import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";
import { Plus, Trash2, Upload } from "lucide-react";

import { AssetMap, EventTypeSlug, EventWithStats, Honoree, ThemeConfig } from "@/types";

import { compressImage } from "@/lib/compressImage";
import { EVENT_TYPES } from "@/lib/honorees";
import { eventBasicSchema, extractZodErrors } from "@/lib/schemas";

import { DEFAULT_ASSETS } from "@/context/AssetContext";
import { DEFAULT_THEME, SERIF_PRESETS } from "@/context/ThemeContext";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FileUpload from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { LayoutBuilder } from "@/components/master/LayoutBuilder";
import { RsvpQuestionsEditor } from "@/components/master/RsvpQuestionsEditor";

import {
  ASSET_LABELS,
  COLOR_PALETTES,
  EventFormData,
  emptyForm,
  eventToForm,
} from "./eventFormModel";

// ─── EventFormModal ───────────────────────────────────────────────────────────

interface EventFormModalProps {
  open: boolean;
  editingEvent: EventWithStats | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({ open, editingEvent, onClose, onSaved }) => {
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
                { v: "rsvp",     l: "RSVP" },
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
                  className="flex h-11 w-full touch-manipulation rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:h-9 sm:text-sm"
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
            {/* ── Tab: RSVP ───────────────────────────────── */}
            <TabsContent value="rsvp" className="space-y-4 pt-4">
              <RsvpQuestionsEditor
                questions={form.rsvpQuestions}
                onChange={rsvpQuestions => setForm(prev => ({ ...prev, rsvpQuestions }))}
              />
            </TabsContent>

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
                  className="min-h-11 w-full touch-manipulation rounded-md border bg-background px-3 py-2 text-base sm:min-h-0 sm:text-sm"
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
