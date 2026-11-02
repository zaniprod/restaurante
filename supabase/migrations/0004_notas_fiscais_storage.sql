-- Storage bucket for market-purchase invoice photos (addPurchase, Task 11). Private bucket,
-- admin-only (purchases/purchase_items are admin-only per Task 2's RLS; this matches).

insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false);

create policy "notas_fiscais_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'notas-fiscais'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "notas_fiscais_select_admin" on storage.objects
  for select using (
    bucket_id = 'notas-fiscais'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
