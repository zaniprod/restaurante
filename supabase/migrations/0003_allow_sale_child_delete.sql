-- editSale (Task 8) replaces a sale's line items and payments with new ones when the
-- cashier corrects a mistake. That requires deleting the old sale_items/sale_payments rows.
-- This does NOT weaken the spec's traceability anti-goal: sales and sale_edits themselves
-- still have no delete policy (a sale record can never be erased), and editSale always
-- writes a sale_edits snapshot of the prior items/payments before replacing them, so the
-- full history survives even though the old child rows don't.

create policy "sale_items_delete_operador_or_admin" on sale_items
  for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );

create policy "sale_payments_delete_operador_or_admin" on sale_payments
  for delete using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('operador','admin'))
  );
