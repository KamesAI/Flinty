#!/usr/bin/env node
import fs from "node:fs";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/))
      .filter(Boolean)
      .map((match) => {
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [match[1], value];
      }),
  );
}

const env = { ...loadEnv("../../../../.env.local"), ...loadEnv(".env.local"), ...process.env };
const workflowId = env.WF3_WORKFLOW_ID || "dfe1jIPlZA10dqJK";
const baseUrl = (env.N8N_STAGING_URL || "https://staging-n8n.kamesai.com").replace(/\/$/, "");

if (!env.N8N_API_KEY) throw new Error("N8N_API_KEY manquant");
if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");

const headers = {
  "X-N8N-API-KEY": env.N8N_API_KEY,
  "Content-Type": "application/json",
};

const response = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}`, { headers });
if (!response.ok) {
  throw new Error(`GET WF3 ${response.status}: ${await response.text()}`);
}

const workflow = await response.json();
const childSheetDocument = {
  __rl: true,
  value: '={{ $("Webhook").first().json.body.sheet_id }}',
  mode: "id",
};

for (const node of workflow.nodes) {
  if (node.name === "Read Leads_Qualified" || node.name === "Update statut_email") {
    node.parameters.documentId = childSheetDocument;
  }

  if (node.name === "Update statut_email") {
    node.parameters.columns.value.lead_id = "={{ $('Filter éligibles').item.json.lead_id }}";
  }

  if (node.name === "Send Resend Email") {
    const authHeader = node.parameters.headerParameters.parameters.find(
      (parameter) => parameter.name === "Authorization",
    );
    if (!authHeader) throw new Error("Header Authorization introuvable dans WF3");
    authHeader.value = `Bearer ${env.RESEND_API_KEY}`;
  }
}

const update = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: Object.fromEntries(
    Object.entries(workflow.settings ?? {}).filter(([key]) =>
      [
        "errorWorkflow",
        "executionOrder",
        "executionTimeout",
        "saveDataErrorExecution",
        "saveDataSuccessExecution",
        "saveExecutionProgress",
        "saveManualExecutions",
        "timezone",
      ].includes(key),
    ),
  ),
};

const updated = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(update),
});

const text = await updated.text();
if (!updated.ok) {
  throw new Error(`PUT WF3 ${updated.status}: ${text}`);
}

console.log(JSON.stringify({
  workflow_id: workflowId,
  patched_nodes: ["Read Leads_Qualified", "Update statut_email", "Send Resend Email"],
  status: updated.status,
}, null, 2));
