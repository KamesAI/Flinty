---
name: n8n-code-python
description: Write Python code in n8n Code nodes. Use when writing Python in n8n, using _input/_json/_node syntax, working with standard library, or need to understand Python limitations in n8n Code nodes. Use this skill when the user specifically requests Python for an n8n Code node. Note — JavaScript is recommended for 95% of use cases — only use Python when the user explicitly prefers it or the task requires Python-specific standard library capabilities (regex, hashlib, statistics).
---

# Python Code Node (Beta)

Expert guidance for writing Python code in n8n Code nodes.

---

## ⚠️ Important: JavaScript First

**Recommendation**: Use **JavaScript for 95% of use cases**. Only use Python when:
- You need specific Python standard library functions
- You're significantly more comfortable with Python syntax
- You're doing data transformations better suited to Python

**Why JavaScript is preferred:**
- Full n8n helper functions ($helpers.httpRequest, etc.)
- Luxon DateTime library for advanced date/time operations
- No external library limitations
- Better n8n documentation and community support

---

## Quick Start

```python
# Basic template for Python Code nodes
items = _input.all()

processed = []
for item in items:
    processed.append({
        "json": {
            **item["json"],
            "processed": True,
            "timestamp": datetime.now().isoformat()
        }
    })

return processed
```

### Essential Rules

1. **Consider JavaScript first** — use Python only when necessary
2. **Access data**: `_input.all()`, `_input.first()`, or `_input.item`
3. **CRITICAL**: Must return `[{"json": {...}}]` format
4. **CRITICAL**: Webhook data is under `_json["body"]` (not `_json` directly)
5. **CRITICAL LIMITATION**: **No external libraries** (no requests, pandas, numpy)
6. **Standard library only**: json, datetime, re, base64, hashlib, urllib.parse, math, random, statistics

---

## Mode Selection Guide

### Run Once for All Items (Recommended - Default)

```python
all_items = _input.all()
total = sum(item["json"].get("amount", 0) for item in all_items)

return [{
    "json": {
        "total": total,
        "count": len(all_items),
        "average": total / len(all_items) if all_items else 0
    }
}]
```

### Run Once for Each Item

```python
item = _input.item

return [{
    "json": {
        **item["json"],
        "processed": True,
        "processed_at": datetime.now().isoformat()
    }
}]
```

---

## Python Modes: Beta vs Native

### Python (Beta) — Recommended

```python
# Use: _input, _json, _node helper syntax
items = _input.all()
now = _now  # Built-in datetime object
return [{"json": {"count": len(items), "timestamp": now.isoformat()}}]
```

### Python (Native) (Beta) — More Limited

```python
# Use: _items, _item variables only
processed = []
for item in _items:
    processed.append({"json": {"id": item["json"].get("id"), "processed": True}})
return processed
```

**Recommendation**: Use **Python (Beta)** for better n8n integration.

---

## Data Access Patterns

### Pattern 1: _input.all() - Most Common

```python
all_items = _input.all()
valid = [item for item in all_items if item["json"].get("status") == "active"]
return [{"json": {"id": item["json"]["id"], "name": item["json"]["name"]}} for item in valid]
```

### Pattern 2: _input.first()

```python
first_item = _input.first()
data = first_item["json"]
return [{"json": {"result": process_data(data), "processed_at": datetime.now().isoformat()}}]
```

### Pattern 3: _input.item (Each Item Mode Only)

```python
current_item = _input.item
return [{"json": {**current_item["json"], "item_processed": True}}]
```

### Pattern 4: _node - Reference Other Nodes

```python
webhook_data = _node["Webhook"]["json"]
http_data = _node["HTTP Request"]["json"]
return [{"json": {"combined": {"webhook": webhook_data, "api": http_data}}}]
```

---

## Critical: Webhook Data Structure

```python
# ❌ WRONG - Will raise KeyError
name = _json["name"]

# ✅ CORRECT - Webhook data is under ["body"]
name = _json["body"]["name"]

# ✅ SAFER - Use .get() for safe access
webhook_data = _json.get("body", {})
name = webhook_data.get("name")
```

---

## Return Format Requirements

```python
# ✅ Single result
return [{"json": {"field1": value1}}]

# ✅ Multiple results
return [{"json": {"id": 1}}, {"json": {"id": 2}}]

# ✅ List comprehension
return [{"json": {"id": item["json"]["id"]}} for item in _input.all() if item["json"].get("valid")]

# ✅ Empty result
return []

# ❌ WRONG: Dict instead of list
return {"json": {"field": value}}

# ❌ WRONG: List without json wrapper
return [{"field": value}]
```

---

## CRITICAL Limitation: No External Libraries

```python
# ❌ NOT AVAILABLE
import requests   # No
import pandas     # No
import numpy      # No

# ✅ AVAILABLE (Standard Library)
import json
import datetime
import re
import base64
import hashlib
import urllib.parse
import math
import random
import statistics
```

### Workarounds

- **Need HTTP requests?** → Use **HTTP Request node** or switch to **JavaScript** with `$helpers.httpRequest()`
- **Need data analysis?** → Use `statistics` module or switch to **JavaScript**
- **Need web scraping?** → Use **HTTP Request node** + **HTML Extract node**

---

## Common Patterns

### 1. Data Transformation

```python
items = _input.all()
return [
    {
        "json": {
            "id": item["json"].get("id"),
            "name": item["json"].get("name", "Unknown").upper(),
            "processed": True
        }
    }
    for item in items
]
```

### 2. Filtering & Aggregation

```python
items = _input.all()
total = sum(item["json"].get("amount", 0) for item in items)
valid_items = [item for item in items if item["json"].get("amount", 0) > 0]
return [{"json": {"total": total, "count": len(valid_items)}}]
```

### 3. String Processing with Regex

```python
import re
email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
all_emails = []
for item in _input.all():
    emails = re.findall(email_pattern, item["json"].get("text", ""))
    all_emails.extend(emails)
return [{"json": {"emails": list(set(all_emails)), "count": len(set(all_emails))}}]
```

### 4. Statistical Analysis

```python
from statistics import mean, median, stdev
values = [item["json"].get("value", 0) for item in _input.all() if "value" in item["json"]]
if values:
    return [{"json": {
        "mean": mean(values),
        "median": median(values),
        "stdev": stdev(values) if len(values) > 1 else 0,
        "min": min(values),
        "max": max(values)
    }}]
return [{"json": {"error": "No values found"}}]
```

### 5. Data Validation

```python
validated = []
for item in _input.all():
    data = item["json"]
    errors = []
    if not data.get("email"): errors.append("Email required")
    if not data.get("name"): errors.append("Name required")
    validated.append({"json": {**data, "valid": len(errors) == 0, "errors": errors or None}})
return validated
```

---

## Error Prevention - Top 5 Mistakes

### #1: Importing External Libraries

```python
# ❌ WRONG
import requests  # ModuleNotFoundError!
# ✅ CORRECT: Use HTTP Request node or switch to JavaScript
```

### #2: Missing Return Statement

```python
# ❌ WRONG: No return
items = _input.all()
# ...forgot to return!
# ✅ CORRECT
return [{"json": item["json"]} for item in _input.all()]
```

### #3: Incorrect Return Format

```python
# ❌ WRONG
return {"json": {"result": "success"}}
# ✅ CORRECT
return [{"json": {"result": "success"}}]
```

### #4: KeyError on Dictionary Access

```python
# ❌ WRONG
name = _json["user"]["name"]  # KeyError!
# ✅ CORRECT
name = _json.get("user", {}).get("name", "Unknown")
```

### #5: Webhook Body Nesting

```python
# ❌ WRONG
email = _json["email"]  # KeyError!
# ✅ CORRECT
email = _json.get("body", {}).get("email", "no-email")
```

---

## Standard Library Reference

```python
import json
data = json.loads(json_string)

from datetime import datetime, timedelta
now = datetime.now()
tomorrow = now + timedelta(days=1)
formatted = now.strftime("%Y-%m-%d")

import re
matches = re.findall(r'\d+', text)

import base64
encoded = base64.b64encode(data).decode()

import hashlib
hash_value = hashlib.sha256(text.encode()).hexdigest()

import urllib.parse
params = urllib.parse.urlencode({"key": "value"})

from statistics import mean, median, stdev
average = mean([1, 2, 3, 4, 5])
```

---

## Best Practices

1. **Always use `.get()` for dictionary access** — avoids KeyError
2. **Handle None explicitly** — `amount = item["json"].get("amount") or 0`
3. **Use list comprehensions** — more Pythonic and readable
4. **Return consistent structure** — always `[{"json": result}]`
5. **Debug with `print()`** — appears in browser console (F12)

---

## Production Gotchas

### Correct Node Reference Syntax

```python
# ❌ WRONG
data = _node['HTTP Request']['json']
# ✅ CORRECT
data = _node['HTTP Request'].first()['json']
```

### Cross-Iteration Data

`$getWorkflowStaticData('global')` may not be available in Python Beta mode. For accumulating data across SplitInBatches iterations, use a JavaScript Code node instead.

---

## When to Use Python vs JavaScript

### Use Python When
- You need `statistics` module for statistical operations
- You're significantly more comfortable with Python syntax
- Your logic maps well to list comprehensions

### Use JavaScript When (Recommended for 95%)
- You need HTTP requests (`$helpers.httpRequest()`)
- You need advanced date/time (DateTime/Luxon)
- For most use cases

---

## Quick Reference Checklist

- [ ] Considered JavaScript first — using Python only when necessary
- [ ] Return statement exists
- [ ] Proper return format — each item: `{"json": {...}}`
- [ ] Data access correct — `_input.all()`, `_input.first()`, or `_input.item`
- [ ] No external imports — only standard library
- [ ] Safe dictionary access — using `.get()`
- [ ] Webhook data — access via `["body"]`
- [ ] Mode selection — "All Items" for most cases

---

## n8n Documentation
- Code Node Guide: https://docs.n8n.io/code/code-node/
- Python in n8n: https://docs.n8n.io/code/builtin/python-modules/
