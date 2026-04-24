---
name: create-tasks
description: Generate implementation task files from PRD and Architecture documents
---

<objective>
Generate a structured set of implementation task files from existing PRD and Architecture documents.

Create well-scoped, coherent tasks that an AI agent can execute autonomously. Each task represents 1-3 hours of focused work with clear deliverables and success criteria. This comes AFTER PRD and ARCHI - both must exist first.
</objective>

<context>
Current project: !`ls -la`
Existing specs folder: !`ls specs/ 2>/dev/null || echo "No specs folder"`
Package.json: !`cat package.json 2>/dev/null | head -20 || echo "No package.json"`
</context>

<process>
## Phase 1: Understanding

1. **Ask for project location**:
   > "Where is your project located? Are you starting from scratch or using a boilerplate?"

2. **Explore existing codebase**:
   - Read `package.json` for dependencies
   - Check folder structure (`app/`, `src/`, `components/`)
   - Identify what's already implemented

3. **Document current state**:
   - ✅ Already implemented: [list]
   - 🚧 Partially implemented: [list]
   - ❌ Not yet built: [list]

4. **Ask for PRD location**, then read completely:
   - Extract all features
   - Note user flows
   - Identify acceptance criteria
   - List all user stories

5. **Ask for ARCHI location**, then read completely:
   - Note tech stack decisions
   - Understand data models
   - Review API design
   - Check integration requirements

## Phase 2: Task Decomposition

6. **Group features into logical domains**:
   - Authentication & Users
   - Core Feature 1
   - Core Feature 2
   - Payments & Billing
   - Admin & Settings
   - Infrastructure & DevOps

7. **For each domain, identify atomic tasks**:
   - Each task = ONE focused piece of work
   - Task should be completable in 1-3 hours
   - Task should have clear start and end state
   - Task should be independently testable

8. **Determine task dependencies**:
   - Which tasks must come first? (blockers)
   - Which tasks can be parallelized?
   - Create a dependency graph

9. **Prioritize tasks**:
   - P0: Blocks everything else (auth, database setup)
   - P1: Core MVP features
   - P2: Important but not critical
   - P3: Nice to have, can defer

## Phase 3: Task Specification

10. **For each task, define**:
    - Clear title (action-oriented)
    - Context (why this task exists)
    - Detailed requirements
    - Technical approach (from ARCHI)
    - Acceptance criteria (from PRD)
    - Dependencies (other tasks)
    - Estimated complexity

11. **Include implementation hints**:
    - Relevant code patterns
    - Libraries to use
    - Files to create/modify
    - Edge cases to handle

12. **Define verification steps**:
    - How to test the implementation
    - What "done" looks like
    - Manual verification steps
    - Automated test requirements

## Phase 4: Output Generation

13. **Create individual task files**:
    - One file per task
    - Numbered for execution order
    - Stored in `tasks/` folder

14. **Create master task list**:
    - Overview of all tasks
    - Dependency visualization
    - Progress tracking template

15. **Generate execution plan**:
    - Recommended order
    - Parallel execution opportunities
    - Milestone checkpoints
</process>

<output_format>
## Master Task List (tasks/TASKS.md)

# Implementation Tasks: [Product Name]

## Overview
- **Total Tasks**: [X]
- **Estimated Total Time**: [X-Y hours]
- **Generated From**: PRD v[X], ARCHI v[X]
- **Generated On**: [Date]

## Progress Tracker

| # | Task | Priority | Status | Dependencies | Est. Time |
|---|------|----------|--------|--------------|-----------|
| 001 | [Task Title] | P0 | ⬜ Todo | None | 2h |
| 002 | [Task Title] | P0 | ⬜ Todo | 001 | 1.5h |
| 003 | [Task Title] | P1 | ⬜ Todo | 001, 002 | 3h |

Status Legend: ⬜ Todo | 🔄 In Progress | ✅ Done | ⏸️ Blocked

## Dependency Graph

```
[001: Setup] ─┬─► [002: Auth] ─┬─► [004: Feature A]
              │                │
              └─► [003: DB] ───┴─► [005: Feature B]
```

## Milestones

### Milestone 1: Foundation (Tasks 001-003)
- [ ] Project setup complete
- [ ] Database connected
- [ ] Auth working

### Milestone 2: Core MVP (Tasks 004-008)
- [ ] Main feature functional
- [ ] User can complete primary flow

### Milestone 3: Polish & Launch (Tasks 009-012)
- [ ] Payments integrated
- [ ] Ready for first users

---

## Individual Task File Format (tasks/001-task-name.md)

# Task 001: [Action-Oriented Title]

## Context
[2-3 sentences explaining WHY this task exists and how it fits into the bigger picture]

**References**:
- PRD Section: [Section name/link]
- ARCHI Section: [Section name/link]

## Objective
[One clear sentence: what will be TRUE after this task is complete that isn't true now]

## Requirements

### Must Have
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]
- [ ] [Specific requirement 3]

### Should Have
- [ ] [Nice to have but not blocking]

### Must NOT
- [ ] [Explicit out of scope items to prevent scope creep]

## Technical Approach

### Files to Create
```
src/
├── [new-file-1.ts]      # [Purpose]
├── [new-file-2.ts]      # [Purpose]
└── components/
    └── [NewComponent.tsx]  # [Purpose]
```

### Files to Modify
- `[existing-file.ts]`: [What changes]
- `[another-file.ts]`: [What changes]

### Implementation Steps
1. [First step with details]
2. [Second step with details]
3. [Third step with details]

### Code Patterns to Follow
```typescript
// Example of expected code pattern
[Relevant code snippet or pattern]
```

### Libraries/Dependencies
- `[library-name]`: [Why needed, how to install]

## Acceptance Criteria

From PRD:
- [ ] [User story or acceptance criteria 1]
- [ ] [User story or acceptance criteria 2]

Technical:
- [ ] [Technical requirement 1]
- [ ] [Technical requirement 2]

## Verification

### Manual Testing
1. [Step to verify manually]
2. [Step to verify manually]
3. [Expected result]

### Automated Testing
```typescript
// Test cases to implement
describe('[Feature]', () => {
  it('should [expected behavior]', () => {
    // Test implementation hint
  });
});
```

## Dependencies

### Blocked By
- [ ] Task [XXX]: [Title] - [Why it's a blocker]

### Blocks
- Task [XXX]: [Title] - [Why this task blocks it]

## Complexity & Estimates

- **Complexity**: [Low / Medium / High]
- **Estimated Time**: [X hours]
- **Risk Level**: [Low / Medium / High]
- **Risk Factors**: [What could go wrong]

## Notes

[Any additional context, gotchas, or tips for the implementer]

---

**Status**: ⬜ Todo
**Assigned**: [Unassigned]
**Started**: [Date]
**Completed**: [Date]
</output_format>

<task_templates>
## Common Task Types

### Setup Task Template
```markdown
# Task 00X: Project Setup - [Specific Setup]

## Context
Initial project configuration required before feature development can begin.

## Requirements
- [ ] Initialize [framework/tool]
- [ ] Configure [configuration files]
- [ ] Verify [setup working]

## Verification
- [ ] `npm run dev` starts without errors
- [ ] [Tool] accessible at [URL/location]
```

### Database Task Template
```markdown
# Task 00X: Database - [Entity/Migration]

## Context
Data model implementation based on ARCHI schema design.

## Requirements
- [ ] Create Prisma schema for [Entity]
- [ ] Run migration
- [ ] Create seed data (if applicable)

## Technical Approach
### Schema
\`\`\`prisma
model [Entity] {
  // From ARCHI document
}
\`\`\`

## Verification
- [ ] Migration runs successfully
- [ ] Can CRUD [entity] via Prisma Studio
```

### API Route Task Template
```markdown
# Task 00X: API - [Resource] Endpoints

## Context
Backend API for [feature] as defined in ARCHI.

## Requirements
- [ ] GET /api/[resource] - List
- [ ] POST /api/[resource] - Create
- [ ] GET /api/[resource]/[id] - Read
- [ ] PATCH /api/[resource]/[id] - Update
- [ ] DELETE /api/[resource]/[id] - Delete

## Verification
- [ ] All endpoints return correct status codes
- [ ] Auth middleware protects routes
- [ ] Validation rejects invalid input
```

### UI Component Task Template
```markdown
# Task 00X: UI - [Component Name]

## Context
User interface component for [feature/page].

## Requirements
- [ ] Create [Component] with props: [list]
- [ ] Implement [interaction/behavior]
- [ ] Style with Tailwind/shadcn

## Verification
- [ ] Component renders correctly
- [ ] Responsive on mobile/desktop
- [ ] Accessible (keyboard nav, screen reader)
```

### Integration Task Template
```markdown
# Task 00X: Integration - [Service Name]

## Context
Third-party integration with [service] for [purpose].

## Requirements
- [ ] Set up [service] account/API key
- [ ] Implement [service] client
- [ ] Handle [specific use case]
- [ ] Error handling for [service] failures

## Verification
- [ ] [Service] responds correctly in dev
- [ ] Errors are handled gracefully
- [ ] Credentials stored securely in env
```
</task_templates>

<rules>
- NEVER create tasks without reading both PRD and ARCHI first
- Each task must be completable by an AI agent WITHOUT human intervention
- Tasks must be atomic - one clear objective, not multiple unrelated changes
- Include exact file paths and code patterns when possible
- Reference specific PRD sections and ARCHI decisions in each task
- Dependencies must be explicit - no hidden assumptions
- Acceptance criteria must be testable, not subjective
- Estimate time conservatively (better to over-estimate)
- Group related tasks but keep them independent
- Always include a "Must NOT" section to prevent scope creep
- Tasks should be ordered so the codebase is always in a working state
- Include rollback instructions for risky tasks
- Keep task files self-contained - all info needed should be in the file
</rules>

<complexity_guidelines>
**Low Complexity (1-2 hours)**:
- Single file changes
- Well-defined patterns to follow
- No external dependencies
- Clear input/output

**Medium Complexity (2-3 hours)**:
- Multiple file changes
- Some decision-making required
- One external integration
- Edge cases to handle

**High Complexity (3+ hours)**:
- Consider breaking into smaller tasks
- Multiple integrations
- Complex state management
- Significant testing required
</complexity_guidelines>

<examples>
**Good Task Title:**
"Implement User Registration API with Email Verification"

**Bad Task Title:**
"User stuff" or "Backend work"

**Good Acceptance Criteria:**
- [ ] POST /api/auth/register accepts {email, password, name}
- [ ] Password is hashed with bcrypt (min 10 rounds)
- [ ] Verification email sent via Resend within 5 seconds
- [ ] Returns 201 with user object (no password)
- [ ] Returns 409 if email already exists

**Bad Acceptance Criteria:**
- [ ] Registration works
- [ ] Emails are sent

**Good Dependency Declaration:**
"Blocked By: Task 002 (Database Schema) - User table must exist before we can create users"

**Bad Dependency Declaration:**
"Needs database"
</examples>

<transition>
After generating all tasks, inform the user:
"Your implementation tasks are ready in the `tasks/` folder.

**Summary:**
- [X] total tasks generated
- Estimated [Y-Z] hours of development
- [N] milestones defined

**Recommended execution order:**
1. Start with tasks 001-00X (Foundation)
2. Then tasks 00X-00X (Core Features)
3. Finally tasks 00X-00X (Polish)

You can now execute tasks one by one. Would you like me to start with Task 001?"
</transition>
