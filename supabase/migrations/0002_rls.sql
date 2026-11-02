alter table profiles enable row level security;
alter table menu_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table sale_payments enable row level security;
alter table sale_edits enable row level security;
alter table expenses enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;

-- profiles: a user may select only their own row
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

-- menu_items: any authenticated user may select; no write policies (managed via service role)
create policy "menu_items_select_authenticated" on menu_items
  for select to authenticated using (true);

-- sales / sale_items / sale_payments / sale_edits: operador or admin may select/insert/update.
-- Deliberately no delete policy: cancelling a sale is an update (status = 'cancelled'), never a row deletion.
create policy "sales_select_operador_or_admin" on sales
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sales_insert_operador_or_admin" on sales
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sales_update_operador_or_admin" on sales
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );

create policy "sale_items_select_operador_or_admin" on sale_items
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_items_insert_operador_or_admin" on sale_items
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_items_update_operador_or_admin" on sale_items
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );

create policy "sale_payments_select_operador_or_admin" on sale_payments
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_payments_insert_operador_or_admin" on sale_payments
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_payments_update_operador_or_admin" on sale_payments
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );

create policy "sale_edits_select_operador_or_admin" on sale_edits
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_edits_insert_operador_or_admin" on sale_edits
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
create policy "sale_edits_update_operador_or_admin" on sale_edits
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );

-- expenses / purchases / purchase_items: admin only, select/insert/update (no delete policy either)
create policy "expenses_select_admin" on expenses
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "expenses_insert_admin" on expenses
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "expenses_update_admin" on expenses
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "purchases_select_admin" on purchases
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "purchases_insert_admin" on purchases
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "purchases_update_admin" on purchases
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "purchase_items_select_admin" on purchase_items
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "purchase_items_insert_admin" on purchase_items
  for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
create policy "purchase_items_update_admin" on purchase_items
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
