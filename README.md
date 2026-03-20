# Money Manager Viewer

A browser-based viewer for **Money Manager** (by Real Byte Apps) `.mmbak` backup files. Upload your backup once and explore your spending history — all processing happens locally in the browser, nothing is sent to any server.

---

## Features

- **Zero-server parsing** — uses [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly) to read `.mmbak` files directly in the browser
- **Session persistence** — the backup is stored in IndexedDB so the dashboard survives page refreshes without re-uploading
- **Time filters** — All Time / This Year / Last Year
- **Spending by Category** — bar chart (top 10) + scrollable breakdown table with share %
- **Transaction list** — search by note or category, sort by amount (sign-aware), include/exclude category filter
- **Summary cards** — total income, total expense, and balance

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then:

1. Export your backup from Money Manager → **Settings → Backup → Local Backup**
2. Drop the `.mmbak` file on the upload page
3. Explore your spending on the dashboard

```bash
npm test          # run all unit tests (Vitest)
npm run build     # production build
```

---

## Architecture

### Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| DB parsing | sql.js (SQLite → WASM) |
| Charts | Recharts |
| Icons | lucide-react |
| Tests | Vitest + @testing-library/react |

### `.mmbak` File Format

A `.mmbak` file is a standard **SQLite 3 database**. Key tables:

| Table | Purpose |
|-------|---------|
| `INOUTCOME` | All transactions (income, expense, transfer, adjustment) |
| `ZCATEGORY` | Category definitions (`type=0` income, `type=1` expense) |
| `CURRENCY` | Currency symbol lookup |

Important: `DO_TYPE` and `AMOUNT_ACCOUNT` columns are stored as `VARCHAR` in the schema, so all values are coerced to `Number` in the mapping layer.

`DO_TYPE` values:
- `0` — income
- `1` — expense
- `3` — transfer (excluded from the UI)
- `4`, `7` — adjustments (excluded)

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout — wraps app in DbProvider
│   ├── page.tsx            # Upload landing page
│   ├── globals.css
│   └── dashboard/
│       └── page.tsx        # Main dashboard (filter + all components)
│
├── components/
│   ├── FileUpload.tsx           # Drag-and-drop / click-to-browse uploader
│   ├── FilterTabs.tsx           # All Time / This Year / Last Year tabs
│   ├── SummaryCards.tsx         # Income / Expense / Balance cards
│   ├── SpendingChart.tsx        # Recharts bar chart (top 10 categories)
│   ├── CategoryTable.tsx        # Scrollable breakdown table with pinned footer
│   ├── TransactionList.tsx      # Searchable, sortable, filterable transaction table
│   ├── CategoryFilterPopover.tsx # Include/exclude category filter popover
│   └── __tests__/              # Component unit tests
│
├── context/
│   └── DbContext.tsx       # React context: holds parsed DB, handles restore
│
└── lib/
    ├── types.ts            # Shared TypeScript types
    ├── db.ts               # sql.js query helpers (getTransactions, getSummary, …)
    ├── storage.ts          # IndexedDB helpers (saveBackup, loadBackup, clearBackup)
    └── __tests__/          # Unit tests for db and storage layers
```

---

## Data Flow

```
User drops .mmbak
       │
       ▼
FileUpload.processFile()
  └─ reads ArrayBuffer → Uint8Array
  └─ DbContext.loadDb(bytes, name)
       ├─ initSqlJs() → sql.js Database
       ├─ setDb(db)  ← React state
       └─ saveBackup(bytes, name) → IndexedDB
       │
       ▼
router.push("/dashboard")
       │
       ▼
DashboardPage
  └─ reads db from DbContext
  └─ calls getTransactions / getSummary / getCategorySpending
  └─ renders components

— On next page refresh —
DbContext (useEffect on mount)
  └─ loadBackup() from IndexedDB
  └─ initSqlJs(bytes) → restore db
  └─ auto-redirect to /dashboard (via FileUpload useEffect)
```

---

## Key Implementation Notes

### Column coercion in db.ts
`DO_TYPE` is `VARCHAR` in the schema, so sql.js returns strings (`"0"`, `"1"`). All numeric columns are explicitly coerced with `Number()` at the mapping layer to prevent strict-equality bugs (`"0" === 0` → `false`).

### Amount sorting (sign-aware)
The sort in `TransactionList` uses a signed value: `income = +amount`, `expense = −amount`. Descending order puts the largest income first and the biggest expense last; ascending reverses that.

### CategoryTable layout
Uses three separate `<table>` elements sharing identical `colgroup` width definitions (`table-fixed`) so columns stay aligned across the fixed header, scrollable body (6 rows default), and pinned footer.

### IndexedDB persistence
`src/lib/storage.ts` wraps IndexedDB with a simple key-value store (one record, key `"current"`). `DbContext` checks it on mount and initialises sql.js silently. Errors (e.g. private browsing) are caught and silently ignored — the user just needs to re-upload.

### WASM serving
`public/sql-wasm.wasm` is a copy of the sql.js WASM binary served locally. `locateFile` in sql.js init is set to `() => "/sql-wasm.wasm"` to avoid CDN/CORS issues.

---

## Testing

62 unit tests across 9 test files:

| File | What's tested |
|------|--------------|
| `lib/__tests__/db.test.ts` | Date range helpers, getTransactions, getSummary, getCategorySpending, getCategories — using an in-memory sql.js DB |
| `lib/__tests__/storage.test.ts` | IndexedDB save/load/clear round-trips (via `fake-indexeddb`) |
| `components/__tests__/FileUpload.test.tsx` | Upload area rendering, wrong extension error, restoring spinner |
| `components/__tests__/FilterTabs.test.tsx` | Tab rendering, aria-selected, onChange callback |
| `components/__tests__/SummaryCards.test.tsx` | Amount formatting, card rendering |
| `components/__tests__/SpendingChart.test.tsx` | Empty state, chart heading, Y-axis formatting |
| `components/__tests__/CategoryTable.test.tsx` | Row rendering, totals row, share percentages |
| `components/__tests__/TransactionList.test.tsx` | Search, amount sort (sign-aware), income/expense colours, pagination, category filter |
| `components/__tests__/CategoryFilterPopover.test.tsx` | Include/exclude mode, checkbox toggle, active badge, clear |
