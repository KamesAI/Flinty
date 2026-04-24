"use client";

import React from "react";
import { Layers, Target, MailOpen, CalendarCheck } from "lucide-react";
import { KpiCard } from "./KpiCard";

interface KpiGridProps {
  campaignsActive: number;
  qualifiedCount: number;
  avgOpenRate: number;
  meetingsCount: number;
  deltas?: {
    campaignsActive?: number;
    qualifiedLeads?: number;
    openRate?: number;
    meetingsBooked?: number;
  };
  sparks?: {
    campaignsActive?: number[];
    qualifiedLeads?: number[];
    openRate?: number[];
    meetingsBooked?: number[];
  };
}

export function KpiGrid({
  campaignsActive,
  qualifiedCount,
  avgOpenRate,
  meetingsCount,
  deltas,
  sparks,
}: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
      <KpiCard
        label="Campagnes actives"
        value={campaignsActive}
        delta={deltas?.campaignsActive ?? 1}
        sublabel="au total"
        icon={Layers}
        spark={sparks?.campaignsActive}
        index={0}
      />
      <KpiCard
        label="Leads qualifiés"
        value={qualifiedCount}
        delta={deltas?.qualifiedLeads ?? 23}
        sublabel="cette semaine"
        icon={Target}
        spark={sparks?.qualifiedLeads}
        index={1}
      />
      <KpiCard
        label="Taux d'ouverture"
        value={avgOpenRate}
        suffix="%"
        decimals={1}
        delta={deltas?.openRate ?? 3.4}
        sublabel="moyenne globale"
        icon={MailOpen}
        spark={sparks?.openRate}
        index={2}
      />
      <KpiCard
        label="Meetings bookés"
        value={meetingsCount}
        delta={deltas?.meetingsBooked ?? 3}
        sublabel="sur la semaine"
        icon={CalendarCheck}
        spark={sparks?.meetingsBooked}
        index={3}
      />
    </div>
  );
}
