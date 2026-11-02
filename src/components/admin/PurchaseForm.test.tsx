import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PurchaseForm } from "./PurchaseForm";

describe("PurchaseForm", () => {
  test("starts with one item row and a file input for the invoice photo", () => {
    render(<PurchaseForm onSubmit={vi.fn()} onSearchProduct={vi.fn().mockResolvedValue([])} />);

    expect(screen.getAllByLabelText(/produto/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/quantidade/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/valor/i)).toHaveLength(1);
    expect(screen.getByLabelText(/nota fiscal/i)).toBeInTheDocument();
  });

  test("Adicionar item adds another item row", () => {
    render(<PurchaseForm onSubmit={vi.fn()} onSearchProduct={vi.fn().mockResolvedValue([])} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar item" }));

    expect(screen.getAllByLabelText(/produto/i)).toHaveLength(2);
  });

  test("typing in the product field calls onSearchProduct and renders clickable suggestions", async () => {
    const onSearchProduct = vi.fn().mockResolvedValue(["Tomate"]);
    render(<PurchaseForm onSubmit={vi.fn()} onSearchProduct={onSearchProduct} />);

    fireEvent.change(screen.getAllByLabelText(/produto/i)[0], { target: { value: "Tom" } });

    expect(onSearchProduct).toHaveBeenCalledWith("Tom");

    const suggestion = await screen.findByRole("button", { name: "Tomate" });
    fireEvent.click(suggestion);

    expect(screen.getAllByLabelText(/produto/i)[0]).toHaveValue("Tomate");
  });

  test("submitting calls onSubmit with the date, items, and photo", () => {
    const onSubmit = vi.fn();
    render(<PurchaseForm onSubmit={onSubmit} onSearchProduct={vi.fn().mockResolvedValue([])} />);

    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: "2026-11-20" } });
    fireEvent.change(screen.getAllByLabelText(/produto/i)[0], { target: { value: "Tomate" } });
    fireEvent.change(screen.getAllByLabelText(/quantidade/i)[0], { target: { value: "3kg" } });
    fireEvent.change(screen.getAllByLabelText(/valor/i)[0], { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      date: "2026-11-20",
      items: [{ productName: "Tomate", quantity: "3kg", value: 15 }],
      photo: undefined,
    });
  });
});
