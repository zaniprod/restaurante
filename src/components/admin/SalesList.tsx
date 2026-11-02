import type { SaleWithDetails } from "@/lib/sales/actions";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function SalesList(props: {
  sales: SaleWithDetails[];
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const { sales, onEdit, onCancel } = props;

  if (sales.length === 0) {
    return <p className="py-4 text-sm text-ink-soft">Nenhuma venda registrada.</p>;
  }

  return (
    <ul>
      {sales.map((sale) => (
        <li key={sale.id} className="flex items-center gap-3 border-b border-line py-2 text-sm">
          <span className="w-24 font-medium text-ink">{formatBRL(sale.total)}</span>

          <span className="flex-1">
            {sale.status === "cancelled" ? (
              <span className="rounded-full border border-rust px-2 py-0.5 text-xs text-rust">Cancelada</span>
            ) : sale.edited ? (
              <span className="rounded-full border border-ink-soft px-2 py-0.5 text-xs text-ink-soft">Editada</span>
            ) : null}
          </span>

          <button
            type="button"
            onClick={() => onEdit(sale.id)}
            className="text-green underline-offset-2 hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onCancel(sale.id)}
            className="text-rust underline-offset-2 hover:underline"
          >
            Cancelar
          </button>
        </li>
      ))}
    </ul>
  );
}
