---
name: create-architecture
description: Design technical architecture for a Next.js SaaS application based on PRD requirements
---

<objective>
Create a comprehensive technical architecture document for a Next.js SaaS application.

Translate PRD requirements into concrete technical decisions: tech stack, libraries, database schema, API design, and implementation approach. The architecture should be practical, battle-tested, and optimized for rapid MVP development.

This document bridges the gap between WHAT to build (PRD) and HOW to build it (Implementation).
</objective>

<context>
You are a senior full-stack architect specializing in Next.js SaaS applications. You prioritize:
- Speed to market over perfection
- Proven technologies over cutting-edge experiments
- Simplicity over cleverness
- Scalability paths over premature optimization
</context>

<process>
## Phase 1: Gather Requirements

1. **Check for existing PRD**:
   - If PRD exists in context, use it as the source of truth
   - If no PRD, ask: "Do you have a PRD? If not, let's clarify the core requirements first."

2. **Extract key technical requirements from PRD**:
   - Core features that need implementation
   - User types and authentication needs
   - Data entities and relationships
   - External integrations required
   - Performance/scale expectations
   - Budget constraints (affects hosting choices)

3. **Ask clarifying questions** (only if not answered in PRD):
   - "What's your deployment preference? (Vercel, AWS, self-hosted)"
   - "Do you need real-time features? (chat, live updates)"
   - "What payment model? (subscription, one-time, usage-based)"
   - "Any existing technical constraints or preferences?"

## Phase 2: Define Tech Stack

4. **Select technologies for each layer**:

   For each technology choice, document:
   - **What**: The specific tool/library
   - **Why**: Rationale for this choice
   - **Trade-offs**: What you're giving up
   - **Alternatives considered**: Other options and why not

5. **Core stack decisions**:
   - Framework (Next.js version, App Router vs Pages)
   - Deployment platform
   - Database (type and provider)
   - Authentication solution
   - Payment processing
   - File storage
   - Email service
   - AI/ML services (if needed)
   - Analytics and monitoring

## Phase 3: Design Data Architecture

6. **Define database schema**:
   - List all entities/tables
   - Define relationships
   - Identify indexes needed
   - Plan for multi-tenancy (if applicable)

7. **Design API structure**:
   - API routes organization
   - Authentication middleware
   - Rate limiting strategy
   - Error handling patterns

## Phase 4: Plan Feature Implementation

8. **For each core feature from PRD**:
   - Break down into technical components
   - Identify required libraries
   - Define data flow
   - Estimate complexity (Low/Medium/High)

9. **Define folder structure**:
   - App directory organization
   - Component hierarchy
   - Shared utilities location
   - Type definitions

## Phase 5: Infrastructure & DevOps

10. **Plan deployment pipeline**:
    - Environment strategy (dev, staging, prod)
    - CI/CD approach
    - Environment variables management
    - Database migrations strategy

11. **Define monitoring & observability**:
    - Error tracking
    - Performance monitoring
    - User analytics
    - Logging strategy
</process>

<output_format>
# Technical Architecture: [Product Name]

## Architecture Overview

**Architecture Philosophy**
[2-3 sentences describing the guiding principles for technical decisions]

**Tech Stack Summary**
- **Framework**: [Choice] (from [template/scratch])
- **Deployment**: [Platform]
- **Database**: [DB + ORM]
- **Authentication**: [Solution]
- **Payments**: [Provider + model]
- **Storage**: [Solution for files/images]
- **Email**: [Service]
- **AI/ML**: [If applicable]
- **Analytics**: [Solution]

---

## Frontend Architecture

### Core Stack

- **Framework**: [e.g., Next.js 15 with App Router]
  - **Why**: [Rationale]
  - **Trade-off**: [What you're giving up]

- **UI Components**: [e.g., shadcn/ui + Tailwind CSS]
  - **Why**: [Rationale]
  - **Trade-off**: [What you're giving up]

- **Styling**: [e.g., Tailwind CSS]
  - **Why**: [Rationale]
  - **Trade-off**: [What you're giving up]

### State Management

- **Global State**: [e.g., Zustand]
  - **Why**: [Rationale]
  - **Use cases**: [What state goes here]

- **Server State**: [e.g., TanStack Query / SWR]
  - **Why**: [Rationale]
  - **Use cases**: [What state goes here]

- **Form State**: [e.g., React Hook Form + Zod]
  - **Why**: [Rationale]

### Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected routes
│   ├── (marketing)/       # Public pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── layouts/           # Layout components
│   └── features/          # Feature-specific components
├── lib/
│   ├── db/                # Database client & queries
│   ├── auth/              # Auth utilities
│   ├── api/               # API client functions
│   └── utils/             # Helper functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── config/                # App configuration
```

---

## Backend Architecture

### Database Design

**ORM**: [e.g., Prisma / Drizzle]
- **Why**: [Rationale]

**Database**: [e.g., PostgreSQL on Supabase/Neon/PlanetScale]
- **Why**: [Rationale]

### Schema

```prisma
// Core entities

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  // [Add fields based on PRD]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  // [Define based on PRD entities]
}

// [Add other models based on PRD requirements]
```

### API Design

**Pattern**: [e.g., Next.js API Routes / Server Actions]

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/[resource]` | GET | List resources | Yes |
| `/api/[resource]` | POST | Create resource | Yes |
| `/api/[resource]/[id]` | GET | Get single | Yes |
| `/api/[resource]/[id]` | PATCH | Update | Yes |
| `/api/[resource]/[id]` | DELETE | Delete | Yes |

---

## Authentication & Authorization

**Solution**: [e.g., Better Auth / NextAuth / Clerk]
- **Why**: [Rationale]
- **Trade-off**: [What you're giving up]

**Auth Flow**:
```
[Describe the authentication flow]
1. User signs up/logs in
2. [Session/JWT created]
3. [How protected routes work]
4. [How API auth works]
```

**Authorization Model**:
- [Describe roles/permissions if applicable]

---

## Payment Integration

**Provider**: [e.g., Stripe]
- **Why**: [Rationale]

**Payment Model**: [Subscription / One-time / Usage-based]

**Implementation**:
- Checkout flow: [Stripe Checkout / Custom]
- Webhook handling: [Events to handle]
- Subscription management: [Customer portal / Custom]

**Price Structure**:
| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | [Features] |
| Pro | $X/mo | [Features] |
| Enterprise | Custom | [Features] |

---

## Third-Party Integrations

### [Integration 1: e.g., AI Service]
- **Provider**: [e.g., OpenAI / Anthropic]
- **Use case**: [What it's used for]
- **Implementation**: [SDK / API calls]
- **Cost consideration**: [Pricing model]

### [Integration 2: e.g., Email]
- **Provider**: [e.g., Resend / SendGrid]
- **Use case**: [Transactional / Marketing]
- **Implementation**: [How to integrate]

### [Integration 3: e.g., Storage]
- **Provider**: [e.g., S3 / Cloudflare R2]
- **Use case**: [What files are stored]
- **Implementation**: [Direct upload / Signed URLs]

---

## Feature Implementation Guide

### Feature 1: [Feature Name from PRD]

**Complexity**: [Low / Medium / High]

**Components needed**:
- [ ] [Component 1]
- [ ] [Component 2]

**Libraries required**:
- `[library-name]`: [Purpose]

**Data flow**:
```
[User action] → [Frontend component] → [API/Server Action] → [Database] → [Response]
```

**Implementation notes**:
- [Key consideration 1]
- [Key consideration 2]

### Feature 2: [Feature Name from PRD]

**Complexity**: [Low / Medium / High]

**Components needed**:
- [ ] [Component 1]
- [ ] [Component 2]

**Libraries required**:
- `[library-name]`: [Purpose]

**Data flow**:
```
[Describe the flow]
```

---

## DevOps & Deployment

### Environments

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Development | localhost:3000 | Local/Dev DB | Development |
| Preview | [auto-generated] | Preview DB | PR reviews |
| Production | [domain] | Prod DB | Live users |

### CI/CD Pipeline

```yaml
# Deployment flow
1. Push to branch
2. Run linting & type check
3. Run tests (if any)
4. Deploy to preview (PRs) or production (main)
```

### Environment Variables

```bash
# Required environment variables
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Third-party services
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# [Add others based on integrations]
```

---

## Security Considerations

- [ ] Input validation on all forms (Zod schemas)
- [ ] SQL injection prevention (ORM parameterized queries)
- [ ] XSS prevention (React's built-in escaping)
- [ ] CSRF protection (Next.js built-in)
- [ ] Rate limiting on API routes
- [ ] Secure headers (next-secure-headers)
- [ ] Environment variables never exposed to client

---

## Performance Optimization

- [ ] Image optimization (next/image)
- [ ] Code splitting (dynamic imports)
- [ ] Database query optimization (indexes, select specific fields)
- [ ] Caching strategy (ISR, SWR, Redis if needed)
- [ ] Bundle size monitoring

---

## Dependencies Summary

### Production Dependencies
```json
{
  "next": "^15.x",
  "react": "^19.x",
  "@prisma/client": "^5.x",
  // [List key dependencies]
}
```

### Development Dependencies
```json
{
  "typescript": "^5.x",
  "prisma": "^5.x",
  "tailwindcss": "^3.x",
  // [List dev dependencies]
}
```

---

## Open Technical Questions

- [ ] [Unresolved technical decision]
- [ ] [Area needing more research]

---

## Next Steps

1. [ ] Set up project with boilerplate
2. [ ] Configure database and run initial migration
3. [ ] Implement authentication
4. [ ] Build core feature 1
5. [ ] [Continue based on PRD priorities]
</output_format>

<rules>
- Always reference the PRD when making decisions - architecture serves the product, not the other way around
- Prefer boring, proven technology over shiny new tools
- Every technology choice must have a "Why" and "Trade-off"
- Don't over-engineer for scale you don't have - note scaling paths instead
- Keep the MVP stack minimal - you can always add complexity later
- Consider the developer's experience level when recommending tools
- Default to managed services for MVP (less ops overhead)
- Always include cost considerations for paid services
- Make the document actionable - a developer should be able to start building from this
- Flag areas of uncertainty as "Open Questions" rather than guessing
- Consider the existing codebase/template if one exists
</rules>

<stack_recommendations>
**For Most Next.js SaaS MVPs, default to:**

| Layer | Recommendation | Why |
|-------|---------------|-----|
| Framework | Next.js 15 (App Router) | Industry standard, great DX |
| Deployment | Vercel | Zero-config, free tier |
| Database | PostgreSQL (Neon/Supabase) | Reliable, free tiers available |
| ORM | Prisma | Best DX, type-safe |
| Auth | Better Auth or NextAuth | Full-featured, flexible |
| UI | shadcn/ui + Tailwind | Beautiful, customizable, free |
| Forms | React Hook Form + Zod | Type-safe validation |
| Payments | Stripe | Industry standard |
| Email | Resend | Great DX, generous free tier |
| Storage | Cloudflare R2 or S3 | Cheap, reliable |
| Analytics | Plausible or PostHog | Privacy-friendly |

**Adjust based on specific needs** - these are starting points, not mandates.
</stack_recommendations>

<examples>
**Good Architecture Philosophy:**
"Leverage the existing NOW.TS template to minimize boilerplate work. Focus development time on the core differentiator: Gemini-powered thumbnail generation with reusable Personas. Keep it simple - no over-engineering for a 3-day sprint."

**Bad Architecture Philosophy:**
"Use microservices architecture with Kubernetes for scalability."
(Over-engineered for MVP)

**Good Tech Choice Documentation:**
- **Database**: PostgreSQL on Neon
  - **Why**: Free tier supports MVP, scales well, Prisma integration is seamless
  - **Trade-off**: Less flexible than MongoDB for unstructured data, but our data is relational
  - **Alternative considered**: PlanetScale - great but MySQL syntax differs from team's PostgreSQL experience

**Bad Tech Choice Documentation:**
- **Database**: PostgreSQL
(No rationale, no trade-offs, not actionable)
</examples>

<transition>
Once the architecture is approved, inform the user:
"Your technical architecture is complete. You now have:
1. ✅ PRD (What to build)
2. ✅ Architecture (How to build it)

Next step: Break this down into implementable tasks. Would you like to create a task breakdown for development?"
</transition>
