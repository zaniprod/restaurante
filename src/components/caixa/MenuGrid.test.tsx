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

    expect(screen.getByRole("heading", { name: "Bebidas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pratos" })).toBeInTheDocument();
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

  test("searching filters items by name across categories", () => {
    render(<MenuGrid items={items} onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Buscar item"), { target: { value: "refri" } });

    expect(screen.getByRole("button", { name: /Refrigerante Lata/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buffet por KG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pratos" })).not.toBeInTheDocument();
  });

  test("clicking a category chip shows only that category, clicking it again shows all", () => {
    render(<MenuGrid items={items} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Pratos" }));

    expect(screen.getByRole("button", { name: "Buffet por KG" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Refrigerante Lata/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pratos" }));

    expect(screen.getByRole("button", { name: /Refrigerante Lata/ })).toBeInTheDocument();
  });

  test("Pratos and Lanches show first, other categories keep their relative order", () => {
    const manyItems: MenuItem[] = [
      { id: "1", category: "Xis", name: "Xis Salada", price: 34.9, manualValue: false },
      { id: "2", category: "Bebidas", name: "Água Mineral", price: 5, manualValue: false },
      { id: "3", category: "Pratos", name: "Prato Feito", price: 34.9, manualValue: false },
      { id: "4", category: "Lanches", name: "Coxinha", price: 8, manualValue: false },
    ];

    render(<MenuGrid items={manyItems} onSelect={vi.fn()} />);

    const headingNames = screen.getAllByRole("heading").map((h) => h.textContent);
    expect(headingNames).toEqual(["Pratos", "Lanches", "Xis", "Bebidas"]);
  });
});
