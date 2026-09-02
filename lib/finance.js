import { supabase } from './supabase';
import { getTotalSellingPrice } from './orderProducts';
import {
  toNumber,
  calculateCostLyd,
  calculateTotalCostLyd,
  calculateProfitLyd,
  resolveSellingPrice
} from './money';

export async function createOrUpdateOrderFinance(orderId, financeData) {
  console.log('createOrUpdateOrderFinance called with:', { orderId, financeData });
  
  // Check if finance record exists
  const { data: existing, error: existingError } = await supabase
    .from('order_finance')
    .select('id')
    .eq('order_id', orderId)
    .single();
  
  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking existing finance record:', existingError);
  }
  
  console.log('Existing finance record:', existing);

  const payload = {
    cost_try: toNumber(financeData.cost_try),
    fx_try_to_lyd: toNumber(financeData.fx_try_to_lyd),
    cost_lyd: calculateCostLyd(financeData.cost_try, financeData.fx_try_to_lyd),
    shipping_lyd: toNumber(financeData.shipping_lyd),
    selling_price_lyd: toNumber(financeData.selling_price_lyd),
    owner_notes: financeData.owner_notes || null
  };
  
  if (existing) {
    // Update existing
    console.log('Updating existing finance record');
    const { error } = await supabase
      .from('order_finance')
      .update(payload)
      .eq('order_id', orderId);
    
    if (error) {
      console.error('Error updating order finance:', error);
      throw error;
    }
    console.log('Finance record updated successfully');
  } else {
    // Create new
    console.log('Creating new finance record');
    const insertData = {
      order_id: orderId,
      ...payload
    };
    console.log('Insert data:', insertData);
    
    const { data, error } = await supabase
      .from('order_finance')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Error creating order finance:', error);
      throw error;
    }
    console.log('Finance record created successfully:', data);
  }
  
  // Recalculate profit after update without overwriting an owner selling-price save
  await recalculateProfit(orderId);
}

export async function getOrderFinance(orderId) {
  const { data, error } = await supabase
    .from('order_finance')
    .select('*')
    .eq('order_id', orderId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting order finance:', error);
    return null;
  }
  
  return data;
}

export async function calculateTotalCost(orderId, costLyd, shippingLyd) {
  const cost = toNumber(costLyd);
  if (cost === null) return null;
  
  // Get sum of expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount_lyd')
    .eq('order_id', orderId);
  
  const expensesTotal = (expenses || []).reduce(
    (sum, exp) => sum + (toNumber(exp.amount_lyd) ?? 0),
    0
  );
  
  return calculateTotalCostLyd(cost, shippingLyd, expensesTotal);
}

export async function recalculateProfit(orderId, { syncSellingPrice = false } = {}) {
  const productTotal = await getTotalSellingPrice(orderId);

  let { data: finance, error: financeError } = await supabase
    .from('order_finance')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (financeError && financeError.code !== 'PGRST116') {
    console.error('Error getting order finance:', financeError);
    return;
  }

  if (!finance) {
    const sellingPriceLyd = resolveSellingPrice({
      productTotal,
      syncSellingPrice: true
    });
    const { data: created, error: createError } = await supabase
      .from('order_finance')
      .insert({
        order_id: orderId,
        selling_price_lyd: sellingPriceLyd,
        profit_lyd: calculateProfitLyd(sellingPriceLyd, null)
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating finance record:', createError);
      throw createError;
    }

    finance = created;
  }

  const sellingPriceLyd = resolveSellingPrice({
    storedSellingPrice: finance.selling_price_lyd,
    productTotal,
    syncSellingPrice
  });
  const costLyd = calculateCostLyd(finance.cost_try, finance.fx_try_to_lyd)
    ?? toNumber(finance.cost_lyd);
  const totalCostLyd = await calculateTotalCost(orderId, costLyd, finance.shipping_lyd);
  const profitLyd = calculateProfitLyd(sellingPriceLyd, totalCostLyd);

  const { error } = await supabase
    .from('order_finance')
    .update({
      cost_lyd: costLyd,
      selling_price_lyd: sellingPriceLyd,
      profit_lyd: profitLyd
    })
    .eq('order_id', orderId);

  if (error) {
    console.error('Error recalculating profit:', error);
    throw error;
  }
}

export async function createExpense(orderId, expenseData) {
  const { error } = await supabase
    .from('expenses')
    .insert({
      order_id: orderId,
      title: expenseData.title,
      amount_lyd: expenseData.amount_lyd
    });
  
  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
  
  // Recalculate profit
  await recalculateProfit(orderId);
}

export async function getExpenses(orderId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
  
  return data || [];
}

export async function deleteExpense(expenseId) {
  // First get the order_id
  const { data: expense } = await supabase
    .from('expenses')
    .select('order_id')
    .eq('id', expenseId)
    .single();
  
  if (!expense) return null;
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
  
  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
  
  // Recalculate profit
  await recalculateProfit(expense.order_id);
  return expense.order_id;
}

export async function createExchangeRate(date, rate) {
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({
      date,
      fx_try_to_lyd: rate,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'date'
    });
  
  if (error) {
    console.error('Error creating exchange rate:', error);
    throw error;
  }
}

export async function getExchangeRate(date) {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('fx_try_to_lyd')
    .eq('date', date)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting exchange rate:', error);
    return null;
  }
  
  return data;
}

export async function getLatestExchangeRate() {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting latest exchange rate:', error);
    return null;
  }
  
  return data;
}

export async function getAllExchangeRates() {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error getting exchange rates:', error);
    return [];
  }
  
  return data || [];
}

// Reports - For complex queries with filters
export async function getTotalProfit(filters = {}) {
  // Get all order_finance records with related orders
  let query = supabase
    .from('order_finance')
    .select('profit_lyd, orders!inner(status, created_at)')
    .not('profit_lyd', 'is', null);
  
  // Apply filters through the orders relationship
  if (filters.status) {
    query = query.eq('orders.status', filters.status);
  }
  
  if (filters.startDate) {
    query = query.gte('orders.created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('orders.created_at', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error getting total profit:', error);
    // Fallback: get all and filter in memory
    const { data: allFinance } = await supabase
      .from('order_finance')
      .select('profit_lyd, order_id')
      .not('profit_lyd', 'is', null);
    
    if (!allFinance) return 0;
    
    // Get orders that match filters
    let ordersQuery = supabase.from('orders').select('id');
    if (filters.status) ordersQuery = ordersQuery.eq('status', filters.status);
    if (filters.startDate) ordersQuery = ordersQuery.gte('created_at', filters.startDate);
    if (filters.endDate) ordersQuery = ordersQuery.lte('created_at', filters.endDate);
    
    const { data: orders } = await ordersQuery;
    const orderIds = orders ? orders.map(o => o.id) : [];
    
    const filtered = allFinance.filter(f => orderIds.includes(f.order_id));
    return filtered.reduce((sum, item) => sum + (toNumber(item.profit_lyd) ?? 0), 0);
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  const total = data.reduce((sum, item) => sum + (toNumber(item.profit_lyd) ?? 0), 0);
  return total;
}

export async function getTotalExpenses(filters = {}) {
  let query = supabase
    .from('expenses')
    .select('amount_lyd');
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error getting total expenses:', error);
    return 0;
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  const total = data.reduce((sum, item) => sum + (toNumber(item.amount_lyd) ?? 0), 0);
  return total;
}
