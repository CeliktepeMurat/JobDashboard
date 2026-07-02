# Job Aggregator & Tracker — Project Brief

## Context

This is a personal side project built while job hunting, with two goals:

1. Solve a real problem: aggregate job listings from multiple sources into one dashboard, and track applications across platforms (LinkedIn, Wellfound, Indeed, RemoteYeah, company sites).
2. Refresh and expand full-stack skills with current, in-demand technologies — this project doubles as something to discuss in technical interviews.

The developer has 5+ years of experience in Web3/blockchain infra (Nethermind, Octoswap, BuidlerLabs) and full-stack development (React, Node.js, Express). Comfortable with React Native. Newer to: Next.js, Prisma, Docker, scheduled jobs, and using AI-assisted job data APIs. Treat explanations as "this is new to me" for anything beyond React/Node/Express — explain new concepts clearly, don't assume prior familiarity.

## Core Concept

A web dashboard that:

- Pulls international remote job listings via SerpApi (Google Jobs engine)
- Pulls LinkedIn job listings (Turkey + global) via an Apify LinkedIn scraper actor
- Displays both in one unified, filterable feed
- Lets the user mark jobs as "applied" and track status (applied / followed up / interviewing / rejected)
- Lets the user manually add jobs from sources without API access (e.g. Indeed, Wellfound, company career pages, Kariyer.net) so all applications live in one tracker regardless of source

## Tech Stack (decided, do not deviate without discussion)

- **Frontend + Backend:** Next.js (App Router) — API routes serve as the backend, no separate Express/NestJS service needed for this project's scope
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Job data sources:**
  - SerpApi — `engine=google_jobs` endpoint, for international remote roles (free tier: 250 searches/month)
  - Apify — LinkedIn job scraper actor, for LinkedIn listings (~$0.10 per 1,000 results)
- **Scheduled fetching:** Cron-based daily fetch (Vercel Cron, or node-cron if running locally) — jobs are fetched once a day and cached in the DB, NOT fetched live on every page load. This keeps API usage low and cost near $0.
- **Deployment target:** Vercel (Next.js native fit, free tier, has built-in Cron support)

## MVP Feature Scope (build this first, nothing more)

1. Job feed — shows jobs fetched from SerpApi + Apify, with filters: keyword, source (Remote/LinkedIn), date posted
2. "Mark as applied" action on any job in the feed → saves to DB with status
3. Manual job entry form — for jobs applied to outside the automated feed (Indeed, Wellfound, Kariyer.net, company sites). Fields: company, role, platform, date, link, status, notes
4. Simple stats view — total applications this week/month, breakdown by platform/source
5. Basic status tracking per application: Applied → Followed Up → Interviewing → Rejected → Offer

## Explicitly OUT of scope for MVP (do not build until MVP is done and confirmed working)

- Auto-apply / application automation of any kind
- Cover letter generation
- Resume parsing/matching
- Kariyer.net API integration (deliberately excluded — manual entry only for now)
- Notifications/alerts
- Multi-user support (this is a single-user personal tool)
- Mobile app version

## Job Search Preferences (used to build the actual fetch queries)

These are the real search parameters to use when calling each source. If the source's API doesn't support a parameter directly (e.g. "last 24 hours"), translate it to the closest equivalent the API does support, and note the limitation rather than silently dropping it.

**LinkedIn (via Apify — curious_coder/linkedin-jobs-scraper) — currently the only active source**

Three separate searches, all last 24 hours (`f_TPR=r86400`):

1. "full stack developer" — Turkey — all workplace types (Remote, Hybrid, On-site)
2. "software engineer" — Turkey — all workplace types
3. "blockchain developer" — Worldwide — remote only (`f_WT=2`)

**Google Jobs (via SerpApi) — built but disabled, not currently used**

Kept in the codebase (`src/lib/fetchers/serpapi.ts`) and wired into the source
registry in `src/app/api/fetch-jobs/route.ts` with `enabled: false`, so it can
be switched back on (or another source added the same way) without rewriting
the fetch pipeline. Last known-working params if re-enabled:

- Workplace: remote — appended to the query text as a keyword (e.g. `"full stack developer remote"`), NOT the `chips=work_from_home:1` filter. That chip was tested directly against Google Jobs and reliably returned zero results (confirmed 2026-07-02) — Google's chip values appear to be session-encoded tokens that the plain string isn't a stable substitute for.
- Keywords/roles: "blockchain developer", "full stack developer", "software engineer"
- Location parameter: United States (proxy for the full international remote pool, not because the user targets the US specifically; see Known Constraints)

**Implementation note:** these preferences will likely run as multiple separate queries per source (one per keyword/role) rather than one combined query, since job search APIs generally return better results per distinct keyword than from a combined OR-style query. Combine and de-duplicate results in the app layer (e.g. dedupe by job URL) before storing/displaying.

If these preferences need to change later, update this section — don't hardcode them only in code without reflecting the change here too.

## Skills Profile (used for relevance scoring, not just keyword search)

Derived from the developer's actual resume. Used to score/rank fetched jobs by relevance, not just to expand search keywords blindly — a job matching several of these should rank higher in the feed than one that only loosely matches the search term.

**Core / heavily weighted (strong signal of a good match):**

- TypeScript, JavaScript, Node.js, React, Next.js
- NestJS, REST APIs, GraphQL
- PostgreSQL, Redis

**Secondary / moderate weight:**

- React Native, Redux, Tailwind CSS
- MongoDB, Docker, AWS (Lambda, EC2, S3)
- CI/CD

**Web3/Blockchain-specific (relevant only for blockchain-tagged searches, not full-stack searches):**

- Solidity, Foundry, Hardhat, Web3 integration, smart contracts
- Viem, Wagmi, The Graph Protocol

**Approach:**

1. Fetch jobs per the Job Search Preferences section (keyword + source queries as already defined — don't change the search keywords based on this list)
2. After fetching, score each job using `src/lib/job-scorer.ts`, which reads rules from `scoring-rules.md` (project root). Elimination rules run first — any match returns score 0. Then core/secondary/blockchain keyword scoring runs.
3. Surface a relevance tag (High/Medium/Low) in the feed UI. Default filter is Medium+ so eliminated/low-match jobs are hidden unless the user removes the filter.
4. To add new elimination rules or tweak scoring, edit `scoring-rules.md` and restart the dev server.

Thresholds: High ≥ 6, Medium ≥ 2, Low < 2. Score 0 = eliminated by a rule.

## Known Constraints & Bottlenecks

- **API keys** (SerpApi, Apify) must stay server-side only — used inside Next.js API routes, never exposed to the client/browser
- **Google Jobs has little to no coverage for Turkey** — confirmed via direct testing (returns "Google hasn't returned any results for this query" for Turkey-based searches). This is why LinkedIn (via Apify) + manual entry cover the Turkey-specific job search, while SerpApi/Google Jobs covers international remote roles (using `location: United States` in the query regardless of user's actual location)
- AI/API responses should be validated before saving to DB — don't assume external API shape is always consistent
- Keep scope tight — this project's purpose is to be FINISHED, not maximally feature-complete. Resist scope creep; log "nice to have" ideas separately rather than building them now

## Working Style Preferences

- Explain new tools/concepts as you introduce them (Prisma migrations, Next.js API routes, cron setup, etc.) — assume the developer wants to understand WHY a piece exists, not just have it generated
- Prioritize getting a working end-to-end slice early (even one hardcoded job source displaying in the UI) over building all pieces in isolation before connecting them
- Flag clearly if something proposed here turns out to be a bad idea technically — don't silently change the plan

## Workflow Principles

Kept deliberately lightweight — this is a solo 1-2 week MVP, not a team codebase. Heavier process (subagent orchestration, elaborate task-tracking files, multi-file planning docs) is explicitly NOT adopted here; it would slow this project down more than it helps.

**Plan before building, briefly.** For anything more than a trivial change (new feature, schema change, new API integration) — give a short plan in chat first: what will change, which files, any tradeoffs. No need for a separate plan file. For one-line fixes or obvious small edits, just do it.

**Verify before calling something done.** Don't mark a feature complete without actually running it and confirming it works — start the dev server, hit the endpoint, check the DB row was created, etc. "It should work" is not done; "I ran it and confirmed X" is done.

**Fix root causes, not symptoms.** If a bug shows up, explain what actually caused it, not just the patch. No silent workarounds that mask a deeper issue (e.g. swallowing an error instead of handling why it occurred).

**Capture corrections.** If I correct something more than once (a pattern Claude Code keeps getting wrong, a preference I have to repeat), add a short note under a "Lessons" section below so it's not repeated. Keep it to one or two lines per lesson — this is a log, not documentation.

**Autonomous on bugs.** If given an error message, failing test, or log output, go ahead and investigate and fix it directly rather than asking me to narrow it down first. Explain what was wrong after, not before.

**Simplicity over cleverness.** Given the choice between a simple, slightly less elegant solution and a clever one, prefer simple — especially since this codebase needs to stay easy to explain in interviews later.
