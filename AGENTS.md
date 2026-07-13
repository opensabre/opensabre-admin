# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vue 3 + Vite + TypeScript admin frontend. Application code lives in `src/`: routes in `src/router`, Pinia stores in `src/store`, shared composables in `src/composables`, plugins in `src/plugins`, directives in `src/directives`, and API/UI types in `src/types`. Static assets are split between `src/assets` and `public`. Mock API handlers are in `mock`. Unit tests live under `tests/unit`, with shared setup in `tests/setup.ts`. Root config includes `vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`, and `uno.config.ts`.

## Build, Test, and Development Commands

Use Node.js 22.18.0 and `pnpm`; the `preinstall` hook rejects other package managers. In non-interactive shells, ensure `/Users/zhoutaoo/.nvm/versions/node/v22.18.0/bin` is first in `PATH` before running Node or pnpm commands.

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the Vite development server.
- `pnpm build`: run `vue-tsc --noEmit` and produce a production build.
- `pnpm build-only`: run only the Vite build.
- `pnpm type-check`: run TypeScript/Vue type checking.
- `pnpm test`: start Vitest in watch mode.
- `pnpm test:run`: run the test suite once for CI-style verification.
- `pnpm test:coverage`: generate V8 coverage reports.
- `pnpm lint`: run ESLint, Prettier, and Stylelint fixes.

## Coding Style & Naming Conventions

Write Vue single-file components in `template`, `script`, `style` order. Component tags in templates should use `PascalCase`; Vue multi-word component names are not required. Prefer TypeScript, `const` where possible, object shorthand, and no `var`. Use the `@` alias for imports from `src`. Avoid manual edits to generated declarations such as `src/types/auto-imports.d.ts`.

## Testing Guidelines

Vitest runs in `happy-dom` with global test APIs enabled. Place tests in `tests/**/*.{test,spec}.{js,ts}`; current examples use `tests/unit/store/*.test.ts` and `tests/unit/components/*.test.ts`. Prefer focused unit tests for stores, composables, and reusable components. Run `pnpm test:run` before submitting changes.

## Commit & Pull Request Guidelines

Commits follow Conventional Commits enforced by Commitlint. Allowed types include `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`, `chore`, and `wip`. Use `pnpm commit` for the guided Commitizen flow, or write messages like `fix: 修正 API 成功响应码`. Pull requests should include a concise description, linked issues when applicable, test results, and screenshots or recordings for visible UI changes.

## Security & Configuration Tips

Do not commit credentials, production tokens, or local environment overrides. Keep deployment changes scoped to `Dockerfile`, `nginx.conf`, or documented environment configuration. The OpenSabre server supports passwordless SSH via `ssh root@opensabre`; use it only for requested deployment or diagnostics.
