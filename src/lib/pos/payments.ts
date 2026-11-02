export type PaymentMethod = "dinheiro" | "pix" | "cartao";

export type PaymentEntry = {
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
};

export function validatePayments(
  payments: PaymentEntry[],
  totalCents: number,
): { valid: boolean; error?: string } {
  const sumCents = payments.reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);

  if (sumCents !== totalCents) {
    return {
      valid: false,
      error: `A soma dos pagamentos (${sumCents} centavos) não corresponde ao total (${totalCents} centavos).`,
    };
  }

  return { valid: true };
}

export function calculateChangeCents(cashReceivedCents: number, cashAmountDueCents: number): number {
  return cashReceivedCents - cashAmountDueCents;
}
