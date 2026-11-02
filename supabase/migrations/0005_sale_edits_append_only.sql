-- Code review finding (I2): sale_edits is the audit trail the spec relies on for
-- traceability ("números em que se possa confiar"). An update policy on it let the shared
-- operador login silently rewrite a past snapshot, defeating the whole point of keeping one.
-- An audit log must be append-only: select + insert, never update or delete.

drop policy "sale_edits_update_operador_or_admin" on sale_edits;
