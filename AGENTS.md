# Repository Guidelines

## Project Structure & Module Organization
`neko-ui` is an Expo + React Native component library.

- `src/components/`: component modules, typically one folder per component (for example `Header/`, `Button/`, `Widget/`).
- `src/hooks/`: reusable hooks.
- `src/index.ts`: top-level export surface for consumers.
- `app/`: local Expo Router demo screens used for manual validation.
- `.rnstorybook/`: React Native Storybook configuration and generated story registry.
- `assets/images/`: static assets for app/demo branding.
- `cli/`: package CLI entry (`neko-ui` binary).

Preferred component layout:
`ComponentName.tsx`, `ComponentName.types.ts`, `ComponentName.stories.tsx`, and `index.ts`.

## Hard Rule
- When you are asked to make changes, you need to do them in a deticated `codex/<topic>` branch

## Build, Lint, and Development Commands
- `npm run start`: start Expo dev server.
- `npm run ios` / `npm run android` / `npm run web`: launch Expo target platform.
- `npm run lint`: run Expo ESLint config.
- `npm run storybook-generate`: regenerate `.rnstorybook/storybook.requires.ts` after adding/removing stories.
- `npm run storybook:start`: run Storybook on port `6006`.
- `npm run build-storybook`: create static Storybook build.
- `npm run release`: run `release-it` (tags, changelog, GitHub release).

## Coding Style & Naming Conventions
- Language: TypeScript (`strict` mode enabled).
- Formatting/style: follow existing code style (2-space indentation, semicolons, double quotes).
- Use path alias imports via `@/*` when it improves clarity.
- Keep components in `PascalCase`; colocate types in `*.types.ts`.
- Keep story files as `*.stories.tsx` next to the component they document.
- Favor composable APIs (compound component pattern is common in this repo).

## Testing Guidelines
There is no dedicated automated test script configured yet. Current validation is story-driven:

- Add or update Storybook stories for every component behavior change.
- Verify behavior in Expo demo screens (`app/`) when interactions are complex.
- Always run `npm run lint` before opening a PR.

## Commit & Pull Request Guidelines
- Follow the existing commit style seen in history: short prefixes like `Feature: ...`, `Improvement: ...`, `Fix`, plus automated `chore(release): x.y.z`.
- Keep commits focused and scoped to one logical change.
- PRs should include:
  - concise summary of what changed and why,
  - linked issue (if applicable),
  - screenshots or short recordings for UI changes,
  - note of updated stories/components touched.
