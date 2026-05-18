import { getCampaignById } from "@/lib/campaigns";
import { getAllConversationTurns, type ConversationTurn } from "@/lib/conversations";
import { sendSetterGraduationEmail } from "@/lib/graduation-alerts";
import { readCampaignConfig } from "@/lib/replies";
import { updateConfigValue } from "@/lib/sheets";
import { buildWarmupState, configBool } from "@/lib/warmup";

export type GraduationReason = "warmup_active" | "low_accuracy" | "insufficient_turns" | "not_found";

export interface GraduationResult {
  graduated: boolean;
  accuracy: number;
  reason?: GraduationReason;
  sampleSize?: number;
}

const MIN_LABELLED_TURNS = 50;
const ACCURACY_THRESHOLD = 0.85;
const LOW_ACCURACY_ALERT_DAYS = 21;

function hasForcedAIQuestionTag(turn: ConversationTurn) {
  return (turn.tags ?? "").split(",").map((tag) => tag.trim()).includes("forced_validation_ai_question");
}

function isLabelledSetterTurn(turn: ConversationTurn) {
  if (turn.role !== "setter") return false;
  if (!turn.intent) return false;
  if (hasForcedAIQuestionTag(turn)) return false;
  return Boolean(turn.human_intent_label || turn.validated_by);
}

function isCorrectIntentTurn(turn: ConversationTurn) {
  if (turn.human_intent_label) return turn.human_intent_label === turn.intent;
  return Boolean(turn.validated_by) && !turn.validated_by.startsWith("escalated") && turn.edited_from_draft !== "true";
}

export function getIntentAccuracySample(
  turns: ConversationTurn[],
  sampleSize = MIN_LABELLED_TURNS
): ConversationTurn[] {
  return turns
    .filter(isLabelledSetterTurn)
    .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
    .slice(-sampleSize);
}

export function computeIntentAccuracy(turns: ConversationTurn[]): number {
  const labelledTurns = turns.filter(isLabelledSetterTurn);
  if (labelledTurns.length === 0) return 0;

  const correct = labelledTurns.filter(isCorrectIntentTurn).length;
  return correct / labelledTurns.length;
}

function isWarmupActive(lockedUntil: string | undefined, now: Date) {
  if (!lockedUntil) return true;
  const lockedUntilTime = new Date(lockedUntil).getTime();
  if (!Number.isFinite(lockedUntilTime)) return true;
  return lockedUntilTime > now.getTime();
}

function isAfterLowAccuracyAlertWindow(lockedUntil: string | undefined, now: Date) {
  if (!lockedUntil) return false;
  const lockedUntilTime = new Date(lockedUntil).getTime();
  if (!Number.isFinite(lockedUntilTime)) return false;
  return now.getTime() - lockedUntilTime >= LOW_ACCURACY_ALERT_DAYS * 24 * 60 * 60 * 1000;
}

async function appendGraduationDevLog(campaignId: string, accuracy: number, now: Date) {
  try {
    const [{ appendFile }, path] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const logPath = path.resolve(process.cwd(), "../../Dev-Log.md");
    const entry = [
      "",
      `### ${now.toISOString().slice(0, 10)} — Auto-graduation Setter ${campaignId}`,
      `- \`setter_validation=false\` appliqué automatiquement après warm-up.`,
      `- Accuracy intent sur 50 turns : ${(accuracy * 100).toFixed(1)}%.`,
      "",
    ].join("\n");
    await appendFile(logPath, entry, "utf8");
  } catch {
    // Vercel/serverless peut être read-only ; l'audit persistant est aussi écrit dans Config.
  }
}

export async function graduateCampaign(campaignId: string): Promise<GraduationResult> {
  const resolved = await getCampaignById(campaignId);
  if (!resolved?.sheetId) {
    return { graduated: false, accuracy: 0, reason: "not_found", sampleSize: 0 };
  }

  const now = new Date();
  const config = await readCampaignConfig(resolved.sheetId, campaignId);
  const warmup = buildWarmupState(
    config,
    Number.parseInt(config.warmup_positive_replies ?? "0", 10) || 0,
    now
  );
  if (configBool(config.warmup_campaign, false) && warmup.completed) {
    await Promise.all([
      updateConfigValue(resolved.sheetId, campaignId, "warmup_campaign", "FALSE"),
      updateConfigValue(resolved.sheetId, campaignId, "warmup_completed_at", now.toISOString()),
    ]);
  }
  const lockedUntil = config.setter_validation_locked_until;

  if (isWarmupActive(lockedUntil, now)) {
    return { graduated: false, accuracy: 0, reason: "warmup_active", sampleSize: 0 };
  }

  const turns = await getAllConversationTurns(resolved.sheetId);
  const sample = getIntentAccuracySample(turns, MIN_LABELLED_TURNS);
  const accuracy = computeIntentAccuracy(sample);

  if (sample.length < MIN_LABELLED_TURNS) {
    return { graduated: false, accuracy, reason: "insufficient_turns", sampleSize: sample.length };
  }

  if (accuracy < ACCURACY_THRESHOLD) {
    const result: GraduationResult = {
      graduated: false,
      accuracy,
      reason: "low_accuracy",
      sampleSize: sample.length,
    };

    if (isAfterLowAccuracyAlertWindow(lockedUntil, now)) {
      await sendSetterGraduationEmail({
        campaignId,
        campaignName: resolved.campaign.nom,
        graduated: false,
        accuracy,
        reason: "low_accuracy",
        sampleSize: sample.length,
      });
    }

    return result;
  }

  await Promise.all([
    updateConfigValue(resolved.sheetId, campaignId, "setter_validation", "FALSE"),
    updateConfigValue(resolved.sheetId, campaignId, "setter_graduated_at", now.toISOString()),
    updateConfigValue(resolved.sheetId, campaignId, "setter_graduation_accuracy", accuracy.toFixed(4)),
  ]);

  await appendGraduationDevLog(campaignId, accuracy, now);

  await sendSetterGraduationEmail({
    campaignId,
    campaignName: resolved.campaign.nom,
    graduated: true,
    accuracy,
    sampleSize: sample.length,
  });

  return { graduated: true, accuracy, sampleSize: sample.length };
}
