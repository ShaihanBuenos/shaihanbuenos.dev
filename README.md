# shaihanbuenos.dev

The source code of [shaihanbuenos.dev](https://shaihanbuenos.dev), the personal site of Shaihan Buenos. The site is not live yet.

Static site in two languages: English at the root and Portuguese under `/pt-br`.

## Stack

Astro · TypeScript · plain CSS · Cloudflare Workers (static assets) · Node test runner

## Run

```bash
npm ci && npm run dev
scripts/check          # format, lint, types, build and tests
```

More in [`docs/desenvolvimento.md`](docs/desenvolvimento.md) (in Portuguese).

## Where things are

- `src/pages/`: one file per address; Portuguese pages under `src/pages/pt-br/`
- `src/layouts/`: the document shared by every page
- `src/lib/`: languages, the launch switch and the feed
- `tests/`: tests that run against the built site
- `DESIGN.md`, `PRODUCT.md`, `GLOSSARY.md`: the design system, what the site is for and its vocabulary
