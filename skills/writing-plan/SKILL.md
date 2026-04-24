---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step automation/workflow task, before building
---

# Writing Implementation Plans (Kames AI Edition)

## Overview

Write comprehensive implementation plans assuming Thomas has zero context for this specific workflow and needs exact instructions. Document everything he needs to know: which n8n nodes to create, what settings to configure, what credentials to use, where to test it, expected results at each step.

Give him the whole plan as bite-sized tasks (2-5 minutes each). Each step must be actionable immediately without additional thinking.

**Assume Thomas:**
- Is NOT a developer (needs exact instructions, no assumptions)
- Knows n8n basics but not advanced patterns
- Needs to know EXACTLY where to click, what to type, what command to run
- Needs expected results after each step (so he knows it worked)
- Will follow instructions precisely if they're clear enough

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md` in your project folder

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Create HTTP Request node for webhook" - step
- "Test webhook URL with curl command" - step
- "Add credentials to node" - step
- "Run workflow manually to verify" - step
- "Document workflow for client" - step

**NOT acceptable:**
- "Set up the workflow" (too vague, 30+ minutes)
- "Configure the API integration" (which settings? what values?)
- "Test everything" (test what exactly? how?)

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** Follow this plan task-by-task. Thomas will execute each step and report results.

**Goal:** [One sentence describing what this builds]

**Client:** [Client name or "Internal Kames"]

**Architecture:** [2-3 sentences about approach - which services connect to what]

**Tech Stack:** [Key technologies: n8n, specific APIs, AWS services, database, etc.]

**Prerequisites:**
- [ ] Access to [service/platform]
- [ ] Credentials for [API/service]
- [ ] [Other requirements]

---
```

## Task Structure

```markdown
### Task N: [Component Name - e.g., "Webhook Reception", "CRM Integration", "Email Notification"]

**What we're building:** [1 sentence explanation]

**n8n Nodes to Create:**
- Webhook node (HTTP Request)
- Code node (for data transformation)
- HTTP Request node (API call to HubSpot)
- [etc.]

**Files/Credentials Needed:**
- HubSpot API key (stored in n8n credentials as "HubSpot-Client-X")
- [etc.]

---

#### Step 1: Create webhook node

**Action:**
1. In n8n, click "+ Add node"
2. Search for "Webhook"
3. Select "Webhook" node
4. Settings to configure:
   - HTTP Method: POST
   - Path: /calendly-booking
   - Authentication: None
   - Respond: Immediately

**Expected result:**
- Node created with webhook URL: `https://your-n8n-domain.com/webhook/calendly-booking`
- Node shows "Waiting for webhook call..." when you click "Listen for test event"

---

#### Step 2: Test webhook reception

**Action:**
Run this curl command in your terminal (replace URL with your webhook URL):

```bash
curl -X POST https://your-n8n-domain.com/webhook/calendly-booking \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invitee.created",
    "payload": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }'
```

**Expected result:**
- n8n execution shows in executions list
- Webhook node displays the received data
- You see: `{"event": "invitee.created", "payload": {...}}`

---

#### Step 3: Add data transformation node

**Action:**
1. Click "+ Add node" after webhook node
2. Search for "Code"
3. Select "Code" node
4. Paste this code:

```javascript
// Extract data from Calendly webhook
const email = $input.item.json.payload.email;
const name = $input.item.json.payload.name;

// Transform to HubSpot format
return [{
  json: {
    properties: {
      email: email,
      firstname: name.split(' ')[0],
      lastname: name.split(' ')[1] || ''
    }
  }
}];
```

**Expected result:**
- Code node created and connected to webhook node
- When you run workflow with test data, code node outputs:
```json
{
  "properties": {
    "email": "test@example.com",
    "firstname": "Test",
    "lastname": "User"
  }
}
```

---

#### Step 4: Create HubSpot API credentials

**Action:**
1. In n8n, go to Settings → Credentials
2. Click "+ New credential"
3. Search for "HubSpot API"
4. Fill in:
   - Credential name: `HubSpot-Client-X`
   - API Key: [paste client's HubSpot API key]
5. Click "Test" to verify connection
6. Click "Save"

**Expected result:**
- Credential saved successfully
- Test shows "Connection successful"
- Credential appears in credentials list

---

#### Step 5: Add HubSpot node

**Action:**
1. Click "+ Add node" after Code node
2. Search for "HubSpot"
3. Select "HubSpot" node
4. Configure:
   - Credential: Select "HubSpot-Client-X"
   - Resource: Contact
   - Operation: Create or Update
   - Email: `{{$json.properties.email}}`
   - Additional Fields → Add: firstname, lastname
   - Map fields from previous node output

**Expected result:**
- HubSpot node created and connected
- Node shows "Ready to execute"
- When you click "Execute node", it creates/updates contact in HubSpot

---

#### Step 6: Test end-to-end workflow

**Action:**
1. Activate workflow (toggle switch at top)
2. Send test webhook again with curl command from Step 2
3. Check n8n execution
4. Check HubSpot to verify contact was created

**Expected result:**
- Execution shows all 3 nodes succeeded (green checkmarks)
- HubSpot contact created with:
  - Email: test@example.com
  - First name: Test
  - Last name: User
- No errors in execution log

---

#### Step 7: Document workflow

**Action:**
Create file: `docs/clients/Client-X-Calendly-HubSpot.md`

```markdown
# Client X - Calendly to HubSpot Integration

**Workflow:** Calendly-HubSpot-Sync
**Status:** Active
**Created:** 2024-12-25

## What it does
When someone books a meeting via Calendly, automatically creates/updates their contact in HubSpot.

## Webhook URL
https://your-n8n-domain.com/webhook/calendly-booking

## Credentials used
- HubSpot-Client-X (API key)

## Monitoring
Check n8n executions daily for any failures.

## Troubleshooting
If webhook stops working:
1. Check Calendly webhook is still active
2. Verify HubSpot API key hasn't expired
3. Check n8n execution logs for error details
```

**Expected result:**
- Documentation file created
- Easy for you to reference later
- Easy to hand off to client if needed

---
```

## Remember - Critical Rules

**1. Exact instructions always:**
- ❌ "Configure the node"
- ✅ "In HTTP Method dropdown, select POST"

**2. Expected results after EVERY step:**
- Thomas needs to know if he did it right
- Include exact text/data he should see
- Include screenshots path if complex UI

**3. Complete values (not placeholders when possible):**
- ❌ "Add your API key here"
- ✅ "API Key: [paste from client's HubSpot settings → Integrations → API Key]"

**4. Commands with expected output:**
```bash
# Run this:
curl -X POST https://...

# You should see:
{"status": "success", "data": {...}}
```

**5. Reference AWS/terminal context:**
- Thomas connects to AWS EC2 via PuTTY as "ec2-user" (not ubuntu)
- Include full paths for files
- Specify which terminal (local vs SSH)

## Task Categories Examples

### n8n Workflow Tasks
```markdown
### Task 1: Create Lead Scoring Workflow

**Step 1:** Create workflow
**Step 2:** Add webhook trigger
**Step 3:** Add scoring logic in Code node
**Step 4:** Connect to database
**Step 5:** Test with sample data
**Step 6:** Activate and document
```

### AWS/Docker Tasks
```markdown
### Task 2: Deploy New n8n Instance for Client

**Step 1:** SSH into EC2
**Step 2:** Create Docker Compose file
**Step 3:** Start containers
**Step 4:** Verify n8n is accessible
**Step 5:** Set up backup cron job
**Step 6:** Document access details
```

### API Integration Tasks
```markdown
### Task 3: Integrate Notion API

**Step 1:** Create Notion integration in workspace
**Step 2:** Get API token
**Step 3:** Store credentials in n8n
**Step 4:** Create test HTTP Request node
**Step 5:** Verify API connection
**Step 6:** Build data transformation logic
```

## Testing Strategy

**Every task must include testing steps:**

1. **Unit test** (test single node):
   - Run node manually with test data
   - Verify output matches expected

2. **Integration test** (test workflow end-to-end):
   - Trigger workflow with real-world data
   - Verify all nodes execute successfully
   - Check final destination (CRM, database, etc.)

3. **Error handling test** (test failure scenarios):
   - Send invalid data
   - Verify error is caught and logged
   - Verify client receives error notification if configured

## Real-World Kames Examples

### Example 1: Calendly → HubSpot Integration

**Bad plan:**
```markdown
### Task 1: Set up integration
- Create workflow
- Configure Calendly webhook
- Add HubSpot nodes
- Test it
```
❌ Too vague, no exact instructions, Thomas doesn't know WHAT to configure

**Good plan:**
```markdown
### Task 1: Calendly Webhook Reception

#### Step 1: Create webhook node in n8n
1. Open n8n at https://your-n8n-instance.com
2. Click "Workflows" → "+ New workflow"
3. Name it: "Calendly-HubSpot-ClientX"
4. Click "+ Add node" → Search "Webhook" → Select it
5. Configure:
   - HTTP Method: POST
   - Path: calendly-clientx
   - Authentication: None
6. Copy webhook URL (shows at top of node settings)

**Expected result:** URL like `https://your-n8n-instance.com/webhook/calendly-clientx`

#### Step 2: Configure Calendly webhook
1. Log into client's Calendly account
2. Go to Integrations → Webhooks → Add webhook
3. Paste URL from Step 1
4. Select events: "Invitee Created"
5. Click "Save"

**Expected result:** Webhook appears in Calendly webhooks list as "Active"

[...continues with more bite-sized steps]
```
✅ Exact instructions, expected results, no ambiguity

### Example 2: Database Backup Automation

**Bad plan:**
```markdown
### Task 1: Set up backups
- Create backup script
- Add to cron
- Test it
```
❌ Thomas doesn't know what script to create or how to add to cron

**Good plan:**
```markdown
### Task 1: PostgreSQL Backup Script

#### Step 1: Create backup directory
**Terminal:** SSH into EC2 with PuTTY as ec2-user

```bash
mkdir -p /home/ec2-user/backups/postgres
ls -la /home/ec2-user/backups/
```

**Expected result:** You see `postgres/` directory listed

#### Step 2: Create backup script
```bash
nano /home/ec2-user/backup-db.sh
```

Paste this content:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H%M)
docker exec n8n-postgres pg_dump -U postgres n8n > /home/ec2-user/backups/postgres/n8n-$DATE.sql
find /home/ec2-user/backups/postgres/ -name "*.sql" -mtime +7 -delete
echo "Backup completed: n8n-$DATE.sql"
```

Press Ctrl+X, then Y, then Enter to save.

**Expected result:** File created at `/home/ec2-user/backup-db.sh`

#### Step 3: Make script executable
```bash
chmod +x /home/ec2-user/backup-db.sh
ls -la /home/ec2-user/backup-db.sh
```

**Expected result:** You see `-rwxr-xr-x` (x means executable)

#### Step 4: Test script manually
```bash
/home/ec2-user/backup-db.sh
ls -la /home/ec2-user/backups/postgres/
```

**Expected result:** 
- You see "Backup completed: n8n-2024-12-25-1430.sql"
- File exists in backups/postgres/ directory

[...continues with cron setup steps]
```
✅ Exact commands, expected outputs, Thomas can follow blindly

## Execution Options

After saving the plan, present these options:

**"Plan complete and saved to `docs/plans/<filename>.md`.**

**Execution approach:**

**Option 1: Step-by-step with validation (RECOMMENDED for Thomas)**
- I guide you through each step
- You execute and report results
- I verify before moving to next step
- Best for learning + avoiding mistakes

**Option 2: Batch execution**
- You execute multiple steps at once
- Report back when stuck or done
- Faster but higher risk of mistakes

**Which approach?"**

## Integration with Other Skills

**Reference related skills when relevant:**

```markdown
**Related skills:**
- If debugging needed: Use @systematic-debugging skill
- If writing tests: Use @test-driven-development skill
- If building complex workflow: Break into multiple plans

**Before starting this plan:**
- [ ] Review @systematic-debugging to understand error handling approach
- [ ] Have @test-driven-development skill ready for workflow testing
```

## File Naming Convention

```
docs/plans/YYYY-MM-DD-<descriptive-name>.md

Examples:
- docs/plans/2024-12-25-calendly-hubspot-integration.md
- docs/plans/2024-12-26-email-lead-scoring-workflow.md
- docs/plans/2024-12-27-new-client-n8n-instance-setup.md
```

## Remember - Thomas Context

**Thomas needs:**
1. Exact file paths (not relative, absolute)
2. Expected results after each step (so he knows it worked)
3. Error handling instructions (what if it fails?)
4. Terminal context (PuTTY SSH vs local terminal)
5. No assumptions about technical knowledge

**Thomas doesn't need:**
1. Lengthy explanations of WHY (focus on WHAT and HOW)
2. Multiple ways to do something (give him THE way)
3. Advanced concepts (keep it simple)
4. Theoretical background (he wants to execute)

**This is a success if:**
- Thomas can follow the plan without asking clarifying questions
- Each step takes 2-5 minutes max
- He knows immediately if he did it right (expected results)
- The final implementation works as specified

## Quality Checklist

Before saving the plan, verify:

- [ ] Every step has expected result
- [ ] All file paths are absolute and exact
- [ ] All commands are copy-paste ready
- [ ] All credentials/API keys are documented
- [ ] Testing steps included for each task
- [ ] Error handling documented
- [ ] Client/project context clear
- [ ] Prerequisites listed upfront
- [ ] No ambiguous instructions ("configure", "set up", etc.)
- [ ] Thomas could follow this 6 months from now with zero context
