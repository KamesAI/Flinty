"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  computeIsRichTemplate,
  EMAIL_TEMPLATE_MEDIA_OPTIONS,
  EMAIL_TEMPLATE_SECTIONS,
  type CampaignEmailTemplates,
  type EmailTemplateEntry,
  type EmailSequenceKey,
} from "@/lib/email-templates";
import { TemplatePreview } from "./TemplatePreview";

interface CampaignOption {
  campaign_id: string;
  nom: string;
  secteur: string;
  localisation: string;
}

const SECTION_TONE_CLASS = "border-orange-400/28 bg-orange-400/[0.025]";

const VARIANT_TONE_CLASS = "border-orange-400/18 bg-orange-400/[0.012]";

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
}: {
  campaigns: CampaignOption[];
  selectedCampaignId: string;
  initialTemplates: CampaignEmailTemplates;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialTemplates.entries);
  const [pendingCampaignId, setPendingCampaignId] = useState(selectedCampaignId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<EmailSequenceKey>("j0");
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
        setMessage(data.message ?? "Impossible d'enregistrer les templates.");
        return;
      }

      setEntries(data.templates.entries);
      setMessage("Templates enregistres dans Google Sheets.");
    } catch {
      setMessage("Erreur reseau pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const currentSection = EMAIL_TEMPLATE_SECTIONS.find((s) => s.key === activeSection)!;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
          Templates email
        </p>
        <h1 className="text-3xl font-bold text-white">Bibliotheque de campagne</h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-2xl">
          Gere ici les variantes J0 et les relances avec preview text, CTA et media email-safe
          pour chaque campagne.
        </p>
      </div>

      <section className="bg-zinc-950 border border-orange-500/35 bg-orange-500/[0.03] rounded-2xl p-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
              Choisir une campagne
            </p>
            <h2 className="text-xl font-semibold text-white">Selection de la campagne</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Les templates restent stockes par campagne, avec compatibilite V1 et metadonnees
              V2 dans Google Sheets.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors min-w-[280px]"
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
              className="group relative inline-flex items-center justify-center disabled:opacity-50"
            >
              <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
              <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
                <span className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                  Valider
                </span>
              </span>
            </button>
            <Link
              href={`/dashboard/campaigns/${selectedCampaignId}`}
              className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:text-white hover:border-zinc-500 transition-colors"
            >
              Voir la campagne
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-6 items-start">
        {/* Sidebar verticale */}
        <aside className="w-52 shrink-0 sticky top-6 self-start flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2 px-1">
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
                    ? "bg-orange-500/15 border border-orange-500/40 text-orange-300"
                    : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <span
                  className={`block text-sm font-semibold mb-0.5 ${isActive ? "text-orange-400" : "text-zinc-300"}`}
                >
                  {section.key === "j0" ? "J0" : section.title.replace("Relance ", "")}
                </span>
                <span className="block text-xs leading-tight text-zinc-500">
                  {section.key === "j0" ? "Prise de contact" : section.description.split(" ").slice(0, 3).join(" ") + "…"}
                </span>
                {hasContent && (
                  <span
                    className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full ${isActive ? "bg-orange-400" : "bg-zinc-600"}`}
                  />
                )}
              </button>
            );
          })}
        </aside>

        {/* Contenu animé */}
        <div
          className="flex-1 min-w-0 transition-all duration-150"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <section className={`bg-zinc-950 border rounded-2xl p-6 ${SECTION_TONE_CLASS}`}>
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
                {currentSection.key === "j0" ? "Sequence J0" : `Sequence ${currentSection.title}`}
              </p>
              <h2 className="text-xl font-semibold text-white">
                {currentSection.key === "j0"
                  ? selectedCampaign?.nom ?? "Campagne introuvable"
                  : currentSection.title}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {currentSection.key === "j0"
                  ? `${currentSection.title}${selectedCampaign ? ` · ${selectedCampaign.secteur} · ${selectedCampaign.localisation}` : ""}`
                  : currentSection.description}
              </p>
            </div>

            <div className="space-y-5">
              {currentSection.variants.map((variant) => {
                const entry = entries.find(
                  (candidate) =>
                    candidate.sequence_key === currentSection.key &&
                    candidate.variant_key === variant.key
                );

                if (!entry) return null;

                return (
                  <div
                    key={`${currentSection.key}:${variant.key}`}
                    className={`bg-black border rounded-2xl p-4 lg:p-5 ${VARIANT_TONE_CLASS}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-white">{variant.label}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Cle template: {selectedCampaignId} / {currentSection.key} / {variant.key}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-zinc-600 uppercase tracking-widest">
                          {currentSection.key.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                              Sujet
                            </label>
                            <input
                              value={entry.subject}
                              onChange={(event) =>
                                updateEntry(entry, "subject", event.target.value)
                              }
                              placeholder="Objet de l'email"
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                              Preview text
                            </label>
                            <input
                              value={entry.preview_text}
                              onChange={(event) =>
                                updateEntry(entry, "preview_text", event.target.value)
                              }
                              placeholder="Texte d'aperçu de la boite mail"
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                            Corps
                          </label>
                          <textarea
                            value={entry.body}
                            onChange={(event) => updateEntry(entry, "body", event.target.value)}
                            placeholder="Contenu de l'email..."
                            rows={currentSection.key === "j0" ? 11 : 9}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-y"
                          />
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-orange-500/[0.025] to-transparent p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.06)]">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-orange-100">Bloc CTA</p>
                            <p className="text-sm text-zinc-500 mt-1">
                              Renseigne le libelle et l&apos;URL ensemble pour afficher un bouton
                              d&apos;action dans le preview.
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                Libelle CTA
                              </label>
                              <input
                                value={entry.cta_label}
                                onChange={(event) =>
                                  updateEntry(entry, "cta_label", event.target.value)
                                }
                                placeholder="Ex: Voir la demo"
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                URL CTA
                              </label>
                              <input
                                value={entry.cta_url}
                                onChange={(event) =>
                                  updateEntry(entry, "cta_url", event.target.value)
                                }
                                placeholder="https://..."
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-orange-400/[0.02] to-transparent p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.05)]">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-orange-100">Bloc media</p>
                            <p className="text-sm text-zinc-500 mt-1">
                              Pour une video, configure uniquement une miniature et une URL cible.
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                Type de media
                              </label>
                              <select
                                value={entry.media_type}
                                onChange={(event) =>
                                  updateEntry(entry, "media_type", event.target.value)
                                }
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                              >
                                {EMAIL_TEMPLATE_MEDIA_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-zinc-500 mt-2">
                                {
                                  EMAIL_TEMPLATE_MEDIA_OPTIONS.find(
                                    (option) => option.value === entry.media_type
                                  )?.description
                                }
                              </p>
                            </div>

                            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                  URL miniature
                                </label>
                                <input
                                  value={entry.media_thumbnail_url}
                                  onChange={(event) =>
                                    updateEntry(entry, "media_thumbnail_url", event.target.value)
                                  }
                                  placeholder="https://.../thumbnail.jpg"
                                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                  URL cible
                                </label>
                                <input
                                  value={entry.media_target_url}
                                  onChange={(event) =>
                                    updateEntry(entry, "media_target_url", event.target.value)
                                  }
                                  placeholder="https://loom.com/... ou landing page"
                                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-orange-300/20 bg-orange-300/[0.025] p-4">
                          <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                            Notes internes
                          </label>
                          <textarea
                            value={entry.notes}
                            onChange={(event) => updateEntry(entry, "notes", event.target.value)}
                            placeholder="Hypothese de test, cible, angle commercial..."
                            rows={3}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-y"
                          />
                        </div>
                      </div>

                      <TemplatePreview entry={entry} />
                    </div>
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
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "Enregistrer les templates"}
          </button>
        </div>
      </div>
    </div>
  );
}
