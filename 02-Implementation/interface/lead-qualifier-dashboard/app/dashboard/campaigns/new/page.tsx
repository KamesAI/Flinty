"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OFFRES = ["Répondeur IA 24/7", "Lead Scoring", "Résumé appels CRM", "Relances Email/SMS"];
const TAILLES = ["1-5", "1-10", "10-50", "50-200", "200+"];
const TEMPLATES = ["Template #1 Intro", "Template #2 Question", "Template #3 Valeur"];

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    secteur: "",
    localisation: "",
    taille_equipe: "1-10",
    poste: "",
    offre_kames: OFFRES[0],
    template_email: TEMPLATES[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/campaigns/${data.campaign_id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">Nouvelle campagne</p>
        <h1 className="text-3xl font-bold text-white">Lancer une prospection</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Nom de la campagne</label>
          <input
            className={inputClass}
            placeholder="ex: Plombiers Bordeaux — Mars 2026"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Secteur cible</label>
            <input className={inputClass} placeholder="ex: plombier" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Ville / Zone</label>
            <input className={inputClass} placeholder="ex: Bordeaux" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Taille d&apos;équipe</label>
            <select className={inputClass} value={form.taille_equipe} onChange={(e) => setForm({ ...form, taille_equipe: e.target.value })}>
              {TAILLES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Poste ciblé</label>
            <input className={inputClass} placeholder="ex: Gérant" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Offre Kames</label>
          <select className={inputClass} value={form.offre_kames} onChange={(e) => setForm({ ...form, offre_kames: e.target.value })}>
            {OFFRES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">Template email</label>
          <select className={inputClass} value={form.template_email} onChange={(e) => setForm({ ...form, template_email: e.target.value })}>
            {TEMPLATES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-zinc-400 text-sm hover:border-zinc-500 hover:text-white transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Lancement..." : "🚀 Lancer la campagne"}
          </button>
        </div>
      </form>
    </div>
  );
}
