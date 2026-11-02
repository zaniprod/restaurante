# Sistema de Caixa + Gestão Financeira — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where a shared cashier screen registers restaurant sales (items + split payments) and an admin area shows revenue reports, tracks expenses and itemized market purchases, and computes the business balance.

**Architecture:** Next.js (App Router, TypeScript) deployed on Vercel, with Supabase (Postgres + Auth + Storage) as the backend. Two route groups guarded by role (`operador` → `/caixa`, `admin` → `/admin`), a small set of pure functions for cart/payment/report math (fully unit-tested), and Next.js Server Actions for all writes to Supabase, relying on Postgres Row Level Security as the real security boundary (not just UI gating).

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest + React Testing Library, Supabase CLI (local Postgres via Docker) for migrations and integration tests.

**Spec:** `docs/superpowers/specs/2026-11-02-sistema-caixa-restaurante-design.md`

## Global Constraints

- Payment methods are exactly three: `dinheiro`, `pix`, `cartao`. A single sale may split its total across more than one.
- Cash payments auto-calculate change; no other payment method does.
- "Buffet por KG" is a direct R$ value entry (the scale shows the final price) — never weight × price/kg.
- No discounts or manual total adjustments exist anywhere in the sale flow; the total is always the exact sum of lines.
- Editing or cancelling a sale requires no password and has no time limit (any past sale is editable); every edit/cancel is visibly tagged and the full prior state is preserved for traceability.
- Edit/cancel is available both at the cashier screen and from the admin panel.
- Reports are always computed live from current data (never a frozen daily snapshot).
- There is no menu-editing UI; menu items are seeded/updated directly in the database.
- Expenses have no fixed category, just a free-text description.
- Market purchases are entered item-by-item (product, quantity, value) with a photo attached for reference; there is no per-product aggregation report in v1 — only structured capture for later use.
- Only two roles exist: `operador` (shared login) and `admin` (individual accounts, one per owner).

## Review Focus

- Split payments whose amounts don't sum exactly to the sale total because of floating-point centavos — the app must compare in integer cents, not floats, and refuse to finalize on mismatch.
- A cash payment where the amount received is less than the cash portion due — must block finalization instead of producing a negative/nonsensical change.
- Editing a sale that originally had multiple payment methods — the snapshot taken before the edit must capture every item line and every payment row, not just the total.
- A revenue or balance report for a period with zero completed sales, or only cancelled ones — must render R$ 0,00 cleanly, and cancelled sales must never contribute to revenue totals while still appearing (tagged) in the sales list.
- Double-submitting "finalizar venda" (slow network, impatient double-click) — must not create two sales for one checkout.

---

## File Structure

```
src/
  app/
    layout.tsx
    page.tsx                       # redirects by role after login
    login/page.tsx
    caixa/
      layout.tsx                   # guard: role in (operador, admin)
      page.tsx
    admin/
      layout.tsx                   # guard: role = admin
      page.tsx                     # revenue dashboard
      vendas/page.tsx               # daily sales list, edit/cancel
      despesas/page.tsx
      compras/page.tsx
      balanco/page.tsx
  lib/
    supabase/
      client.ts                    # browser client
      server.ts                    # server client (reads cookies)
    pos/
      cart.ts
      cart.test.ts
      payments.ts
      payments.test.ts
    reports/
      revenue.ts
      revenue.test.ts
      balance.ts
      balance.test.ts
    sales/
      actions.ts
      actions.test.ts
    expenses/
      actions.ts
      actions.test.ts
    purchases/
      actions.ts
      actions.test.ts
  components/
    caixa/
      MenuGrid.tsx
      MenuGrid.test.tsx
      Cart.tsx
      Cart.test.tsx
      PaymentForm.tsx
      PaymentForm.test.tsx
    admin/
      SalesList.tsx
      ExpenseForm.tsx
      PurchaseForm.tsx
  types/
    database.ts
middleware.ts
supabase/
  migrations/
    0001_init.sql
    0002_rls.sql
  seed/
    menu_items.sql
    seed_users.ts
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `src/lib/sanity.test.ts`

**Interfaces:**
- Produces: a running `npm run dev` Next.js app and a working `npm test` (Vitest) command, used by every later task.

- [ ] **Step 1: Scaffold Next.js app** with `npx create-next-app@latest` (TypeScript, App Router, Tailwind CSS, no `src/` prompt override — keep the `src/` layout).
- [ ] **Step 2: Add Vitest + React Testing Library** (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`) and a `vitest.config.ts` with the `jsdom` environment.
- [ ] **Step 3: Write a trivial failing test** in `src/lib/sanity.test.ts`: `expect(1 + 1).toBe(2)` — just to prove the runner works end to end.
- [ ] **Step 4: Run `npm test` to verify it passes.**
- [ ] **Step 5: Commit.**

```bash
git add package.json tsconfig.json vitest.config.ts tailwind.config.ts src/
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Database schema, RLS, and seed data

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_rls.sql`, `supabase/seed/menu_items.sql`, `supabase/seed/seed_users.ts`

**Interfaces:**
- Produces: the full Postgres schema every later task reads/writes — table and column names below are exact and must not change.

- [ ] **Step 1: Install the Supabase CLI and run `supabase init` + `supabase start`** (local Postgres via Docker) so migrations can be applied and tested locally before touching the hosted project.
- [ ] **Step 2: Write `0001_init.sql`** with exactly these tables:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('operador','admin')),
  name text not null
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  price numeric(10,2),
  manual_value boolean not null default false,
  active boolean not null default true
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'completed' check (status in ('completed','cancelled')),
  total numeric(10,2) not null,
  edited boolean not null default false
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null
);

create table sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null check (method in ('dinheiro','pix','cartao')),
  amount numeric(10,2) not null,
  cash_received numeric(10,2),
  change_given numeric(10,2)
);

create table sale_edits (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  snapshot jsonb not null,
  edited_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  photo_url text,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_name text not null,
  quantity text not null,
  value numeric(10,2) not null
);
```

- [ ] **Step 3: Write `0002_rls.sql`.** Enable RLS on every table above. Policies:
  - `profiles`: a user may `select` only their own row (`id = auth.uid()`).
  - `menu_items`: any authenticated user may `select`; no insert/update/delete policy exists for any role (writes happen only via the Supabase SQL editor/service role).
  - `sales`, `sale_items`, `sale_payments`, `sale_edits`: `select`, `insert`, `update` allowed when `auth.uid()` has a `profiles.role` of `operador` or `admin`. No `delete` policy (cancelling is an `update`, never a row deletion).
  - `expenses`, `purchases`, `purchase_items`: `select`, `insert`, `update` allowed only when `auth.uid()` has `profiles.role = 'admin'`.
- [ ] **Step 4: Apply both migrations to the local stack** with `supabase db reset` and confirm no errors.
- [ ] **Step 5: Write `supabase/seed/menu_items.sql`** inserting the ~65 items from `Cardápio/cardapio_calcadao.xlsx`, grouped by the sheet's `Categoria` column, using the sheet's `Preço (R$)` values. Set `manual_value = true` and `price = null` only for the "Buffet por KG" row; every other row gets its listed numeric price. Skip the rows whose price is blank/crossed-out in the sheet (Xis Mignon à Moda da Casa, À la Minuta de Bife, À la Minuta de Frango) until the spec's pending prices are confirmed — insert them with `active = false` so they exist but don't show on the grid yet.
- [ ] **Step 6: Write `supabase/seed/seed_users.ts`**, a one-off script using the Supabase service-role key to create 3 `auth.users` (one `operador`, two `admin`) via `supabase.auth.admin.createUser`, then insert matching `profiles` rows with the right `role` and `name`. Document the required env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in a comment at the top of the file.
- [ ] **Step 7: Run the seed script against the local stack** and verify in Supabase Studio that 3 users and ~65 menu items exist.
- [ ] **Step 8: Commit.**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and seed data"
```

---

### Task 3: Auth, session middleware, and role-guarded layouts

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `middleware.ts`, `src/app/login/page.tsx`, `src/app/caixa/layout.tsx`, `src/app/admin/layout.tsx`, `src/app/page.tsx`
- Test: `src/app/login/login.test.tsx`

**Interfaces:**
- Consumes: `profiles` table from Task 2 (`id`, `role`, `name`).
- Produces: `createBrowserClient()` in `client.ts` and `createServerClient()` in `server.ts` — every later task that talks to Supabase from a Server Action or Server Component imports one of these two.

- [ ] **Step 1: Write `src/lib/supabase/client.ts`** exporting `createBrowserClient(): SupabaseClient`, and `src/lib/supabase/server.ts` exporting `async function createServerClient(): Promise<SupabaseClient>` (reads/writes auth cookies via `next/headers`, per `@supabase/ssr` docs).
- [ ] **Step 2: Write `middleware.ts`** refreshing the Supabase session cookie on every request (standard `@supabase/ssr` middleware pattern).
- [ ] **Step 3: Write `src/app/login/page.tsx`**: a single email+password form that calls `supabase.auth.signInWithPassword` and redirects to `/` on success.
- [ ] **Step 4: Write the failing test** for the login page in `login.test.tsx`: renders a form with an email field, a password field, and a submit button labeled "Entrar".
- [ ] **Step 5: Run the test, confirm it fails, then implement the page to pass it.**
- [ ] **Step 6: Write `src/app/page.tsx`**: a server component that reads the current user's `profiles.role` and redirects — `operador` → `/caixa`, `admin` → `/admin`, no session → `/login`.
- [ ] **Step 7: Write `src/app/caixa/layout.tsx`** and `src/app/admin/layout.tsx`: each is a server component that loads `profiles.role` for the current session and calls `redirect('/login')` if there's no session, or `redirect('/caixa')`/`redirect('/admin')` if the role doesn't match that section (`admin`-only for `/admin`; `operador` or `admin` for `/caixa`).
- [ ] **Step 8: Run full test suite, confirm green.**
- [ ] **Step 9: Commit.**

```bash
git add src/lib/supabase middleware.ts src/app/login src/app/page.tsx src/app/caixa/layout.tsx src/app/admin/layout.tsx
git commit -m "feat: add Supabase auth, session middleware, and role-guarded layouts"
```

---

### Task 4: Cart logic

**Files:**
- Create: `src/lib/pos/cart.ts`
- Test: `src/lib/pos/cart.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type MenuItem = { id: string; category: string; name: string; price: number | null; manualValue: boolean };
  export type CartLine = { menuItemId: string; name: string; quantity: number; unitPrice: number; lineTotal: number };
  export function addItem(cart: CartLine[], item: MenuItem): CartLine[];
  export function addManualValueLine(cart: CartLine[], item: MenuItem, value: number): CartLine[];
  export function removeLine(cart: CartLine[], index: number): CartLine[];
  export function cartTotalCents(cart: CartLine[]): number; // avoids float drift; UI divides by 100 to display
  ```
  Later tasks (6, 7) import these names and types as-is.

- [ ] **Step 1: Write failing tests:**
  - `addItem` on an empty cart with a fixed-price item (`price: 10`) produces one line with `quantity: 1, unitPrice: 10, lineTotal: 10`.
  - `addItem` called twice with the same `menuItemId` increments that line's `quantity` to `2` and recomputes `lineTotal`, instead of adding a second line.
  - `addManualValueLine` with `value: 37.5` adds a line with `quantity: 1, unitPrice: 37.5, lineTotal: 37.5`, independent of the item's (null) `price`.
  - `removeLine` removes the line at the given index and leaves the others untouched.
  - `cartTotalCents` on a cart with lines totaling `10 + 37.5` returns `4750`.
- [ ] **Step 2: Run `npm test cart.test.ts`, confirm all fail.**
- [ ] **Step 3: Implement the four functions and the types above.** `cartTotalCents` must sum via `Math.round(line.lineTotal * 100)` per line, not sum floats then multiply, to avoid drift.
- [ ] **Step 4: Run the tests, confirm all pass.**
- [ ] **Step 5: Commit.**

```bash
git add src/lib/pos/cart.ts src/lib/pos/cart.test.ts
git commit -m "feat: add cart logic for the cashier screen"
```

---

### Task 5: Payment splitting and change logic

**Files:**
- Create: `src/lib/pos/payments.ts`
- Test: `src/lib/pos/payments.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (pure, standalone).
- Produces:
  ```ts
  export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao';
  export type PaymentEntry = { method: PaymentMethod; amount: number; cashReceived?: number };
  export function validatePayments(payments: PaymentEntry[], totalCents: number): { valid: boolean; error?: string };
  export function calculateChangeCents(cashReceivedCents: number, cashAmountDueCents: number): number;
  ```
  Task 6/7 import these as-is; `totalCents` matches `cartTotalCents` from Task 4.

- [ ] **Step 1: Write failing tests:**
  - `validatePayments` with one `dinheiro` entry whose `amount` (in reais) converts to the exact `totalCents` returns `{ valid: true }`.
  - `validatePayments` with a `dinheiro` + `cartao` split summing to exactly `totalCents` returns `{ valid: true }`.
  - `validatePayments` whose amounts sum to 1 centavo less/more than `totalCents` returns `{ valid: false, error: ... }` (pins the centavo-rounding Review Focus item).
  - `calculateChangeCents(5000, 3490)` returns `1510`.
  - `calculateChangeCents(2000, 3490)` (received less than due) returns a negative number (`-1490`) — callers must treat negative as "insufficient, block finalize" (pins the second Review Focus item).
- [ ] **Step 2: Run `npm test payments.test.ts`, confirm all fail.**
- [ ] **Step 3: Implement both functions**, converting each `amount`/`cashReceived` (reais, possibly fractional) to integer cents via `Math.round(value * 100)` before comparing or subtracting.
- [ ] **Step 4: Run the tests, confirm all pass.**
- [ ] **Step 5: Commit.**

```bash
git add src/lib/pos/payments.ts src/lib/pos/payments.test.ts
git commit -m "feat: add payment split validation and change calculation"
```

---

### Task 6: Caixa UI — menu grid, cart, payment form

**Files:**
- Create: `src/components/caixa/MenuGrid.tsx`, `src/components/caixa/Cart.tsx`, `src/components/caixa/PaymentForm.tsx`
- Test: `src/components/caixa/MenuGrid.test.tsx`, `src/components/caixa/Cart.test.tsx`, `src/components/caixa/PaymentForm.test.tsx`

**Interfaces:**
- Consumes: `MenuItem`, `CartLine`, `addItem`, `addManualValueLine`, `removeLine`, `cartTotalCents` from Task 4; `PaymentMethod`, `PaymentEntry`, `validatePayments`, `calculateChangeCents` from Task 5.
- Produces:
  ```ts
  // MenuGrid.tsx
  export function MenuGrid(props: { items: MenuItem[]; onSelect: (item: MenuItem, manualValue?: number) => void }): JSX.Element;
  // Cart.tsx
  export function Cart(props: { lines: CartLine[]; onRemove: (index: number) => void }): JSX.Element;
  // PaymentForm.tsx
  export function PaymentForm(props: { totalCents: number; onConfirm: (payments: PaymentEntry[]) => void }): JSX.Element;
  ```
  Task 7's `caixa/page.tsx` composes all three.

- [ ] **Step 1: Write failing test for `MenuGrid`:** given items in two categories, renders both category headings and a clickable button per item showing its name and formatted price; clicking a fixed-price item calls `onSelect(item)`; clicking the one item with `manualValue: true` opens a numeric input, and submitting `37.5` calls `onSelect(item, 37.5)`.
- [ ] **Step 2: Write failing test for `Cart`:** renders one row per line with name, quantity, and formatted `lineTotal`; renders the formatted `cartTotalCents` sum; clicking a line's remove button calls `onRemove(index)`.
- [ ] **Step 3: Write failing test for `PaymentForm`:** starts with one `dinheiro` row; typing an amount and clicking "Adicionar forma de pagamento" adds a second row with a method selector (`dinheiro`/`pix`/`cartao`); if any row is `dinheiro`, a "valor recebido" field appears and the computed change (via `calculateChangeCents`) is displayed; clicking "Confirmar" calls `onConfirm` with the entered `PaymentEntry[]` only when `validatePayments` returns `valid: true`, and instead shows the returned `error` text when it doesn't.
- [ ] **Step 4: Run all three test files, confirm failures.**
- [ ] **Step 5: Implement `MenuGrid`, `Cart`, and `PaymentForm`** to the signatures above, formatting all money as `R$ X,XX` (reais with comma decimal).
- [ ] **Step 6: Run the tests, confirm all pass.**
- [ ] **Step 7: Commit.**

```bash
git add src/components/caixa
git commit -m "feat: add menu grid, cart, and payment form components"
```

---

### Task 7: Create-sale server action and the Caixa page

**Files:**
- Create: `src/lib/sales/actions.ts`, `src/app/caixa/page.tsx`
- Test: `src/lib/sales/actions.test.ts`

**Interfaces:**
- Consumes: `createServerClient` (Task 3); `CartLine`, `cartTotalCents` (Task 4); `PaymentEntry` (Task 5); `MenuGrid`, `Cart`, `PaymentForm` (Task 6).
- Produces:
  ```ts
  export async function getMenuItems(): Promise<MenuItem[]>;
  export async function createSale(lines: CartLine[], payments: PaymentEntry[]): Promise<{ id: string }>;
  ```
  Task 8 imports `createSale`'s row shape (it edits/cancels what this writes).

- [ ] **Step 1: Write a failing integration test** against the local Supabase stack (seeded per Task 2): signed in as the seeded `operador`, call `createSale` with two fixed-price lines and a single `dinheiro` payment equal to the total; assert a `sales` row exists with matching `total` and `status: 'completed'`, exactly 2 `sale_items` rows, and exactly 1 `sale_payments` row with the right `method`/`amount`.
- [ ] **Step 2: Add a second failing case in the same file:** calling `createSale` signed in as a user with no `profiles` row (or no session) is rejected by RLS (the insert throws/returns an error) — pins that security lives in Postgres, not just the UI.
- [ ] **Step 3: Run the test file, confirm both fail** (function doesn't exist yet).
- [ ] **Step 4: Implement `getMenuItems`** (selects active `menu_items`) and `createSale`** (inserts one `sales` row, its `sale_items`, and its `sale_payments` in sequence, returning the new sale's `id`).
- [ ] **Step 5: Run the test, confirm both pass.**
- [ ] **Step 6: Write `src/app/caixa/page.tsx`:** a client component holding `cart: CartLine[]` and composing `MenuGrid` (from `getMenuItems`, loaded server-side and passed in), `Cart`, and `PaymentForm`; `PaymentForm`'s `onConfirm` calls `createSale`, then clears the cart and shows a success confirmation. Disable the "Confirmar" button for the duration of the `createSale` call so a slow network or a double-click can't submit the same cart twice (pins the double-submit Review Focus item).
- [ ] **Step 7: Run the full test suite, confirm green.**
- [ ] **Step 8: Commit.**

```bash
git add src/lib/sales/actions.ts src/lib/sales/actions.test.ts src/app/caixa/page.tsx
git commit -m "feat: add createSale action and wire up the caixa page"
```

---

### Task 8: Edit/cancel sale and the daily sales list

**Files:**
- Modify: `src/lib/sales/actions.ts`
- Create: `src/components/admin/SalesList.tsx`, `src/app/admin/vendas/page.tsx`
- Modify: `src/app/caixa/page.tsx` (add a sales-list view with edit/cancel, reusing `SalesList`)
- Test: `src/lib/sales/actions.test.ts` (extend), `src/components/admin/SalesList.test.tsx`

**Interfaces:**
- Consumes: `createServerClient`, the `sales`/`sale_items`/`sale_payments`/`sale_edits` schema from Task 2, `createSale`'s row shapes from Task 7.
- Produces:
  ```ts
  export async function listSalesByDate(date: string): Promise<SaleWithDetails[]>; // SaleWithDetails = sale + items + payments + edited/status
  export async function editSale(saleId: string, lines: CartLine[], payments: PaymentEntry[]): Promise<void>;
  export async function cancelSale(saleId: string): Promise<void>;
  ```
  Task 9's revenue report consumes `SaleWithDetails`.

- [ ] **Step 1: Write failing tests for `editSale`:** given an existing sale (from Task 7's helper), calling `editSale` with different lines/payments (a) writes a `sale_edits` row whose `snapshot` contains the sale's original items and payments in full, (b) updates the `sales.total`, `sale_items`, and `sale_payments` to the new values, and (c) sets `sales.edited = true`.
- [ ] **Step 2: Write a failing test for `cancelSale`:** sets `sales.status = 'cancelled'` and writes a `sale_edits` snapshot of the pre-cancel state, leaving `sale_items`/`sale_payments` untouched.
- [ ] **Step 3: Write a failing test for `listSalesByDate`:** given one completed, one edited, and one cancelled sale on the same date, returns all three with their correct `status`/`edited` flags, and a sale on a different date is excluded.
- [ ] **Step 4: Run the test file, confirm all three fail.**
- [ ] **Step 5: Implement `editSale`, `cancelSale`, `listSalesByDate`** per the assertions above (snapshot is taken by reading the current rows before any update, inside the same function).
- [ ] **Step 6: Run the tests, confirm all pass.**
- [ ] **Step 7: Write a failing test for `SalesList`:** renders one row per `SaleWithDetails` with its total and a visible "Editada" or "Cancelada" badge when applicable (no badge otherwise); each row has "Editar" and "Cancelar" buttons that call the corresponding callback props with the sale's `id`.
- [ ] **Step 8: Run it, confirm it fails, then implement `SalesList`** to pass.
- [ ] **Step 9: Write `src/app/admin/vendas/page.tsx`:** loads `listSalesByDate` for a date picked via a date input (default today), renders `SalesList`, and wires "Editar" to a form reusing `Cart`/`PaymentForm` from Task 6 (pre-filled with the sale's current lines/payments) and "Cancelar" to a confirmation that calls `cancelSale`.
- [ ] **Step 10: Add the same `SalesList` (today only, no date picker) to `src/app/caixa/page.tsx`** so the cashier screen can also edit/cancel today's sales, per the spec's "both at the register and remotely" decision.
- [ ] **Step 11: Run the full test suite, confirm green.**
- [ ] **Step 12: Commit.**

```bash
git add src/lib/sales/actions.ts src/lib/sales/actions.test.ts src/components/admin/SalesList.tsx src/components/admin/SalesList.test.tsx src/app/admin/vendas/page.tsx src/app/caixa/page.tsx
git commit -m "feat: add sale editing/cancellation with traceable snapshots"
```

---

### Task 9: Revenue report

**Files:**
- Create: `src/lib/reports/revenue.ts`, `src/app/admin/page.tsx`
- Test: `src/lib/reports/revenue.test.ts`

**Interfaces:**
- Consumes: `SaleWithDetails` shape from Task 8.
- Produces:
  ```ts
  export type DailyRevenue = { date: string; totalCents: number; byMethod: Record<PaymentMethod, number> };
  export function aggregateRevenueByDay(sales: SaleWithDetails[]): DailyRevenue[];
  ```

- [ ] **Step 1: Write failing tests:**
  - Two `completed` sales on the same date with `dinheiro` and `pix` payments produce one `DailyRevenue` entry with `totalCents` equal to their sum and the correct per-method breakdown.
  - A `cancelled` sale in the input contributes `0` to every total (pins the cancelled-sales Review Focus item).
  - An empty input array returns `[]`, and the caller (the admin page) must render `R$ 0,00` rather than erroring when there's no entry for the selected day (pins the zero-sales Review Focus item).
- [ ] **Step 2: Run the test, confirm failures.**
- [ ] **Step 3: Implement `aggregateRevenueByDay`**, summing in cents via each sale's `sale_payments`.
- [ ] **Step 4: Run the tests, confirm pass.**
- [ ] **Step 5: Write `src/app/admin/page.tsx`:** loads sales for a selected date range (default: current month) via `listSalesByDate`-style queries, runs `aggregateRevenueByDay`, and renders a table with one row per day showing total and the dinheiro/pix/cartão breakdown, defaulting a day with no data to `R$ 0,00`.
- [ ] **Step 6: Commit.**

```bash
git add src/lib/reports/revenue.ts src/lib/reports/revenue.test.ts src/app/admin/page.tsx
git commit -m "feat: add revenue report aggregated by day and payment method"
```

---

### Task 10: Expenses

**Files:**
- Create: `src/lib/expenses/actions.ts`, `src/components/admin/ExpenseForm.tsx`, `src/app/admin/despesas/page.tsx`
- Test: `src/lib/expenses/actions.test.ts`, `src/components/admin/ExpenseForm.test.tsx`

**Interfaces:**
- Consumes: `createServerClient` (Task 3), `expenses` table (Task 2).
- Produces:
  ```ts
  export async function listExpenses(fromDate: string, toDate: string): Promise<Expense[]>; // Expense = { id, date, description, amount }
  export async function addExpense(date: string, description: string, amount: number): Promise<void>;
  ```
  Task 12's balance report consumes `listExpenses`.

- [ ] **Step 1: Write failing tests for `addExpense`/`listExpenses`:** adding an expense makes it appear in `listExpenses` for a range that includes its date, and absent from a range that excludes it. Adding one signed in as the seeded `operador` is rejected by RLS (admin-only, pins role separation).
- [ ] **Step 2: Run, confirm failures; implement both functions; run again, confirm pass.**
- [ ] **Step 3: Write a failing test for `ExpenseForm`:** renders date, description, and amount fields plus a submit button; submitting with all three filled calls `onSubmit({ date, description, amount })`; submitting with description empty shows a validation message and does not call `onSubmit`.
- [ ] **Step 4: Run, confirm failure; implement `ExpenseForm`; run again, confirm pass.**
- [ ] **Step 5: Write `src/app/admin/despesas/page.tsx`:** renders `ExpenseForm` wired to `addExpense`, and a list of the current month's expenses from `listExpenses` below it.
- [ ] **Step 6: Commit.**

```bash
git add src/lib/expenses src/components/admin/ExpenseForm.tsx src/components/admin/ExpenseForm.test.tsx src/app/admin/despesas/page.tsx
git commit -m "feat: add expense entry and listing"
```

---

### Task 11: Market purchases

**Files:**
- Create: `src/lib/purchases/actions.ts`, `src/components/admin/PurchaseForm.tsx`, `src/app/admin/compras/page.tsx`
- Test: `src/lib/purchases/actions.test.ts`, `src/components/admin/PurchaseForm.test.tsx`

**Interfaces:**
- Consumes: `createServerClient` (Task 3), `purchases`/`purchase_items` tables (Task 2).
- Produces:
  ```ts
  export type PurchaseItemInput = { productName: string; quantity: string; value: number };
  export async function addPurchase(date: string, items: PurchaseItemInput[], photo?: File): Promise<void>; // uploads photo to Supabase Storage bucket "notas-fiscais" first, if provided; stores the resulting public/signed URL as purchases.photo_url
  export async function listPurchases(fromDate: string, toDate: string): Promise<Purchase[]>; // Purchase = { id, date, total, photoUrl, items: PurchaseItemInput[] }
  export async function suggestProductNames(query: string): Promise<string[]>; // distinct past purchase_items.product_name matching query, for autocomplete
  ```
  Task 12's balance report consumes `listPurchases`' `total`.

- [ ] **Step 1: Write failing tests for `addPurchase`/`listPurchases`:** adding a purchase with two items (no photo) creates one `purchases` row whose `total` equals the sum of the items' `value`, and two matching `purchase_items` rows; `listPurchases` for a range including that date returns it with its items. Calling `addPurchase` signed in as `operador` is rejected by RLS.
- [ ] **Step 2: Write a failing test for `suggestProductNames`:** after adding purchases containing "Tomate" and "Alface", querying `"Tom"` returns `["Tomate"]` and querying `""`/unmatched text returns `[]` or all names (pick one and assert it) — not an error.
- [ ] **Step 3: Run, confirm failures; implement `addPurchase`, `listPurchases`, `suggestProductNames`** (photo upload via `supabase.storage.from('notas-fiscais').upload(...)`, skipped entirely when no `photo` is passed); run again, confirm pass.
- [ ] **Step 4: Write a failing test for `PurchaseForm`:** starts with one item row (product/quantity/value fields); an "Adicionar item" button adds another row; typing in the product field calls a provided `onSearchProduct(query)` prop (wired to `suggestProductNames` by the page) and renders the returned suggestions as clickable options that fill the field on click; a file input accepts the invoice photo; submitting calls `onSubmit({ date, items, photo })` with all entered rows.
- [ ] **Step 5: Run, confirm failure; implement `PurchaseForm`; run again, confirm pass.**
- [ ] **Step 6: Write `src/app/admin/compras/page.tsx`:** renders `PurchaseForm` wired to `addPurchase`/`suggestProductNames`, and a list of the current month's purchases (date, total, item count) from `listPurchases` below it.
- [ ] **Step 7: Commit.**

```bash
git add src/lib/purchases src/components/admin/PurchaseForm.tsx src/components/admin/PurchaseForm.test.tsx src/app/admin/compras/page.tsx
git commit -m "feat: add itemized market purchase entry with photo attachment"
```

---

### Task 12: Balance report

**Files:**
- Create: `src/lib/reports/balance.ts`, `src/app/admin/balanco/page.tsx`
- Test: `src/lib/reports/balance.test.ts`

**Interfaces:**
- Consumes: `aggregateRevenueByDay`/`DailyRevenue` (Task 9), `listExpenses` (Task 10), `listPurchases` (Task 11).
- Produces:
  ```ts
  export function calculateBalance(revenueCents: number, expensesCents: number, purchasesCents: number): number;
  ```

- [ ] **Step 1: Write failing tests:** `calculateBalance(100000, 20000, 15000)` returns `65000`; `calculateBalance(0, 5000, 0)` returns `-5000` (expenses with no revenue produce a negative balance, rendered as a loss, not an error).
- [ ] **Step 2: Run, confirm failure; implement; run again, confirm pass.**
- [ ] **Step 3: Write `src/app/admin/balanco/page.tsx`:** for a selected month, sums `aggregateRevenueByDay`'s totals, sums `listExpenses`' amounts, sums `listPurchases`' totals, calls `calculateBalance`, and renders the three inputs plus the resulting balance (styled distinctly when negative).
- [ ] **Step 4: Commit.**

```bash
git add src/lib/reports/balance.ts src/lib/reports/balance.test.ts src/app/admin/balanco/page.tsx
git commit -m "feat: add revenue minus expenses balance report"
```
