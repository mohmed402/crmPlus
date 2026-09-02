import { supabase } from './supabase';
import { parseQuantity, toNumber } from './money';

export async function createOrderProduct(orderId, productData) {
  const { error } = await supabase
    .from('order_products')
    .insert({
      order_id: orderId,
      product_name: productData.product_name,
      size: productData.size || null,
      product_code: productData.product_code || null,
      product_link: productData.product_link || null,
      quantity: parseQuantity(productData.quantity),
      selling_price_lyd: toNumber(productData.selling_price_lyd)
    });
  
  if (error) {
    console.error('Error creating order product:', error);
    throw error;
  }
}

export async function getOrderProducts(orderId) {
  const { data, error } = await supabase
    .from('order_products')
    .select('*')
    .eq('order_id', orderId)
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error getting order products:', error);
    return [];
  }
  
  return data || [];
}

export async function updateOrderProduct(productId, productData) {
  const { error } = await supabase
    .from('order_products')
    .update({
      product_name: productData.product_name,
      size: productData.size || null,
      product_code: productData.product_code || null,
      product_link: productData.product_link || null,
      quantity: parseQuantity(productData.quantity),
      selling_price_lyd: toNumber(productData.selling_price_lyd)
    })
    .eq('id', productId);
  
  if (error) {
    console.error('Error updating order product:', error);
    throw error;
  }
}

export async function getTotalSellingPrice(orderId) {
  const { data, error } = await supabase
    .from('order_products')
    .select('selling_price_lyd, quantity')
    .eq('order_id', orderId)
    .not('selling_price_lyd', 'is', null);
  
  if (error) {
    console.error('Error getting total selling price:', error);
    return 0;
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  return data.reduce((sum, product) => {
    return sum + ((toNumber(product.selling_price_lyd) ?? 0) * parseQuantity(product.quantity));
  }, 0);
}

export async function deleteOrderProduct(productId) {
  const { error } = await supabase
    .from('order_products')
    .delete()
    .eq('id', productId);
  
  if (error) {
    console.error('Error deleting order product:', error);
    throw error;
  }
}

export async function deleteOrderProducts(orderId) {
  const { error } = await supabase
    .from('order_products')
    .delete()
    .eq('order_id', orderId);
  
  if (error) {
    console.error('Error deleting order products:', error);
    throw error;
  }
}
