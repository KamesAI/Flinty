"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ActionButtons({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [qualifying, setQualifying] = useState(false);
  const [sendingJ0, setSendingJ0] = useState(false);

  useEffect(() => {
    if (status !== "generating") return;
    const interval = window.setInterval(() => {
      router.refresh();
    }, 12_000);
    return () => window.clearInterval(interval);
  }, [router, status]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate-leads`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Génération lancée — WF1 scrape Google Maps, les leads arrivent dans l'onglet Raw.");
        router.refresh();
      } else {
        alert(`Erreur : ${data.message ?? "Échec de l'appel n8n"}`);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setGenerating(false);
    }
  }

  async function handleQualify() {
    setQualifying(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/qualify`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Qualification lancée — leads envoyés à n8n.");
      } else {
        alert(`Erreur : ${data.message ?? "Échec de l'appel n8n"}`);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setQualifying(false);
    }
  }

  async function handleSendJ0() {
    setSendingJ0(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send-j0`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Emails J0 lancés — ${data.leads_count} lead${data.leads_count > 1 ? "s" : ""} contacté${data.leads_count > 1 ? "s" : ""}`);
      } else {
        alert(`Erreur : ${data.message ?? "Échec de l'appel n8n"}`);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSendingJ0(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {generating ? "Génération..." : "⚡ Générer les leads"}
      </button>
      <button
        onClick={handleQualify}
        disabled={qualifying}
        className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium text-sm hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {qualifying ? "Qualification..." : "▶ Qualifier les leads"}
      </button>
      <button
        onClick={handleSendJ0}
        disabled={sendingJ0}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sendingJ0 ? "Envoi..." : "📧 Envoyer emails J0"}
      </button>
    </div>
  );
}
