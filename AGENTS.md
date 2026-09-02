# Code Busters Hub

## Purpose

Code Busters Hub is an internal team operations application.

The application supports team organization and recurring operational workflows such as:

- team overview
- absences and vacations
- dispatcher rotations
- monitoring rotations
- substitutions
- additional internal team tools

This project is also used to learn agentic software development.

## Agent Working Style

For non-trivial tasks:

1. Inspect the existing code before changing anything.
2. Briefly explain the intended approach before implementation.
3. Prefer small, incremental changes over large rewrites.
4. Explain unfamiliar Next.js, React, TypeScript, or architectural concepts when they are introduced.
5. Mention important architectural trade-offs.
6. Do not perform unrelated refactoring.
7. After implementation, summarize what changed.
8. Report validation results and failures clearly.
9. Do not hide important implementation decisions behind automation.

For trivial changes, keep the explanation concise and focus on the requested change.

## Technology

Current core stack:

- Next.js
- React
- TypeScript
- App Router
- npm
- ESLint

Do not assume additional frameworks or libraries are available unless they already exist in the repository.

## Project Documentation

Before making architectural or feature-level changes, consult the relevant project documentation:

- `docs/product.md` for product scope and intended features
- `docs/architecture.md` for architectural boundaries and structure
- `docs/conventions.md` for development conventions
- `docs/decisions/` for documented architectural decisions when they exist

Keep implementation consistent with these documents.

If the code and documentation conflict, mention the conflict instead of silently choosing one.

## Next.js Guidelines

- Use the App Router.
- Prefer Server Components by default.
- Use Client Components only when browser APIs, state, effects, event handlers, or other client-side behavior are required.
- Add `"use client"` only where necessary.
- Keep server-only logic out of Client Components.
- Prefer built-in Next.js and React functionality over unnecessary dependencies.
- Follow the Next.js version and conventions already used by this repository.
- Do not introduce Pages Router patterns into the App Router application.
- Keep client boundaries as small as practical.

## TypeScript

- Use strict TypeScript.
- Avoid `any`.
- Prefer explicit domain types for business concepts.
- Reuse existing types where appropriate.
- Keep feature-specific types close to the feature that owns them.
- Do not weaken types merely to silence compiler errors.
- Prefer type inference when it remains clear and safe.

## Components

- Keep components focused on one responsibility.
- Separate reusable UI components from feature-specific components.
- Do not put business logic into purely presentational UI components.
- Prefer composition over overly configurable components.
- Reuse existing components before creating new ones.
- Keep feature-specific components inside their feature unless they are genuinely reusable across the application.
- Prefer semantic HTML and accessible native elements.

## Business Logic

Business logic should be separated from UI rendering where practical.

Examples in this project include:

- determining the current dispatcher
- calculating weekly rotations
- checking absence conflicts
- assigning substitutions
- determining monitoring responsibility

Prefer pure, testable functions for this logic when possible.

## Dependencies

Do not install a new dependency without first explaining:

- why it is needed
- what problem it solves
- whether the same problem can reasonably be solved with the existing stack
- what architectural or maintenance cost it introduces

Do not introduce dependencies speculatively for possible future requirements.

## Data and Infrastructure

The persistence, authentication, hosting, and external integration architecture may not yet be decided.

Do not introduce a database, ORM, authentication provider, global state library, API framework, or external service unless the task explicitly requires it or a documented decision already exists.

Mock data is acceptable during early implementation when persistence is not yet required.

## Accessibility

Accessibility is part of the implementation.

Where applicable:

- use semantic HTML
- provide accessible names
- support keyboard interaction
- preserve visible focus states
- associate form labels correctly
- avoid relying only on color to communicate meaning
- prefer native HTML semantics before ARIA

Do not add ARIA attributes unless they are actually needed.

## Git Workflow

Branches:

- `main` contains stable code.
- `dev` is the integration branch.
- Feature work branches from `dev`.

Branch examples:

- `feature/dashboard`
- `feature/absence-management`
- `feature/rotation-management`
- `fix/...`
- `chore/...`
- `docs/...`

Do not commit feature work directly to `main`.

Prefer small, focused commits.

Suggested commit message style:

- `feat: add team overview`
- `fix: correct weekly rotation calculation`
- `chore: configure project tooling`
- `docs: document application architecture`

## Validation

Before considering a coding task complete:

- run the relevant lint command
- run TypeScript checks where appropriate
- run relevant tests when available
- run a production build when the change could affect production behavior
- manually verify UI behavior when appropriate
- report failures instead of hiding them

Do not claim a task is complete if relevant validation has not been run or has failed.

## Scope Control

Do not:

- delete functionality without explicit instruction
- rewrite large parts of the project unnecessarily
- modify unrelated code merely because it could be improved
- introduce architecture merely because it may be useful later
- implement future product ideas unless explicitly requested
- create unnecessary abstractions
- silently change established conventions

Prefer the smallest change that correctly solves the current task.

## Security

Do not:

- expose secrets or credentials
- commit `.env` files containing secrets
- hardcode tokens, passwords, API keys, or private credentials
- log sensitive information unnecessarily

Use environment variables for secrets when external services are introduced.

## General Principle

Prefer readable, maintainable, straightforward code.

Build incrementally.

Choose the simplest solution that satisfies the current requirement.

Refactor toward abstractions only when repetition or complexity demonstrates a concrete need.
