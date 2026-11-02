export type MenuItem = {
  id: string;
  category: string;
  name: string;
  price: number | null;
  manualValue: boolean;
};

export type CartLine = {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export function addItem(cart: CartLine[], item: MenuItem): CartLine[] {
  const existingIndex = cart.findIndex((line) => line.menuItemId === item.id);

  if (existingIndex === -1) {
    return [
      ...cart,
      {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price ?? 0,
        lineTotal: item.price ?? 0,
      },
    ];
  }

  return cart.map((line, index) => {
    if (index !== existingIndex) return line;
    const quantity = line.quantity + 1;
    return { ...line, quantity, lineTotal: quantity * line.unitPrice };
  });
}

export function addManualValueLine(cart: CartLine[], item: MenuItem, value: number): CartLine[] {
  return [
    ...cart,
    {
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: value,
      lineTotal: value,
    },
  ];
}

export function removeLine(cart: CartLine[], index: number): CartLine[] {
  return cart.filter((_, i) => i !== index);
}

export function cartTotalCents(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + Math.round(line.lineTotal * 100), 0);
}
