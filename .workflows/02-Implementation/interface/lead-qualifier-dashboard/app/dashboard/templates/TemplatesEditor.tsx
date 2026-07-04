"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeIsRichTemplate,
  EMAIL_TEMPLATE_MEDIA_OPTIONS,
  EMAIL_TEMPLATE_SECTIONS,
  type CampaignEmailTemplates,
  type EmailTemplateEntry,
  type EmailSequenceKey,
  type EmailVariantKey,
} from "@/lib/email-templates";
import { TemplatePreview } from "./TemplatePreview";

interface CampaignOption {
  campaign_id: string;
  nom: string;
  secteur: string;
  localisation: string;
}

const SECTION_TONE_CLASS = "border-zinc-200 bg-white shadow-sm";

const VARIANT_TONE_CLASS = "bg-white shadow-sm";

const CARD_PANEL_SURFACE_CLASS = "bg-white";

const CARD_SUBPANEL_SURFACE_CLASS = "border-zinc-200 bg-zinc-50";

const CARD_FIELD_CLASS =
  "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 focus:outline-none";

const VARIANT_TABS_RAIL_CLASS = "border border-blue-200/60 bg-blue-50";
const PREVIEW_TOGGLE_CLASS =
  "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition-colors";

function getEntryKey(entry: Pick<EmailTemplateEntry, "sequence_key" | "variant_key">) {
  return `${entry.sequence_key}:${entry.variant_key}`;
}

type EditableField =
  | "subject"
  | "body"
  | "preview_text"
  | "cta_label"
  | "cta_url"
  | "media_type"
  | "media_thumbnail_url"
  | "media_target_url"
  | "notes";

export function TemplatesEditor({
  campaigns,
  selectedCampaignId,
  initialTemplates,
  initialActiveSection = "j0",
}: {
  campaigns: CampaignOption[];
  selectedCampaignId: string;
  initialTemplates: CampaignEmailTemplates;
  initialActiveSection?: EmailSequenceKey;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialTemplates.entries);
  const [pendingCampaignId, setPendingCampaignId] = useState(selectedCampaignId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<EmailSequenceKey>(initialActiveSection);
  const [activeVariantKey, setActiveVariantKey] = useState<EmailVariantKey>("a");
  const [displayMode, setDisplayMode] = useState<"edit" | "options" | "preview">("edit");
  const [contentVisible, setContentVisible] = useState(true);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.campaign_id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  function handleCampaignValidate() {
    router.push(`/dashboard/templates?campaign_id=${pendingCampaignId}`);
  }

  function switchSection(key: EmailSequenceKey) {
    if (key === activeSection) return;
    setContentVisible(false);
    setTimeout(() => {
      setActiveSection(key);
      setDisplayMode("edit");
      setContentVisible(true);
    }, 150);
  }

  function updateEntry(
    target: Pick<EmailTemplateEntry, "sequence_key" | "variant_key">,
    field: EditableField,
    value: string
  ) {
    setEntries((current) =>
      current.map((entry) =>
        getEntryKey(entry) === getEntryKey(target)
          ? (() => {
              const nextMediaType =
                field === "media_type" ? (value as EmailTemplateEntry["media_type"]) : entry.media_type;

              return {
                ...entry,
                [field]: value,
                is_rich_template: computeIsRichTemplate({
                  preview_text: field === "preview_text" ? value : entry.preview_text,
                  cta_label: field === "cta_label" ? value : entry.cta_label,
                  cta_url: field === "cta_url" ? value : entry.cta_url,
                  media_type: nextMediaType,
                  media_thumbnail_url:
                    field === "media_thumbnail_url" ? value : entry.media_thumbnail_url,
                  media_target_url:
                    field === "media_target_url" ? value : entry.media_target_url,
                  notes: field === "notes" ? value : entry.notes,
                }),
              };
            })()
          : entry
      )
    );
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: selectedCampaignId,
          entries: entries.map((entry) => ({
            sequence_key: entry.sequence_key,
            variant_key: entry.variant_key,
            label: entry.label,
            subject: entry.subject,
            body: entry.body,
            preview_text: entry.preview_text,
            cta_label: entry.cta_label,
            cta_url: entry.cta_url,
            media_type: entry.media_type,
            media_thumbnail_url: entry.media_thumbnail_url,
            media_target_url: entry.media_target_url,
            is_rich_template: entry.is_rich_template,
            notes: entry.notes,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage(data.message ?? "Impossible d'enregistrer l'emailing.");
        return;
      }

      setEntries(data.templates.entries);
      setMessage("Emailing enregistre dans Google Sheets.");
    } catch {
      setMessage("Erreur reseau pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const currentSection = EMAIL_TEMPLATE_SECTIONS.find((s) => s.key === activeSection)!;
  const visibleVariants =
    currentSection.key === "j0"
      ? currentSection.variants.filter((variant) => variant.key === activeVariantKey)
      : currentSection.variants;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#059669]">
            Emailing
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Studio emailing
          </h1>
        </div>
        <div
          data-testid="templates-subheader"
          className="mt-3 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-[var(--dashboard-text-secondary)] sm:text-base">
            Gere ici les emails J0 et les relances de chaque campagne avec une lecture plus claire
            des variantes, du contenu et du rendu inbox.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-2">
              Choisir une campagne
            </p>
            <h2 className="text-xl font-semibold text-black">Selection de la campagne</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Chaque campagne conserve ses emails et variantes dans Google Sheets, sans melange
              entre campagnes.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <select
              className={`min-w-[280px] h-11 rounded-lg border px-4 text-sm text-zinc-900 ${CARD_SUBPANEL_SURFACE_CLASS} focus:border-zinc-400 focus:outline-none transition-colors`}
              value={pendingCampaignId}
              onChange={(event) => setPendingCampaignId(event.target.value)}
            >
              {campaigns.map((campaign) => (
                <option key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.nom}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCampaignValidate}
              disabled={pendingCampaignId === selectedCampaignId}
              className="group relative inline-flex h-11 items-center justify-center disabled:opacity-50"
            >
              <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-blue-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
              <span className="relative inline-flex h-11 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-white p-[1px]">
                <span className="inline-flex h-full items-center justify-center rounded-full bg-[rgba(8,20,46,0.92)] px-5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                  Valider
                </span>
              </span>
            </button>
            <Link
              href={`/dashboard/campaigns/${selectedCampaignId}`}
              className="inline-flex h-11 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Voir la campagne
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <aside className="w-52 shrink-0 sticky top-6 self-start flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-2 px-1">
            Séquences
          </p>
          {EMAIL_TEMPLATE_SECTIONS.map((section) => {
            const isActive = section.key === activeSection;
            const sectionEntries = entries.filter((e) => e.sequence_key === section.key);
            const hasContent = sectionEntries.some((e) => e.subject.trim().length > 0);
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => switchSection(section.key)}
                className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-150 ${
                  isActive
                    ? "border border-zinc-300 bg-zinc-100 text-zinc-900"
                    : "border border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                <span
                  className={`block text-sm font-semibold mb-0.5 ${isActive ? "text-zinc-900" : "text-zinc-700"}`}
                >
                  {section.key === "j0" ? "J0" : section.title.replace("Relance ", "")}
                </span>
                <span className="block text-xs leading-tight text-zinc-500">
                  {section.key === "j0" ? "Prise de contact" : section.description.split(" ").slice(0, 3).join(" ") + "…"}
                </span>
                {hasContent && (
                  <span
                    className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full ${isActive ? "bg-zinc-500" : "bg-zinc-400"}`}
                  />
                )}
              </button>
            );
          })}
        </aside>

        <div
          className="flex-1 min-w-0 transition-all duration-150"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <section
            className={`rounded-[28px] border p-6 lg:p-7 shadow-sm ${SECTION_TONE_CLASS}`}
          >
            <div className="mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-2">
                  {currentSection.key === "j0" ? "Sequence J0" : `Sequence ${currentSection.title}`}
                </p>
                <div className="space-y-3">
                  {selectedCampaign ? (
                    <p className="text-sm text-zinc-500 max-w-2xl">
                      {`${currentSection.title} · ${selectedCampaign.secteur} · ${selectedCampaign.localisation}`}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <h2 className="text-xl font-semibold text-primary md:text-2xl">
                      {selectedCampaign?.nom ?? "Campagne introuvable"}
                    </h2>
                    {currentSection.key !== "j0" && (
                      <button
                        type="button"
                        onClick={() =>
                          setDisplayMode((currentMode) =>
                            currentMode === "preview" ? "edit" : "preview"
                          )
                        }
                        aria-pressed={displayMode === "preview"}
                        className={`${PREVIEW_TOGGLE_CLASS} ${
                          displayMode === "preview"
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-blue-200/60 bg-blue-50 text-primary hover:bg-blue-100"
                        }`}
                      >
                        Apercu email
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {currentSection.key === "j0" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Tabs
                    value={activeVariantKey}
                    onValueChange={(value) => setActiveVariantKey(value as EmailVariantKey)}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className={`h-auto rounded-xl p-0.5 ${VARIANT_TABS_RAIL_CLASS}`}>
                      {currentSection.variants.map((variant) => {
                        const variantEntry = entries.find(
                          (candidate) =>
                            candidate.sequence_key === currentSection.key &&
                            candidate.variant_key === variant.key
                        );
                        const hasContent = Boolean(
                          variantEntry?.subject.trim() || variantEntry?.body.trim()
                        );

                        return (
                          <TabsTrigger
                            key={variant.key}
                            value={variant.key}
                            className="min-w-0 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium bg-primary/20 text-primary-foreground transition hover:bg-primary/30 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-primary/90"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span>{variant.label}</span>
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasContent ? "bg-emerald-400" : "bg-zinc-700"}`}
                              />
                            </span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDisplayMode((currentMode) =>
                          currentMode === "options" ? "edit" : "options"
                        )
                      }
                      aria-pressed={displayMode === "options"}
                      className={`${PREVIEW_TOGGLE_CLASS} ${
                        displayMode === "options"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-blue-200/60 bg-blue-50 text-primary hover:bg-blue-100"
                      }`}
                    >
                      CTA / Media optionnel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDisplayMode((currentMode) =>
                          currentMode === "preview" ? "edit" : "preview"
                        )
                      }
                      aria-pressed={displayMode === "preview"}
                      className={`${PREVIEW_TOGGLE_CLASS} ${
                        displayMode === "preview"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-blue-200/60 bg-blue-50 text-primary hover:bg-blue-100"
                      }`}
                    >
                      Apercu email
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {visibleVariants.map((variant) => {
                const entry = entries.find(
                  (candidate) =>
                    candidate.sequence_key === currentSection.key &&
                    candidate.variant_key === variant.key
                );

                if (!entry) return null;

                return (
                  <div
                    key={`${currentSection.key}:${variant.key}`}
                    className={`rounded-[24px] p-5 lg:p-6 ${VARIANT_TONE_CLASS}`}
                  >
                    <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-lg font-semibold text-zinc-900">{variant.label}</p>
                          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                            {currentSection.key.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {currentSection.key === "j0"
                            ? "Travaille une seule variante a la fois pour comparer les angles sans surcharge visuelle."
                            : "Concentre-toi sur un message court, lisible et facile a iterer."}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600`}
                      >
                        <span className="text-zinc-500">ID interne</span>
                        <span>
                          {selectedCampaignId} / {currentSection.key} / {variant.key}
                        </span>
                      </div>
                    </div>

                    {displayMode === "preview" ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:p-5">
                        <TemplatePreview entry={entry} />
                      </div>
                    ) : currentSection.key === "j0" && displayMode === "options" ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className={`rounded-2xl border p-4 ${CARD_SUBPANEL_SURFACE_CLASS}`}>
                            <div className="mb-3">
                              <p className="text-sm font-medium text-zinc-900">CTA optionnel</p>
                              <p className="mt-1 text-sm text-zinc-600">
                                Libelle et URL doivent etre remplis ensemble.
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                  Libelle CTA
                                </label>
                                <input
                                  value={entry.cta_label}
                                  onChange={(event) =>
                                    updateEntry(entry, "cta_label", event.target.value)
                                  }
                                  placeholder="Ex: Voir la demo"
                                  className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                  URL CTA
                                </label>
                                <input
                                  value={entry.cta_url}
                                  onChange={(event) =>
                                    updateEntry(entry, "cta_url", event.target.value)
                                  }
                                  placeholder="https://..."
                                  className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className={`rounded-2xl border p-4 lg:col-span-2 ${CARD_SUBPANEL_SURFACE_CLASS}`}
                          >
                            <div className="mb-3">
                              <p className="text-sm font-medium text-zinc-900">Media optionnel</p>
                              <p className="mt-1 text-sm text-zinc-600">
                                Utilise une miniature cliquable, jamais une video embarquee.
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                  Type de media
                                </label>
                                <select
                                  value={entry.media_type}
                                  onChange={(event) =>
                                    updateEntry(entry, "media_type", event.target.value)
                                  }
                                  className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                                >
                                  {EMAIL_TEMPLATE_MEDIA_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <p className="mt-2 text-xs text-zinc-500">
                                  {
                                    EMAIL_TEMPLATE_MEDIA_OPTIONS.find(
                                      (option) => option.value === entry.media_type
                                    )?.description
                                  }
                                </p>
                              </div>

                              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                    URL miniature
                                  </label>
                                  <input
                                    value={entry.media_thumbnail_url}
                                    onChange={(event) =>
                                      updateEntry(
                                        entry,
                                        "media_thumbnail_url",
                                        event.target.value
                                      )
                                    }
                                    placeholder="https://.../thumbnail.jpg"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                    URL cible
                                  </label>
                                  <input
                                    value={entry.media_target_url}
                                    onChange={(event) =>
                                      updateEntry(
                                        entry,
                                        "media_target_url",
                                        event.target.value
                                      )
                                    }
                                    placeholder="https://loom.com/... ou landing page"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div
                          className={`rounded-2xl p-4 lg:p-5 ${CARD_PANEL_SURFACE_CLASS}`}
                        >
                          <div className="mb-4">
                            <p className="text-sm font-medium text-zinc-900">Contenu principal</p>
                            <p className="mt-1 text-sm text-zinc-600">
                              Garde l&apos;essentiel visible: objet, apercu et corps du message.
                            </p>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                              Sujet
                              </label>
                              <input
                                value={entry.subject}
                                onChange={(event) =>
                                  updateEntry(entry, "subject", event.target.value)
                                }
                                placeholder="Objet de l'email"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                              Preview text
                              </label>
                              <input
                                value={entry.preview_text}
                                onChange={(event) =>
                                  updateEntry(entry, "preview_text", event.target.value)
                                }
                                placeholder="Texte d'aperçu de la boite mail"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm ${CARD_FIELD_CLASS}`}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                              Corps
                            </label>
                            <textarea
                              value={entry.body}
                              onChange={(event) => updateEntry(entry, "body", event.target.value)}
                              placeholder="Contenu de l'email..."
                              rows={currentSection.key === "j0" ? 10 : 8}
                              className={`w-full resize-y rounded-xl border px-4 py-3 text-sm ${CARD_FIELD_CLASS}`}
                            />
                          </div>
                        </div>

                        <div className={`rounded-2xl border p-4 ${CARD_SUBPANEL_SURFACE_CLASS}`}>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-zinc-900">Notes internes</p>
                            <p className="mt-1 text-sm text-zinc-600">
                              Conserve ici les hypotheses, segments et angles a tester.
                            </p>
                          </div>
                          <textarea
                            value={entry.notes}
                            onChange={(event) => updateEntry(entry, "notes", event.target.value)}
                            placeholder="Hypothese de test, cible, angle commercial..."
                            rows={3}
                            className={`w-full resize-y rounded-xl border px-4 py-3 text-sm ${CARD_FIELD_CLASS}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-zinc-400">{message}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-4" />
            {saving ? "Enregistrement..." : "Enregistrer le template"}
          </button>
        </div>
      </div>
    </div>
  );
}
