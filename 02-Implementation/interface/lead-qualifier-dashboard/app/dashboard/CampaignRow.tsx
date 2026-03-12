"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buildCampaignCarouselItems } from "./campaign-row-carousel";
import { buildCampaignRowModel, type CampaignRowProps } from "./campaign-row-model";
import { getCampaignRowThemeTokens } from "./campaign-row-theme";

function getStatusDotClass(tone: ReturnType<typeof buildCampaignRowModel>["status"]["tone"]) {
  if (tone === "active") {
    return "";
  }

  if (tone === "completed") {
    return "";
  }

  if (tone === "paused" || tone === "inactive") {
    return "";
  }

  return "";
}

function getStatusDotStyle(tone: ReturnType<typeof buildCampaignRowModel>["status"]["tone"]): CSSProperties {
  const tokens = getCampaignRowThemeTokens();

  if (tone === "active") {
    return { backgroundColor: tokens.activeDot };
  }

  if (tone === "completed") {
    return { backgroundColor: tokens.completedDot };
  }

  if (tone === "paused" || tone === "inactive") {
    return { backgroundColor: tokens.inactiveDot };
  }

  return { backgroundColor: tokens.generatingDot };
}

function getStageFillStyle(stageKey: ReturnType<typeof buildCampaignRowModel>["stages"][number]["key"]) {
  const tokens = getCampaignRowThemeTokens();

  if (stageKey === "raw") {
    return { backgroundColor: tokens.stageFills.raw };
  }

  if (stageKey === "qualified") {
    return { backgroundColor: tokens.stageFills.qualified };
  }

  if (stageKey === "contacted") {
    return { backgroundColor: tokens.stageFills.contacted };
  }

  return { backgroundColor: tokens.stageFills.replies };
}

export function CampaignRow(props: CampaignRowProps) {
  const model = buildCampaignRowModel(props);
  const tokens = getCampaignRowThemeTokens();
  const carouselItems = buildCampaignCarouselItems(model.stages);

  return (
    <Link href={props.href} className="block">
    <motion.article
      initial="rest"
      animate="rest"
      whileHover="hover"
      variants={{
        rest: {
          backgroundColor: tokens.surface,
          boxShadow: "0px 0px 0px rgba(15, 23, 42, 0)",
        },
        hover: {
          backgroundColor: tokens.surfaceHover,
          boxShadow: "0px 10px 30px rgba(15, 23, 42, 0.08)",
          transition: { duration: 0.15, ease: "easeInOut" },
        },
      }}
      style={{ borderBottomColor: tokens.border }}
      className="group border-b"
    >
      <div className="grid gap-5 px-6 py-5 md:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span
              className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${getStatusDotClass(model.status.tone)}`}
              style={getStatusDotStyle(model.status.tone)}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="truncate text-[17px] font-semibold tracking-[-0.02em]"
                  style={{ color: tokens.textPrimary }}
                >
                  {props.name}
                </h3>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: tokens.textSecondary }}
                  strokeWidth={1.9}
                />
              </div>

              <p className="mt-1 truncate text-sm" style={{ color: tokens.textSecondary }}>
                {props.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden">
          <div
            className="relative overflow-hidden rounded-[20px] border px-2.5 py-2.5"
            style={{
              borderColor: tokens.border,
              backgroundColor: tokens.carouselSurface,
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-10"
              style={{ background: `linear-gradient(90deg, ${tokens.carouselSurface} 20%, transparent 100%)` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-10"
              style={{ background: `linear-gradient(270deg, ${tokens.carouselSurface} 20%, transparent 100%)` }}
            />
            <motion.div
              className="flex w-max gap-3"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 14, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
            >
              {carouselItems.map((stage) => (
                <div
                  key={stage.id}
                  className="w-[124px] shrink-0 rounded-[16px] border px-3 py-2"
                  style={{
                    borderColor: tokens.border,
                    backgroundColor: tokens.pillBackground,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-[10px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: tokens.textMuted }}
                    >
                      {stage.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: tokens.textPrimary }}>
                      {stage.value}
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ backgroundColor: tokens.stageTrack }}>
                    <div
                      className="h-full rounded-full"
                      style={{ ...getStageFillStyle(stage.key), width: `${Math.max(stage.fillPercent, stage.value > 0 ? 12 : 6)}%` }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {model.rates.map((rate) => (
              <span
                key={rate.label}
                className="inline-flex h-7 items-center gap-1 rounded-full border px-3 text-[10px] font-medium"
                style={{
                  borderColor: tokens.border,
                  backgroundColor: tokens.ratePillBackground,
                  color: tokens.textSecondary,
                }}
              >
                <span style={{ color: tokens.textMuted }}>{rate.label}</span>
                <span className="tabular-nums" style={{ color: tokens.textPrimary }}>
                  {rate.value}
                </span>
              </span>
            ))}

            {props.isGenerating ? (
              <span
                className="inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[10px] font-medium"
                style={{
                  borderColor: tokens.generatingBorder,
                  backgroundColor: tokens.generatingBackground,
                  color: tokens.generatingText,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: tokens.generatingDot }}
                />
                En cours
              </span>
            ) : (
              <span
                className="inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[10px] font-medium"
                style={{
                  borderColor: tokens.border,
                  backgroundColor: tokens.mutedPillBackground,
                  color: tokens.textSecondary,
                }}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(model.status.tone)}`}
                  style={getStatusDotStyle(model.status.tone)}
                />
                {model.status.label}
              </span>
            )}
          </div>

          <motion.span
            variants={{
              rest: { opacity: 0, x: 4 },
              hover: { opacity: 1, x: 0, transition: { duration: 0.12, ease: "easeOut" } },
            }}
            className="hidden h-8 w-8 items-center justify-center rounded-full md:inline-flex"
            style={{ backgroundColor: tokens.border, color: "#FFA318" }}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
          </motion.span>
        </div>
      </div>
    </motion.article>
    </Link>
  );
}

export type { CampaignRowProps };
