import { supabase } from './supabase';
import { createOrderProduct, getTotalSellingPrice } from './orderProducts';
import { createOrUpdateOrderFinance } from './finance';
import { getCustomerByPhone, createCustomer, updateCustomer } from './customers';

export async function createOrder(orderData, userId) {
  let customerId = null;
  
  // Check if customer exists by phone, if not create new customer
  if (orderData.phone) {
    let customer = await getCustomerByPhone(orderData.phone);
    
    if (customer) {
      customerId = customer.id;
      // Update customer info if provided
      if (orderData.customer_name || orderData.address || orderData.socialMedia) {
        await updateCustomer(customer.id, {
          name: orderData.customer_name || customer.name,
          phone: orderData.phone,
          address: orderData.address || customer.address,
          ...orderData.socialMedia
        });
      }
    } else {
      // Create new customer
      customerId = await createCustomer({
        name: orderData.customer_name,
        phone: orderData.phone,
        address: orderData.address || null,
        ...orderData.socialMedia
      });
    }
  }
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      created_by: userId,
      customer_id: customerId,
      customer_name: orderData.customer_name,
      phone: orderData.phone || null,
      address: orderData.address || null,
      notes: orderData.notes || null,
      status: orderData.status || 'New',
      deposit_paid: orderData.deposit_paid || false,
      amount_paid: orderData.amount_paid || 0
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  
  const orderId = data.id;
  
  // Add products
  if (orderData.products && Array.isArray(orderData.products)) {
    for (const product of orderData.products) {
      await createOrderProduct(orderId, product);
    }
  }
  
  // Calculate total selling price from products and create finance record
  const totalSellingPrice = await getTotalSellingPrice(orderId);
  console.log('Total selling price for new order:', orderId, '=', totalSellingPrice);
  
  if (totalSellingPrice > 0) {
    console.log('Creating finance record for order:', orderId);
    await createOrUpdateOrderFinance(orderId, {
      selling_price_lyd: totalSellingPrice
    });
  } else {
    console.log('Skipping finance record creation - total selling price is 0 or null');
  }
  
  return orderId;
}

export async function getOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      users (
        username
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting order:', error);
    return null;
  }
  
  if (data && data.users) {
    data.created_by_username = data.users.username;
    delete data.users;
  }
  
  return data;
}

export async function getAllOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      users (
        username
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting orders:', error);
    return [];
  }
  
  if (!orders || orders.length === 0) {
    return [];
  }
  
  // Add product count and first product name
  const ordersWithProducts = await Promise.all(orders.map(async (order) => {
    // Get first product
    const { data: products } = await supabase
      .from('order_products')
      .select('product_name')
      .eq('order_id', order.id)
      .limit(1);
    
    // Get product count
    const { count: productCount } = await supabase
      .from('order_products')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order.id);
    
    // Format user data
    if (order.users) {
      order.created_by_username = order.users.username;
      delete order.users;
    }
    
    return {
      ...order,
      product_name: products && products.length > 0 ? products[0].product_name : '-',
      product_count: productCount || 0
    };
  }));
  
  return ordersWithProducts;
}

export async function updateOrder(id, orderData) {
  const { error } = await supabase
    .from('orders')
    .update({
      customer_name: orderData.customer_name,
      phone: orderData.phone || null,
      address: orderData.address || null,
      notes: orderData.notes || null,
      status: orderData.status || 'New',
      deposit_paid: orderData.deposit_paid !== undefined ? orderData.deposit_paid : false,
      amount_paid: orderData.amount_paid !== undefined ? orderData.amount_paid : 0
    })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function deleteOrder(id) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}
