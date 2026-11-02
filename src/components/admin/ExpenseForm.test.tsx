import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ExpenseForm } from "./ExpenseForm";

describe("ExpenseForm", () => {
  test("renders date, description, and amount fields plus a submit button", () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  test("submitting with all fields filled calls onSubmit with the entered values", () => {
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: "2026-11-15" } });
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: "Aluguel" } });
    fireEvent.change(screen.getByLabelText(/valor/i), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSubmit).toHaveBeenCalledWith({ date: "2026-11-15", description: "Aluguel", amount: 1500 });
  });

  test("submitting with an empty description shows a validation message and does not call onSubmit", () => {
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: "2026-11-15" } });
    fireEvent.change(screen.getByLabelText(/valor/i), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
