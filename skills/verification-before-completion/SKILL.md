---
name: verification-before-completion
description: Use when you are about to say done, finished, ready to merge, or "you can test" for Flinty; when dashboard TypeScript, API routes, or Sheets integration changed; requires fresh npm run test (or explicit N/A) before success claims
---

# Verification Before Completion (Kames AI Edition)

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**For Thomas:** If I say "it works" without having tested it myself, I'm lying to you. This skill prevents that.

**Violating the letter of this rule is violating the spirit of this rule.**

## Gotchas (Flinty)

- Le hook Stop du repo peut **relancer une fois** si la réponse finale sonne « livré » sans mention de `npm run test` ni exemption ; inclure une phrase du type : « Tests : `npm run test` — OK (résumé) » ou « Pas de tests TS pour ce changement (raison) ».
- **Docs / config seulement** : indiquer clairement N/A pour Vitest pour éviter faux positifs.
- **n8n** : la preuve = exécution + inspection sorties nœuds, pas l’icône verte seule.
- Référence : [`references/flinty-dashboard.md`](references/flinty-dashboard.md).

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command/test proves this claim?
2. RUN: Execute the FULL verification (fresh, complete)
3. READ: Full output, check response codes, count errors
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Kames Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Workflow works | Execute workflow, check all nodes succeed | Code looks right, "should work" |
| Webhook triggers | Send test webhook, verify n8n execution | Webhook URL created, assumed working |
| API integration works | Call API, verify 200 response + correct data | Credentials added, "probably works" |
| Database insert succeeds | Query database, see new record | INSERT query written, no error shown |
| Email sends | Check sent folder or email logs | SMTP configured, "should send" |
| Docker container running | `docker ps`, see container RUNNING | `docker-compose up` ran without error |
| AWS deployment complete | SSH + verify service accessible | CloudFormation says "CREATE_COMPLETE" |
| Client automation ready | Execute full workflow with real data | All nodes created and connected |

## Red Flags - STOP

**BEFORE saying any of these phrases, you MUST verify:**

- "Perfect!" / "Great!" / "Done!" / "All set!"
- "Should work now" / "Probably fixed"
- "Workflow is ready" / "Integration complete"
- "Deployed successfully"
- "Everything looks good"
- "The automation is working"
- About to tell Thomas "you can test it"
- About to activate workflow in production
- Trusting n8n success icon without checking output data
- Thinking "just this once I'll skip verification"
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "n8n shows green checkmarks" | Check the actual OUTPUT data |
| "I'm confident this is right" | Confidence ≠ evidence |
| "Just this once I'll skip" | No exceptions |
| "Manual test takes too long" | Do it anyway or don't claim success |
| "Thomas will test it later" | Then don't claim it works NOW |
| "I'm tired" | Exhaustion ≠ excuse |
| "Webhook URL exists so must work" | URL existing ≠ workflow executing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Kames Patterns

### Workflow Verification

```
✅ CORRECT:
[Execute workflow in n8n]
[Check execution log shows:]
  - Webhook node: ✓ Data received
  - Code node: ✓ Transformed data
  - API node: ✓ 200 response
[Verify final destination (database/CRM) has new record]
"Workflow verified: all nodes executed successfully, contact created in HubSpot with ID 12345"

❌ WRONG:
"Workflow should work now, all nodes are connected and green"
"Everything looks good, you can activate it"
```

### Webhook Verification

```
✅ CORRECT:
[Run curl command:]
curl -X POST https://n8n.kamesai.com/webhook/test -d '{"test":"data"}'

[Check n8n execution:]
- Execution ID: abc123
- Status: Success
- Webhook received: {"test":"data"}
- Output: {"processed":true}

"Webhook verified: curl request triggered execution abc123, workflow processed data correctly"

❌ WRONG:
"Webhook is set up, should work when client sends data"
"URL is correct, ready to use"
```

### API Integration Verification

```
✅ CORRECT:
[Execute HTTP Request node in n8n]
[Check response:]
- Status: 200
- Body: {"id": 123, "status": "created"}
[Check API dashboard to confirm record created]

"API integration verified: POST request succeeded (200), contact ID 123 created in HubSpot, visible in dashboard"

❌ WRONG:
"API credentials are configured, integration should work"
"No errors in node settings, looks good"
```

### Database Verification

```
✅ CORRECT:
[Execute INSERT workflow]
[SSH to EC2 and query database:]
docker exec n8n-postgres psql -U postgres -d n8n -c "SELECT * FROM contacts WHERE email='test@example.com';"

[Output shows:]
 id |      email         |   created_at
----+-------------------+--------------
 42 | test@example.com  | 2024-12-25...

"Database insertion verified: query returns record ID 42 with correct email"

❌ WRONG:
"INSERT node executed without errors, should be in database"
"Postgres node shows success icon"
```

### Docker/AWS Verification

```
✅ CORRECT:
[Run docker ps command:]
docker ps --filter "name=n8n"

[Output shows:]
CONTAINER ID   STATUS          PORTS                    NAMES
abc123def456   Up 2 minutes    0.0.0.0:5678->5678/tcp   n8n-app

[Test n8n access:]
curl -I https://n8n.kamesai.com

[Output shows:]
HTTP/2 200

"Docker container verified: n8n-app running for 2 minutes, accessible at https://n8n.kamesai.com (200 response)"

❌ WRONG:
"Docker Compose started without errors, should be running"
"Container is up, ready to use"
```

### Email/SMS Verification

```
✅ CORRECT:
[Execute email workflow]
[Check n8n execution log:]
- Email node: Success
- SMTP response: 250 Message accepted

[Check actual email:]
- Log into client@gmail.com
- See email in Sent folder
- Subject: "Test from n8n"
- Body matches template

"Email verified: SMTP accepted message (250), email visible in Sent folder with correct content"

❌ WRONG:
"Email node succeeded, email should have sent"
"No SMTP errors, looks good"
```

## Real-World Kames Examples

### Example 1: Calendly Webhook Integration

**❌ What I used to do (WRONG):**
```
Claude: "I've configured the webhook in Calendly and created the n8n workflow. 
The integration should work now! You can activate it and tell the client it's ready."

Thomas: *activates workflow*
Thomas: *client books meeting*
Thomas: "Claude, nothing happened in n8n..."
Claude: "Oh... let me check..."
[Finds: Calendly webhook pointing to wrong URL]
```

**✅ What this skill forces me to do (CORRECT):**
```
Claude: "Let me verify the integration before claiming it's ready."

[Step 1: Test webhook]
curl -X POST https://n8n.kamesai.com/webhook/calendly-test \
  -H "Content-Type: application/json" \
  -d '{"event":"invitee.created","payload":{"email":"test@test.com"}}'

[Step 2: Check n8n execution]
Execution ID: abc-123-def
Status: Success
Nodes executed: 3/3
Output: {"hubspot_id": "12345"}

[Step 3: Verify HubSpot]
Contact "test@test.com" created in HubSpot with ID 12345

Claude: "Integration verified: 
- Webhook received test data ✓
- Workflow executed successfully (3/3 nodes) ✓  
- HubSpot contact created (ID 12345) ✓
Ready to activate for client."
```

### Example 2: Database Backup Script

**❌ What I used to do (WRONG):**
```
Claude: "Perfect! I've created the backup script and added it to cron. 
Your database is now being backed up daily."

Thomas: *1 week later checks backups folder*
Thomas: "Claude, there are no backup files..."
Claude: "Let me check the script..."
[Finds: Script has typo in Docker container name]
```

**✅ What this skill forces me to do (CORRECT):**
```
Claude: "Let me verify the backup script works before claiming it's set up."

[Step 1: Run script manually]
/home/ec2-user/backup-db.sh

[Output:]
Backup completed: n8n-2024-12-25-1430.sql

[Step 2: Verify file exists]
ls -lh /home/ec2-user/backups/postgres/
-rw-r--r-- 1 ec2-user ec2-user 2.3M Dec 25 14:30 n8n-2024-12-25-1430.sql

[Step 3: Test restore]
docker exec n8n-postgres psql -U postgres -d test_restore < /home/ec2-user/backups/postgres/n8n-2024-12-25-1430.sql

[Output:]
SET
SET
CREATE TABLE
[... restore successful ...]

Claude: "Backup verified:
- Script executed successfully ✓
- Backup file created (2.3MB) ✓
- Restore test passed ✓
Safe to add to cron for automated backups."
```

### Example 3: n8n Workflow for Lead Scoring

**❌ What I used to do (WRONG):**
```
Claude: "Great! The lead scoring workflow is complete. All nodes are configured and 
connected. The scoring logic looks correct. Ready to use!"

Thomas: *sends test lead*
Thomas: "Claude, the score shows as 'undefined' in the output..."
Claude: "Oh, I see the issue..."
[Finds: Code node referencing wrong variable name]
```

**✅ What this skill forces me to do (CORRECT):**
```
Claude: "Let me verify the scoring workflow with test data."

[Step 1: Execute workflow with test data]
Test lead: {
  "email": "test@startup.com",
  "company_size": "50",
  "industry": "SaaS"
}

[Step 2: Check each node output]
- Webhook node output: ✓ Data received
- Code node (scoring logic) output: {"score": 85, "tier": "hot"}
- Database node: ✓ Inserted
- Slack node: ✓ Message sent

[Step 3: Verify Slack message]
[Screenshot of Slack message showing "🔥 Hot lead: test@startup.com (Score: 85)"]

[Step 4: Verify database]
SELECT * FROM leads WHERE email='test@startup.com';
email            | score | tier
-----------------+-------+------
test@startup.com |    85 | hot

Claude: "Lead scoring workflow verified:
- Test lead processed successfully ✓
- Score calculated correctly (85) ✓
- Tier assigned correctly (hot) ✓
- Slack notification sent ✓
- Database record created ✓
Ready for production use."
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction ("Perfect!", "Great!", etc.)
- ANY positive statement about work state
- Activating workflow in production
- Moving to next task
- Telling Thomas "you can test it now"
- Telling client "it's ready"

**Rule applies to:**
- Exact phrases like "it works"
- Paraphrases like "should be good now"
- Implications like "ready to activate"
- ANY communication suggesting completion/correctness

## The Verification Checklist

Before claiming ANYTHING works:

```markdown
## Verification Checklist

**What I'm claiming:** [e.g., "Calendly to HubSpot integration works"]

**Verification steps:**
1. [ ] Identified what command/test proves this claim
2. [ ] Executed the FULL verification (not partial)
3. [ ] Read complete output (not just "success" icon)
4. [ ] Confirmed output matches expected result
5. [ ] Checked final destination (database/CRM/email/etc.)
6. [ ] Verified no errors in logs
7. [ ] Tested error case (invalid data still handled correctly)

**Evidence:**
- [Paste command executed]
- [Paste output received]
- [Paste confirmation from final destination]

**Conclusion:**
✅ Verified working: [specific evidence]
OR
❌ Not working: [specific failure + evidence]
```

## Thomas's Signals I Violated This Rule

**Watch for these from Thomas:**
- "Claude, you said it worked but it doesn't"
- "Did you actually test this?"
- "Are you sure? Can you verify?"
- "I don't believe you" (trust broken - very bad)
- Silent frustration (tests it himself and finds it broken)

**When you see these:** You failed verification-before-completion. Apologize and verify properly.

## Subagent Verification (v5.0+)

Quand un subagent reporte un statut, la vérification s'applique **au parent** avant de propager le résultat.

| Statut subagent | Action parent | Vérification requise |
|----------------|---------------|----------------------|
| `DONE` | Passer en spec compliance review | Oui — relire output + preuves |
| `DONE_WITH_CONCERNS` | Traiter les concerns d'abord | Oui — ne pas ignorer les concerns |
| `NEEDS_CONTEXT` | Fournir le contexte manquant, re-dispatcher | N/A jusqu'au prochain `DONE` |
| `BLOCKED` | Identifier type de blocage (contexte / modèle / tâche trop large / escalade Thomas) | N/A jusqu'à déblocage |

**Règle clé :** `DONE` d'un subagent ≠ vérifié. Le parent DOIT lire les preuves et confirmer avant de marquer la tâche TASK-v4-XXX en `✅`.

### n8n — Vérification post-subagent

```
Subagent reporte DONE sur workflow n8n :
1. Lire son output : quels nodes ont exécuté ? quelle data de sortie ?
2. Vérifier exécution réelle via MCP n8n (pas juste icône verte)
3. Confirmer résultat final (Sheets mis à jour / email envoyé / setter déclenché)
ONLY THEN : accepter le DONE
```

## Special Cases

### When Thomas Asks "Does this work?"

```
❌ WRONG:
"Yes, it should work!" (without verifying)

✅ CORRECT:
"Let me verify..." [runs test] "Yes, verified working: [evidence]"
OR
"I haven't verified yet. Let me test it now..."
```

### When n8n Shows Green Checkmarks

```
❌ WRONG:
"All nodes succeeded, workflow works!"

✅ CORRECT:
[Check actual output data of each node]
[Verify final destination has correct result]
"Workflow verified: nodes executed AND output data is correct AND final result matches expected"
```

### When Delegating to Thomas

```
❌ WRONG:
"I've set everything up. You can run this command to finish."

✅ CORRECT:
"I've set everything up. Before you run the command, I'll verify my setup works..."
[Runs verification]
"Setup verified: [evidence]. Now you can run the command."
```

## The Bottom Line

**No shortcuts for verification.**

**For Thomas specifically:**
- You're not a developer, so you trust my claims
- If I say "it works" and it doesn't, you waste time debugging
- If I say "it works" and it does, you gain confidence in me
- Verification protects our working relationship

**For me specifically:**
- Claiming without verifying = lying
- Lying = broken trust
- Broken trust = Thomas finds another solution
- This skill prevents that

Run the test. Read the output. THEN claim the result.

**This is non-negotiable.**

## Quick Reference

| Situation | Verification Required | Evidence Needed |
|-----------|----------------------|-----------------|
| Workflow complete | Execute with test data | All nodes green + correct output data + final destination updated |
| Webhook works | Send test webhook | n8n execution created + data received + workflow processed |
| API integration | Call API endpoint | 200 response + correct data + destination updated |
| Database insert | Query database | Record exists with correct data |
| Docker running | docker ps + curl | Container UP + service accessible |
| Email/SMS sent | Check logs/inbox | SMTP accepted + message in sent folder/logs |
| AWS deployed | SSH + service check | Service running + accessible + responding |
| Client ready | Full end-to-end test | Real-world scenario works start to finish |

**Remember:**
- "Should work" = not verified = lying
- "Looks good" = not verified = lying
- "Probably fine" = not verified = lying
- "All set" = not verified = lying

**Only acceptable:**
- "Verified working: [evidence]"
- "Not working: [evidence of failure]"
- "Haven't verified yet, testing now..."
