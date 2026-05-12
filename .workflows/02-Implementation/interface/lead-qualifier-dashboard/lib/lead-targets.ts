export const DEFAULT_TARGET_QUALIFIED_LEADS = 50;
export const DEFAULT_TARGET_TOLERANCE_PERCENT = 10;
export const DEFAULT_ESTIMATED_QUALIFICATION_RATE = 0.15;

export function estimateTargetRawLeads(
  targetQualifiedLeads: number,
  qualificationRate = DEFAULT_ESTIMATED_QUALIFICATION_RATE
): number {
  const safeRate = qualificationRate > 0 ? qualificationRate : DEFAULT_ESTIMATED_QUALIFICATION_RATE;
  return Math.ceil(targetQualifiedLeads / safeRate / 50) * 50;
}
