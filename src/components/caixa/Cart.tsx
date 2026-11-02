import { cartTotalCents, type CartLine } from "@/lib/pos/cart";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function Cart(props: { lines: CartLine[]; onRemove: (index: number) => void }) {
  const { lines, onRemove } = props;

  return (
    <div>
      {lines.map((line, index) => (
        <div key={`${line.menuItemId}-${index}`}>
          <span>{line.name}</span>
          <span>{line.quantity}</span>
          <span>{formatBRL(line.lineTotal)}</span>
          <button type="button" onClick={() => onRemove(index)}>
            Remover
          </button>
        </div>
      ))}
      <div>
        <span>Total:</span> <span>{formatBRL(cartTotalCents(lines) / 100)}</span>
      </div>
    </div>
  );
}
