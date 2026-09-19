@AGENTS.md

# Claude Code Instructions

## Project

This repository contains the Code Busters Hub.

Code Busters Hub is an internal team operations application for organizing recurring responsibilities and team coordination.

Before making changes, read:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/conventions.md`

If architectural decision records exist under `docs/decisions/`, consult the relevant ones.

## Working Mode

This project is also used to learn agentic software development.

When handling a non-trivial task:

1. Inspect the existing implementation first.
2. Explain the intended approach briefly.
3. Identify the smallest useful change.
4. Mention relevant trade-offs.
5. Implement incrementally.
6. Avoid unrelated refactoring.
7. Validate the change.
8. Summarize the changed files and behavior.

Do not hide important implementation choices behind automation.

When introducing a concept that may be unfamiliar, explain it briefly in practical terms.

Examples include:

- Server Components
- Client Components
- route handlers
- caching
- data fetching
- React state
- TypeScript generics
- architectural boundaries

Do not over-explain trivial syntax unless asked.

## Planning

For larger tasks, start with a short plan before editing files.

A useful plan should include:

- files likely to change
- the intended data flow
- any architectural impact
- validation steps

Do not create long speculative plans for simple tasks.

If the requirement is ambiguous and the ambiguity materially affects the implementation, ask before making a large assumption.

For small implementation details, prefer the simplest reasonable interpretation.

## Scope

Only change files that are relevant to the requested task.

Do not:

- redesign unrelated components
- rename unrelated files
- restructure folders without a concrete need
- introduce future features
- clean up unrelated technical debt
- replace working code merely because another pattern is preferred

If unrelated issues are discovered, mention them separately instead of fixing them automatically.

## Next.js

The project uses Next.js with the App Router.

Follow these rules:

- Prefer Server Components by default.
- Use Client Components only when required.
- Add `"use client"` only to the smallest necessary component boundary.
- Keep server-only logic out of Client Components.
- Use App Router conventions.
- Do not introduce Pages Router patterns.
- Prefer Next.js built-in capabilities over unnecessary libraries.
- Follow the installed Next.js version rather than assuming behavior from another version.

## React

Keep React components focused.

Prefer:

- composition
- clear props
- local state for local UI behavior
- server-side logic when client state is unnecessary

Avoid:

- giant components with many unrelated responsibilities
- unnecessary effects
- state that can be derived
- global state for local problems
- premature generic abstractions

## TypeScript

Use strict TypeScript.

Rules:

- avoid `any`
- do not weaken types to silence errors
- use domain-specific types where they improve clarity
- keep feature-specific types close to the feature
- reuse existing types when appropriate
- prefer readable types over overly clever type-level programming

When a type error occurs, fix the underlying mismatch rather than bypassing it with unsafe casting.

## Project Structure

Use the documented architecture in `docs/architecture.md`.

General ownership:

```text
src/app/
    Next.js routing and composition

src/components/
    reusable application-wide UI

src/features/
    feature-specific components and business logic

src/lib/
    shared technical infrastructure and utilities

src/types/
    types genuinely shared across features

src/styles/
    global styling infrastructure
```

Do not create folders merely because they are listed here.

Create structure only when implementation requires it.

## Product Scope

Current product areas may include:

- dashboard
- team overview
- absences
- dispatcher rotations
- monitoring rotations
- substitutions

Future ideas documented in product documentation are not implementation requirements.

Do not implement them unless explicitly requested.

## Business Logic

Keep business logic separate from presentation where practical.

Examples:

- current dispatcher calculation
- weekly rotation calculation
- absence conflict detection
- substitutions
- monitoring assignments

Prefer pure functions for calculations when possible.

Pure functions should be easy to test without rendering React components.

## Styling

Use the styling approach already present in the repository.

Do not install Tailwind, CSS-in-JS libraries, component libraries, or other styling systems unless explicitly decided.

Prefer reusable variables or design tokens when they already exist.

Avoid unnecessary inline styles.

## Dependencies

Do not install new dependencies automatically for convenience.

Before adding a dependency, explain:

1. what problem it solves
2. why the existing stack is insufficient
3. what maintenance or architectural impact it introduces

Prefer the platform, React, and Next.js built-ins when they are sufficient.

## Data Persistence

Persistence has not necessarily been decided yet.

Do not independently introduce:

- Prisma
- Drizzle
- another ORM
- a database
- authentication providers
- external APIs
- global state management
- backend frameworks

unless the current task or a documented architectural decision requires them.

Mock data is acceptable for early UI and domain modeling work.

## Accessibility

Treat accessibility as a default requirement.

Prefer:

- semantic HTML
- native controls
- keyboard accessibility
- correct labels
- visible focus states
- accessible names

Use ARIA only when native HTML semantics are insufficient.

## Testing

Prioritize tests for meaningful behavior.

Especially useful areas include:

- rotation calculations
- absence rules
- substitutions
- date calculations
- regressions
- important user interactions

Avoid tests that only assert implementation details.

When business logic can be extracted into pure functions, test those functions directly.

## Validation

After implementing a change, run the relevant validation available in the repository.

Typical checks:

```bash
npm run lint
```

When appropriate:

```bash
npm run build
```

Run tests when a test command exists and the change affects tested behavior.

Do not claim validation succeeded unless it was actually executed.

If a command fails:

1. report the failure
2. explain the likely cause
3. distinguish between a failure caused by the current change and a pre-existing failure

## Git

The expected branch model is:

```text
main
  stable

dev
  integration

feature/*
fix/*
chore/*
docs/*
  working branches
```

Feature work should normally start from `dev`.

Do not commit directly to `main`.

Do not perform destructive Git operations without explicit instruction.

Avoid:

- force pushes
- resetting user work
- deleting branches
- rewriting history

unless explicitly requested and understood.

## Security

Never expose or commit:

- passwords
- API keys
- tokens
- private SSH keys
- secrets
- credentials

Do not add secrets to source code.

Do not commit secret-containing `.env` files.

## Communication

After a non-trivial implementation, provide a concise summary containing:

### Changed

- relevant files
- behavior that changed

### Validation

- commands executed
- whether they succeeded

### Notes

- important trade-offs
- follow-up work only when relevant

Keep explanations practical and tied to the actual code.

## Default Principle

Prefer the smallest correct change.

Do not optimize for hypothetical future requirements.

Keep the codebase understandable.

Build the application incrementally.
