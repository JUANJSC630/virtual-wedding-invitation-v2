import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

import { BLOCK_MENU, SECTION_REGISTRY } from "@/blocks/registry";
import { BlockInstance, BlockType } from "@/blocks/types";

interface Props {
  blocks: BlockInstance[];
  onChange: (blocks: BlockInstance[]) => void;
}

function SortableRow({
  block,
  onToggle,
  onDelete,
}: {
  block: BlockInstance;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const entry = SECTION_REGISTRY[block.type];
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!entry) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-background px-2 py-2 ${block.enabled ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-muted-foreground hover:text-foreground"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-base leading-none">{entry.icon}</span>
      <span className="flex-1 truncate text-sm">{entry.label}</span>
      <button
        type="button"
        onClick={() => onToggle(block.id)}
        title={block.enabled ? "Ocultar" : "Mostrar"}
        className="p-1 text-muted-foreground hover:text-foreground"
      >
        {block.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => onDelete(block.id)}
        title="Eliminar bloque"
        className="p-1 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Constructor de secciones (Fase B.6): reordenar (drag-and-drop), mostrar/ocultar,
 * eliminar y añadir bloques. Opera sobre `blocks` y emite el nuevo array por
 * `onChange`. La persistencia va con el resto del formulario del evento.
 */
export function LayoutBuilder({ blocks, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const toggle = (id: string) =>
    onChange(blocks.map(b => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const remove = (id: string) => onChange(blocks.filter(b => b.id !== id));
  const add = (type: BlockType) =>
    onChange([...blocks, { id: nanoid(8), type, enabled: true, config: {} }]);

  // En el menú "Añadir": ocultar los tipos únicos que ya están presentes.
  const present = new Set(blocks.map(b => b.type));
  const addable = BLOCK_MENU.filter(
    m => SECTION_REGISTRY[m.type].canDuplicate || !present.has(m.type)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Arrastra para reordenar · el ojo muestra/oculta · la papelera elimina.
        </p>
        <select
          value=""
          onChange={e => {
            if (e.target.value) add(e.target.value as BlockType);
            e.target.value = "";
          }}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">+ Añadir bloque…</option>
          {addable.map(m => (
            <option key={m.type} value={m.type}>
              {m.icon} {m.label}
            </option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map(b => (
              <SortableRow key={b.id} block={b} onToggle={toggle} onDelete={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay bloques. Añade uno con el menú de arriba.
        </p>
      )}
    </div>
  );
}
