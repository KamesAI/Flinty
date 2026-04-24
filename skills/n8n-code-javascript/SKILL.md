---
name: n8n-code-javascript
description: Write JavaScript code in n8n Code nodes. Use when writing JavaScript in n8n, using $input/$json/$node syntax, making HTTP requests with $helpers, working with dates using DateTime, troubleshooting Code node errors, choosing between Code node modes, or doing any custom data transformation in n8n. Always use this skill when a workflow needs a Code node — whether for data aggregation, filtering, API calls, format conversion, batch processing logic, or any custom JavaScript. Covers SplitInBatches loop patterns, cross-iteration data, pairedItem, and real-world production patterns.
---

# JavaScript Code Node

Expert guidance for writing JavaScript code in n8n Code nodes.

---

## Quick Start

```javascript
// Basic template for Code nodes
const items = $input.all();

// Process data
const processed = items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    timestamp: new Date().toISOString()
  }
}));

return processed;
```

### Essential Rules

1. **Choose "Run Once for All Items" mode** (recommended for most use cases)
2. **Access data**: `$input.all()`, `$input.first()`, or `$input.item`
3. **CRITICAL**: Must return `[{json: {...}}]` format
4. **CRITICAL**: Webhook data is under `$json.body` (not `$json` directly)
5. **Built-ins available**: $helpers.httpRequest(), DateTime (Luxon), $jmespath()

---

## Mode Selection Guide

The Code node offers two execution modes. Choose based on your use case:

### Run Once for All Items (Recommended - Default)

**Use this mode for:** 95% of use cases

- **How it works**: Code executes **once** regardless of input count
- **Data access**: `$input.all()` or `items` array
- **Best for**: Aggregation, filtering, batch processing, transformations, API calls with all data
- **Performance**: Faster for multiple items (single execution)

```javascript
// Example: Calculate total from all items
const allItems = $input.all();
const total = allItems.reduce((sum, item) => sum + (item.json.amount || 0), 0);

return [{
  json: {
    total,
    count: allItems.length,
    average: total / allItems.length
  }
}];
```

**When to use:**
- ✅ Comparing items across the dataset
- ✅ Calculating totals, averages, or statistics
- ✅ Sorting or ranking items
- ✅ Deduplication
- ✅ Building aggregated reports
- ✅ Combining data from multiple items

### Run Once for Each Item

**Use this mode for:** Specialized cases only

- **How it works**: Code executes **separately** for each input item
- **Data access**: `$input.item` or `$item`
- **Best for**: Item-specific logic, independent operations, per-item validation
- **Performance**: Slower for large datasets (multiple executions)

```javascript
// Example: Add processing timestamp to each item
const item = $input.item;

return [{
  json: {
    ...item.json,
    processed: true,
    processedAt: new Date().toISOString()
  }
}];
```

**Decision Shortcut:**
- **Need to look at multiple items?** → Use "All Items" mode
- **Each item completely independent?** → Use "Each Item" mode
- **Not sure?** → Use "All Items" mode (you can always loop inside)

---

## Data Access Patterns

### Pattern 1: $input.all() - Most Common

```javascript
const allItems = $input.all();
const valid = allItems.filter(item => item.json.status === 'active');
const mapped = valid.map(item => ({
  json: { id: item.json.id, name: item.json.name }
}));
return mapped;
```

### Pattern 2: $input.first() - Very Common

```javascript
const firstItem = $input.first();
const data = firstItem.json;
return [{ json: { result: processData(data), processedAt: new Date().toISOString() } }];
```

### Pattern 3: $input.item - Each Item Mode Only

```javascript
const currentItem = $input.item;
return [{ json: { ...currentItem.json, itemProcessed: true } }];
```

### Pattern 4: $node - Reference Other Nodes

```javascript
const webhookData = $node["Webhook"].json;
const httpData = $node["HTTP Request"].json;
return [{ json: { combined: { webhook: webhookData, api: httpData } } }];
```

---

## Critical: Webhook Data Structure

**MOST COMMON MISTAKE**: Webhook data is nested under `.body`

```javascript
// ❌ WRONG - Will return undefined
const name = $json.name;

// ✅ CORRECT - Webhook data is under .body
const name = $json.body.name;
const webhookData = $input.first().json.body;
```

---

## Return Format Requirements

**CRITICAL RULE**: Always return array of objects with `json` property

```javascript
// ✅ Single result
return [{ json: { field1: value1 } }];

// ✅ Multiple results
return [
  {json: {id: 1, data: 'first'}},
  {json: {id: 2, data: 'second'}}
];

// ✅ Empty result
return [];

// ❌ WRONG: Object without array wrapper
return { json: {field: value} };

// ❌ WRONG: Array without json wrapper
return [{field: value}];
```

---

## Common Patterns

### 1. Data Transformation & Enrichment

```javascript
const items = $input.all();
return items.map(item => {
  const data = item.json;
  const nameParts = data.name.split(' ');
  return {
    json: {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' '),
      email: data.email,
      created_at: new Date().toISOString()
    }
  };
});
```

### 2. Aggregation & Reporting

```javascript
const items = $input.all();
const total = items.reduce((sum, item) => sum + (item.json.amount || 0), 0);
return [{
  json: {
    total,
    count: items.length,
    average: total / items.length,
    timestamp: new Date().toISOString()
  }
}];
```

### 3. Filtering with Regex

```javascript
const pattern = /\b([A-Z]{2,5})\b/g;
const matches = {};
for (const item of $input.all()) {
  const found = item.json.text.match(pattern);
  if (found) found.forEach(m => { matches[m] = (matches[m] || 0) + 1; });
}
return [{json: {matches}}];
```

### 4. Top N Filtering & Ranking

```javascript
const topItems = $input.all()
  .sort((a, b) => (b.json.score || 0) - (a.json.score || 0))
  .slice(0, 10);
return topItems.map(item => ({json: item.json}));
```

---

## Error Prevention - Top 5 Mistakes

### #1: Empty Code or Missing Return

```javascript
// ❌ WRONG: No return statement
const items = $input.all();
// Forgot to return!

// ✅ CORRECT
const items = $input.all();
return items.map(item => ({json: item.json}));
```

### #2: Expression Syntax Confusion

```javascript
// ❌ WRONG in Code node
const value = "{{ $json.field }}";

// ✅ CORRECT in Code node
const value = $input.first().json.field;
```

### #3: Incorrect Return Wrapper

```javascript
// ❌ WRONG
return {json: {result: 'success'}};
// ✅ CORRECT
return [{json: {result: 'success'}}];
```

### #4: Missing Null Checks

```javascript
// ❌ WRONG: Crashes if field doesn't exist
const value = item.json.user.email;
// ✅ CORRECT
const value = item.json?.user?.email || 'no-email@example.com';
```

### #5: Webhook Body Nesting

```javascript
// ❌ WRONG
const email = $json.email;
// ✅ CORRECT
const email = $json.body.email;
```

---

## Built-in Functions & Helpers

### $helpers.httpRequest()

```javascript
const response = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: { 'Authorization': 'Bearer token' }
});
return [{json: {data: response}}];
```

### DateTime (Luxon)

```javascript
const now = DateTime.now();
const formatted = now.toFormat('yyyy-MM-dd');
const tomorrow = now.plus({days: 1});
return [{json: {today: formatted, tomorrow: tomorrow.toFormat('yyyy-MM-dd')}}];
```

### $jmespath()

```javascript
const data = $input.first().json;
const adults = $jmespath(data, 'users[?age >= `18`]');
return [{json: {adults}}];
```

---

## Production Gotchas

### SplitInBatches Loop Semantics

- `main[0]` = **done** — fires ONCE after all batches processed
- `main[1]` = **each batch** — fires for every batch (loop body)

Always add a **Limit 1** node after the done output.

### Cross-Iteration Data Accumulation (CRITICAL)

`$('Node Inside Loop').all()` returns **ONLY the last iteration's items**. Use workflow static data:

```javascript
// BEFORE the loop (reset accumulator):
const staticData = $getWorkflowStaticData('global');
staticData.results = [];
return $input.all();

// INSIDE the loop body (accumulate):
const staticData = $getWorkflowStaticData('global');
const results = [];
for (const item of $input.all()) {
  const processed = { /* ... */ };
  results.push({ json: processed });
  staticData.results.push(processed);
}
return results;

// AFTER the loop (read accumulated data):
const staticData = $getWorkflowStaticData('global');
const allResults = staticData.results || [];
```

### pairedItem for New Output Items

```javascript
const results = [];
for (let i = 0; i < $input.all().length; i++) {
  const item = $input.all()[i];
  results.push({
    json: { /* new data */ },
    pairedItem: { item: i }
  });
}
return results;
```

### Correct Node Reference Syntax

```javascript
// ❌ WRONG
const data = $('HTTP Request').json;
// ✅ CORRECT
const data = $('HTTP Request').first().json;
```

### Float Precision for Price/Currency

```javascript
// ✅ Reliable - compare at cent level
if (Math.round(newPrice * 100) !== Math.round(oldPrice * 100)) {
  // Real price change detected
}
```

---

## Quick Reference Checklist

- [ ] Return statement exists — must return array of objects
- [ ] Proper return format — each item: `{json: {...}}`
- [ ] Data access correct — `$input.all()`, `$input.first()`, or `$input.item`
- [ ] No n8n expressions in code — use JavaScript directly
- [ ] Error handling — guard clauses for null/undefined
- [ ] Webhook data — access via `.body`
- [ ] Mode selection — "All Items" for most cases

---

## n8n Documentation
- Code Node Guide: https://docs.n8n.io/code/code-node/
- Built-in Methods: https://docs.n8n.io/code-examples/methods-variables-reference/
- Luxon Documentation: https://moment.github.io/luxon/
