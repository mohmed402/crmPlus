import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders';
import { getOrderFinance } from '@/lib/finance';
import { getExpenses } from '@/lib/finance';
import { getOrderProducts } from '@/lib/orderProducts';
import { getOrderBalance } from '@/lib/payments';
import { getOrderEvents } from '@/lib/orderEvents';
import { calculateRemaining } from '@/lib/money';

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
    
    const order = await getOrderById(parseInt(params.id));
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const products = await getOrderProducts(parseInt(params.id));
    const isOwner = userRole === 'owner';
    const { payments, netPaid } = await getOrderBalance(parseInt(params.id));
    const events = await getOrderEvents(parseInt(params.id), {
      includeFinancial: isOwner
    });

    const response = {
      order,
      products,
      payments,
      events,
      balance: { netPaid }
    };
    
    // Only owner can see finance data
    if (isOwner) {
      const finance = await getOrderFinance(parseInt(params.id));
      const expenses = await getExpenses(parseInt(params.id));
      response.finance = finance;
      response.expenses = expenses;
      response.balance.remaining = calculateRemaining(finance?.selling_price_lyd, netPaid);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderData = await request.json();
    await updateOrder(parseInt(params.id), orderData, parseInt(userId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }
    
    await deleteOrder(parseInt(params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

