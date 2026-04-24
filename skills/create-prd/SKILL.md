---
name: create-prd
description: Create a lean Product Requirements Document through interactive discovery conversation
---

<objective>
Create a focused Product Requirements Document (PRD) for an MVP through iterative conversation.

Guide the user through defining product vision, user personas, core features, and success metrics. Keep the PRD minimal and focused on essential features that solve real problems. This is the FOUNDATION - the PRD comes FIRST, then ARCHI, then implementation.
</objective>

<process>
## Phase 1: Information Discovery

1. **Do NOT write anything until you have answers to ALL 5 areas below**

Ask questions progressively (2-3 at a time, not all at once) until you have complete clarity:

### Area 1: Problem & Vision
- What problem does this product solve?
- Who experiences this problem most acutely?
- What makes this solution unique or different?
- What does success look like?

### Area 2: Target Users
- Who are the primary users? (1-3 personas max)
- What are their key characteristics? (role, context, pain points)
- What motivates them to use this product?
- What would make them stop using it?

### Area 3: Core Features
- What is the ONE thing this product must do? (critical feature)
- What 2-3 features support that core capability?
- What features are nice-to-have but not critical for MVP?
- How will users accomplish their primary goal?

### Area 4: Success Metrics
- How will you measure if the product is successful?
- What are the key metrics to track? (engagement, conversion, retention)
- What does "good" look like for each metric?
- What's the timeline for achieving these metrics?

### Area 5: Constraints & Context
- What's the timeline for MVP launch?
- What technical constraints exist? (platform, integrations, tech stack)
- What's the budget/resource situation?
- Are there any regulatory or compliance requirements?
- What existing solutions are users currently using?

## Phase 2: Validate Understanding

2. **Before writing the PRD**, summarize your understanding back to the user:
   - "Here's what I understand about your product..."
   - List the problem, users, core features, and success metrics
   - Ask: "Is this accurate? Anything to add or correct?"

3. **Iterate until the user confirms** your understanding is correct.

## Phase 3: Write the PRD

4. **Only after confirmation**, generate the PRD using the output format below.

5. **Keep it lean**:
   - No fluff or corporate speak
   - Every section must be actionable
   - If something doesn't help build the product, remove it
   - Maximum 2-3 pages when printed

## Phase 4: Review & Refine

6. **After presenting the PRD**, ask:
   - "Does this capture your vision accurately?"
   - "Are the user stories clear enough for development?"
   - "Should we adjust scope or priorities?"

7. **Iterate on specific sections** as needed without rewriting the entire document.
</process>

<output_format>
# Product Requirements Document: [Product Name]

## 1. Overview

### Problem Statement
[2-3 sentences describing the core problem]

### Product Vision
[One sentence describing what success looks like]

### Target Launch Date
[Date or timeframe]

---

## 2. Target Users

### Primary Persona: [Name]
- **Role**: [Job title or description]
- **Context**: [When/where they encounter the problem]
- **Pain Points**: [Top 3 frustrations with current solutions]
- **Goals**: [What they're trying to accomplish]

### Secondary Persona: [Name] (if applicable)
- **Role**: [Job title or description]
- **Context**: [When/where they encounter the problem]
- **Pain Points**: [Top 3 frustrations]
- **Goals**: [What they're trying to accomplish]

---

## 3. Core Features (MVP Scope)

### Feature 1: [Critical Feature Name]
**Priority**: P0 (Must Have)

**Description**: [What it does in one sentence]

**User Stories**:
- As a [user], I want to [action] so that [benefit]
- As a [user], I want to [action] so that [benefit]

**Acceptance Criteria**:
- [ ] [Specific, testable requirement]
- [ ] [Specific, testable requirement]
- [ ] [Specific, testable requirement]

### Feature 2: [Supporting Feature Name]
**Priority**: P0 (Must Have)

**Description**: [What it does in one sentence]

**User Stories**:
- As a [user], I want to [action] so that [benefit]

**Acceptance Criteria**:
- [ ] [Specific, testable requirement]
- [ ] [Specific, testable requirement]

### Feature 3: [Supporting Feature Name]
**Priority**: P1 (Should Have)

**Description**: [What it does in one sentence]

**User Stories**:
- As a [user], I want to [action] so that [benefit]

**Acceptance Criteria**:
- [ ] [Specific, testable requirement]
- [ ] [Specific, testable requirement]

---

## 4. Out of Scope (v1)

Features explicitly NOT included in MVP:
- [Feature] - Reason: [Why it's deferred]
- [Feature] - Reason: [Why it's deferred]
- [Feature] - Reason: [Why it's deferred]

---

## 5. Success Metrics

| Metric | Target | Timeframe | How to Measure |
|--------|--------|-----------|----------------|
| [Metric 1] | [Target value] | [By when] | [Tool/method] |
| [Metric 2] | [Target value] | [By when] | [Tool/method] |
| [Metric 3] | [Target value] | [By when] | [Tool/method] |

---

## 6. Technical Constraints

- **Platform**: [Web, mobile, desktop, etc.]
- **Tech Stack**: [If predetermined]
- **Integrations Required**: [List any must-have integrations]
- **Performance Requirements**: [Load time, concurrent users, etc.]
- **Security/Compliance**: [Any specific requirements]

---

## 7. Open Questions

- [ ] [Unresolved question that needs answer before development]
- [ ] [Unresolved question that needs answer before development]

---

## 8. Appendix

### User Flow: [Primary Action]
```
[Step 1] → [Step 2] → [Step 3] → [Success State]
```

### Competitive Reference
- [Competitor 1]: [What to learn from them]
- [Competitor 2]: [What to learn from them]
</output_format>

<rules>
- NEVER write the PRD until you have answers to all 5 areas
- Ask questions conversationally, not like a form
- Keep the PRD to essential information only - if it doesn't help build the product, cut it
- User stories must follow the format: "As a [user], I want to [action] so that [benefit]"
- Acceptance criteria must be specific and testable (not vague like "works well")
- Limit MVP to 3-5 core features maximum
- Always include an "Out of Scope" section to set clear boundaries
- Prioritize features using P0 (must have), P1 (should have), P2 (nice to have)
- Success metrics must be measurable with specific targets
- Flag open questions rather than making assumptions
- The PRD is a living document - encourage iteration
- Write for developers and stakeholders, not investors
- Avoid jargon and buzzwords - be specific and concrete
</rules>

<examples>
**Good Problem Statement:**
"Small business owners spend 5+ hours per week manually creating social media content. They lack design skills and can't afford to hire a designer, resulting in inconsistent branding and low engagement."

**Bad Problem Statement:**
"People need better social media tools."

**Good User Story:**
"As a small business owner, I want to generate a week's worth of branded social posts in under 10 minutes so that I can focus on running my business instead of creating content."

**Bad User Story:**
"As a user, I want to create content easily."

**Good Acceptance Criteria:**
- [ ] User can upload brand colors and logo
- [ ] System generates 7 unique post designs
- [ ] Generation completes in under 60 seconds
- [ ] Posts are downloadable as PNG and JPG

**Bad Acceptance Criteria:**
- [ ] Content generation works
- [ ] Users like the designs
</examples>

<transition>
Once the PRD is approved by the user, inform them:
"Your PRD is complete. The next step is to create the technical architecture document. This will translate these requirements into a technical blueprint. Would you like to proceed with architecture planning?"
</transition>
