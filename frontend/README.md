# frontend

The GitPay marketing site: a React 19 + Vite + TypeScript single page, deployed to GitHub Pages.

It is not part of the Action. Nothing in `src/` imports it, it is not bundled into `dist/`, and its
dependencies do not count toward the Action's runtime dependency limit (I11) — they live in this
folder's own `package.json` and never ship to adopters.

## Develop

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck, then build to frontend/dist
npm run preview   # serve the production build
```

## Layout

```
src/
  main.tsx, App.tsx      entry and page order
  styles.css             design tokens (dark-first, light theme included) and all styles
  hooks.ts               reduced motion, in-view, interval, reveal, count-up
  components/ui.tsx      window chrome, spotlight cards, reveal wrapper, copy helper
  sections/              one file per page section
  lib/core.ts            the only import from the Action's code (see below)
```

## The policy playground runs the real code

`src/lib/core.ts` re-exports `evaluate`, `format` and `assertAllowed` from `src/core/policy.ts`,
`toAtomic` from `src/core/amount.ts` and `canonical` from `src/core/idempotency.ts`. Those modules
are pure (no chain library, no network, no Node APIs — invariant I1), so the browser runs exactly
what the Action runs, and the log in the playground is the Action's own output. A change to policy
conditions or evidence strings shows up on the site automatically. Only the import direction
`frontend → src/core` is allowed; core must never import from here.

## Deploy

`.github/workflows/pages.yml` builds on every pull request that touches `frontend/` or
`src/core/`, and deploys to Pages on pushes to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build uses relative asset paths (`base: "./"` in `vite.config.ts`), so it works under
`https://<org>.github.io/<repo>/` without naming the repository.
