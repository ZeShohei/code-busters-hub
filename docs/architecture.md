# Architecture

## Current State

The project is a Next.js application using the App Router and TypeScript.

The architecture will evolve incrementally as features are implemented.

Avoid introducing abstractions before there is a concrete need for them.

## Proposed Source Structure

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── types/
└── styles/
```

## app

Contains Next.js routing and App Router specific files.

Typical responsibilities:

- layouts
- pages
- loading states
- error states
- route handlers
- metadata
- route-specific composition

Keep business logic out of `app` where possible.

The `app` directory should mainly compose features and reusable components.

## components

Contains reusable application-wide UI components.

Examples:

- Button
- Card
- Modal
- Navigation
- Dialog
- Input
- Select
- EmptyState

Feature-specific components should generally not be placed here.

A component belongs in `components` when it is reusable across multiple features and does not contain feature-specific business logic.

## features

Contains business and domain functionality grouped by feature.

Initial feature areas may include:

```text
features/
├── absences/
├── dashboard/
├── rotations/
├── substitutions/
└── team/
```

Each feature should remain self-contained where practical.

A feature may later contain directories such as:

```text
components/
types/
services/
utils/
hooks/
```

Only create these directories when they are actually needed.

Avoid creating empty architectural layers in advance.

Example:

```text
features/
└── rotations/
    ├── components/
    │   ├── RotationCard.tsx
    │   └── RotationOverview.tsx
    ├── types/
    │   └── rotation.ts
    └── utils/
        └── getCurrentRotation.ts
```

## lib

Contains shared technical infrastructure and utilities that are not specific to a single feature.

Potential examples:

- API clients
- date utilities
- configuration
- validation helpers
- database access
- authentication helpers
- shared server utilities

Do not move feature-specific business logic into `lib`.

## types

Contains types that are genuinely shared across multiple features.

Prefer keeping feature-specific types inside their respective feature.

Example:

```text
src/
├── types/
│   └── common.ts
└── features/
    └── rotations/
        └── types/
            └── rotation.ts
```

A type should only be moved into the global `types` directory when multiple features actually depend on it.

## styles

Contains global styles and styling infrastructure.

Potential examples:

- global styles
- CSS variables
- design tokens
- shared mixins
- reusable style utilities

Component-specific styles should stay close to the component when possible.

## Data Layer

The persistence solution has not been decided yet.

Do not introduce any of the following until a concrete architectural decision has been made:

- database
- ORM
- authentication provider
- external backend
- state management library
- API framework

The first implementations may use mock data where appropriate.

The persistence layer should be introduced only when the application requirements make it necessary.

## Server and Client Components

Prefer Server Components by default.

Use Client Components only when client-side functionality is required.

Typical reasons for a Client Component include:

- `useState`
- `useEffect`
- event handlers
- browser APIs
- interactive UI state
- client-side libraries that require the browser

Do not add `"use client"` to large parts of the application unnecessarily.

Keep Client Components as small and focused as possible.

## State Management

Do not introduce a global state management library by default.

Prefer, in this order:

1. Server state and Server Components
2. URL state where appropriate
3. Local component state
4. React Context for genuinely shared client state
5. External state management only when clearly justified

Do not introduce libraries such as Zustand, Redux or similar tools without a concrete requirement.

## Data Fetching

Prefer Next.js and React built-in data fetching patterns.

Keep data fetching close to the server-side feature or page that requires it.

Do not introduce additional data-fetching libraries unless the existing stack cannot reasonably solve the requirement.

## Business Logic

Business logic should not be tightly coupled to UI components.

Examples of business logic in this project may include:

- determining the current dispatcher
- calculating rotation assignments
- handling substitutions
- checking absence conflicts
- determining responsibility for a given week

Prefer implementing this logic in feature-specific utilities or services so it can be tested independently from the UI.

## Reusable UI vs Feature Components

Reusable UI components:

```text
src/components/
```

Feature-specific components:

```text
src/features/<feature>/components/
```

Example:

```text
src/
├── components/
│   └── Card/
│       └── Card.tsx
└── features/
    └── rotations/
        └── components/
            └── RotationCard.tsx
```

`Card` is generic.

`RotationCard` contains rotation-specific meaning and therefore belongs inside the feature.

## Dependencies

Avoid introducing dependencies unless they solve a concrete problem.

Before adding a dependency, consider:

- Can the existing stack solve the problem?
- Is the dependency actively maintained?
- Does it significantly increase complexity?
- Will it become central to the architecture?
- Is the benefit worth the maintenance cost?

Agents should explain why a new dependency is needed before installing it.

## Error Handling

Handle expected errors explicitly.

Avoid silently swallowing errors.

User-facing errors should provide useful feedback where appropriate.

Technical errors should remain understandable during development and debugging.

## Accessibility

Accessibility should be considered part of the implementation rather than a later cleanup step.

Where applicable:

- use semantic HTML
- provide accessible names
- support keyboard interaction
- maintain visible focus states
- avoid relying only on color
- use appropriate ARIA attributes only when necessary

Prefer native HTML semantics before adding ARIA.

## Testing Strategy

Testing should focus on meaningful behavior.

Prioritize tests for:

- rotation calculations
- absence logic
- substitution logic
- date-related business rules
- regressions
- important user interactions

Avoid tests that only mirror implementation details.

Business logic should preferably be testable independently from React components.

## Initial Product Architecture

The first version of the application is expected to contain the following areas:

```text
Dashboard
│
├── Team
│
├── Absences
│
├── Rotations
│   ├── Dispatcher
│   └── Monitoring
│
└── Substitutions
```

This structure is conceptual.

Do not create routes, folders or abstractions purely because they appear in this document.

Create them when implementation work actually begins.

## Architectural Decisions

Larger architectural decisions should be documented in:

```text
docs/decisions/
```

Examples:

```text
docs/decisions/
├── 001-data-storage.md
├── 002-authentication.md
└── 003-deployment.md
```

Do not create decision documents before a real decision needs to be made.

## Architectural Principle

Prefer the simplest architecture that satisfies the current requirements.

Build incrementally.

Avoid speculative abstractions.

Refactor toward reusable patterns when repetition or complexity demonstrates the need.

The goal is not to predict every future requirement.

The goal is to keep the project understandable, maintainable and easy to evolve.
