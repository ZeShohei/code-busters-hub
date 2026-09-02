# Development Conventions

## Naming

React components use PascalCase.

Example:

```text
TeamMemberCard.tsx
```

Functions and variables use camelCase.

Types and interfaces use PascalCase.

Constants may use camelCase or UPPER_SNAKE_CASE depending on context and existing project conventions.

## Components

Prefer named exports for reusable components.

Example:

```tsx
export const TeamMemberCard = () => {
  return <div />;
};
```

Keep components focused on one responsibility.

Prefer composition over overly configurable components with many unrelated props.

Feature-specific components should remain inside their feature unless they are genuinely reusable across multiple features.

## Imports

Prefer the configured project alias for imports when appropriate.

Example:

```tsx
import { TeamMemberCard } from '@/components/TeamMemberCard';
```

Avoid deeply nested relative imports such as:

```text
../../../../components/TeamMemberCard
```

Group imports in a consistent order:

1. React and framework imports
2. External dependencies
3. Internal project imports
4. Relative imports
5. Styles

Follow the existing project style when it differs.

## Client Components

Do not add:

```tsx
'use client';
```

unless the component actually requires client-side functionality.

Typical reasons include:

- `useState`
- `useEffect`
- event handlers
- browser APIs
- interactive client-side state
- client-only libraries

Keep Client Components as small as practical.

Prefer Server Components by default.

## TypeScript

Use strict TypeScript.

Avoid `any`.

Prefer explicit domain types for business concepts.

Do not weaken types simply to silence TypeScript errors.

Keep feature-specific types close to the feature that owns them.

Move types into shared locations only when multiple features genuinely depend on them.

Prefer type inference where it keeps the code clear.

Add explicit types where they improve readability, public APIs, or safety.

## Styling

Follow the styling approach already configured in the project.

Do not introduce an additional styling framework without a deliberate decision.

Keep component-specific styles close to the component where practical.

Use shared design tokens or CSS variables instead of duplicating values when such tokens exist.

Avoid unnecessary global styles.

## Accessibility

Accessibility is part of the implementation and should not be treated as a later cleanup task.

Prefer semantic HTML.

Where applicable:

- provide accessible names
- support keyboard interaction
- preserve visible focus states
- associate labels with form controls
- avoid relying only on color to communicate meaning
- use ARIA only when native HTML semantics are insufficient

Do not add ARIA attributes unnecessarily.

## Comments

Comments should explain why something exists rather than restating obvious code.

Bad:

```ts
// Increment count.
count++;
```

Better:

```ts
// Rotation starts on Monday to match the team's weekly dispatcher schedule.
```

Avoid comments that become outdated easily.

Prefer clear naming and structure over explanatory comments when possible.

## Functions

Prefer small, focused functions.

Keep business logic separate from rendering logic where practical.

Pure functions are preferred for calculations such as:

- rotation assignments
- date calculations
- absence conflicts
- substitutions

This makes business logic easier to understand and test.

## File Size

Prefer focused files.

Do not split code purely to satisfy an arbitrary line-count rule.

Split a file when responsibilities become difficult to understand or maintain.

## Error Handling

Do not silently swallow errors.

Handle expected errors explicitly.

Provide useful error messages where appropriate.

Do not expose secrets or sensitive technical information to users.

During development, preserve enough context to make errors diagnosable.

## Dependencies

Do not introduce a new dependency without a clear reason.

Before installing a dependency, consider:

- whether the existing stack can solve the problem
- whether the dependency is maintained
- whether it increases architectural complexity
- whether the benefit justifies the maintenance cost

Coding agents should explain why a new dependency is needed before adding it.

## Tests

Add tests where they provide meaningful confidence.

Focus especially on:

- business logic
- rotation calculations
- absence logic
- substitution logic
- date-related rules
- regressions
- important user interactions

Avoid tests that merely duplicate implementation details.

Prefer testing observable behavior.

Business logic should preferably be testable independently from React components.

## Linting and Validation

Before considering a coding task complete:

- run the relevant lint command
- check TypeScript errors
- run relevant tests
- run a build when the change could affect production behavior
- manually verify UI behavior when appropriate

Do not hide failing validation steps.

Report failures clearly.

## Git Workflow

The repository uses the following branch model:

```text
main
└── stable code

dev
└── integration branch

feature/*
fix/*
chore/*
└── working branches created from dev
```

Do not commit feature work directly to `main`.

Prefer small, focused commits.

Commit messages should describe the intent of the change.

Examples:

```text
feat: add team overview
fix: correct weekly rotation calculation
chore: configure project tooling
docs: document application architecture
```

## Agentic Development

This project is also used to learn agentic software development.

Coding agents should:

1. inspect the existing code before making changes
2. briefly explain the proposed approach for non-trivial tasks
3. make small and incremental changes
4. avoid unrelated refactoring
5. explain important architectural decisions
6. mention relevant trade-offs
7. run appropriate validation after implementation
8. summarize changed files and behavior

Agents should not:

- rewrite large parts of the application without a concrete reason
- install dependencies speculatively
- introduce architecture for hypothetical future requirements
- delete existing functionality without explicit instruction
- modify unrelated code merely because it could be improved

## General Principle

Prefer readable, maintainable and straightforward code.

Choose the simplest solution that satisfies the current requirement.

Introduce abstractions when real repetition or complexity demonstrates the need for them.
