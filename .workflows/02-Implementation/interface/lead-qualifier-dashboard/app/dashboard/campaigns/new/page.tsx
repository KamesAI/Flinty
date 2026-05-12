"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ArrowLeft, Sparkles, Rocket, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CAMPAIGN_QUESTIONS } from "./chat-state";
import { deriveFormDefaults } from "./campaign-launch";
import { DEFAULT_TARGET_QUALIFIED_LEADS } from "@/lib/lead-targets";

const BRAND = "#006596";
const BRAND_LIGHT = "#00A8E8";
const STORAGE_KEY = "flinty.campaigns.new.chat";
const TOAST_KEY = "flinty.flash_toast";

export default function NewCampaignPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icpMd, setIcpMd] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [secteur, setSecteur] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [offre, setOffre] = useState("");
  const [targetQualifiedLeads, setTargetQualifiedLeads] = useState(DEFAULT_TARGET_QUALIFIED_LEADS);
  const [searchTerms, setSearchTerms] = useState("");
  const [searchLocations, setSearchLocations] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentIndex = answers.length;
  const isComplete = currentIndex >= CAMPAIGN_QUESTIONS.length;
  const progress = Math.min(currentIndex, CAMPAIGN_QUESTIONS.length);
  const showLaunch = icpMd !== null;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers: string[] };
        if (parsed && Array.isArray(parsed.answers)) setAnswers(parsed.answers);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers }));
    } catch { /* ignore */ }
  }, [answers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [answers, isComplete]);

  useEffect(() => {
    if (!isComplete) inputRef.current?.focus();
  }, [currentIndex, isComplete]);

  useEffect(() => {
    if (icpMd !== null) {
      const defaults = deriveFormDefaults(answers);
      setNom(defaults.nom);
      setSecteur(defaults.secteur);
      setLocalisation(defaults.localisation);
      setOffre(defaults.offre_kames);
      setSearchTerms(defaults.secteur);
      setSearchLocations(defaults.localisation);
    }
  }, [icpMd, answers]);

  const submit = () => {
    const value = draft.trim();
    if (!value || isComplete) return;
    setAnswers((prev) => [...prev, value]);
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const goBack = () => {
    if (answers.length === 0) return;
    const last = answers[answers.length - 1];
    setAnswers((prev) => prev.slice(0, -1));
    setDraft(last);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns/generate-icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { icp_md?: string };
      setIcpMd(data.icp_md ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur génération ICP");
    } finally {
      setGenerating(false);
    }
  };

  const handleLaunch = async () => {
    if (!icpMd) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const defaults = deriveFormDefaults(answers);
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
          target_qualified_leads: targetQualifiedLeads,
          search_terms: searchTerms,
          search_locations: searchLocations,
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

  const timeline: Array<
    | { kind: "q"; index: number; text: string }
    | { kind: "a"; index: number; text: string }
  > = [];
  for (let i = 0; i < CAMPAIGN_QUESTIONS.length; i++) {
    if (i > currentIndex) break;
    timeline.push({ kind: "q", index: i, text: CAMPAIGN_QUESTIONS[i].text });
    if (i < answers.length) {
      timeline.push({ kind: "a", index: i, text: answers[i] });
    }
  }

  // --- LAUNCH SCREEN (after ICP generated) ---
  if (showLaunch) {
    return (
      <div className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col p-4 sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
              Nouvelle campagne
            </p>
            <h1 className="text-3xl font-bold">Ton ICP est prêt</h1>
            <p className="mt-1 text-sm text-[#6b6b69]">Édite si besoin, configure puis lance.</p>
          </div>
          <button
            type="button"
            onClick={() => setIcpMd(null)}
            className="rounded-lg border border-black/10 px-3 py-2 text-xs text-[#6b6b69] transition-colors hover:border-black/20 hover:text-[#111111]"
          >
            ← Retour
          </button>
        </header>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Nom de la campagne", value: nom, onChange: setNom, placeholder: "Campagne Plombiers Bordeaux" },
            { label: "Secteur", value: secteur, onChange: setSecteur, placeholder: "ex : Plombiers" },
            { label: "Localisation", value: localisation, onChange: setLocalisation, placeholder: "ex : Bordeaux" },
            { label: "Offre Kames", value: offre, onChange: setOffre, placeholder: "Votre proposition de valeur" },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-[#6b6b69]">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#aaaaa7] focus:border-[#006596]/40 focus:outline-none focus:ring-2 focus:ring-[#006596]/10"
              />
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-xs font-medium text-[#6b6b69]">
            Objectif de leads qualifiés
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={targetQualifiedLeads}
            onChange={(e) => setTargetQualifiedLeads(Number(e.target.value) || DEFAULT_TARGET_QUALIFIED_LEADS)}
            className="w-40 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#006596]/40 focus:outline-none focus:ring-2 focus:ring-[#006596]/10"
          />
          <p className="mt-2 text-xs text-[#6b6b69]">
            Flinty générera assez de leads raw pour viser cet objectif, avec une marge finale de +/- 10%.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-[#6b6b69]">
              Métiers à scraper
            </label>
            <textarea
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              placeholder="plomberie, électricité, menuiserie, couverture"
              className="min-h-[82px] w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#aaaaa7] focus:border-[#006596]/40 focus:outline-none focus:ring-2 focus:ring-[#006596]/10"
            />
            <p className="mt-2 text-xs text-[#6b6b69]">
              Sépare les métiers par des virgules : WF1 générera une matrice métier x ville.
            </p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-[#6b6b69]">
              Villes à scraper
            </label>
            <textarea
              value={searchLocations}
              onChange={(e) => setSearchLocations(e.target.value)}
              placeholder="Bordeaux, Mérignac, Pessac, Talence"
              className="min-h-[82px] w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#aaaaa7] focus:border-[#006596]/40 focus:outline-none focus:ring-2 focus:ring-[#006596]/10"
            />
            <p className="mt-2 text-xs text-[#6b6b69]">
              Utilise une vraie liste de villes, pas une phrase ICP.
            </p>
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            <div className="border-b border-black/6 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6b6b69]">Édition</span>
            </div>
            <textarea
              value={icpMd}
              onChange={(e) => setIcpMd(e.target.value)}
              className="flex-1 resize-none bg-transparent p-4 font-mono text-xs text-[#111111] focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            <div className="border-b border-black/6 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6b6b69]">Aperçu</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{icpMd}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {launchError && <p className="mt-3 text-sm text-red-600">{launchError}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching || !nom.trim()}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
          >
            <Rocket className="h-4 w-4" />
            {launching ? "Lancement en cours…" : "Lancer la campagne"}
          </button>
        </div>
      </div>
    );
  }

  // --- CHAT SCREEN ---
  return (
    <div className="flex flex-col bg-slate-50" style={{ minHeight: "calc(100vh - 0px)" }}>
      {/* Top bar */}
      <header className="w-full border-b border-slate-200/70 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div
              className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2"
              style={{ color: BRAND }}
            >
              Nouvelle campagne
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${(progress / CAMPAIGN_QUESTIONS.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${BRAND}, ${BRAND_LIGHT})` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {progress}/{CAMPAIGN_QUESTIONS.length}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
          >
            Annuler
          </button>
        </div>
      </header>

      {/* Chat panel */}
      <main className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_32px_-8px_rgba(15,23,42,0.08)] border border-slate-200/60 overflow-hidden">
          {/* Thread */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-[420px] max-h-[calc(100vh-300px)]"
          >
            <AnimatePresence initial={false}>
              {timeline.map((item) => {
                const key = `${item.kind}-${item.index}`;
                if (item.kind === "q") {
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
                      >
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div
                          className="text-[10px] font-semibold tracking-wider uppercase mb-1"
                          style={{ color: BRAND }}
                        >
                          Question {item.index + 1}
                        </div>
                        <p className="text-[15px] leading-relaxed text-gray-800">{item.text}</p>
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-end"
                  >
                    <div
                      className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap break-words text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      {item.text}
                    </div>
                  </motion.div>
                );
              })}

              {isComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[15px] leading-relaxed text-gray-800">
                      ✨ Tu as répondu aux 8 questions. Génère ton ICP pour passer à l&apos;étape suivante.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Input / completion bar */}
          <div className="border-t border-slate-200/70 bg-white px-4 py-4">
            {!isComplete ? (
              <>
                <div className="flex items-end gap-2">
                  <button
                    onClick={goBack}
                    disabled={answers.length === 0}
                    className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="Revenir à la question précédente"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 flex items-end gap-2 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 focus-within:border-[#006596]/40 border border-slate-200 rounded-3xl px-4 py-2 transition-all"
                    style={{ "--tw-ring-color": `${BRAND}33` } as React.CSSProperties}
                  >
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                      }}
                      onKeyDown={handleKey}
                      placeholder={CAMPAIGN_QUESTIONS[currentIndex]?.placeholder}
                      className="flex-1 resize-none bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-slate-400 leading-relaxed py-1.5 max-h-[140px]"
                    />
                    <button
                      onClick={submit}
                      disabled={!draft.trim()}
                      className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: BRAND }}
                      aria-label="Envoyer"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Entrée pour valider · Shift+Entrée pour saut de ligne
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-12 rounded-xl text-white font-medium text-[15px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération en cours…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Générer l&apos;ICP
                      <Rocket className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
                <button
                  onClick={goBack}
                  disabled={generating}
                  className="w-full h-9 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Modifier la dernière réponse
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
