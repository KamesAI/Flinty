---
name: n8n-node-configuration
description: Operation-aware node configuration guidance. Use when configuring nodes, understanding property dependencies, determining required fields, choosing between get_node detail levels, or learning common configuration patterns by node type. Always use this skill when setting up node parameters — it explains which fields are required for each operation, how displayOptions control field visibility, and when to use patchNodeField for surgical edits vs full node updates.
---

# n8n Node Configuration

Expert guidance for operation-aware node configuration with property dependencies.

---

## Configuration Philosophy

**Progressive disclosure**: Start minimal, add complexity as needed

- `get_node` with `detail: "standard"` is the most used discovery pattern
- 56 seconds average between configuration edits
- Covers 95% of use cases with 1-2K tokens response

---

## Core Concepts

### 1. Operation-Aware Configuration

**Not all fields are always required** — it depends on operation!

```javascript
// Slack post message:
{ "resource": "message", "operation": "post", "channel": "#general", "text": "Hello!" }

// Slack update message:
{ "resource": "message", "operation": "update", "messageId": "123", "text": "Updated!" }
// channel NOT required for update
```

**Key**: Resource + operation determine which fields are required!

### 2. Property Dependencies via displayOptions

```javascript
// body field shows only when:
{
  "displayOptions": {
    "show": {
      "sendBody": [true],
      "method": ["POST", "PUT", "PATCH"]
    }
  }
}
```

### 3. Progressive Discovery

1. **get_node({detail: "standard"})** — DEFAULT, ~1-2K tokens, covers 95% of needs
2. **get_node({mode: "search_properties", propertyQuery: "..."})** — Find specific fields
3. **get_node({detail: "full"})** — Complete schema, ~3-8K tokens, use sparingly

---

## Configuration Workflow

```
1. Identify node type and operation
2. get_node (standard detail is default)
3. Configure required fields
4. validate_node (profile: "runtime")
5. If field unclear → get_node({mode: "search_properties"})
6. Add optional fields as needed
7. Validate again
8. Deploy
```

### Example: HTTP Request POST

```javascript
// Step 1: Minimal config
{ "method": "POST", "url": "https://api.example.com", "authentication": "none" }

// Step 2: Validate → Error: "sendBody required for POST"
// Step 3: Fix
{ "method": "POST", "url": "...", "authentication": "none", "sendBody": true }

// Step 4: Validate → Error: "body required when sendBody=true"
// Step 5: Complete config
{
  "method": "POST",
  "url": "https://api.example.com",
  "authentication": "none",
  "sendBody": true,
  "body": {
    "contentType": "json",
    "content": { "name": "={{$json.name}}", "email": "={{$json.email}}" }
  }
}
// Step 6: Validate → Valid! ✅
```

---

## get_node Detail Level Decision Tree

```
Starting new node config?
  → YES: get_node (standard)

Standard has what you need?
  → YES: Configure with it
  → NO: Continue

Looking for specific field?
  → YES: search_properties mode
  → NO: Continue

Still need more details?
  → YES: get_node({detail: "full"})
```

---

## Common Node Patterns

### Pattern 1: Resource/Operation Nodes (Slack, Google Sheets, Airtable)

```javascript
{
  "resource": "<entity>",      // What type of thing
  "operation": "<action>",     // What to do with it
  // ... operation-specific fields
}
```

### Pattern 2: HTTP-Based Nodes

```javascript
{
  "method": "<HTTP_METHOD>",
  "url": "<endpoint>",
  "authentication": "<type>",
  // POST/PUT/PATCH → sendBody available
  // sendBody=true → body required
}
```

### Pattern 3: Database Nodes

```javascript
{
  "operation": "<query|insert|update|delete>",
  // operation="insert" → table + values required
  // operation="update" → table + values + where required
}
```

### Pattern 4: Conditional Logic (IF, Switch)

```javascript
{
  "conditions": {
    "<type>": [{
      "operation": "<operator>",
      "value1": "...",
      "value2": "..."  // Only for binary operators
    }]
  }
}
```

---

## Operation-Specific Examples

### Slack Node

#### Post Message
```javascript
{ "resource": "message", "operation": "post", "channel": "#general", "text": "Hello!" }
```

#### Update Message
```javascript
{ "resource": "message", "operation": "update", "messageId": "1234567890", "text": "Updated!" }
```

#### Create Channel
```javascript
{ "resource": "channel", "operation": "create", "name": "new-channel", "isPrivate": false }
```

### HTTP Request Node

#### GET Request
```javascript
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": { "parameters": [{ "name": "limit", "value": "100" }] }
}
```

#### POST with JSON
```javascript
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "authentication": "none",
  "sendBody": true,
  "body": {
    "contentType": "json",
    "content": { "name": "John Doe", "email": "john@example.com" }
  }
}
```

### IF Node

#### String Comparison (Binary)
```javascript
{
  "conditions": {
    "string": [{ "value1": "={{$json.status}}", "operation": "equals", "value2": "active" }]
  }
}
```

#### Empty Check (Unary)
```javascript
{
  "conditions": {
    "string": [{ "value1": "={{$json.email}}", "operation": "isEmpty", "singleValue": true }]
  }
}
```

---

## Node-Specific Configuration Notes

### SplitInBatches v3

```javascript
{ "batchSize": 100, "options": {} }
```

- `main[0]` (done) → Downstream processing (add Limit 1 first)
- `main[1]` (each batch) → Loop body → loops back to SplitInBatches input

### Google Sheets Node

- **Never use `append`** on sheets with formula columns — it overwrites formulas. Use HTTP Request with Google Sheets API `values.update` (PUT)
- **Per-item execution**: Each input item = one API call. Aggregate items in Code node first for bulk writes
- **Formula columns**: Use numbers, not strings (`parseFloat()` in Code node)

---

## Surgical Field Edits with patchNodeField

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

Use when editing code inside Code nodes, URLs in HTTP nodes, or text in long fields without re-transmitting the full content.

---

## Anti-Patterns

### Don't: Over-configure Upfront

```javascript
// ❌ BAD: Adding every possible field
{ "method": "GET", "url": "...", "sendQuery": false, "sendHeaders": false, "timeout": 10000, ... }

// ✅ GOOD: Start minimal
{ "method": "GET", "url": "...", "authentication": "none" }
```

### Don't: Skip Validation

```javascript
// ❌ BAD: Configure and deploy without validating
// ✅ GOOD: validate_node({...}) before every deploy
```

---

## Best Practices

### Do
1. Start with `get_node` (standard detail is default)
2. Validate iteratively (configure → validate → fix → repeat)
3. Use `search_properties` mode when stuck
4. Respect operation context — different operations = different requirements
5. Trust auto-sanitization

### Don't
1. Jump to `detail: "full"` immediately
2. Copy configs without understanding the operation context
3. Manually fix auto-sanitization issues

---

## Summary

**Configuration Strategy**:
1. `get_node` (standard) → see required fields
2. Configure required fields for operation
3. `validate_node` → read errors
4. Fix one error at a time
5. Repeat until valid (avg 2-3 cycles)
6. Deploy

**Key Principles**: Operation-aware, progressive disclosure, dependency-aware, validation-driven.
