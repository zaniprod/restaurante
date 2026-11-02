import { cartTotalCents, type CartLine } from "@/lib/pos/cart";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function Cart(props: { lines: CartLine[]; onRemove: (index: number) => void }) {
  const { lines, onRemove } = props;

  return (
    <div>
      {lines.length === 0 && <p className="py-4 text-sm text-ink-soft">Nenhum item na comanda.</p>}

      <ul>
        {lines.map((line, index) => (
          <li
            key={`${line.menuItemId}-${index}`}
            className="flex items-center gap-2 border-b border-line py-2 text-sm"
          >
            <span className="flex-1 text-ink">{line.name}</span>
            <span className="w-6 text-right text-ink-soft">{line.quantity}</span>
            <span className="w-20 text-right font-medium text-ink">{formatBRL(line.lineTotal)}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-xs text-rust underline-offset-2 hover:underline"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink pt-3">
        <span className="text-sm text-ink-soft">Total:</span>
        <span className="font-serif text-3xl text-ink">{formatBRL(cartTotalCents(lines) / 100)}</span>
      </div>
    </div>
  );
}
