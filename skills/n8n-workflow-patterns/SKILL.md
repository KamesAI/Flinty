---
name: n8n-workflow-patterns
description: Proven architectural patterns for building n8n workflows. Use when designing a new workflow, choosing between trigger types, structuring data flows, handling errors, implementing batch processing with SplitInBatches, working with Google Sheets/Drive, building AI agents, or following the workflow creation checklist. Consult this skill before building any automation to choose the right pattern and avoid common gotchas.
---

# n8n Workflow Patterns

Proven architectural patterns for building n8n workflows.

---

## The 6 Core Patterns

1. **Webhook Processing** (Most Common) — Receive HTTP requests → Process → Output
2. **HTTP API Integration** — Fetch from REST APIs → Transform → Store/Use
3. **Database Operations** — Read/Write/Sync database data
4. **AI Agent Workflow** — AI agents with tools and memory
5. **Scheduled Tasks** — Recurring automation workflows
6. **Batch Processing** — Process large datasets in chunks with API rate limits

---

## Pattern Selection Guide

**Webhook Processing** — Use when:
- Receiving data from external systems
- Building integrations (Slack commands, form submissions, GitHub webhooks)
- Example: "Receive Stripe payment → Update database → Send confirmation"

**HTTP API Integration** — Use when:
- Fetching data from external APIs, synchronizing with third-party services
- Example: "Fetch GitHub issues → Transform → Create Jira tickets"

**Database Operations** — Use when:
- Syncing between databases, running queries on schedule (ETL)
- Example: "Read Postgres records → Transform → Write to MySQL"

**AI Agent Workflow** — Use when:
- Building conversational AI, need AI with tool access
- Example: "Chat with AI that can search docs, query database, send emails"

**Scheduled Tasks** — Use when:
- Recurring reports, periodic data fetching, maintenance tasks
- Example: "Daily: Fetch analytics → Generate report → Email team"

**Batch Processing** — Use when:
- Large datasets exceeding API batch limits, nested loops
- Example: "Fetch products for 4 markets × 1000 per API call → Aggregate all results"

---

## Common Workflow Components

### Triggers
- **Webhook** — HTTP endpoint (instant)
- **Schedule** — Cron-based timing (periodic)
- **Manual** — Click to execute (testing)

### Transformation Nodes
- **Set** — Map/transform fields
- **Code** — Complex logic (JavaScript or Python)
- **IF/Switch** — Conditional routing
- **Merge** — Combine data streams

### Outputs
- **HTTP Request** — Call APIs
- **Database** — Write data
- **Communication** — Email, Slack, Discord
- **Storage** — Files, cloud storage

---

## Workflow Creation Checklist

### Planning Phase
- [ ] Identify the pattern (webhook, API, database, AI, scheduled)
- [ ] List required nodes (use search_nodes)
- [ ] Understand data flow (input → transform → output)
- [ ] Plan error handling strategy

### Implementation Phase
- [ ] Create workflow with appropriate trigger
- [ ] Add data source nodes
- [ ] Configure authentication/credentials
- [ ] Add transformation nodes (Set, Code, IF)
- [ ] Add output/action nodes
- [ ] Configure error handling

### Validation Phase
- [ ] Validate each node configuration (validate_node)
- [ ] Validate complete workflow (validate_workflow)
- [ ] Test with sample data
- [ ] Handle edge cases (empty data, errors)

### Deployment Phase
- [ ] Review workflow settings
- [ ] Activate workflow using `activateWorkflow` operation
- [ ] Monitor first executions

---

## Data Flow Patterns

### Linear Flow
```
Trigger → Transform → Action → End
```

### Branching Flow
```
Trigger → IF → [True Path]
             └→ [False Path]
```

### Loop Pattern
```
Trigger → Split in Batches → Process → Loop (until done)
```

### Error Handler Pattern
```
Main Flow → [Success Path]
         └→ [Error Trigger → Error Handler]
```

---

## Batch Processing Pattern

### SplitInBatches Outputs — CRITICAL

- `main[0]` = **done** — fires ONCE after all batches complete
- `main[1]` = **each batch** — fires per batch (this is the loop body)

```
Prepare Items → SplitInBatches → [main[1]: Process Batch] → (loops back)
                                  [main[0]: Done] → Limit 1 → Aggregate
```

**Always add a Limit 1 node after the done output.**

### Cross-Iteration Data

`$('Node Inside Loop').all()` returns **ONLY the last batch's items**. Use `$getWorkflowStaticData('global')` in a Code node inside the loop to accumulate across all iterations. See n8n Code JavaScript skill for the full pattern.

### Nested Loops

```
Define Categories (N items)
  → Outer Loop (SplitInBatches, batchSize=1)
    → Prepare category data
    → Inner Loop (SplitInBatches, batchSize=1000)
      → API Call → Verify → (loops back to Inner Loop via main[1])
    → Inner done[0] → Rate Limit Delay → back to Outer Loop
  → Outer done[0] → Limit 1 → Final Aggregate
```

**Wiring gotcha**: Inner `done[0]` must connect back to the OUTER loop input.

### API Pagination

```
Schedule → Set Date Window → Fetch Page → Process
  → IF has more? → [true] Update id_from → Fetch Page (loop)
                  → [false] → Aggregate → Output
```

### Dry-Run / Verification Tolerance

```javascript
// In verification Code node — handle disabled upstream nodes
const body = $input.first().json;
const looksLikeRequest = body.method && body.parameters && !body.status;
if (looksLikeRequest) {
  return [{ json: { status: 'SKIPPED', message: 'Upstream disabled for testing' }}];
}
```

---

## Integration-Specific Gotchas

### Google Sheets

- **NEVER use `append`** on sheets with formula columns — it breaks formulas. Use Google Sheets API `values.update` (PUT) via HTTP Request with `googleApi` credential
- **Write numbers, not strings** — string "4.98" breaks `ADD()` formulas. Use `parseFloat()` in Code node
- **Per-item execution trap**: Google Sheets nodes run once per input item. Aggregate items in a Code node first for bulk writes
- **UNFORMATTED_VALUE returns numbers**, not text like "N/A" — filter explicitly in Code nodes

### Google Drive

- **`convertToGoogleDocument: true` creates a Google Doc (text)**, NOT a Google Sheet — omit this option to upload a CSV for download
- **CSV download link**: `https://drive.google.com/uc?id={fileId}&export=download` — use instead of `/view` links

### Bidirectional Threshold Checking

```javascript
// ❌ Only catches increases
if (diff > threshold) { flag(); }

// ✅ Catches both spikes AND crashes
if (Math.abs(diff) > threshold) { flag(); }
```

---

## Common Gotchas

### Webhook Data Structure

```javascript
// ❌ WRONG
{{$json.email}}
// ✅ CORRECT
{{$json.body.email}}
```

### Node Execution Order

- v0: Top-to-bottom (legacy)
- v1: Connection-based (recommended)

Check: workflow settings → Execution Order

### Authentication Issues (401/403)

- Configure credentials in the "Credentials" section, not parameters
- Test credentials before workflow activation

---

## Quick Start Examples

### Simple Webhook → Slack

```
1. Webhook (path: "form-submit", POST)
2. Set (map form fields)
3. Slack (post message to #notifications)
```

### Scheduled Report

```
1. Schedule (daily at 9 AM)
2. HTTP Request (fetch analytics)
3. Code (aggregate data)
4. Email (send formatted report)
5. Error Trigger → Slack (notify on failure)
```

### AI Assistant

```
1. Webhook (receive chat message)
2. AI Agent
   ├─ OpenAI Chat Model (ai_languageModel)
   ├─ HTTP Request Tool (ai_tool)
   ├─ Database Tool (ai_tool)
   └─ Window Buffer Memory (ai_memory)
3. Webhook Response (send AI reply)
```

---

## Best Practices

### ✅ Do
- Start with the simplest pattern that solves your problem
- Use error handling on all workflows
- Test with sample data before activation
- Use descriptive node names
- Monitor workflow executions after deployment

### ❌ Don't
- Build workflows in one shot (iterate! avg 56s between edits)
- Skip validation before activation
- Ignore error scenarios
- Hardcode credentials in parameters
- Forget to handle empty data cases

---

## Summary

**Key Points**:
1. **6 core patterns** cover 90%+ of workflow use cases
2. **Webhook processing** is the most common pattern
3. Use the **workflow creation checklist** for every workflow
4. **Plan pattern** → **Select nodes** → **Build** → **Validate** → **Deploy**
