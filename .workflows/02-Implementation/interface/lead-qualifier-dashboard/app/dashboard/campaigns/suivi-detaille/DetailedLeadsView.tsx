"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Mail,
  Phone,
  RotateCcw,
  Search,
} from "lucide-react";
import { cn } from "@/components/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  QualifiedLeadDetailed,
  RejectedLead,
} from "@/lib/sheets-detailed";
import {
  distinctValues,
  filterQualifiedLeads,
  sortQualifiedLeads,
  type QualifiedLeadFilters,
  type SortKey,
  type SortState,
} from "./detailed-leads-filters";

interface CampaignOption {
  campaign_id: string;
  nom: string;
}

interface DetailedLeadsViewProps {
  campaigns: CampaignOption[];
  selectedCampaignId: string | null;
  qualifiedLeads: QualifiedLeadDetailed[];
  rejectedLeads: RejectedLead[];
  error?: string | null;
}

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

function scoreBadgeTone(raw: string): string {
  const score = parseInt(raw || "0", 10) || 0;
  if (score >= 70) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export function DetailedLeadsView({
  campaigns,
  selectedCampaignId,
  qualifiedLeads,
  rejectedLeads,
  error,
}: DetailedLeadsViewProps) {
  const router = useRouter();

  const [filters, setFilters] = useState<QualifiedLeadFilters>({
    query: "",
    statuses: [],
    secteurs: [],
    minScore: 0,
    maxScore: 100,
  });
  const [sort, setSort] = useState<SortState>({ by: null, dir: "asc" });

  const availableStatuses = useMemo(
    () => distinctValues(qualifiedLeads, "statut_email"),
    [qualifiedLeads]
  );
  const availableSecteurs = useMemo(
    () => distinctValues(qualifiedLeads, "secteur"),
    [qualifiedLeads]
  );

  const visibleQualified = useMemo(
    () => sortQualifiedLeads(filterQualifiedLeads(qualifiedLeads, filters), sort),
    [qualifiedLeads, filters, sort]
  );

  function handleCampaignChange(value: string) {
    if (!value) {
      router.replace("/dashboard/campaigns/suivi-detaille");
    } else {
      router.replace(`/dashboard/campaigns/suivi-detaille?c=${encodeURIComponent(value)}`);
    }
  }

  function toggleSort(key: SortKey) {
    if (!key) return;
    setSort((current) => {
      if (current.by !== key) return { by: key, dir: "asc" };
      if (current.dir === "asc") return { by: key, dir: "desc" };
      return { by: null, dir: "asc" };
    });
  }

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function resetFilters() {
    setFilters({ query: "", statuses: [], secteurs: [], minScore: 0, maxScore: 100 });
    setSort({ by: null, dir: "asc" });
  }

  const hasActiveFilters =
    filters.query !== "" ||
    filters.statuses.length > 0 ||
    filters.secteurs.length > 0 ||
    filters.minScore !== 0 ||
    filters.maxScore !== 100 ||
    sort.by !== null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4" data-testid="detailed-leads-view">
        {/* Top bar: campaign selector + export */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white/70 p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <label
              htmlFor="campaign-selector"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Campagne
            </label>
            <select
              id="campaign-selector"
              data-testid="campaign-selector"
              value={selectedCampaignId ?? ""}
              onChange={(e) => handleCampaignChange(e.target.value)}
              className="min-w-[280px] flex-1 max-w-md rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Sélectionner une campagne —</option>
              {campaigns.map((c) => (
                <option key={c.campaign_id} value={c.campaign_id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {selectedCampaignId ? (
            <div className="flex items-center gap-2">
              <a
                href={`/api/campaigns/${selectedCampaignId}/export?format=csv`}
                className="inline-flex h-[34px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Export CSV
              </a>
              <a
                href={`/api/campaigns/${selectedCampaignId}/export?format=json`}
                className="inline-flex h-[34px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Export JSON
              </a>
              <a
                href={`/api/campaigns/${selectedCampaignId}/export?format=instantly`}
                className="inline-flex h-[34px] items-center justify-center rounded-[10px] border border-primary/25 bg-primary/5 px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Instantly
              </a>
            </div>
          ) : null}
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!selectedCampaignId ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="qualified" className="w-full">
            <TabsList>
              <TabsTrigger value="qualified" className="gap-2">
                Qualifiés
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                  {qualifiedLeads.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                Rejetés
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {rejectedLeads.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qualified" className="mt-4 space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-slate-200 bg-white/70 p-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    data-testid="filter-search"
                    type="search"
                    placeholder="Recherche société, gérant, email, ville, hook…"
                    value={filters.query}
                    onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                    className="h-[34px] w-full rounded-[10px] border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <DropdownMultiselect
                  label="Statut email"
                  options={availableStatuses}
                  formatOption={(v) => STATUS_LABELS[v]?.label ?? v}
                  selected={filters.statuses}
                  onToggle={(v) =>
                    setFilters((f) => ({ ...f, statuses: toggleInList(f.statuses, v) }))
                  }
                />

                <DropdownMultiselect
                  label="Secteur"
                  options={availableSecteurs}
                  selected={filters.secteurs}
                  onToggle={(v) =>
                    setFilters((f) => ({ ...f, secteurs: toggleInList(f.secteurs, v) }))
                  }
                />

                <div className="flex items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[13px]">
                  <span className="text-muted-foreground">Score</span>
                  <input
                    data-testid="filter-min-score"
                    type="number"
                    min={0}
                    max={100}
                    value={filters.minScore}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        minScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      }))
                    }
                    className="w-12 rounded border border-slate-200 px-1 text-center text-[12px] focus:border-primary focus:outline-none"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    data-testid="filter-max-score"
                    type="number"
                    min={0}
                    max={100}
                    value={filters.maxScore}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        maxScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      }))
                    }
                    className="w-12 rounded border border-slate-200 px-1 text-center text-[12px] focus:border-primary focus:outline-none"
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-[32px] items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <RotateCcw className="size-3.5" />
                    Réinitialiser
                  </button>
                )}

                <div className="ml-auto text-[12px] text-muted-foreground">
                  <span data-testid="visible-count" className="font-semibold tabular-nums text-slate-900">
                    {visibleQualified.length}
                  </span>{" "}
                  / {qualifiedLeads.length} leads
                </div>
              </div>

              {/* Qualified table */}
              <div className="overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <table className="w-full min-w-[960px] text-[13px]" data-testid="qualified-table">
                  <thead className="sticky top-0 bg-slate-50/80 backdrop-blur">
                    <tr className="border-b border-slate-200 text-left">
                      <ThSortable label="Prénom gérant" sortKey="prenom_gerant" sort={sort} onClick={toggleSort} />
                      <ThSortable label="Nom gérant"    sortKey="nom_gerant"    sort={sort} onClick={toggleSort} />
                      <ThSortable label="Société"       sortKey="societe"       sort={sort} onClick={toggleSort} />
                      <th className="px-3 py-2 font-semibold text-slate-700">Email gérant</th>
                      <th className="px-3 py-2 font-semibold text-slate-700">Téléphone</th>
                      <ThSortable label="Ville"         sortKey="ville"         sort={sort} onClick={toggleSort} />
                      <ThSortable label="Poste"         sortKey="poste"         sort={sort} onClick={toggleSort} />
                      <ThSortable label="Secteur"       sortKey="secteur"       sort={sort} onClick={toggleSort} />
                      <ThSortable label="Score"         sortKey="score"         sort={sort} onClick={toggleSort} />
                      <th className="px-3 py-2 font-semibold text-slate-700">Hook</th>
                      <ThSortable label="Statut email"  sortKey="statut_email"  sort={sort} onClick={toggleSort} />
                      <ThSortable label="Équipe"        sortKey="taille_equipe" sort={sort} onClick={toggleSort} />
                      <th className="px-3 py-2 font-semibold text-slate-700">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleQualified.map((lead, rowIndex) => {
                      const status = STATUS_LABELS[lead.statut_email] ?? {
                        label: lead.statut_email,
                        tone: "bg-slate-100 text-slate-600 border-slate-200",
                      };
                      const siteHref = lead.site
                        ? lead.site.startsWith("http")
                          ? lead.site
                          : `https://${lead.site}`
                        : null;
                      return (
                        <tr
                          key={`qualified:${rowIndex}:${lead.lead_id}`}
                          className="group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                          onClick={() => {
                            if (selectedCampaignId) {
                              router.push(
                                `/dashboard/campaigns/${selectedCampaignId}/leads/${lead.lead_id}`
                              );
                            }
                          }}
                        >
                          <td className="px-3 py-2 font-medium text-slate-900">{lead.prenom_gerant || "—"}</td>
                          <td className="px-3 py-2 text-slate-900">{lead.nom_gerant || "—"}</td>
                          <td className="px-3 py-2 text-slate-900">{lead.societe || "—"}</td>
                          <td className="px-3 py-2 text-slate-700" onClick={(e) => e.stopPropagation()}>
                            {lead.email_gerant ? (
                              <a
                                href={`mailto:${lead.email_gerant}`}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <Mail className="size-3" />
                                {lead.email_gerant}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700" onClick={(e) => e.stopPropagation()}>
                            {lead.téléphone ? (
                              <a
                                href={`tel:${lead.téléphone}`}
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-primary"
                              >
                                <Phone className="size-3" />
                                {lead.téléphone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{lead.ville || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{lead.poste || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{lead.secteur || "—"}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px] tabular-nums", scoreBadgeTone(lead.score))}
                            >
                              {lead.score}
                            </Badge>
                          </td>
                          <td className="max-w-[280px] px-3 py-2 text-slate-600">
                            {lead.personalized_hook ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="line-clamp-2 cursor-help">{lead.personalized_hook}</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {lead.personalized_hook}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={cn("text-[11px]", status.tone)}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-700">{lead.taille_equipe || "—"}</td>
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            {siteHref ? (
                              <a
                                href={siteHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-primary"
                              >
                                <ExternalLink className="size-3" />
                                {lead.site}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {visibleQualified.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-3 py-10 text-center text-sm text-muted-foreground">
                          Aucun lead ne correspond aux filtres actuels.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <div className="overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <table className="w-full min-w-[720px] text-[13px]" data-testid="rejected-table">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-3 py-2 font-semibold text-slate-700">Nom</th>
                      <th className="px-3 py-2 font-semibold text-slate-700">Site</th>
                      <th className="px-3 py-2 font-semibold text-slate-700">Score</th>
                      <th className="px-3 py-2 font-semibold text-slate-700">Raison du rejet</th>
                      <th className="px-3 py-2 font-semibold text-slate-700">Traité le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedLeads.map((lead, rowIndex) => {
                      const siteHref = lead.site
                        ? lead.site.startsWith("http")
                          ? lead.site
                          : `https://${lead.site}`
                        : null;
                      return (
                        <tr
                          key={`rejected:${rowIndex}:${lead.lead_id}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-2 text-slate-900">{lead.nom || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {siteHref ? (
                              <a
                                href={siteHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:text-primary"
                              >
                                <ExternalLink className="size-3" />
                                {lead.site}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px] tabular-nums", scoreBadgeTone(lead.score))}
                            >
                              {lead.score}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{lead.rejection_reason || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatDate(lead.processed_at)}
                          </td>
                        </tr>
                      );
                    })}
                    {rejectedLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                          Aucun lead rejeté pour cette campagne.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
}

function ThSortable({
  label,
  sortKey,
  sort,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onClick: (key: SortKey) => void;
}) {
  const active = sort.by === sortKey;
  return (
    <th className="px-3 py-2 font-semibold text-slate-700">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-primary",
          active && "text-primary"
        )}
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30 group-hover:opacity-70" />
        )}
      </button>
    </th>
  );
}

function DropdownMultiselect({
  label,
  options,
  selected,
  onToggle,
  formatOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatOption?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-medium transition-colors",
          selected.length > 0
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        )}
      >
        {label}
        {selected.length > 0 ? (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {selected.length}
          </span>
        ) : null}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-30 max-h-72 w-56 overflow-y-auto rounded-[12px] border border-slate-200 bg-white p-1 shadow-lg">
            {options.map((opt, optIndex) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={`${label}-${optIndex}-${opt}`}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="truncate">{formatOption ? formatOption(opt) : opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-white/60 px-6 py-24 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Search className="size-5" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">
        Sélectionne une campagne
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Choisis une campagne dans la liste déroulante pour voir l&apos;intégralité
        de ses leads synchronisés depuis Google Sheets.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// Export helpers for tests
export const _testing = { scoreBadgeTone, STATUS_LABELS };
