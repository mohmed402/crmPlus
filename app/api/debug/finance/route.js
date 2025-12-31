import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }
    
    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      return NextResponse.json({
        error: 'Order not found',
        details: orderError
      });
    }
    
    // Check if finance record exists
    const { data: finance, error: financeError } = await supabase
      .from('order_finance')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    // Get products
    const { data: products } = await supabase
      .from('order_products')
      .select('*')
      .eq('order_id', orderId);
    
    return NextResponse.json({
      order,
      finance: finance || null,
      financeError: financeError ? { code: financeError.code, message: financeError.message } : null,
      products,
      diagnosis: {
        orderExists: !!order,
        financeExists: !!finance,
        productsCount: products?.length || 0,
        hasProductPrices: products?.some(p => p.selling_price_lyd > 0) || false
      }
    });
  } catch (error) {
    console.error('Debug finance error:', error);
    return NextResponse.json(
      { error: 'Failed to debug finance', details: error.message },
      { status: 500 }
    );
  }
}

