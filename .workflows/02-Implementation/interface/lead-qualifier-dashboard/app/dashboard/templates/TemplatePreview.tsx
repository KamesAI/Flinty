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
  const previewShellClass = "border-zinc-200 bg-white shadow-sm";
  const previewPanelClass = "border-zinc-200 bg-zinc-50";
  const previewInsetClass = "border-zinc-200 bg-white";

  return (
    <div className={`h-full rounded-[24px] border p-5 ${previewShellClass}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Apercu email
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Lecture rapide du rendu inbox et du message.
          </p>
        </div>
      </div>

      <div className={`overflow-hidden rounded-[22px] border ${previewInsetClass}`}>
        <div className={`border-b px-4 py-3 ${previewPanelClass}`}>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-zinc-500">
            Inbox preview
          </p>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {entry.subject.trim() || "Objet de l'email"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{previewText}</p>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              {entry.sequence_key.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="border-t-0 bg-white p-4 space-y-4">
          {showMedia ? (
            <a
              href={entry.media_target_url}
              target="_blank"
              rel="noreferrer"
              className={`group block overflow-hidden rounded-xl border transition-colors hover:border-zinc-300 ${previewPanelClass}`}
            >
              <div className="relative aspect-[16/9] bg-zinc-100">
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
            <div className={`rounded-xl border border-dashed px-4 py-5 ${previewPanelClass}`}>
              <p className="text-sm text-zinc-600">
                Aucun media configure. Le template restera sur un format texte simple.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {bodyParagraphs.length > 0 ? (
              bodyParagraphs.map((paragraph, index) => (
                <p
                  key={`${entry.sequence_key}-${entry.variant_key}-${index}`}
                  className="text-sm leading-6 text-zinc-800"
                >
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
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {entry.cta_label}
            </a>
          ) : (
            <div className={`rounded-lg border px-4 py-3 text-sm text-zinc-600 ${previewPanelClass}`}>
              Aucun CTA configure.
            </div>
          )}
        </div>
      </div>

      <div className={`mt-4 rounded-xl border px-4 py-3 ${previewPanelClass}`}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Note email-safe
        </p>
        <p className="text-sm text-zinc-600">
          Les videos ne sont jamais embarquees directement dans l&apos;email. Le preview simule
          uniquement une miniature cliquable avec bouton play visuel.
        </p>
      </div>

      {entry.notes.trim() ? (
        <div className={`mt-4 rounded-xl border px-4 py-3 ${previewPanelClass}`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Notes internes
          </p>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap">{entry.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
