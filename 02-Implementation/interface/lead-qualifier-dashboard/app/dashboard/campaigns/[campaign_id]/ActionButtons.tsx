"use client";

import { useState } from "react";

export function ActionButtons({ campaignId }: { campaignId: string }) {
  const [qualifying, setQualifying] = useState(false);
  const [sendingJ0, setSendingJ0] = useState(false);

  async function handleQualify() {
    setQualifying(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/qualify`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Qualification lancée — leads envoyés à n8n`);
      } else {
        alert(`Erreur : ${data.message ?? "Echec de l'appel n8n"}`);
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
        alert(`Erreur : ${data.message ?? "Echec de l'appel n8n"}`);
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
