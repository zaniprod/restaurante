import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { MenuGrid } from "./MenuGrid";
import type { MenuItem } from "@/lib/pos/cart";

const items: MenuItem[] = [
  { id: "item-1", category: "Bebidas", name: "Refrigerante Lata", price: 7, manualValue: false },
  { id: "item-2", category: "Pratos", name: "Buffet por KG", price: null, manualValue: true },
];

describe("MenuGrid", () => {
  test("renders category headings and one button per item with formatted price", () => {
    render(<MenuGrid items={items} onSelect={vi.fn()} />);

    expect(screen.getByText("Bebidas")).toBeInTheDocument();
    expect(screen.getByText("Pratos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refrigerante Lata.*R\$ 7,00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buffet por KG" })).toBeInTheDocument();
  });

  test("clicking a fixed-price item calls onSelect with just the item", () => {
    const onSelect = vi.fn();
    render(<MenuGrid items={items} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Refrigerante Lata/ }));

    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  test("clicking a manual-value item opens a numeric input, and submitting calls onSelect with the value", () => {
    const onSelect = vi.fn();
    render(<MenuGrid items={items} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Buffet por KG" }));

    const input = screen.getByLabelText(/valor/i);
    fireEvent.change(input, { target: { value: "37.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSelect).toHaveBeenCalledWith(items[1], 37.5);
  });
});
