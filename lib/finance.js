import { supabase } from './supabase';
import { getTotalSellingPrice } from './orderProducts';

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
  
  const costLyd = financeData.cost_try && financeData.fx_try_to_lyd 
    ? financeData.cost_try * financeData.fx_try_to_lyd 
    : null;
  
  const totalCostLyd = await calculateTotalCost(orderId, costLyd, financeData.shipping_lyd);
  const profitLyd = financeData.selling_price_lyd && totalCostLyd
    ? financeData.selling_price_lyd - totalCostLyd
    : null;
  
  console.log('Calculated values:', { costLyd, totalCostLyd, profitLyd });
  
  if (existing) {
    // Update existing
    console.log('Updating existing finance record');
    const { error } = await supabase
      .from('order_finance')
      .update({
        cost_try: financeData.cost_try || null,
        fx_try_to_lyd: financeData.fx_try_to_lyd || null,
        cost_lyd: costLyd,
        shipping_lyd: financeData.shipping_lyd || null,
        selling_price_lyd: financeData.selling_price_lyd || null,
        profit_lyd: profitLyd,
        owner_notes: financeData.owner_notes || null
      })
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
      cost_try: financeData.cost_try || null,
      fx_try_to_lyd: financeData.fx_try_to_lyd || null,
      cost_lyd: costLyd,
      shipping_lyd: financeData.shipping_lyd || null,
      selling_price_lyd: financeData.selling_price_lyd || null,
      profit_lyd: profitLyd,
      owner_notes: financeData.owner_notes || null
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
  
  // Recalculate profit after update
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
  if (!costLyd) return null;
  
  // Get sum of expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount_lyd')
    .eq('order_id', orderId);
  
  const expensesTotal = expenses 
    ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_lyd || 0), 0)
    : 0;
  
  return (costLyd || 0) + (shippingLyd || 0) + expensesTotal;
}

export async function recalculateProfit(orderId) {
  const { data: finance } = await supabase
    .from('order_finance')
    .select('*')
    .eq('order_id', orderId)
    .single();
  
  if (!finance) return;
  
  // Get total selling price from products if not set in finance
  let sellingPriceLyd = finance.selling_price_lyd;
  if (!sellingPriceLyd) {
    sellingPriceLyd = await getTotalSellingPrice(orderId);
    if (sellingPriceLyd > 0) {
      await supabase
        .from('order_finance')
        .update({ selling_price_lyd: sellingPriceLyd })
        .eq('order_id', orderId);
    }
  }
  
  const totalCostLyd = await calculateTotalCost(orderId, finance.cost_lyd, finance.shipping_lyd);
  const profitLyd = sellingPriceLyd && totalCostLyd
    ? sellingPriceLyd - totalCostLyd
    : null;
  
  await supabase
    .from('order_finance')
    .update({ profit_lyd: profitLyd })
    .eq('order_id', orderId);
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
  
  if (!expense) return;
  
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
    return filtered.reduce((sum, item) => sum + parseFloat(item.profit_lyd || 0), 0);
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  const total = data.reduce((sum, item) => sum + parseFloat(item.profit_lyd || 0), 0);
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
  
  const total = data.reduce((sum, item) => sum + parseFloat(item.amount_lyd || 0), 0);
  return total;
}
