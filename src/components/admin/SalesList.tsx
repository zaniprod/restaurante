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

  return (
    <div>
      {sales.map((sale) => (
        <div key={sale.id}>
          <span>{formatBRL(sale.total)}</span>
          {sale.status === "cancelled" ? (
            <span>Cancelada</span>
          ) : sale.edited ? (
            <span>Editada</span>
          ) : null}
          <button type="button" onClick={() => onEdit(sale.id)}>
            Editar
          </button>
          <button type="button" onClick={() => onCancel(sale.id)}>
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
}
