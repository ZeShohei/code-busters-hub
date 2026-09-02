# Code Busters Hub – Agent Guidelines

## Project
Internal team operations portal for:
- absences
- rotations
- monitoring duties
- team coordination

## Tech Stack
- Next.js
- TypeScript
- App Router
- ESLint

## General Rules
- Prefer simple, maintainable solutions.
- Do not introduce new dependencies without a clear reason.
- Reuse existing components before creating new ones.
- Keep business logic out of UI components where possible.
- Use strict TypeScript types.
- Avoid `any`.
- Keep components small and focused.
- Follow the existing folder structure and naming conventions.

## Next.js
- Use current App Router patterns.
- Prefer Server Components unless client-side interactivity is required.
- Add `"use client"` only where necessary.
- Keep server-only logic out of client components.
- Prefer Next.js built-in capabilities before adding external libraries.

## Development Workflow
- `main` contains stable code.
- `dev` is the integration branch.
- New work is done in feature branches based on `dev`.
- Do not commit directly to `main`.
- Keep commits focused and descriptive.

## Before Completing a Task
- Run linting.
- Run relevant tests.
- Check TypeScript errors.
- Verify the feature manually when applicable.
- Summarize changed files and important decisions.

## Agent Behaviour
- Inspect existing code before making structural changes.
- Do not refactor unrelated code.
- Do not delete existing functionality without explicit instruction.
- When requirements are ambiguous, prefer the smallest safe implementation.
- Explain architectural decisions when introducing a new pattern.

## Learning Mode

This project is also used to learn agentic software development.

When making non-trivial changes:
1. Explain the intended approach briefly before implementation.
2. Mention important architectural trade-offs.
3. Prefer incremental changes over large rewrites.
4. Explain unfamiliar Next.js concepts when they are introduced.
5. Do not hide important implementation decisions behind automation.