# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Completion Signal

**IMPORTANT:** After completing any coding task, ALWAYS end your final message with:

👍👍👍 Done coding, READY to test!

This signals to the user that the implementation is complete and ready for testing.

## Commands

- `npm run dev` — Start Vite dev server (hot reload)
- `npm run build` — Type-check with `tsc -b` then bundle with Vite
- `npm run lint` — Run ESLint across the project
- `npm test` — Run all tests once with Vitest
- `npm run test:watch` — Run Vitest in watch mode
- `npx vitest run src/App.test.tsx` — Run a single test file
- `npm run preview` — Preview the production build locally

## Architecture

React 19 + TypeScript app scaffolded with Vite 7. Entry point is `index.html` → `src/main.tsx` → `src/App.tsx`.

- **src/** — Application source (components, styles, assets)
- **public/** — Static assets served as-is
- **vite.config.ts** — Vite configuration with `@vitejs/plugin-react`
- **tsconfig.json** — TypeScript project references split into `tsconfig.app.json` (app code) and `tsconfig.node.json` (tooling/config code)
- **eslint.config.js** — Flat ESLint config with `react-hooks` and `react-refresh` plugins

## Testing

Tests use **Vitest** with **jsdom** environment and **@testing-library/react**. Global test APIs (`describe`, `it`, `expect`) are enabled — no imports needed. Test setup in `src/test/setup.ts` registers `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument()`). Place test files next to source as `*.test.tsx`.
