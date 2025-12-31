import { supabase } from './supabase';

export async function createCustomer(customerData) {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: customerData.name,
      phone: customerData.phone || null,
      address: customerData.address || null,
      facebook: customerData.facebook || null,
      whatsapp: customerData.whatsapp || null
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
  
  return data.id;
}

export async function getCustomerByPhone(phone) {
  if (!phone) return null;
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    console.error('Error getting customer by phone:', error);
    return null;
  }
  
  return data;
}

export async function getCustomerById(id) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting customer by id:', error);
    return null;
  }
  
  return data;
}

export async function updateCustomer(id, customerData) {
  const { error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      phone: customerData.phone || null,
      address: customerData.address || null,
      facebook: customerData.facebook || null,
      whatsapp: customerData.whatsapp || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export async function searchCustomers(queryTerm) {
  const searchPattern = `%${queryTerm}%`;
  
  // Supabase doesn't support ILIKE directly, so we'll use or() with ilike
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.${searchPattern},phone.ilike.${searchPattern}`)
    .order('name', { ascending: true })
    .limit(20);
  
  if (error) {
    // Fallback: try separate queries if or() doesn't work
    const { data: nameData } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', searchPattern)
      .order('name', { ascending: true })
      .limit(20);
    
    const { data: phoneData } = await supabase
      .from('customers')
      .select('*')
      .ilike('phone', searchPattern)
      .order('name', { ascending: true })
      .limit(20);
    
    // Combine and deduplicate
    const combined = [...(nameData || []), ...(phoneData || [])];
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    return unique.slice(0, 20);
  }
  
  return data || [];
}

export async function getAllCustomersWithStats() {
  // Get all customers
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });
  
  if (customersError) {
    console.error('Error getting customers:', customersError);
    return [];
  }
  
  if (!customers || customers.length === 0) {
    return [];
  }
  
  // For each customer, calculate statistics
  const customersWithStats = await Promise.all(customers.map(async (customer) => {
    // Count orders for this customer
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);
    
    // Get order_finance data directly by joining through orders
    const { data: financeRecords, error: financeError } = await supabase
      .from('order_finance')
      .select('selling_price_lyd, profit_lyd, order_id, orders!inner(customer_id)')
      .eq('orders.customer_id', customer.id);
    
    // Calculate totals
    let totalRevenue = 0;
    let totalProfit = 0;
    
    if (financeRecords && !financeError) {
      financeRecords.forEach(finance => {
        totalRevenue += parseFloat(finance.selling_price_lyd || 0);
        totalProfit += parseFloat(finance.profit_lyd || 0);
      });
    }
    
    return {
      ...customer,
      order_count: orderCount || 0,
      total_revenue: totalRevenue,
      total_profit: totalProfit
    };
  }));
  
  return customersWithStats;
}
