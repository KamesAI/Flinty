---
name: n8n-mcp-tools-expert
description: Expert guide for using n8n-mcp MCP tools effectively. Use when searching for nodes, validating configurations, accessing templates, managing workflows, managing credentials, auditing instance security, or using any n8n-mcp tool. Provides tool selection guidance, parameter formats, and common patterns. IMPORTANT — Always consult this skill before calling any n8n-mcp tool — it prevents common mistakes like wrong nodeType formats, incorrect parameter structures, and inefficient tool usage. If the user mentions n8n, workflows, nodes, or automation and you have n8n MCP tools available, use this skill first.
---

# n8n MCP Tools Expert

Master guide for using n8n-mcp MCP server tools to build workflows.

---

## Tool Categories

1. **Node Discovery** — search_nodes, get_node
2. **Configuration Validation** — validate_node, validate_workflow
3. **Workflow Management** — n8n_create_workflow, n8n_update_partial_workflow
4. **Template Library** — 2,700+ real workflows
5. **Data Tables** — n8n_manage_datatable
6. **Credential Management** — n8n_manage_credentials
7. **Security & Audit** — n8n_audit_instance
8. **Documentation & Guides** — tools_documentation, ai_agents_guide

---

## Quick Reference

| Tool | Use When | Speed |
|------|----------|-------|
| `search_nodes` | Finding nodes by keyword | <20ms |
| `get_node` | Understanding node operations (detail="standard") | <10ms |
| `validate_node` | Checking configurations (mode="full") | <100ms |
| `n8n_create_workflow` | Creating workflows | 100-500ms |
| `n8n_update_partial_workflow` | Editing workflows (MOST USED!) | 50-200ms |
| `validate_workflow` | Checking complete workflow | 100-500ms |
| `n8n_deploy_template` | Deploy template to n8n instance | 200-500ms |
| `n8n_manage_datatable` | Managing data tables and rows | 50-500ms |
| `n8n_manage_credentials` | Credential CRUD + schema discovery | 50-500ms |
| `n8n_audit_instance` | Security audit | 500-5000ms |
| `n8n_autofix_workflow` | Auto-fix validation errors | 200-1500ms |

---

## CRITICAL: nodeType Formats

**Two different formats** for different tools!

### Format 1: Search/Validate Tools
```javascript
"nodes-base.slack"
"nodes-base.httpRequest"
"nodes-langchain.agent"
```
Used by: search_nodes, get_node, validate_node, validate_workflow

### Format 2: Workflow Tools
```javascript
"n8n-nodes-base.slack"
"n8n-nodes-base.httpRequest"
"@n8n/n8n-nodes-langchain.agent"
```
Used by: n8n_create_workflow, n8n_update_partial_workflow

### Conversion
search_nodes returns BOTH:
```javascript
{
  "nodeType": "nodes-base.slack",             // For search/validate
  "workflowNodeType": "n8n-nodes-base.slack"  // For workflow tools
}
```

---

## Common Mistakes

### Mistake 1: Wrong nodeType Format

```javascript
// WRONG
get_node({nodeType: "slack"})
get_node({nodeType: "n8n-nodes-base.slack"})

// CORRECT
get_node({nodeType: "nodes-base.slack"})
```

### Mistake 2: Using detail="full" by Default

```javascript
// WRONG - Returns 3-8K tokens, wastes context
get_node({nodeType: "nodes-base.slack", detail: "full"})

// CORRECT - Returns 1-2K tokens, covers 95% of use cases
get_node({nodeType: "nodes-base.slack"})  // detail="standard" is default
```

### Mistake 3: Not Using Validation Profiles

```javascript
// WRONG
validate_node({nodeType, config})

// CORRECT
validate_node({nodeType, config, profile: "runtime"})
```

### Mistake 4: Wrong Parameter Name for updateNode

```javascript
// WRONG
operations: [{ type: "updateNode", nodeName: "HTTP Request", parameters: {url: "..."} }]

// CORRECT
operations: [{ type: "updateNode", nodeName: "HTTP Request", updates: {url: "..."} }]
```

### Mistake 5: Wrong Credential Attachment Format

```javascript
// WRONG
updates: {credentials: "myApiKey"}

// CORRECT
updates: {
  credentials: {
    httpHeaderAuth: { id: "abc123", name: "My API Key" }
  }
}
```

### Mistake 6: Not Using Smart Parameters

```javascript
// Old way (manual sourceIndex)
{ type: "addConnection", source: "IF", target: "Handler", sourceIndex: 0 }

// New way (semantic)
{ type: "addConnection", source: "IF", target: "True Handler", branch: "true" }
{ type: "addConnection", source: "Switch", target: "Handler A", case: 0 }
```

---

## Tool Usage Patterns

### Pattern 1: Node Discovery (Most Common)

```javascript
// Step 1: Search
const results = await search_nodes({ query: "slack", limit: 20 });

// Step 2: Get details
const details = await get_node({
  nodeType: "nodes-base.slack",
  includeExamples: true
});

// Step 3: Get readable docs
get_node({ nodeType: "nodes-base.slack", mode: "docs" })
```

### Pattern 2: Validation Loop (2-3 iterations typical)

```javascript
// Validate → Fix → Validate → Fix → Validate
validate_node({
  nodeType: "nodes-base.slack",
  config: { resource: "channel", operation: "create" },
  profile: "runtime"
});
// → Error: "Missing required field: name"
config.name = "general";
// → Validate again...
```

### Pattern 3: Workflow Building (Iterative)

```javascript
// Step 1: Create
await n8n_create_workflow({name, nodes, connections});

// Step 2: Validate
await n8n_validate_workflow({id});

// Step 3: Update iteratively (~56s avg between edits)
await n8n_update_partial_workflow({
  id,
  intent: "Add webhook trigger",
  operations: [{type: "addNode", node: {...}}]
});

// Step 4: Activate
await n8n_update_partial_workflow({
  id,
  operations: [{type: "activateWorkflow"}]
});
```

---

## Template Usage

```javascript
// Search
search_templates({ query: "webhook slack", limit: 20 });

// By node types
search_templates({
  searchMode: "by_nodes",
  nodeTypes: ["n8n-nodes-base.httpRequest", "n8n-nodes-base.slack"]
});

// Get structure
get_template({ templateId: 2947, mode: "structure" });

// Deploy directly
n8n_deploy_template({
  templateId: 2947,
  name: "My Weather to Slack",
  autoFix: true,
  autoUpgradeVersions: true
});
```

---

## Data Table Management

```javascript
// Create table
n8n_manage_datatable({
  action: "createTable",
  name: "Contacts",
  columns: [
    {name: "email", type: "string"},
    {name: "score", type: "number"}
  ]
});

// Get rows with filter
n8n_manage_datatable({
  action: "getRows",
  tableId: "dt-123",
  filter: {
    filters: [{columnName: "status", condition: "eq", value: "active"}]
  },
  limit: 50
});

// Upsert rows
n8n_manage_datatable({
  action: "upsertRows",
  tableId: "dt-123",
  filter: {filters: [{columnName: "email", condition: "eq", value: "a@b.com"}]},
  data: {score: 15}
});
```

**Filter conditions**: `eq`, `neq`, `like`, `ilike`, `gt`, `gte`, `lt`, `lte`

---

## Credential Management

```javascript
// Discover required fields
n8n_manage_credentials({action: "getSchema", credentialType: "httpHeaderAuth"});

// Create credential
n8n_manage_credentials({
  action: "create",
  name: "My Slack Token",
  type: "slackApi",
  data: {accessToken: "xoxb-..."}
});

// List credentials
n8n_manage_credentials({action: "list"});
```

---

## Security & Audit

```javascript
// Full audit
n8n_audit_instance();

// Custom checks only
n8n_audit_instance({
  customChecks: ["hardcoded_secrets", "unauthenticated_webhooks"]
});
```

**Custom deep scan checks**:
- `hardcoded_secrets` — Detects 50+ patterns (API keys, tokens, PII)
- `unauthenticated_webhooks` — Flags webhooks without auth
- `error_handling` — Flags workflows with 3+ nodes and no error handling
- `data_retention` — Flags workflows saving all execution data

---

## Surgical Edits with patchNodeField

```javascript
n8n_update_partial_workflow({
  id: "wf-123",
  operations: [{
    type: "patchNodeField",
    nodeName: "Code",
    fieldPath: "parameters.jsCode",
    patches: [{find: "const limit = 10;", replace: "const limit = 50;"}]
  }]
});
```

---

## Tool Availability

**Always Available** (no n8n API needed):
- search_nodes, get_node, validate_node, validate_workflow
- search_templates, get_template, tools_documentation

**Requires n8n API** (N8N_API_URL + N8N_API_KEY):
- n8n_create_workflow, n8n_update_partial_workflow
- n8n_validate_workflow (by ID), n8n_list_workflows
- n8n_deploy_template, n8n_manage_datatable
- n8n_manage_credentials, n8n_audit_instance, n8n_autofix_workflow

---

## Best Practices

### Do
- Use `get_node` with `detail: "standard"` (default) — covers 95% of use cases
- Specify validation profile explicitly (`profile: "runtime"`)
- Use smart parameters (`branch`, `case`) for clarity
- Include `intent` parameter in workflow updates
- Iterate workflows (avg 56s between edits)
- Use `patchNodeField` for surgical Code node edits
- Use `n8n_deploy_template` for quick starts

### Don't
- Use `detail: "full"` unless necessary (wastes tokens)
- Forget nodeType prefix (`nodes-base.*`)
- Try to build workflows in one shot (iterate!)
- Ignore auto-sanitization behavior
- Use full prefix with search/validate tools
- Forget to activate workflows after building

---

## Common Workflow

1. `search_nodes` → find node
2. `get_node` → understand config
3. `validate_node` → check config
4. `n8n_create_workflow` → build
5. `n8n_validate_workflow` → verify
6. `n8n_update_partial_workflow` → iterate
7. `activateWorkflow` → go live!
