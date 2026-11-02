-- Code review finding (I8): admins had no way to correct a mistaken expense or purchase
-- (e.g. a typo like 1000 instead of 100), which permanently distorts the balance report —
-- the opposite of "ter certeza do balanço". Admin-only delete, matching the existing
-- select/insert/update policies on these three tables.

create policy "expenses_delete_admin" on expenses
  for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "purchases_delete_admin" on purchases
  for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "purchase_items_delete_admin" on purchase_items
  for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
