"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Archive,
  MailOpen,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/sonner";
import { cn } from "@/components/lib/utils";
import {
  buildCampaignBoardModel,
  moveCampaignCard,
  moveCampaignToArchived,
  type CampaignBoardBucket,
  type CampaignBoardCard,
  type CampaignBoardCardInput,
  type CampaignBoardColumn,
} from "./campaign-board-model";

const statusStyles: Record<CampaignBoardCard["badgeTone"], string> = {
  draft: "border-muted-foreground/20 bg-muted text-muted-foreground",
  generating: "border-primary/30 bg-primary/10 text-primary",
  active: "border-success/30 bg-success/10 text-success",
  paused: "border-warning/30 bg-warning/10 text-warning",
  completed: "border-muted-foreground/20 bg-muted text-muted-foreground",
  stopped: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function CampaignKanban({
  campaigns,
}: {
  campaigns: CampaignBoardCardInput[];
}) {
  const [tab, setTab] = useState("active");
  const initialModel = useMemo(() => buildCampaignBoardModel(campaigns), [campaigns]);
  const [state, setState] = useState(() => ({
    active: initialModel.activeColumns,
    archived: initialModel.archivedColumns,
  }));
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [draggingCard, setDraggingCard] = useState<CampaignBoardCard | null>(null);

  const campaignsKey = useMemo(
    () =>
      campaigns
        .map((c) => `${c.id}:${c.rawStatus}`)
        .sort()
        .join("|"),
    [campaigns],
  );
  const prevKeyRef = useRef(campaignsKey);
  useEffect(() => {
    if (prevKeyRef.current === campaignsKey) return;
    prevKeyRef.current = campaignsKey;
    const m = buildCampaignBoardModel(campaigns);
    setState({ active: m.activeColumns, archived: m.archivedColumns });
  }, [campaigns, campaignsKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { active: activeColumns, archived: archivedColumns } = state;

  const currentColumns = tab === "active" ? activeColumns : archivedColumns;

  const activeCount = activeColumns.reduce((t, c) => t + c.cards.length, 0);
  const archivedCount = archivedColumns.reduce((t, c) => t + c.cards.length, 0);

  const handleArchiveCard = useCallback(async (cardId: string) => {
    setArchivingId(cardId);
    try {
      const res = await fetch(`/api/campaigns/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "archived" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Impossible d'archiver la campagne", {
          description: err.error ?? `Erreur ${res.status}`,
        });
        return;
      }
      setState((s) => {
        const r = moveCampaignToArchived(s.active, s.archived, cardId);
        if (!r) return s;
        return { active: r.activeColumns, archived: r.archivedColumns };
      });
      toast.success("Campagne archivée", {
        description: "Retrouvez-la dans l’onglet Archivées.",
      });
    } finally {
      setArchivingId(null);
    }
  }, []);

  function handleDragStart({ active }: DragStartEvent) {
    const card = currentColumns.flatMap((c) => c.cards).find((c) => c.id === active.id);
    setDraggingCard(card ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingCard(null);
    if (!over) return;
    const targetColumnId = over.id as CampaignBoardBucket;
    if (tab === "active") {
      setState((s) => ({
        ...s,
        active: moveCampaignCard(s.active, active.id as string, targetColumnId),
      }));
    } else {
      setState((s) => ({
        ...s,
        archived: moveCampaignCard(s.archived, active.id as string, targetColumnId),
      }));
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <Toaster position="top-center" />
      <div className="mb-5 flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Play className="size-3.5" />
            En cours
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {activeCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="size-3.5" />
            Archivées
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {archivedCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="active" className="mt-0">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activeColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                draggingCardId={draggingCard?.id ?? null}
                isArchivedView={false}
                onArchive={handleArchiveCard}
                archivingId={archivingId}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>
            {draggingCard ? <CardDragPreview card={draggingCard} /> : null}
          </DragOverlay>
        </DndContext>
      </TabsContent>

      <TabsContent value="archived" className="mt-0">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {archivedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                draggingCardId={draggingCard?.id ?? null}
                isArchivedView
                onArchive={handleArchiveCard}
                archivingId={archivingId}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>
            {draggingCard ? <CardDragPreview card={draggingCard} /> : null}
          </DragOverlay>
        </DndContext>
      </TabsContent>
    </Tabs>
  );
}

function KanbanColumn({
  column,
  draggingCardId,
  isArchivedView,
  onArchive,
  archivingId,
}: {
  column: CampaignBoardColumn;
  draggingCardId: string | null;
  isArchivedView: boolean;
  onArchive: (cardId: string) => void;
  archivingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={cn(
        "flex min-w-[260px] flex-1 flex-col rounded-2xl border bg-white/70 shadow-[0_8px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-colors",
        isOver
          ? "border-[#FFA318]/50 bg-[#FFA318]/5"
          : "border-slate-200/80",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-sm font-semibold tracking-tight",
                column.accent ? "text-primary" : "text-foreground",
              )}
            >
              {column.title}
            </h3>
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground shadow-sm">
              {column.cards.length}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{column.hint}</p>
        </div>
        <button
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-primary"
          aria-label={`Ajouter dans ${column.title}`}
          type="button"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-3">
        <AnimatePresence>
          {column.cards.map((card, index) => (
            <DraggableCampaignCard
              key={card.id}
              card={card}
              index={index}
              isBeingDragged={card.id === draggingCardId}
              showArchiveAction={!isArchivedView}
              onArchive={onArchive}
              isArchiving={archivingId === card.id}
            />
          ))}
        </AnimatePresence>
        {column.cards.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-[11px] text-muted-foreground transition-colors",
              isOver ? "border-[#FFA318]/40 text-[#FFA318]" : "border-slate-200",
            )}
          >
            {isOver ? "Déposer ici" : "Aucune campagne"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraggableCampaignCard({
  card,
  index,
  isBeingDragged,
  showArchiveAction,
  onArchive,
  isArchiving,
}: {
  card: CampaignBoardCard;
  index: number;
  isBeingDragged: boolean;
  showArchiveAction: boolean;
  onArchive: (cardId: string) => void;
  isArchiving: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: "none" }}
      suppressHydrationWarning
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        whileHover={isDragging ? undefined : { y: -2 }}
        className={cn(
          "group rounded-[18px] border bg-white p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all",
          isDragging
            ? "cursor-grabbing border-[#FFA318]/30"
            : "cursor-grab border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            href={card.href}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => isBeingDragged && e.preventDefault()}
            className="truncate text-sm font-semibold text-primary transition-opacity hover:opacity-80"
          >
            {card.name}
          </Link>
          {showArchiveAction ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
                aria-label="Actions de la campagne"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                type="button"
                disabled={isArchiving}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 text-sm shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground transition-colors hover:bg-slate-50"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      await onArchive(card.id);
                    }}
                  >
                    <Archive className="size-3.5 text-muted-foreground" />
                    {isArchiving ? "Archivage…" : "Archiver"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mb-3 truncate text-xs text-muted-foreground">{card.segment}</p>

        <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            <span className="tabular-nums text-foreground">{card.qualified}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MailOpen className="size-3" />
            <span className="tabular-nums text-foreground">{card.contacted}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" />
            <span className="tabular-nums text-foreground">{card.replies}</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px]", statusStyles[card.badgeTone])}
          >
            {card.badgeTone === "generating" ? (
              <span className="mr-1 size-1.5 animate-pulse rounded-full bg-current" />
            ) : null}
            {card.badgeLabel}
          </Badge>
          {card.openRate > 0 ? (
            <span className="text-[11px] font-semibold tabular-nums text-primary">
              {card.openRate}%
            </span>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function CardDragPreview({ card }: { card: CampaignBoardCard }) {
  return (
    <div className="rotate-2 rounded-[18px] border border-[#FFA318]/40 bg-white p-3.5 opacity-95 shadow-[0_16px_40px_rgba(255,163,24,0.18)]">
      <p className="truncate text-sm font-semibold text-primary">{card.name}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{card.segment}</p>
      <div className="mt-2">
        <Badge variant="outline" className={cn("text-[10px]", statusStyles[card.badgeTone])}>
          {card.badgeLabel}
        </Badge>
      </div>
    </div>
  );
}
