-- Code review finding (I1 + I2): createSale/editSale/cancelSale each did several separate
-- inserts/updates/deletes from the app. If the network drops mid-sale (a named builder
-- concern in the spec) between two of those calls, a sale could end up with a total but no
-- items, or edited with no payments — money silently missing from every report. Moving each
-- operation into one SECURITY DEFINER function makes it a single Postgres transaction: it
-- either fully applies or not at all. This also closes I2: direct table writes are revoked
-- from `authenticated`, so the only way to create/edit/cancel a sale is through these
-- functions, which check the caller's role themselves and always write the sale_edits
-- snapshot in the same transaction as the change it records.

revoke insert, update, delete on sales from authenticated;
revoke insert, update, delete on sale_items from authenticated;
revoke insert, update, delete on sale_payments from authenticated;
revoke insert, update, delete on sale_edits from authenticated;

create or replace function create_sale(p_id uuid, p_total numeric, p_items jsonb, p_payments jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('operador', 'admin') then
    raise exception 'not authorized';
  end if;

  -- Idempotent: a client-side retry after a dropped response re-sends the same id.
  if exists (select 1 from sales where id = p_id) then
    return p_id;
  end if;

  insert into sales (id, total, status) values (p_id, p_total, 'completed');

  insert into sale_items (sale_id, menu_item_id, name, quantity, unit_price, line_total)
  select p_id, (item->>'menuItemId')::uuid, item->>'name', (item->>'quantity')::int,
         (item->>'unitPrice')::numeric, (item->>'lineTotal')::numeric
  from jsonb_array_elements(p_items) as item;

  insert into sale_payments (sale_id, method, amount, cash_received, change_given)
  select p_id, payment->>'method', (payment->>'amount')::numeric,
         (payment->>'cashReceived')::numeric,
         case when payment->>'cashReceived' is not null
              then (payment->>'cashReceived')::numeric - (payment->>'amount')::numeric
              else null end
  from jsonb_array_elements(p_payments) as payment;

  return p_id;
end;
$$;

grant execute on function create_sale(uuid, numeric, jsonb, jsonb) to authenticated;

create or replace function edit_sale(p_sale_id uuid, p_total numeric, p_items jsonb, p_payments jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_sale jsonb;
  v_items jsonb;
  v_payments jsonb;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('operador', 'admin') then
    raise exception 'not authorized';
  end if;

  select to_jsonb(s) into v_sale from sales s where id = p_sale_id;
  if v_sale is null then
    raise exception 'sale not found';
  end if;

  select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) into v_items from sale_items i where sale_id = p_sale_id;
  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into v_payments from sale_payments p where sale_id = p_sale_id;

  insert into sale_edits (sale_id, snapshot)
  values (p_sale_id, jsonb_build_object('sale', v_sale, 'items', v_items, 'payments', v_payments));

  update sales set total = p_total, edited = true where id = p_sale_id;

  delete from sale_items where sale_id = p_sale_id;
  insert into sale_items (sale_id, menu_item_id, name, quantity, unit_price, line_total)
  select p_sale_id, (item->>'menuItemId')::uuid, item->>'name', (item->>'quantity')::int,
         (item->>'unitPrice')::numeric, (item->>'lineTotal')::numeric
  from jsonb_array_elements(p_items) as item;

  delete from sale_payments where sale_id = p_sale_id;
  insert into sale_payments (sale_id, method, amount, cash_received, change_given)
  select p_sale_id, payment->>'method', (payment->>'amount')::numeric,
         (payment->>'cashReceived')::numeric,
         case when payment->>'cashReceived' is not null
              then (payment->>'cashReceived')::numeric - (payment->>'amount')::numeric
              else null end
  from jsonb_array_elements(p_payments) as payment;
end;
$$;

grant execute on function edit_sale(uuid, numeric, jsonb, jsonb) to authenticated;

create or replace function cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_sale jsonb;
  v_items jsonb;
  v_payments jsonb;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is null or v_role not in ('operador', 'admin') then
    raise exception 'not authorized';
  end if;

  select to_jsonb(s) into v_sale from sales s where id = p_sale_id;
  if v_sale is null then
    raise exception 'sale not found';
  end if;

  select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) into v_items from sale_items i where sale_id = p_sale_id;
  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into v_payments from sale_payments p where sale_id = p_sale_id;

  insert into sale_edits (sale_id, snapshot)
  values (p_sale_id, jsonb_build_object('sale', v_sale, 'items', v_items, 'payments', v_payments));

  update sales set status = 'cancelled' where id = p_sale_id;
end;
$$;

grant execute on function cancel_sale(uuid) to authenticated;
