/**
 * Null-safe numeric helpers for money fields.
 * Empty / null / undefined / '' / NaN → missing (null). Zero is a real value.
 */

export function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isPresent(value) {
  return toNumber(value) !== null;
}

export function parseQuantity(value) {
  const n = toNumber(value);
  return n === null ? 1 : n;
}

export function calculateCostLyd(costTry, fxTryToLyd) {
  const cost = toNumber(costTry);
  const fx = toNumber(fxTryToLyd);
  if (cost === null || fx === null) {
    return null;
  }
  return cost * fx;
}

export function calculateTotalCostLyd(costLyd, shippingLyd, expensesTotal = 0) {
  const cost = toNumber(costLyd);
  if (cost === null) {
    return null;
  }
  return cost + (toNumber(shippingLyd) ?? 0) + (toNumber(expensesTotal) ?? 0);
}

export function calculateProfitLyd(sellingPriceLyd, totalCostLyd) {
  const selling = toNumber(sellingPriceLyd);
  const totalCost = toNumber(totalCostLyd);
  if (selling === null || totalCost === null) {
    return null;
  }
  return selling - totalCost;
}

export function calculateNetProfit(orderProfit, generalExpenses) {
  return (toNumber(orderProfit) ?? 0) - (toNumber(generalExpenses) ?? 0);
}

export function resolveSellingPrice({ storedSellingPrice, productTotal, syncSellingPrice = false } = {}) {
  const productSellingPrice = toNumber(productTotal) ?? 0;
  if (syncSellingPrice) {
    return productSellingPrice;
  }
  const stored = toNumber(storedSellingPrice);
  return stored === null ? productSellingPrice : stored;
}

export function formatMoney(value, { suffix = '', digits = 2, empty = '-' } = {}) {
  const n = toNumber(value);
  if (n === null) {
    return empty;
  }
  const formatted = n.toFixed(digits);
  return suffix ? `${formatted} ${suffix}` : formatted;
}
