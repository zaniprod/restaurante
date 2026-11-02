import { describe, expect, test } from "vitest";
import { aggregateRevenueByDay } from "./revenue";
import type { SaleWithDetails } from "@/lib/sales/actions";

function sale(overrides: Partial<SaleWithDetails>): SaleWithDetails {
  return {
    id: "sale-id",
    createdAt: "2026-11-02T12:00:00.000Z",
    status: "completed",
    total: 0,
    edited: false,
    items: [],
    payments: [],
    ...overrides,
  };
}

describe("aggregateRevenueByDay", () => {
  test("sums completed sales for the same date, broken down by payment method", () => {
    const sales: SaleWithDetails[] = [
      sale({ id: "1", total: 10, payments: [{ method: "dinheiro", amount: 10, cashReceived: null }] }),
      sale({ id: "2", total: 20, payments: [{ method: "pix", amount: 20, cashReceived: null }] }),
    ];

    const result = aggregateRevenueByDay(sales);

    expect(result).toEqual([
      { date: "2026-11-02", totalCents: 3000, byMethod: { dinheiro: 1000, pix: 2000, cartao: 0 } },
    ]);
  });

  test("a cancelled sale contributes 0 to every total but its date still appears", () => {
    const sales: SaleWithDetails[] = [
      sale({ id: "1", status: "cancelled", total: 99, payments: [{ method: "cartao", amount: 99, cashReceived: null }] }),
    ];

    const result = aggregateRevenueByDay(sales);

    expect(result).toEqual([
      { date: "2026-11-02", totalCents: 0, byMethod: { dinheiro: 0, pix: 0, cartao: 0 } },
    ]);
  });

  test("an empty input returns an empty array", () => {
    expect(aggregateRevenueByDay([])).toEqual([]);
  });
});
