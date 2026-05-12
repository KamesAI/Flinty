---
name: systematic-debugging
description: Invoke when anything fails or behaves wrong (Flinty dashboard, Sheets, n8n, API, webhooks, Vercel) BEFORE suggesting code or config changes; use when user pastes an error, a stuck campaign status, or "ça ne marche pas"
---

# Systematic Debugging (Kames AI Edition)

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## Gotchas (Flinty)

- **Campagne `generating` + métriques 0** : souvent WF1 / `N8N_WF1_WEBHOOK` ou callback `generation-complete` — pas un bug UI par défaut.
- **Données "mélangées"** : vérifier l’onglet et le `sheet_id` ; isolation stricte par campagne hors `Contacts_Registry`.
- **Cache `sheet_id`** : ne pas refetch si déjà en cache côté app (règle projet).
- **Staging vs prod** : même symptôme, deux URLs n8n (`N8N_STAGING_URL` / `N8N_BASE_URL`) — ne pas corriger prod en lisant staging.
- Référence courte : [`references/flinty-dashboard.md`](references/flinty-dashboard.md).

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- n8n workflow failures
- Webhook issues
- API integration problems
- AWS EC2/Docker issues
- Database connection failures
- Client automation bugs
- Email/SMS not sending
- CRM integration failures

**Use this ESPECIALLY when:**
- Under time pressure (client expecting fix ASAP)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Client wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings in n8n execution logs
   - They often contain the exact solution
   - Check n8n error details, webhook payloads, API responses
   - Note which node failed, what data was passed to it

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time or intermittently?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - n8n workflow modifications
   - New credentials, webhooks updated
   - AWS EC2 config changes, Docker container updates
   - Environment variable changes

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (webhook → n8n → API → database):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify credentials/API keys propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Example (multi-layer n8n workflow):**
   ```
   # Layer 1: Webhook reception
   Add HTTP Request node to log: "Webhook received: {{$json}}"

   # Layer 2: Data transformation
   Add Code node to log: "Data after transform: {{$json}}"

   # Layer 3: API call
   Add HTTP Request node with verbose logging enabled
   Check response: "API response status: {{$statusCode}}"

   # Layer 4: Database insert
   Add Postgres node with debug query:
   SELECT * FROM table WHERE id = {{$json.id}}
   ```

   **This reveals:** Which layer fails (webhook → n8n ✓, n8n → API ✗)

5. **Trace Data Flow**

   **WHEN error is deep in workflow chain:**

   **Quick version:**
   - Where does bad value originate?
   - What node passed this bad value to the failing node?
   - Keep tracing backward through workflow until you find the source
   - Fix at source node, not at symptom node

   **Example:**
   ```
   ❌ Error at node 6: "Cannot read property 'email' of undefined"

   Trace backward:
   - Node 6 expects: {{$json.contact.email}}
   - Node 5 outputs: {{$json.lead}} (no "contact" property!)
   - Node 4 fetched from API, response has different structure
   - ROOT CAUSE: API changed response format, node 4 needs update
   ```

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples**
   - Locate similar working workflows in your n8n instance
   - Check workflows for other clients that work
   - What works that's similar to what's broken?

2. **Compare Against References**
   - If implementing n8n pattern, check n8n documentation
   - If integrating API, read API docs COMPLETELY
   - Don't skim - understand the pattern fully

3. **Identify Differences**
   - What's different between working and broken workflow?
   - List every difference: node settings, credentials, data structure
   - Don't assume "that can't matter"

4. **Understand Dependencies**
   - What credentials does this workflow need?
   - What environment variables (AWS, n8n)?
   - What external services must be available?
   - What assumptions does the workflow make about input data?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Write it down
   - Be specific, not vague
   
   **Examples:**
   - ✅ "Webhook fails because Calendly sends 'scheduled' event but workflow expects 'created' event"
   - ✅ "API returns 401 because credential expired on December 1st"
   - ❌ "Something wrong with the API" (too vague)

2. **Test Minimally**
   - Make the SMALLEST possible change to test hypothesis
   - One node setting at a time
   - DON'T change multiple nodes/settings at once

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

4. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Ask for help or search documentation
   - Better to admit uncertainty than break more things

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Test Case**
   - Simplest possible reproduction
   - Manual test with known data if possible
   - Document exact steps to trigger bug
   - MUST have before fixing

   **Example:**
   ```
   Test case for webhook issue:
   1. Send POST to webhook URL with this payload: {...}
   2. Expected: workflow executes successfully
   3. Actual: fails at node 4 with error "..."
   ```

2. **Implement Single Fix**
   - Address the root cause identified
   - ONE change at a time
   - No "while I'm here" improvements
   - No bundled changes to other nodes

3. **Verify Fix**
   - Test case passes now?
   - Workflow executes end-to-end?
   - No other workflows broken?
   - Issue actually resolved?

4. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If ≥ 3: STOP and question the architecture (step 5 below)**
   - DON'T attempt Fix #4 without architectural discussion

5. **If 3+ Fixes Failed: Question Architecture**

   **Pattern indicating architectural problem:**
   - Each fix reveals new problem in different node
   - Fixes require "complete workflow rebuild" to implement
   - Each fix creates new symptoms elsewhere
   - Workflow is "band-aided together"

   **STOP and question fundamentals:**
   - Is this workflow pattern fundamentally sound?
   - Should we rebuild workflow from scratch vs. continue fixing?
   - Is there a simpler way to achieve same result?

   **Discuss with Thomas before attempting more fixes**

   This is NOT a failed hypothesis - this is wrong architecture.

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing this node setting and see if it works"
- "Add multiple changes, run workflow again"
- "Skip the test, I'll manually verify in production"
- "It's probably the API, let me change credentials"
- "I don't fully understand but this might work"
- "Let me just restart the Docker container"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before checking n8n execution logs
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different component**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5)

## Thomas's Signals You're Doing It Wrong

**Watch for these redirections:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added logging/evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultrathink this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Client emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "API docs too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |
| "Just restart EC2/Docker" | Restart hides root cause. Investigate why it failed first. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, workflow works |

## When Process Reveals "No Root Cause"

If systematic investigation reveals issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry logic, timeout, error notification)
4. Add monitoring/logging for future investigation

**But:** 95% of "no root cause" cases are incomplete investigation.

## Real-World Kames Examples

### Example 1: Webhook Not Triggering Workflow

**❌ Random fix approach:**
- "Maybe the webhook URL is wrong" → change URL
- "Maybe credentials expired" → refresh credentials
- "Maybe n8n is down" → restart Docker
- Result: 2 hours wasted, still broken

**✅ Systematic approach:**
- Phase 1: Check n8n executions → no execution recorded
- Phase 1: Check webhook logs in Calendly → webhook IS being sent
- Phase 1: Test webhook URL directly with curl → n8n receives it!
- Root cause found: Calendly changed event type from "invitee.created" to "invitee.scheduled"
- Phase 4: Update webhook node to listen for "invitee.scheduled"
- Result: Fixed in 15 minutes

### Example 2: API Integration Returns 401

**❌ Random fix approach:**
- "API key probably expired" → generate new key
- Still fails → "Maybe API endpoint changed" → change URL
- Still fails → "Maybe rate limited" → add delays
- Result: 3 failed fixes, no progress

**✅ Systematic approach:**
- Phase 1: Check exact API response → "Invalid signature"
- Phase 1: Compare with working client workflow → same credentials work there!
- Phase 1: Check what's different → this workflow uses POST, working one uses GET
- Root cause found: API requires signature in header for POST, not for GET
- Phase 4: Add signature header to POST request
- Result: Fixed in 20 minutes

### Example 3: Database Insert Fails Intermittently

**❌ Random fix approach:**
- "Database connection issue" → restart PostgreSQL
- "Maybe timeout too short" → increase timeout
- "Maybe Docker network issue" → restart containers
- Result: Multiple restarts, issue still occurs

**✅ Systematic approach:**
- Phase 1: Reproduce → fails only when webhook sends >10 contacts
- Phase 1: Check error → "Deadlock detected"
- Phase 1: Trace data flow → workflow inserts contacts sequentially in loop
- Root cause found: Loop processes too fast, creates concurrent transactions
- Phase 4: Add 1-second delay between inserts OR batch insert all at once
- Result: Fixed in 25 minutes

## Supporting Context

**For Thomas (non-developer):**
- You don't need to understand all technical details
- Focus on WHAT breaks and WHERE it breaks
- Follow the phases in order
- Add logging/evidence at each step
- Ask Claude to explain unfamiliar terms
- It's okay to not know - systematic process works even without deep technical knowledge

**Key tools for evidence gathering:**
- n8n execution logs (shows exactly what each node received/sent)
- HTTP Request node with verbose logging
- Code node with console.log() for debugging
- AWS CloudWatch logs (for EC2/Docker issues)
- PostgreSQL query logs (for database issues)

**Remember:**
- Symptom: "Workflow fails"
- Root cause: "API expects array but receives object"
- Fix symptom → keeps breaking
- Fix root cause → stays fixed

## Related Skills

These skills work together with systematic debugging:

- **test-driven-development** - For creating test cases before implementing fixes (Phase 4, Step 1)
- Use when building new workflows or fixing complex bugs

**Common debugging pattern:**
1. Use THIS skill to find root cause
2. Use test-driven-development to create failing test
3. Fix root cause
4. Verify test passes

## Real-World Impact

From Kames debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
- Client satisfaction: High (fast, reliable) vs Low (multiple "fixes" needed)
