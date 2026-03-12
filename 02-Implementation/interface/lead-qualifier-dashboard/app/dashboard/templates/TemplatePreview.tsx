"use client";

import { type EmailTemplateEntry } from "@/lib/email-templates";

function getPreviewText(entry: EmailTemplateEntry) {
  if (entry.preview_text.trim()) {
    return entry.preview_text.trim();
  }

  const collapsedBody = entry.body.replace(/\s+/g, " ").trim();
  if (!collapsedBody) {
    return "Aucun apercu defini pour ce template.";
  }

  return collapsedBody.slice(0, 110) + (collapsedBody.length > 110 ? "..." : "");
}

function getBodyParagraphs(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function TemplatePreview({ entry }: { entry: EmailTemplateEntry }) {
  const previewText = getPreviewText(entry);
  const bodyParagraphs = getBodyParagraphs(entry.body);
  const showMedia =
    entry.media_type !== "none" &&
    entry.media_thumbnail_url.trim() &&
    entry.media_target_url.trim();
  const showCta = entry.cta_label.trim() && entry.cta_url.trim();
  const previewToneClass = entry.is_rich_template
    ? "border-orange-400/30 bg-orange-400/[0.025]"
    : "border-zinc-800";

  return (
    <div className={`bg-zinc-950 border rounded-2xl p-5 h-full ${previewToneClass}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-400">
            Preview
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Rendu email-safe avec CTA et media cliquable.
          </p>
        </div>
      </div>

      <div className="bg-black border border-orange-400/20 rounded-2xl overflow-hidden">
        <div className="border-b border-orange-400/20 px-4 py-3 bg-zinc-950/80">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
            Inbox preview
          </p>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {entry.subject.trim() || "Objet de l'email"}
              </p>
              <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{previewText}</p>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-zinc-600">
              {entry.sequence_key.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {showMedia ? (
            <a
              href={entry.media_target_url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl overflow-hidden border border-zinc-800 bg-gradient-to-b from-orange-500/[0.02] to-transparent group transition-colors hover:border-orange-400/20"
            >
              <div className="relative aspect-[16/9] bg-zinc-900">
                {/* Email-safe video block: clickable thumbnail only, never embedded player. */}
                <img
                  src={entry.media_thumbnail_url}
                  alt="Miniature du media"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white border border-white/10">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                      ▶
                    </span>
                    {entry.media_type === "video" ? "Voir la demo" : "Ouvrir le media"}
                  </div>
                </div>
              </div>
            </a>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-6">
              <p className="text-sm text-zinc-400">
                Aucun media configure. Le template restera sur un format texte simple.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {bodyParagraphs.length > 0 ? (
              bodyParagraphs.map((paragraph, index) => (
                <p key={`${entry.sequence_key}-${entry.variant_key}-${index}`} className="text-sm leading-6 text-zinc-300">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-sm leading-6 text-zinc-500">
                Le corps du message apparaitra ici des que tu ajoutes du contenu.
              </p>
            )}
          </div>

          {showCta ? (
            <a
              href={entry.cta_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              {entry.cta_label}
            </a>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-500">
              Aucun CTA configure.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-orange-500/25 bg-black px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Note email-safe
        </p>
        <p className="text-sm text-zinc-400">
          Les videos ne sont jamais embarquees directement dans l&apos;email. Le preview simule
          uniquement une miniature cliquable avec bouton play visuel.
        </p>
      </div>

      {entry.notes.trim() ? (
        <div className="mt-4 rounded-xl border border-orange-300/20 bg-black px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Notes internes
          </p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{entry.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
