"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MapPin, Globe, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/components/lib/utils";
import {
  KANBAN_COLUMNS,
  groupLeadsByColumn,
  COLUMN_PRIMARY_STATUT,
  type KanbanLead,
  type KanbanColumn,
  type KanbanColumnKey,
  type KanbanGroups,
} from "./kanban-columns";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new:          { label: "Nouveau",    tone: "bg-slate-100 text-slate-700 border-slate-200" },
  contacted:    { label: "Contacté",   tone: "bg-blue-50 text-blue-700 border-blue-200" },
  relance_1:    { label: "Relance 1",  tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  relance_2:    { label: "Relance 2",  tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  opened:       { label: "Ouvert",     tone: "bg-amber-50 text-amber-700 border-amber-200" },
  clicked:      { label: "Cliqué",     tone: "bg-orange-50 text-orange-700 border-orange-200" },
  replied:      { label: "Répondu",    tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bounced:      { label: "Bounce",     tone: "bg-red-50 text-red-700 border-red-200" },
  disqualified: { label: "Écarté",     tone: "bg-slate-100 text-slate-500 border-slate-200" },
};

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl">
      {message}
    </div>
  );
}

export function KanbanBoard({
  leads,
  campaignId,
  sheetId,
}: {
  leads: KanbanLead[];
  campaignId: string;
  sheetId: string;
}) {
  const [groups, setGroups] = useState<KanbanGroups>(() => groupLeadsByColumn(leads));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function findLeadColumn(leadId: string): KanbanColumnKey | null {
    for (const col of KANBAN_COLUMNS) {
      if (groups[col.key].some((l) => l.lead_id === leadId)) return col.key;
    }
    return null;
  }

  function findLead(leadId: string): KanbanLead | null {
    for (const col of KANBAN_COLUMNS) {
      const lead = groups[col.key].find((l) => l.lead_id === leadId);
      if (lead) return lead;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const targetCol = over.id as KanbanColumnKey;
    const sourceCol = findLeadColumn(leadId);
    if (!sourceCol || sourceCol === targetCol) return;

    const lead = groups[sourceCol].find((l) => l.lead_id === leadId)!;
    const updatedLead: KanbanLead = {
      ...lead,
      statut_email: COLUMN_PRIMARY_STATUT[targetCol],
    };

    const prevGroups = groups;
    setGroups((g) => ({
      ...g,
      [sourceCol]: g[sourceCol].filter((l) => l.lead_id !== leadId),
      [targetCol]: [...g[targetCol], updatedLead],
    }));

    fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet_id: sheetId, campaign_id: campaignId, statut_email: COLUMN_PRIMARY_STATUT[targetCol] }),
    })
      .then((res) => {
        if (!res.ok) {
          setGroups(prevGroups);
          setToast("Échec de la mise à jour");
        }
      })
      .catch(() => {
        setGroups(prevGroups);
        setToast("Échec de la mise à jour");
      });
  }

  const activeLead = activeId ? findLead(activeId) : null;
  const activeColDef = activeLead
    ? KANBAN_COLUMNS.find((c) => c.key === findLeadColumn(activeLead.lead_id))
    : null;

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <DroppableColumn
              key={col.key}
              col={col}
              leads={groups[col.key]}
              campaignId={campaignId}
              activeLeadId={activeId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead && activeColDef ? (
            <CardOverlay lead={activeLead} />
          ) : null}
        </DragOverlay>
      </DndContext>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

function DroppableColumn({
  col,
  leads,
  campaignId,
  activeLeadId,
}: {
  col: KanbanColumn;
  leads: KanbanLead[];
  campaignId: string;
  activeLeadId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <div
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-2xl border bg-white/70 p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-colors",
        col.border,
        isOver && "ring-2 ring-primary/30 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className={cn("text-[11px] font-bold uppercase tracking-widest", col.text)}>
          {col.label}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
          {leads.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex min-h-[40px] flex-1 flex-col gap-2">
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-10 text-center text-[11px] text-muted-foreground">
            Aucun lead ici pour l&apos;instant
          </div>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.lead_id}
              lead={lead}
              campaignId={campaignId}
              col={col}
              isBeingDragged={lead.lead_id === activeLeadId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 40
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        tone
      )}
    >
      {score}
    </span>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const cfg = STATUS_LABELS[statut] ?? {
    label: statut,
    tone: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        cfg.tone
      )}
    >
      {cfg.label}
    </span>
  );
}

function DraggableCard({
  lead,
  campaignId,
  isBeingDragged,
}: {
  lead: KanbanLead;
  campaignId: string;
  col: KanbanColumn;
  isBeingDragged: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.lead_id });
  const score = parseInt(lead.score) || 0;
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const metaLine = [lead.poste, lead.secteur].filter(Boolean).join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]",
        isBeingDragged && "opacity-30"
      )}
    >
      {/* Header row — always visible */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Déplacer"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="7" r="1.5" />
            <circle cx="8" cy="7" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
          </svg>
        </button>

        <span className="flex-1 truncate text-sm font-semibold text-slate-900">
          {lead.nom}
        </span>

        <ScoreBadge score={score} />

        <span className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </div>

      {/* Secondary row — always visible */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
        <p className="truncate text-[11px] text-muted-foreground">
          {metaLine || "—"}
        </p>
        <StatusBadge statut={lead.statut_email} />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2.5">
          <Link
            href={`/dashboard/campaigns/${campaignId}/leads/${lead.lead_id}`}
            className="mb-1 block text-[14px] font-semibold leading-tight text-slate-900 transition-colors hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            Voir la fiche
          </Link>

          <div className="mt-2 space-y-1">
            {lead.ville && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                {lead.ville}
              </div>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary"
              >
                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{lead.email}</span>
              </a>
            )}
            {lead.site && (
              <a
                href={lead.site.startsWith("http") ? lead.site : `https://${lead.site}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary"
              >
                <Globe className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{lead.site.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {lead.téléphone && (
              <a
                href={`tel:${lead.téléphone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary"
              >
                <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                {lead.téléphone}
              </a>
            )}
          </div>

          {lead.personalized_hook && (
            <p className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 text-xs italic leading-relaxed text-slate-600 line-clamp-3">
              {lead.personalized_hook}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CardOverlay({ lead }: { lead: KanbanLead }) {
  return (
    <div className="w-[300px] cursor-grabbing rounded-xl border border-primary/40 bg-white px-3 py-2.5 shadow-2xl">
      <span className="truncate text-sm font-semibold text-slate-900">{lead.nom}</span>
    </div>
  );
}
