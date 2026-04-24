"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, Sparkles, Rocket } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  CAMPAIGN_QUESTIONS,
  ChatState,
  currentQuestion,
  getDraftAnswer,
  goBack,
  initialChatState,
  isComplete,
  submitAnswer,
} from "./chat-state";
import { deriveFormDefaults } from "./campaign-launch";

const STORAGE_KEY = "flinty.campaigns.new.chat";
const TOAST_KEY = "flinty.flash_toast";

export default function NewCampaignPage() {
  const router = useRouter();
  const [state, setState] = useState<ChatState>(initialChatState);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [icpMd, setIcpMd] = useState<string | null>(null);

  // Campaign form state (shown after ICP is generated)
  const [nom, setNom] = useState("");
  const [secteur, setSecteur] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [offre, setOffre] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatState;
        if (parsed && Array.isArray(parsed.answers) && typeof parsed.currentIndex === "number") {
          setState(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    setDraft(getDraftAnswer(state));
    inputRef.current?.focus();
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [state]);

  // Pre-fill form when ICP is generated
  useEffect(() => {
    if (icpMd !== null) {
      const defaults = deriveFormDefaults(state.answers);
      setNom(defaults.nom);
      setSecteur(defaults.secteur);
      setLocalisation(defaults.localisation);
      setOffre(defaults.offre_kames);
    }
  }, [icpMd, state.answers]);

  const question = currentQuestion(state);
  const complete = isComplete(state);
  const showLaunch = icpMd !== null && !generationError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setState((s) => submitAnswer(s, draft));
  };

  const handleBack = () => {
    if (state.currentIndex === 0) return;
    setState(goBack);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/campaigns/generate-icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: state.answers }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { icp_md?: string };
      setIcpMd(data.icp_md ?? "");
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "Erreur génération ICP");
    } finally {
      setGenerating(false);
    }
  };

  const handleLaunch = async () => {
    if (!icpMd) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const defaults = deriveFormDefaults(state.answers);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          secteur,
          localisation,
          offre_kames: offre,
          icp_md: icpMd,
          villes: localisation,
          taille_equipe: defaults.taille_equipe,
          poste_cible: "",
          template_email: "j0_default",
          score_minimum: 60,
        }),
      });
      if (res.status !== 202) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(TOAST_KEY, `Campagne "${nom}" lancée avec succès !`);
      router.push("/dashboard");
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Erreur lancement campagne");
    } finally {
      setLaunching(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (showLaunch) {
    return (
      <div className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col p-4 sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#006596]">
              Nouvelle campagne
            </p>
            <h1 className="text-3xl font-bold text-white">Ton ICP est prêt</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Édite si besoin, configure puis lance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIcpMd(null)}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            ← Retour
          </button>
        </header>

        {/* Campaign meta form */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Nom de la campagne", value: nom, onChange: setNom, placeholder: "Campagne Plombiers Bordeaux" },
            { label: "Secteur", value: secteur, onChange: setSecteur, placeholder: "ex : Plombiers" },
            { label: "Localisation", value: localisation, onChange: setLocalisation, placeholder: "ex : Bordeaux" },
            { label: "Offre Kames", value: offre, onChange: setOffre, placeholder: "Votre proposition de valeur" },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-zinc-500">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/60 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Split view */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Textarea */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Édition</span>
            </div>
            <textarea
              value={icpMd}
              onChange={(e) => setIcpMd(e.target.value)}
              className="flex-1 resize-none bg-transparent p-4 font-mono text-xs text-zinc-300 focus:outline-none"
              rows={30}
              spellCheck={false}
            />
          </div>

          {/* Markdown preview */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Aperçu</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white">
                <ReactMarkdown>{icpMd}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {launchError && (
          <p className="mt-3 text-sm text-red-400">{launchError}</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching || !nom.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {launching ? "Lancement en cours…" : "Lancer la campagne"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col p-4 sm:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#006596]">
            Nouvelle campagne
          </p>
          <h1 className="text-3xl font-bold text-white">Construisons ton ICP</h1>
          <p className="mt-1 text-sm text-zinc-500">
            8 questions pour cadrer ta cible — Claude générera l&apos;ICP ensuite.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          Annuler
        </button>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-[#006596] transition-all"
            style={{ width: `${(state.currentIndex / CAMPAIGN_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-zinc-500">
          {Math.min(state.currentIndex, CAMPAIGN_QUESTIONS.length)} / {CAMPAIGN_QUESTIONS.length}
        </span>
      </div>

      <div
        ref={transcriptRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 sm:p-6"
      >
        {state.answers.map((answer, index) => {
          const q = CAMPAIGN_QUESTIONS[index];
          if (!q) return null;
          const editing = index === state.currentIndex;
          return (
            <div key={q.key} className="space-y-3">
              <ChatBubble role="assistant" text={q.text} />
              <ChatBubble role="user" text={answer} muted={editing} />
            </div>
          );
        })}

        {!complete && question && state.currentIndex >= state.answers.length && (
          <ChatBubble role="assistant" text={question.text} />
        )}

        {complete && (
          <div className="space-y-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
            <p className="text-sm font-medium text-blue-300">
              ✨ Tu as répondu aux 8 questions. Génère ton ICP pour passer à l&apos;étape suivante.
            </p>
            {generationError && (
              <p className="text-sm text-red-400">{generationError}</p>
            )}
          </div>
        )}
      </div>

      {!complete && question && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 focus-within:border-blue-500/60">
            <button
              type="button"
              onClick={handleBack}
              disabled={state.currentIndex === 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Retour à la question précédente"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={question.placeholder}
              rows={2}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#006596] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Envoyer la réponse"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Entrée pour valider · Shift+Entrée pour saut de ligne
          </p>
        </form>
      )}

      {complete && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Modifier la dernière réponse
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Génération en cours…" : "Générer l'ICP"}
          </button>
        </div>
      )}
    </div>
  );
}

function ChatBubble({
  role,
  text,
  muted = false,
}: {
  role: "assistant" | "user";
  text: string;
  muted?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? muted
              ? "border border-zinc-800 bg-zinc-900/50 text-zinc-500 line-through decoration-zinc-700"
              : "bg-[#006596] text-black"
            : "border border-zinc-800 bg-zinc-900/60 text-zinc-200",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}
