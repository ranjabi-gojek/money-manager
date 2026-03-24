# CLAUDE.md — Money Manager Viewer

## Project overview

Browser-based viewer for Money Manager (Real Byte Apps) `.mmbak` backup files. Parses SQLite entirely client-side via sql.js (WASM). No backend. See README.md for full architecture docs.

## Commands

```bash
npm run dev     # start dev server at localhost:3000
npm test        # run all 62 unit tests (Vitest)
npm run build   # production build
```

## Critical gotchas

### VARCHAR columns
`INOUTCOME.DO_TYPE` and `INOUTCOME.AMOUNT_ACCOUNT` are `VARCHAR` in the schema. sql.js returns them as JS strings. Always wrap with `Number()` when doing arithmetic or strict equality — never `row[n] === 0`, always `Number(row[n]) === 0`.

### WASM location
`public/sql-wasm.wasm` must stay in `public/`. The `locateFile` in sql.js init (in `DbContext.tsx`) points to `/sql-wasm.wasm`. If the WASM moves, update that path.

### sql.js is async
`initSqlJs()` returns a Promise. Never call it synchronously. All DB initialisation happens in `DbContext.loadDb()` and the mount effect.

### IndexedDB in tests
jsdom doesn't have IndexedDB. Tests that touch `src/lib/storage.ts` must import `"fake-indexeddb/auto"` at the top.

### DO_TYPE values
- `0` = income (shown green `+`)
- `1` = expense (shown red `−`)
- `3`, `4`, `7` = transfer/adjustment — **excluded** from `getTransactions` and `getCategorySpending` queries

## File map (quick reference)

| Path | Role |
|------|------|
| `src/lib/types.ts` | All shared types |
| `src/lib/db.ts` | sql.js query helpers |
| `src/lib/storage.ts` | IndexedDB save/load/clear |
| `src/context/DbContext.tsx` | Shared DB state + IndexedDB restore on mount |
| `src/app/page.tsx` | Upload page |
| `src/app/dashboard/page.tsx` | Dashboard (composes all components) |
| `src/components/FileUpload.tsx` | Drag-and-drop uploader |
| `src/components/FilterTabs.tsx` | All Time / This Year / Last Year |
| `src/components/SummaryCards.tsx` | Income / Expense / Balance cards |
| `src/components/SpendingChart.tsx` | Recharts bar chart |
| `src/components/CategoryTable.tsx` | Scrollable table with pinned footer |
| `src/components/TransactionList.tsx` | Search + sort + category filter |
| `src/components/CategoryFilterPopover.tsx` | Include/exclude category popover |
| `public/sql-wasm.wasm` | sql.js WebAssembly binary |

## URL search params

Filters are persisted in the URL so they survive refresh and can be bookmarked/shared.

| Param | Values | Owner |
|-------|--------|-------|
| `tf` | `yearly` \| `monthly` (omit for all-time) | `FilterTabs` via page |
| `year` | e.g. `2026` | `FilterTabs` via page |
| `month` | `1`–`12` | `FilterTabs` via page |
| `q` | search text | `TransactionList` |
| `sort` | `asc` \| `desc` (omit for none) | `TransactionList` |
| `ps` | page size (omit if default 10) | `TransactionList` |
| `cat` | comma-separated category names | `TransactionList` |
| `catMode` | `exclude` (omit if include) | `TransactionList` |

Pages wrap their content in `<Suspense>` (required by Next.js for `useSearchParams`).
`TransactionList` reads params on mount and writes on every filter change via `router.replace`.

## Workflow

After completing any code change task:
- Always run `npm test` and `npm run build`
- Make sure current test is not breaking, adjust test accordingly when there's a change in the feature
- Add another test if new feature introduced
- Create a git commit — without waiting to be asked. If tests fail, fix them first.

## Test conventions

- Tests live in `__tests__/` next to the file they test
- Use `vi.mock("@/context/DbContext", ...)` to isolate components from the DB
- Use `vi.mock("next/navigation", ...)` to mock router
- Component tests use `@testing-library/react` with jsdom
- db.ts tests build a real in-memory sql.js Database in `beforeAll`
- Always run `npm test` after changes and fix failures before committing
