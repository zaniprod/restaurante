import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { SalesList } from "./SalesList";
import type { SaleWithDetails } from "@/lib/sales/actions";

const sales: SaleWithDetails[] = [
  {
    id: "sale-1",
    createdAt: "2026-11-02T12:00:00.000Z",
    status: "completed",
    total: 12,
    edited: false,
    items: [],
    payments: [],
  },
  {
    id: "sale-2",
    createdAt: "2026-11-02T12:05:00.000Z",
    status: "completed",
    total: 20,
    edited: true,
    items: [],
    payments: [],
  },
  {
    id: "sale-3",
    createdAt: "2026-11-02T12:10:00.000Z",
    status: "cancelled",
    total: 8,
    edited: false,
    items: [],
    payments: [],
  },
];

describe("SalesList", () => {
  test("renders a row per sale with its total, and a badge only when edited or cancelled", () => {
    render(<SalesList sales={sales} onEdit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("R$ 12,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 20,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 8,00")).toBeInTheDocument();

    expect(screen.getByText("Editada")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryAllByText(/^(Editada|Cancelada)$/)).toHaveLength(2);
  });

  test("Editar and Cancelar buttons call their callbacks with the sale's id", () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();
    render(<SalesList sales={sales} onEdit={onEdit} onCancel={onCancel} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(onEdit).toHaveBeenCalledWith("sale-1");

    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar" })[0]);
    expect(onCancel).toHaveBeenCalledWith("sale-1");
  });
});
