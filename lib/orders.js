import { supabase } from './supabase';
import { createOrderProduct } from './orderProducts';
import { recalculateProfit } from './finance';
import { getCustomerByPhone, createCustomer, updateCustomer } from './customers';
import { createOrderPayment } from './payments';
import { recordOrderEvent, statusLabel } from './orderEvents';
import { toNumber } from './money';

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
      deposit_paid: false,
      amount_paid: 0
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
  
  // Create/update finance from product totals, including a 0 selling price
  await recalculateProfit(orderId, { syncSellingPrice: true });

  await recordOrderEvent({
    orderId,
    eventType: 'order_created',
    actorId: userId,
    summary: 'تم إنشاء الطلب',
    metadata: { status: orderData.status || 'New' }
  });

  const openingPayment = toNumber(orderData.amount_paid);
  if (openingPayment && openingPayment > 0) {
    await createOrderPayment(orderId, {
      kind: 'payment',
      amount_lyd: openingPayment,
      method: orderData.payment_method || 'cash',
      note: orderData.payment_note || 'دفعة عند إنشاء الطلب',
      paid_at: new Date().toISOString()
    }, userId);
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

export async function updateOrder(id, orderData, actorId) {
  const existing = await getOrderById(id);
  if (!existing) {
    throw new Error('Order not found');
  }

  const nextStatus = orderData.status || existing.status || 'New';
  const { error } = await supabase
    .from('orders')
    .update({
      customer_name: orderData.customer_name,
      phone: orderData.phone || null,
      address: orderData.address || null,
      notes: orderData.notes || null,
      status: nextStatus
    })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }

  if (existing.status !== nextStatus) {
    await recordOrderEvent({
      orderId: id,
      eventType: 'status_changed',
      actorId,
      summary: `تغيرت الحالة من ${statusLabel(existing.status)} إلى ${statusLabel(nextStatus)}`,
      metadata: { from: existing.status, to: nextStatus }
    });
  }

  const fieldChanges = {};
  ['customer_name', 'phone', 'address', 'notes'].forEach((field) => {
    const before = existing[field] ?? null;
    const after = orderData[field] || null;
    if ((before || null) !== (after || null)) {
      fieldChanges[field] = { from: before, to: after };
    }
  });

  if (Object.keys(fieldChanges).length > 0) {
    await recordOrderEvent({
      orderId: id,
      eventType: 'order_updated',
      actorId,
      summary: 'تم تحديث بيانات الطلب',
      metadata: { changes: fieldChanges }
    });
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
