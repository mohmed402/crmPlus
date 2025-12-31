import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only owner can access customer order history
    if (userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const customerId = parseInt(params.id);
    
    // Get all orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching customer orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
    
    // For each order, get product info and finance data
    const ordersWithDetails = await Promise.all((orders || []).map(async (order) => {
      // Get first product name
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
      
      // Get finance data
      const { data: finance } = await supabase
        .from('order_finance')
        .select('selling_price_lyd, profit_lyd')
        .eq('order_id', order.id)
        .single();
      
      return {
        id: order.id,
        product_name: products && products.length > 0 ? products[0].product_name : '-',
        product_count: productCount || 0,
        status: order.status,
        created_at: order.created_at,
        selling_price_lyd: finance?.selling_price_lyd || null,
        profit_lyd: finance?.profit_lyd || null
      };
    }));
    
    return NextResponse.json({ orders: ordersWithDetails });
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}

