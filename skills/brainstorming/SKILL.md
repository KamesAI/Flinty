---
name: brainstorming
description: "You MUST use this before any creative work - creating workflows, building automations, adding integrations, or modifying client solutions. Explores Thomas's intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Automation Designs (Kames AI Edition)

## Overview

Help Thomas turn vague ideas into fully formed automation designs and specs through natural collaborative dialogue.

Start by understanding the current situation (client needs, existing workflows, constraints), then ask questions **one at a time** to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

**For Thomas:** This skill prevents me from jumping into n8n and building something that doesn't match what you actually need. We think it through first, then build.

## When To Use This Skill

**ALWAYS use before:**
- ✅ New client workflow/automation
- ✅ New feature for existing client
- ✅ Infrastructure changes (AWS, Docker, backups)
- ✅ Complex integrations (multiple APIs, data transformations)
- ✅ Modifying existing workflow behavior

**Don't need for:**
- ❌ Quick fixes/bug fixes (use systematic-debugging instead)
- ❌ Simple one-node changes
- ❌ Copying exact workflow from another client

**Announce at start:** "I'm using the brainstorming skill to design this properly before building."

## The Process (3 Phases)

### Phase 1: Understanding the Idea

**Step 1: Check current context**
- What client is this for?
- What tools/integrations are already in place?
- What's the current problem/pain point?
- What have you tried before (if anything)?

**Step 2: Ask clarifying questions ONE AT A TIME**
- **Critical:** Only ONE question per message
- Prefer multiple choice when possible (easier for Thomas to answer)
- If topic needs more exploration, break into multiple questions
- Focus on: purpose, constraints, success criteria, edge cases

**Example question flow for "Calendly to CRM integration":**

```
Question 1: "Which CRM does the client use?"
[a] HubSpot
[b] Salesforce  
[c] Pipedrive
[d] Other (specify)

[Thomas answers: HubSpot]

Question 2: "When someone books via Calendly, what should happen in HubSpot?"
[a] Create new contact only
[b] Create contact + create deal
[c] Update existing contact if exists
[d] Create contact + assign to sales rep

[Thomas answers: c]

Question 3: "Should this work for all Calendly event types, or specific ones?"
[a] All event types
[b] Only specific events (which ones?)

[Thomas answers: b, only "Sales Demo" events]

Question 4: "What should happen if the person is already in HubSpot?"
[a] Update their info (name, phone, etc.)
[b] Add a note about the new booking
[c] Create a task for sales rep
[d] All of the above

[etc.]
```

**Key principle:** Don't ask "What do you want?" (too broad). Ask specific, actionable questions.

### Phase 2: Exploring Approaches

**Once you understand the need, propose 2-3 different approaches with trade-offs.**

**Present conversationally:**
- Lead with your recommended option
- Explain WHY you recommend it
- Show trade-offs for each approach
- Let Thomas choose or validate your recommendation

**Example for Calendly integration:**

```markdown
I see three ways we could build this:

**Option 1: Direct webhook (RECOMMENDED)**
- Calendly → n8n webhook → HubSpot API
- Pros: Real-time, simple, reliable
- Cons: Requires exposing n8n webhook URL
- Setup time: ~1 hour
- Why I recommend: Fastest, most reliable, standard pattern

**Option 2: Polling**
- n8n checks Calendly API every 15 minutes for new bookings
- Pros: No webhook exposure needed
- Cons: Not real-time (15min delay), uses API quota
- Setup time: ~1.5 hours
- When to use: If client can't/won't use webhooks

**Option 3: Calendly → Zapier → n8n → HubSpot**
- Uses Zapier as middleware
- Pros: No n8n webhook exposure, Zapier handles Calendly complexity
- Cons: Extra cost, extra failure point, slower
- Setup time: ~2 hours
- When to use: If n8n instance not internet-accessible

What works best for this client's situation?
```

**YAGNI ruthlessly:**
- Remove features that aren't explicitly needed
- Don't add "nice to have" complexity
- Keep it simple and focused

### Phase 3: Presenting the Design

**Once approach is validated, present full design in sections.**

**Structure:**
1. Overview & Goal (200-300 words)
2. Architecture Diagram (text-based)
3. Data Flow (200-300 words)
4. Error Handling (200-300 words)
5. Testing Strategy (200-300 words)
6. Monitoring & Maintenance (200-300 words)

**After EACH section, ask:** "Does this section look right so far? Any changes needed?"

**Be ready to:**
- Go back and clarify if something doesn't make sense
- Adjust based on Thomas's feedback
- Remove complexity if it's unnecessary

**Example Section 1 (Overview & Goal):**

```markdown
## Calendly to HubSpot Integration - Design

### 1. Overview & Goal

**Client:** Acme Corp
**Goal:** Automatically create/update HubSpot contacts when someone books a "Sales Demo" via Calendly

**Current situation:** 
- Sales team manually copies booking details from Calendly to HubSpot
- Takes ~5 minutes per booking
- ~20 bookings/week = 100 min/week wasted
- Occasional data entry errors

**Proposed solution:**
When someone books a Sales Demo on Calendly, automatically:
1. Check if contact exists in HubSpot (by email)
2. If exists: Update contact with latest info + add booking note
3. If new: Create contact in HubSpot with booking details
4. Notify sales rep via Slack

**Success criteria:**
- Zero manual data entry
- Contact in HubSpot within 30 seconds of booking
- 99% reliability (handle API failures gracefully)
- Sales rep knows about booking immediately

**Out of scope (YAGNI):**
- Bi-directional sync (HubSpot changes back to Calendly)
- Lead scoring (can add later if needed)
- Calendar blocking (Calendly already handles this)

Does this overview capture what you need? Any changes?
```

[Wait for validation before continuing to Section 2]

**Example Section 2 (Architecture):**

```markdown
### 2. Architecture

**High-level flow:**
```
Calendly Event → Webhook → n8n → HubSpot API
                              ↓
                            Slack Notification
```

**Components:**

1. **Calendly Webhook**
   - Triggers on "invitee.created" event
   - Sends to: https://n8n.kamesai.com/webhook/calendly-acme
   - Payload includes: email, name, phone, event_type, scheduled_time

2. **n8n Workflow: "Calendly-HubSpot-Acme"**
   - Node 1: Webhook (receives data)
   - Node 2: Filter (only process "Sales Demo" events)
   - Node 3: Code (transform Calendly → HubSpot format)
   - Node 4: HTTP Request (check if contact exists in HubSpot)
   - Node 5: Switch (exists? → update : create)
   - Node 6a: HTTP Request (update contact)
   - Node 6b: HTTP Request (create contact)
   - Node 7: HTTP Request (add note about booking)
   - Node 8: Slack webhook (notify sales rep)

3. **HubSpot Integration**
   - API Key stored in n8n credentials
   - Endpoints: /contacts/search, /contacts, /engagements

4. **Slack Notification**
   - Webhook URL for #sales channel
   - Message: "🗓️ New Sales Demo booked: {name} ({email}) on {date}"

Does this architecture make sense? Any concerns?
```

[Continue with remaining sections after validation]

## Key Principles

### 1. One Question at a Time
```
❌ BAD:
"What CRM are you using, what event types should trigger it, 
what fields do you want to sync, and should we notify anyone?"

✅ GOOD:
"Which CRM does the client use?"
[Wait for answer]
"What should happen when someone books via Calendly?"
[Wait for answer]
[etc.]
```

### 2. Multiple Choice Preferred
```
❌ BAD:
"What kind of error handling do you want?"

✅ GOOD:
"If the HubSpot API is down when a booking comes in, should we:"
[a] Retry 3 times, then email you the failure
[b] Queue it and retry every 15 min for 24h
[c] Save to database and process manually later
[d] Just log the error and move on
```

### 3. YAGNI Ruthlessly
```
❌ Don't add:
- Lead scoring (unless explicitly requested)
- Bi-directional sync (unless needed)
- Complex branching logic (keep it simple)
- "Future-proofing" for features not needed now

✅ Do add:
- Only what's explicitly needed
- Simple error handling
- Basic logging/monitoring
- What client will actually use
```

### 4. Explore Alternatives
```
Always present 2-3 options:
- Simple/fast approach
- Robust/complex approach
- Alternative technology approach

Let Thomas choose based on:
- Client budget
- Timeline
- Reliability needs
- Future scalability
```

### 5. Incremental Validation
```
Don't dump the entire design at once.

Present:
Section 1 → Validate → Adjust if needed
Section 2 → Validate → Adjust if needed
[etc.]

This prevents building the wrong thing.
```

## After the Design is Validated

### Step 1: Document the Design

**Save to:** `docs/plans/YYYY-MM-DD-<topic>-design.md`

**Template:**
```markdown
# [Client Name] - [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** Validated
**Estimated Time:** X hours

## 1. Overview & Goal
[Content from Phase 3, Section 1]

## 2. Architecture
[Content from Phase 3, Section 2]

## 3. Data Flow
[Detailed step-by-step of data transformation]

## 4. Error Handling
[What happens when things fail]

## 5. Testing Strategy
[How to verify it works]

## 6. Monitoring & Maintenance
[How to keep it healthy]

## 7. Next Steps
- [ ] Create implementation plan (writing-plans skill)
- [ ] Build workflow in n8n
- [ ] Test with sample data
- [ ] Deploy to production
- [ ] Document for client
```

### Step 2: Move to Implementation

**Ask Thomas:**
```
"Design validated and saved to docs/plans/2024-12-25-calendly-hubspot-design.md

Ready to create the implementation plan?

If yes, I'll use the writing-plans skill to break this into 
step-by-step tasks you can execute."
```

**Then use:** `writing-plans` skill to create detailed implementation

## Real-World Kames Examples

### Example 1: Vague Idea → Clear Design

**Thomas's initial request:**
"I want to automate lead scoring for a client."

**Brainstorming conversation:**
```
Claude: "I'm using the brainstorming skill to design this properly. 
Let me understand what you need..."

Question 1: Where do the leads come from?
[a] Website form
[b] CSV imports
[c] CRM manually created
[d] Multiple sources

Thomas: Website form

Question 2: What criteria should determine the score?
[a] Email domain (.com vs .edu vs startup domains)
[b] Company size
[c] Budget range
[d] All of the above

Thomas: Email domain and budget range from form

Question 3: What should happen with high-scoring leads?
[a] Notify sales rep immediately
[b] Auto-assign to specific sales rep
[c] Add to priority list in CRM
[d] All of the above

Thomas: a and c

[...more questions...]

Claude: "Got it. I see three approaches:

**Option 1: Score in n8n, push to CRM (RECOMMENDED)**
- Form → n8n webhook → scoring logic → CRM with score field
- Pros: Simple, fast, easy to adjust scoring rules
- Cons: Scoring logic in n8n (not in CRM)

**Option 2: Score in CRM workflow**
- Form → n8n → CRM → CRM workflow scores it
- Pros: All logic in one place (CRM)
- Cons: CRM workflow more complex, harder to debug

**Option 3: Third-party scoring service**
- Form → Clearbit/similar → enriched data → n8n → CRM
- Pros: Professional scoring, enriched data
- Cons: Extra cost, extra failure point

What fits this client's needs?"

Thomas: Option 1

Claude: "Perfect. Let me present the design in sections...

### 1. Overview & Goal

**Client:** XYZ Corp
**Goal:** Score incoming leads 0-100 based on email domain and budget

[...200-300 word overview...]

Does this look right so far?"

[Continue with Architecture, Data Flow, etc.]
```

### Example 2: Complex Integration Simplified

**Thomas's initial request:**
"Client wants Notion database synced to Google Sheets, updated every hour, with email notifications when new items added, and also push to Slack, plus archive old items to separate sheet."

**Brainstorming (YAGNI in action):**
```
Claude: "That's a lot of features. Let me understand what's actually needed vs nice-to-have..."

Question 1: What's the PRIMARY use case for this sync?
[a] Team needs to view Notion data in Sheets
[b] Team needs to edit in Sheets and sync back
[c] Analytics/reporting on Notion data

Thomas: a

Question 2: Do they actually need hourly updates, or would daily work?
Thomas: Actually, daily is fine

Question 3: For notifications - who needs them and why?
Thomas: Just the manager, to know when sales team adds prospects

Question 4: The archive feature - is that needed now or can we add later?
Thomas: Can add later if they ask

Claude: "Got it. Let me simplify this:

**Original request (complex):**
- Hourly sync
- Email notifications
- Slack notifications  
- Archiving
- Estimated time: 6-8 hours

**What's actually needed (YAGNI applied):**
- Daily sync (Notion → Sheets)
- Email notification to manager on new items
- Estimated time: 2 hours

**We can add later if requested:**
- Hourly sync (15 min to change cron)
- Slack notifications (30 min)
- Archiving (1 hour)

This approach gets them 80% of value with 25% of the work. Sound good?"

Thomas: Perfect

[Continue with design...]
```

## Common Patterns for Kames Automations

### Pattern 1: Webhook Trigger → Action
**Examples:** Form submission, Calendar booking, Payment received

**Key questions:**
- What service sends the webhook?
- What data is in the payload?
- What should happen with that data?
- Real-time or can queue?

### Pattern 2: Scheduled Check → Process
**Examples:** Daily report, Backup automation, Data sync

**Key questions:**
- How often should it run?
- What's the data source?
- What happens if it fails?
- Can it run during business hours?

### Pattern 3: Multi-Step Pipeline
**Examples:** Lead enrichment, Order processing, Document generation

**Key questions:**
- What are all the steps?
- Which steps can fail?
- What's the retry strategy?
- Can steps run in parallel?

### Pattern 4: Bi-Directional Sync
**Examples:** CRM ↔ Database, Sheets ↔ Notion

**Key questions:**
- Which system is source of truth?
- What happens on conflict?
- Real-time or batch?
- What triggers the sync?

## Integration with Other Skills

**Workflow:**
```
1. Brainstorming (this skill)
   ↓ Design validated
2. Writing-plans skill
   ↓ Implementation plan created
3. Execute plan step-by-step
   ↓ If bugs occur...
4. Systematic-debugging skill
   ↓ Root cause found, fix implemented
5. Verification-before-completion skill
   ↓ Actually verified working
6. Done!
```

## Thomas's Role in Brainstorming

**Your job:**
- Answer my questions honestly
- Tell me constraints (budget, timeline, client needs)
- Push back if design seems too complex
- Validate each section before I continue

**My job:**
- Ask smart questions
- Propose good approaches
- Apply YAGNI ruthlessly
- Create clear, actionable design

**Together we avoid:**
- Building the wrong thing
- Over-engineering
- Missing edge cases
- Wasting time on rework

## Quick Reference

| Phase | Your Action | My Action |
|-------|-------------|-----------|
| **Understanding** | Answer questions one at a time | Ask clarifying questions |
| **Exploring** | Choose best approach | Propose 2-3 options with trade-offs |
| **Presenting** | Validate each section | Present design 200-300 words at a time |
| **Documenting** | Review final design | Save to docs/plans/ |
| **Implementing** | Execute tasks | Create plan with writing-plans skill |

## Remember

**Before this skill:**
- Vague idea → jump to n8n → build wrong thing → waste time

**After this skill:**
- Vague idea → brainstorm → clear design → right approach → build correct thing → save time

**Brainstorming takes 15-30 minutes. It saves 2-3 hours of rework.**

That's the ROI. 🎯
