import { describe, expect, test } from "vitest";
import { calculateBalance } from "./balance";

describe("calculateBalance", () => {
  test("revenue minus expenses and purchases", () => {
    expect(calculateBalance(100000, 20000, 15000)).toBe(65000);
  });

  test("expenses with no revenue produce a negative balance", () => {
    expect(calculateBalance(0, 5000, 0)).toBe(-5000);
  });
});
