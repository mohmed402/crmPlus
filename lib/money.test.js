import { describe, expect, it } from 'vitest';
import {
  calculateCostLyd,
  calculateNetProfit,
  calculateProfitLyd,
  calculateTotalCostLyd,
  calculateRemaining,
  calculateNetPaid,
  deriveDepositPaid,
  validateLedgerAmount,
  assertRefundAllowed,
  formatMoney,
  parseQuantity,
  resolveSellingPrice,
  toNumber
} from './money';

describe('toNumber', () => {
  it('keeps zero as a real number', () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber('0')).toBe(0);
    expect(toNumber('0.00')).toBe(0);
  });

  it('treats empty and invalid values as missing', () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('')).toBeNull();
    expect(toNumber('abc')).toBeNull();
  });
});

describe('cost and profit formulas', () => {
  it('computes zero cost, shipping, selling price, and profit', () => {
    expect(calculateCostLyd(0, 8)).toBe(0);
    expect(calculateTotalCostLyd(0, 0, 0)).toBe(0);
    expect(calculateProfitLyd(0, 0)).toBe(0);
  });

  it('does not compute profit when cost is missing', () => {
    expect(calculateTotalCostLyd(null, 10, 5)).toBeNull();
    expect(calculateProfitLyd(100, null)).toBeNull();
  });

  it('subtracts shipping and order expenses once in order profit', () => {
    const costLyd = calculateCostLyd(100, 0.5); // 50
    const totalCost = calculateTotalCostLyd(costLyd, 10, 5); // 65
    expect(calculateProfitLyd(100, totalCost)).toBe(35);
  });
});

describe('net profit', () => {
  it('subtracts general expenses only, not order expenses again', () => {
    const orderProfit = 100; // already after order expenses
    const generalExpenses = 15;
    expect(calculateNetProfit(orderProfit, generalExpenses)).toBe(85);
  });

  it('treats missing profit or expenses as zero', () => {
    expect(calculateNetProfit(null, 10)).toBe(-10);
    expect(calculateNetProfit(20, null)).toBe(20);
  });
});

describe('resolveSellingPrice', () => {
  it('overwrites a stored selling price from product totals when syncing', () => {
    expect(resolveSellingPrice({
      storedSellingPrice: 50,
      productTotal: 80,
      syncSellingPrice: true
    })).toBe(80);
  });

  it('keeps a stored zero unless products are being synced', () => {
    expect(resolveSellingPrice({
      storedSellingPrice: 0,
      productTotal: 80,
      syncSellingPrice: false
    })).toBe(0);
  });

  it('backfills from products when stored selling price is missing', () => {
    expect(resolveSellingPrice({
      storedSellingPrice: null,
      productTotal: 80,
      syncSellingPrice: false
    })).toBe(80);
  });
});

describe('parseQuantity', () => {
  it('keeps a zero quantity', () => {
    expect(parseQuantity(0)).toBe(0);
  });

  it('defaults a missing quantity to 1', () => {
    expect(parseQuantity(null)).toBe(1);
    expect(parseQuantity('')).toBe(1);
  });
});

describe('formatMoney', () => {
  it('shows 0.00 instead of a dash', () => {
    expect(formatMoney(0, { suffix: 'LYD' })).toBe('0.00 LYD');
  });

  it('shows a dash for missing values', () => {
    expect(formatMoney(null)).toBe('-');
  });
});

describe('payment ledger balances', () => {
  const entries = [
    { kind: 'payment', amount_lyd: 80 },
    { kind: 'payment', amount_lyd: 40 },
    { kind: 'refund', amount_lyd: 20 }
  ];

  it('computes net paid from payments minus refunds', () => {
    expect(calculateNetPaid(entries)).toBe(100);
  });

  it('treats an empty ledger as zero paid', () => {
    expect(calculateNetPaid([])).toBe(0);
    expect(formatMoney(calculateNetPaid([]), { suffix: 'LYD' })).toBe('0.00 LYD');
    expect(deriveDepositPaid(0)).toBe(false);
  });

  it('derives deposit_paid from net paid', () => {
    expect(deriveDepositPaid(100)).toBe(true);
    expect(deriveDepositPaid(0)).toBe(false);
  });

  it('computes remaining from selling price and net paid', () => {
    expect(calculateRemaining(150, 100)).toBe(50);
    expect(calculateRemaining(100, 100)).toBe(0);
    expect(calculateRemaining(null, 100)).toBeNull();
  });

  it('rejects zero or missing ledger amounts', () => {
    expect(validateLedgerAmount(0).ok).toBe(false);
    expect(validateLedgerAmount('').ok).toBe(false);
    expect(validateLedgerAmount(10).ok).toBe(true);
  });

  it('rejects refunds larger than net paid', () => {
    expect(assertRefundAllowed(100, 120).ok).toBe(false);
    expect(assertRefundAllowed(100, 100).ok).toBe(true);
    expect(assertRefundAllowed(0, 10).ok).toBe(false);
  });
});
