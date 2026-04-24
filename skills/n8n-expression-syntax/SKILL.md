---
name: n8n-expression-syntax
description: Validate n8n expression syntax and fix common errors. Use when writing n8n expressions, using {{}} syntax, accessing $json/$node variables, troubleshooting expression errors, mapping data between nodes, or referencing webhook data in workflows. Use this skill whenever configuring node fields that reference data from previous nodes — expressions are how n8n passes data between nodes, and getting the syntax wrong is the most common source of workflow errors.
---

# n8n Expression Syntax

Expert guide for writing correct n8n expressions in workflows.

---

## Expression Format

All dynamic content in n8n uses **double curly braces**:

```
{{expression}}
```

**Examples**:
```
✅ {{$json.email}}
✅ {{$json.body.name}}
✅ {{$node["HTTP Request"].json.data}}
❌ $json.email  (no braces - treated as literal text)
❌ {$json.email}  (single braces - invalid)
```

---

## Core Variables

### $json - Current Node Output

```javascript
{{$json.fieldName}}
{{$json['field with spaces']}}
{{$json.nested.property}}
{{$json.items[0].name}}
```

### $node - Reference Other Nodes

```javascript
{{$node["Node Name"].json.fieldName}}
{{$node["HTTP Request"].json.data}}
{{$node["Webhook"].json.body.email}}
```

**Important**: Node names must be in quotes, are case-sensitive, and must match exactly.

### $now - Current Timestamp

```javascript
{{$now}}
{{$now.toFormat('yyyy-MM-dd')}}
{{$now.toFormat('HH:mm:ss')}}
{{$now.plus({days: 7})}}
```

### $env - Environment Variables

```javascript
{{$env.API_KEY}}
```

**Warning**: Some n8n instances block `$env` via `N8N_BLOCK_ENV_ACCESS_IN_NODE`. Use credentials instead if blocked.

---

## CRITICAL: Webhook Data Structure

**Most Common Mistake**: Webhook data is NOT at the root!

```javascript
// Webhook Node Output Structure:
{
  "headers": {...},
  "params": {...},
  "query": {...},
  "body": {           // ⚠️ USER DATA IS HERE!
    "name": "John",
    "email": "john@example.com"
  }
}

// ❌ WRONG:
{{$json.name}}
{{$json.email}}

// ✅ CORRECT:
{{$json.body.name}}
{{$json.body.email}}
```

---

## Common Patterns

### Access Nested Fields

```javascript
{{$json.user.email}}
{{$json.data[0].name}}
{{$json['field name']}}
```

### Reference Other Nodes

```javascript
{{$node["Set"].json.value}}
{{$node["HTTP Request"].json.data}}
{{$node["Webhook"].json.body.email}}
```

### Combine Variables

```javascript
Hello {{$json.body.name}}!
https://api.example.com/users/{{$json.body.user_id}}
```

---

## When NOT to Use Expressions

### Code Nodes

```javascript
// ❌ WRONG in Code node
const email = '={{$json.email}}';

// ✅ CORRECT in Code node
const email = $json.email;
const email = $input.item.json.email;
```

### Webhook Paths

```javascript
// ❌ WRONG
path: "{{$json.user_id}}/webhook"
// ✅ CORRECT
path: "user-webhook"  // Static paths only
```

---

## Validation Rules

### 1. Always Use {{}}

```javascript
❌ $json.field
✅ {{$json.field}}
```

### 2. Bracket Notation for Spaces and Special Characters

```javascript
❌ {{$json.field name}}
✅ {{$json['field name']}}
❌ {{$node.HTTP Request.json}}
✅ {{$node["HTTP Request"].json}}
✅ {{$json['Gross Price w/o shipment']}}
```

### 3. Match Exact Node Names (Case-Sensitive)

```javascript
❌ {{$node["http request"].json}}
✅ {{$node["HTTP Request"].json}}
```

### 4. No Nested {{}}

```javascript
❌ {{{$json.field}}}
✅ {{$json.field}}
```

---

## Common Mistakes Quick Fixes

| Mistake | Fix |
|---------|-----|
| `$json.field` | `{{$json.field}}` |
| `{{$json.field name}}` | `{{$json['field name']}}` |
| `{{$node.HTTP Request}}` | `{{$node["HTTP Request"]}}` |
| `{{{$json.field}}}` | `{{$json.field}}` |
| `{{$json.name}}` (webhook) | `{{$json.body.name}}` |
| `'={{$json.email}}'` (Code node) | `$json.email` |

---

## Working Examples

### Example 1: Webhook to Slack

```
New form submission!
Name: {{$json.body.name}}
Email: {{$json.body.email}}
Message: {{$json.body.message}}
```

### Example 2: HTTP Request to Email

```
Product: {{$node["HTTP Request"].json.data.items[0].name}}
Price: ${{$node["HTTP Request"].json.data.items[0].price}}
```

### Example 3: Format Timestamp

```javascript
{{$now.toFormat('yyyy-MM-dd')}}       // 2025-10-20
{{$now.toFormat('HH:mm:ss')}}         // 14:30:45
{{$now.toFormat('yyyy-MM-dd HH:mm')}} // 2025-10-20 14:30
```

---

## Data Type Handling

### Arrays

```javascript
{{$json.users[0].email}}
{{$json.users.length}}
{{$json.users[$json.users.length - 1].name}}
```

### Strings

```javascript
{{$json.email.toLowerCase()}}
{{$json.name.toUpperCase()}}
```

### Numbers

```javascript
{{$json.price * 1.1}}
{{$json.quantity + 5}}
```

---

## Advanced Patterns

### Conditional Content

```javascript
{{$json.status === 'active' ? 'Active User' : 'Inactive User'}}
{{$json.email || 'no-email@example.com'}}
```

### Date Manipulation

```javascript
{{$now.plus({days: 7}).toFormat('yyyy-MM-dd')}}
{{$now.minus({hours: 24}).toISO()}}
{{DateTime.fromISO('2025-12-25').toFormat('MMMM dd, yyyy')}}
```

### String Manipulation

```javascript
{{$json.email.substring(0, 5)}}
{{$json.message.replace('old', 'new')}}
{{$json.tags.split(',').join(', ')}}
```

---

## Debugging

### Common Error Messages

- **"Cannot read property 'X' of undefined"** → Parent object doesn't exist, check your data path
- **"X is not a function"** → Trying to call method on wrong type
- **Expression shows as literal text** → Missing `{{ }}`

---

## Best Practices

### ✅ Do
- Always use `{{ }}` for dynamic content
- Use bracket notation for field names with spaces
- Reference webhook data from `.body`
- Test expressions in expression editor (click "fx" icon)

### ❌ Don't
- Don't use expressions in Code nodes (use JavaScript directly)
- Don't forget quotes around node names with spaces
- Don't assume webhook data is at root (it's under `.body`!)
- Don't use expressions in webhook paths or credentials

---

## Summary

**Essential Rules**:
1. Wrap expressions in `{{ }}`
2. Webhook data is under `.body`
3. No `{{ }}` in Code nodes
4. Quote node names with spaces
5. Node names are case-sensitive
