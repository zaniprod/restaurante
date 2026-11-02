import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Cart } from "./Cart";
import type { CartLine } from "@/lib/pos/cart";

const lines: CartLine[] = [
  { menuItemId: "item-1", name: "Refrigerante Lata", quantity: 2, unitPrice: 7, lineTotal: 14 },
  { menuItemId: "item-2", name: "Buffet por KG", quantity: 1, unitPrice: 37.5, lineTotal: 37.5 },
];

describe("Cart", () => {
  test("renders one row per line with name, quantity, and formatted line total", () => {
    render(<Cart lines={lines} onRemove={vi.fn()} />);

    expect(screen.getByText("Refrigerante Lata")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("R$ 14,00")).toBeInTheDocument();

    expect(screen.getByText("Buffet por KG")).toBeInTheDocument();
    expect(screen.getByText("R$ 37,50")).toBeInTheDocument();
  });

  test("renders the formatted cart total", () => {
    render(<Cart lines={lines} onRemove={vi.fn()} />);

    expect(screen.getByText("R$ 51,50")).toBeInTheDocument();
  });

  test("clicking a line's remove button calls onRemove with its index", () => {
    const onRemove = vi.fn();
    render(<Cart lines={lines} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole("button", { name: /remover/i });
    fireEvent.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
