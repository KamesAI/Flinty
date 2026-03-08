"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  EMAIL_TEMPLATE_SECTIONS,
  type CampaignEmailTemplates,
  type EmailTemplateEntry,
} from "@/lib/email-templates";

interface CampaignOption {
  campaign_id: string;
  nom: string;
  secteur: string;
  localisation: string;
}

function getEntryKey(entry: Pick<EmailTemplateEntry, "sequence_key" | "variant_key">) {
  return `${entry.sequence_key}:${entry.variant_key}`;
}

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

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.campaign_id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  function handleCampaignValidate() {
    router.push(`/dashboard/templates?campaign_id=${pendingCampaignId}`);
  }

  function updateEntry(
    target: Pick<EmailTemplateEntry, "sequence_key" | "variant_key">,
    field: "subject" | "body",
    value: string
  ) {
    setEntries((current) =>
      current.map((entry) =>
        getEntryKey(entry) === getEntryKey(target)
          ? { ...entry, [field]: value }
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
          Templates email
        </p>
        <h1 className="text-3xl font-bold text-white">Bibliotheque de campagne</h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-2xl">
          Garde ici les 3 variantes d&apos;email J0 et les relances J+3, J+7 et J+10
          pour chaque campagne.
        </p>
      </div>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
              Choisir une campagne
            </p>
            <h2 className="text-xl font-semibold text-white">Selection de la campagne</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Les templates sont stockes par campagne, sans melanger les messages.
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
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider
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

      <div className="space-y-6">
        {EMAIL_TEMPLATE_SECTIONS.map((section) => (
          <section key={section.key} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
                {section.key === "j0" ? "Sequence J0" : `Sequence ${section.title}`}
              </p>
              <h2 className="text-xl font-semibold text-white">
                {section.key === "j0"
                  ? selectedCampaign?.nom ?? "Campagne introuvable"
                  : section.title}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {section.key === "j0"
                  ? `${section.title}${selectedCampaign ? ` · ${selectedCampaign.secteur} · ${selectedCampaign.localisation}` : ""}`
                  : section.description}
              </p>
            </div>

            <div className={`grid gap-4 ${section.key === "j0" ? "md:grid-cols-3" : "grid-cols-1"}`}>
              {section.variants.map((variant) => {
                const entry = entries.find(
                  (candidate) =>
                    candidate.sequence_key === section.key &&
                    candidate.variant_key === variant.key
                );

                if (!entry) return null;

                return (
                  <div
                    key={`${section.key}:${variant.key}`}
                    className="bg-black border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-white">{variant.label}</p>
                      <span className="text-[11px] text-zinc-600 uppercase tracking-widest">
                        {section.key.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3">
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
                          Corps
                        </label>
                        <textarea
                          value={entry.body}
                          onChange={(event) =>
                            updateEntry(entry, "body", event.target.value)
                          }
                          placeholder="Contenu de l'email..."
                          rows={section.key === "j0" ? 12 : 10}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-y"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-zinc-500 max-w-2xl">
          Le dashboard sauvegarde les variantes par campagne. Pour mesurer automatiquement la
          meilleure variante J0, il faudra ensuite faire remonter la variante envoyee par lead
          dans le workflow n8n.
        </p>
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
