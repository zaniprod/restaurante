import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PaymentForm } from "./PaymentForm";

describe("PaymentForm", () => {
  test("starts with one dinheiro row showing a valor recebido field", () => {
    render(<PaymentForm totalCents={3490} onConfirm={vi.fn()} />);

    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.getByLabelText(/valor recebido/i)).toBeInTheDocument();
  });

  test("Adicionar forma de pagamento adds a second row with its own method selector", () => {
    render(<PaymentForm totalCents={3490} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar forma de pagamento" }));

    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  test("shows the computed change for a dinheiro row once valor recebido is entered", () => {
    render(<PaymentForm totalCents={3490} onConfirm={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/^valor$/i), { target: { value: "34.90" } });
    fireEvent.change(screen.getByLabelText(/valor recebido/i), { target: { value: "50" } });

    expect(screen.getByText("R$ 15,10")).toBeInTheDocument();
  });

  test("Confirmar calls onConfirm with the entered payments when they match the total", () => {
    const onConfirm = vi.fn();
    render(<PaymentForm totalCents={3490} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText(/^valor$/i), { target: { value: "34.90" } });
    fireEvent.change(screen.getByLabelText(/valor recebido/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).toHaveBeenCalledWith([{ method: "dinheiro", amount: 34.9, cashReceived: 50 }]);
  });

  test("Confirmar shows an error and does not call onConfirm when payments don't match the total", () => {
    const onConfirm = vi.fn();
    render(<PaymentForm totalCents={3490} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText(/^valor$/i), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/valor recebido/i), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
