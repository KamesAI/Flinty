export interface SetterGraduationEmailInput {
  campaignId: string;
  campaignName?: string;
  graduated: boolean;
  accuracy: number;
  reason?: string;
  sampleSize: number;
}

export async function sendSetterGraduationEmail(input: SetterGraduationEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.ALERT_EMAIL_TO || "thomas@kamesai.com";

  if (!apiKey || !from) return;

  const status = input.graduated ? "gradué" : "à surveiller";
  const subject = input.graduated
    ? `Setter gradué - ${input.campaignName || input.campaignId}`
    : `Setter warm-up bloqué - ${input.campaignName || input.campaignId}`;

  const body = [
    `Campagne: ${input.campaignName || input.campaignId}`,
    `Statut: ${status}`,
    `Accuracy: ${(input.accuracy * 100).toFixed(1)}%`,
    `Échantillon: ${input.sampleSize} turns`,
    input.reason ? `Raison: ${input.reason}` : "",
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend graduation alert failed: ${response.status}`);
  }
}
