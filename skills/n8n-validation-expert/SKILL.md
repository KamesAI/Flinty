---
name: n8n-validation-expert
description: Interpret validation errors and guide fixing them. Use when encountering validation errors, validation warnings, false positives, operator structure issues, or need help understanding validation results. Also use when asking about validation profiles, error types, the validation loop process, or auto-fix capabilities. Consult this skill whenever a validate_node or validate_workflow call returns errors or warnings — it knows which warnings are false positives and which errors need real fixes.
---

# n8n Validation Expert

Expert guide for interpreting and fixing n8n validation errors.

---

## Validation Philosophy

**Validate early, validate often**

Validation is typically iterative:
- Expect validation feedback loops
- Usually 2-3 validate → fix cycles
- Average: 23s thinking about errors, 58s fixing them

**Key insight**: Validation is an iterative process, not one-shot!

---

## Error Severity Levels

### 1. Errors (Must Fix)
**Blocks workflow execution**

Types: `missing_required`, `invalid_value`, `type_mismatch`, `invalid_reference`, `invalid_expression`

```json
{
  "type": "missing_required",
  "property": "channel",
  "message": "Channel name is required",
  "fix": "Provide a channel name (lowercase, no spaces, 1-80 characters)"
}
```

### 2. Warnings (Should Fix)
**Doesn't block execution** but may cause issues

Types: `best_practice`, `deprecated`, `performance`

### 3. Suggestions (Optional)
Types: `optimization`, `alternative`

---

## Validation Profiles

### minimal
Quick checks during editing — only required fields, most permissive

### runtime (RECOMMENDED)
Pre-deployment — required fields, value types, allowed values, basic dependencies

### ai-friendly
AI-generated configurations — same as runtime but reduces false positives

### strict
Production deployment — everything including best practices and security

---

## Common Error Types

### 1. missing_required

```javascript
// Error
{ "type": "missing_required", "property": "channel", "message": "Channel name is required" }

// Fix
config.channel = "#general";
```

### 2. invalid_value

```javascript
// Error
{ "type": "invalid_value", "property": "operation", "message": "Operation must be one of: post, update, delete", "current": "send" }

// Fix
config.operation = "post";
```

### 3. type_mismatch

```javascript
// Error
{ "type": "type_mismatch", "property": "limit", "message": "Expected number, got string" }

// Fix
config.limit = 100;  // Number, not string
```

### 4. invalid_expression

```javascript
// Error
{ "type": "invalid_expression", "property": "text", "message": "Invalid expression: $json.name" }

// Fix
config.text = "={{$json.name}}";  // Add ={{}}
```

### 5. invalid_reference

```javascript
// Error
{ "message": "Node 'HTTP Requets' does not exist" }

// Fix — correct the typo
config.expression = "={{$node['HTTP Request'].json.data}}";
```

### 6. patchNodeField Errors

**Find string not found**:
```
patchNodeField: find string not found in field "parameters.jsCode"
```
→ Double-check the exact string. Use `n8n_get_workflow` to inspect the current value. Whitespace matters.

**Ambiguous match**:
```
patchNodeField: find string matches 3 times — set replaceAll: true or use more specific find string
```
→ Set `replaceAll: true` or make find string more specific.

**Invalid regex pattern**:
→ Check syntax. Nested quantifiers like `(a+)+` are rejected as ReDoS risks.

---

## Auto-Sanitization System

Runs automatically on ANY workflow update.

### What It Fixes

**Binary Operators** (equals, contains, greaterThan, etc.) — removes `singleValue`:
```javascript
// Before: { operation: "equals", singleValue: true }  ❌
// After:  { operation: "equals" }  ✅
```

**Unary Operators** (isEmpty, isNotEmpty, true, false) — adds `singleValue: true`:
```javascript
// Before: { operation: "isEmpty" }  ❌
// After:  { operation: "isEmpty", singleValue: true }  ✅
```

**IF/Switch Metadata** — adds `conditions.options` for IF v2.2+ and Switch v3.2+

### What It CANNOT Fix
- Broken connections (use `cleanStaleConnections` operation)
- Branch count mismatches
- Paradoxical corrupt states

---

## False Positives

Common warnings that are acceptable:

| Warning | When acceptable |
|---------|----------------|
| "Missing error handling" | Simple workflows, testing/development |
| "No retry logic" | APIs with own retry, idempotent operations |
| "Missing rate limiting" | Internal APIs, low-volume workflows |
| "Unbounded query" | Small known datasets, development |

**Reduce false positives**: Use `ai-friendly` profile.

---

## Validation Result Structure

```javascript
{
  "valid": false,
  "errors": [{ "type": "missing_required", "property": "channel", "fix": "..." }],
  "warnings": [{ "type": "best_practice", "suggestion": "..." }],
  "suggestions": [{ "type": "optimization", "message": "..." }],
  "summary": { "hasErrors": true, "errorCount": 1, "warningCount": 1 }
}
```

---

## Common Workflow Errors

**Broken Connections**: Use `cleanStaleConnections` operation
**Circular Dependencies**: Restructure workflow to remove loop
**Multiple Start Nodes**: Remove extra triggers or split into separate workflows
**Disconnected Nodes**: Connect node or remove if unused

---

## Recovery Strategies

### Strategy 1: Start Fresh
Note required fields from `get_node`, create minimal config, add features incrementally.

### Strategy 2: Clean Stale Connections

```javascript
n8n_update_partial_workflow({
  id: "workflow-id",
  operations: [{ type: "cleanStaleConnections" }]
});
```

### Strategy 3: Auto-fix

```javascript
// Preview fixes (default — doesn't apply)
n8n_autofix_workflow({ id: "workflow-id", applyFixes: false });

// Apply high-confidence fixes only
n8n_autofix_workflow({ id: "workflow-id", applyFixes: true, confidenceThreshold: "high" });
```

**Auto-fix capabilities**: expression-format, typeversion-correction, error-output-config, node-type-correction, webhook-missing-path, typeversion-upgrade, version-migration

---

## Best Practices

### ✅ Do
- Validate after every significant change
- Read error messages completely
- Fix errors iteratively (one at a time)
- Use `runtime` profile for pre-deployment
- Trust auto-sanitization for operator issues

### ❌ Don't
- Skip validation before activation
- Try to fix all errors at once
- Use `strict` profile during development (too noisy)
- Deploy with unresolved errors
- Manually fix auto-sanitization issues

---

## Summary

1. **Validation is iterative** (avg 2-3 cycles)
2. **Errors must be fixed**, warnings are optional
3. **Auto-sanitization** fixes operator structures automatically
4. **Use runtime profile** for balanced validation
5. **False positives exist** — learn to recognize them
