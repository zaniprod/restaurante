import { describe, expect, test } from "vitest";
import { addItem, addManualValueLine, cartTotalCents, removeLine } from "./cart";
import type { MenuItem } from "./cart";

const fixedItem: MenuItem = {
  id: "item-1",
  category: "Bebidas",
  name: "Refrigerante Lata",
  price: 10,
  manualValue: false,
};

const buffetKg: MenuItem = {
  id: "item-2",
  category: "Pratos",
  name: "Buffet por KG",
  price: null,
  manualValue: true,
};

describe("addItem", () => {
  test("adds a fixed-price item to an empty cart", () => {
    const cart = addItem([], fixedItem);

    expect(cart).toEqual([
      { menuItemId: "item-1", name: "Refrigerante Lata", quantity: 1, unitPrice: 10, lineTotal: 10 },
    ]);
  });

  test("adding the same item twice increments quantity instead of duplicating the line", () => {
    const cart = addItem(addItem([], fixedItem), fixedItem);

    expect(cart).toEqual([
      { menuItemId: "item-1", name: "Refrigerante Lata", quantity: 2, unitPrice: 10, lineTotal: 20 },
    ]);
  });
});

describe("addManualValueLine", () => {
  test("adds a line with the given value, independent of the item's null price", () => {
    const cart = addManualValueLine([], buffetKg, 37.5);

    expect(cart).toEqual([
      { menuItemId: "item-2", name: "Buffet por KG", quantity: 1, unitPrice: 37.5, lineTotal: 37.5 },
    ]);
  });
});

describe("removeLine", () => {
  test("removes the line at the given index and leaves the others untouched", () => {
    const cart = addManualValueLine(addItem([], fixedItem), buffetKg, 37.5);

    const result = removeLine(cart, 0);

    expect(result).toEqual([
      { menuItemId: "item-2", name: "Buffet por KG", quantity: 1, unitPrice: 37.5, lineTotal: 37.5 },
    ]);
  });
});

describe("cartTotalCents", () => {
  test("sums line totals in cents", () => {
    const cart = addManualValueLine(addItem([], fixedItem), buffetKg, 37.5);

    expect(cartTotalCents(cart)).toBe(4750);
  });
});
