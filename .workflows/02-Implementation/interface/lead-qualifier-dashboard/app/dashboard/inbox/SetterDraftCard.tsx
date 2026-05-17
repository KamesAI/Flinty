"use client";

import { useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { AlertTriangle, RotateCcw, Send, SquarePen, X } from "lucide-react";
import type { ConversationTurn } from "@/lib/conversations";

interface SetterDraftCardProps {
  leadId: string;
  turn?: ConversationTurn;
  turnId?: string;
  draft?: string;
  confidence?: number;
  reasoning?: string;
  onSend?: () => void;
  onEscalate?: () => void;
}

function renderDiff(original: string, edited: string) {
  const originalWords = original.split(/(\s+)/);
  const editedWords = edited.split(/(\s+)/);

  return editedWords.map((word, index) => {
    const changed = word.trim().length > 0 && word !== originalWords[index];
    return (
      <span key={`${word}-${index}`} className={changed ? "rounded bg-yellow-200 px-0.5" : undefined}>
        {word}
      </span>
    );
  });
}

export function SetterDraftCard({
  leadId,
  turn,
  turnId,
  draft,
  confidence,
  reasoning,
  onSend,
  onEscalate,
}: SetterDraftCardProps) {
  const resolvedTurnId = turn?.turn_id ?? turnId ?? "";
  const originalDraft = turn?.content ?? draft ?? "";
  const [content, setContent] = useState(originalDraft);
  const [status, setStatus] = useState<"idle" | "sent" | "escalated" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const edited = content.trim() !== originalDraft.trim();

  function postAction(action: "send" | "escalate") {
    startTransition(async () => {
      setMessage("");
      const endpoint = `/api/replies/${leadId}/${action}`;
      const body =
        action === "send"
          ? {
              turn_id: resolvedTurnId,
              validated_by: "Thomas",
              edited_content: edited ? content : undefined,
            }
          : {
              turn_id: resolvedTurnId,
              escalated_by: "Thomas",
              reason: "manual_review",
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setStatus("error");
        setMessage(payload.error ?? "Action impossible");
        return;
      }

      setStatus(action === "send" ? "sent" : "escalated");
      setMessage(action === "send" ? "Envoi transmis à WF8." : "Thread escaladé.");
      if (action === "send") onSend?.();
      if (action === "escalate") onEscalate?.();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isPending && content.trim().length > 0 && status !== "sent") postAction("send");
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setContent(originalDraft);
    }
  }

  return (
    <div className={status === "escalated" ? "hidden" : "rounded-lg border border-[hsl(var(--primary)/0.2)] bg-white p-4 shadow-sm"}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
            Draft Setter
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Validation humaine obligatoire avant envoi.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {turn?.intent ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              {turn.intent}
            </span>
          ) : null}
          {typeof confidence === "number" ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {Math.round(confidence * 100)}%
            </span>
          ) : null}
          {edited ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              <SquarePen className="size-3" />
              Édité
            </span>
          ) : null}
        </div>
      </div>

      {reasoning ? (
        <details className="mb-3 rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <summary className="cursor-pointer font-semibold text-slate-900">Raisonnement</summary>
          <p className="mt-2 leading-5">{reasoning}</p>
        </details>
      ) : null}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={status === "sent"}
        aria-label="Draft Setter éditable"
        className="min-h-[150px] w-full resize-y rounded-md border border-border bg-white px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-[hsl(var(--primary))] disabled:bg-slate-50"
      />

      <div className="mt-3 rounded-md border border-dashed border-amber-200 bg-amber-50/50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-800">Diff</p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">
          {edited ? renderDiff(originalDraft, content) : "Aucune modification pour l'instant."}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => postAction("send")}
          disabled={isPending || status === "sent" || content.trim().length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="size-4" />
          {isPending ? "Envoi..." : status === "sent" ? "Envoyé ✓" : "Envoyer"}
        </button>
        <button
          type="button"
          onClick={() => setContent(originalDraft)}
          disabled={isPending || !edited}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="size-4" />
          Annuler
        </button>
        <button
          type="button"
          onClick={() => setShowEscalateConfirm(true)}
          aria-label="Confirmer l’escalade"
          disabled={isPending || status === "escalated"}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-800 transition-colors hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AlertTriangle className="size-4" />
          Escalader
        </button>
        {message ? (
          <span className={status === "error" ? "text-xs text-red-700" : "text-xs text-emerald-700"}>
            {message}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Enter pour envoyer · Shift + Enter pour une nouvelle ligne · Escape pour annuler l'édition
      </p>

      {showEscalateConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="escalate-title">
          <div className="w-full max-w-sm rounded-lg border border-border bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 id="escalate-title" className="text-base font-bold text-slate-950">
                  Confirmer l’escalade
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ce thread sortira du pipeline Setter automatique.
                </p>
              </div>
              <button type="button" onClick={() => setShowEscalateConfirm(false)} className="rounded-md p-1 text-muted-foreground hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEscalateConfirm(false)} className="h-9 rounded-md border border-border px-3 text-sm font-semibold">
                Annuler
              </button>
              <button type="button" onClick={() => postAction("escalate")} className="h-9 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white">
                Escalader
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
