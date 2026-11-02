import { describe, expect, test } from "vitest";
import { calculateChangeCents, validatePayments } from "./payments";

describe("validatePayments", () => {
  test("one dinheiro entry matching the total exactly is valid", () => {
    const result = validatePayments([{ method: "dinheiro", amount: 34.9 }], 3490);
    expect(result).toEqual({ valid: true });
  });

  test("a dinheiro + cartao split summing to the total exactly is valid", () => {
    const result = validatePayments(
      [
        { method: "dinheiro", amount: 10 },
        { method: "cartao", amount: 24.9 },
      ],
      3490,
    );
    expect(result).toEqual({ valid: true });
  });

  test("amounts summing to 1 centavo less than the total are invalid", () => {
    const result = validatePayments([{ method: "pix", amount: 34.89 }], 3490);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test("amounts summing to 1 centavo more than the total are invalid", () => {
    const result = validatePayments([{ method: "pix", amount: 34.91 }], 3490);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test("a dinheiro entry whose cashReceived is less than its amount is invalid", () => {
    const result = validatePayments([{ method: "dinheiro", amount: 34.9, cashReceived: 20 }], 3490);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test("a dinheiro entry whose cashReceived exactly matches its amount is valid", () => {
    const result = validatePayments([{ method: "dinheiro", amount: 34.9, cashReceived: 34.9 }], 3490);
    expect(result).toEqual({ valid: true });
  });

  test("a dinheiro entry with no cashReceived given is valid (exact payment, no change)", () => {
    const result = validatePayments([{ method: "dinheiro", amount: 34.9 }], 3490);
    expect(result).toEqual({ valid: true });
  });
});

describe("calculateChangeCents", () => {
  test("returns the change when cash received exceeds the amount due", () => {
    expect(calculateChangeCents(5000, 3490)).toBe(1510);
  });

  test("returns a negative number when cash received is less than the amount due", () => {
    expect(calculateChangeCents(2000, 3490)).toBe(-1490);
  });
});
