import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createExpense, deleteExpense } from '@/lib/finance';
import { recordOrderEvent } from '@/lib/orderEvents';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }
    
    const { orderId, title, amount_lyd } = await request.json();
    await createExpense(orderId, { title, amount_lyd });
    await recordOrderEvent({
      orderId,
      eventType: 'expense_added',
      actorId: userId ? parseInt(userId) : null,
      summary: 'تم إضافة مصروف',
      metadata: { title, amount_lyd }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');
    
    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID required' },
        { status: 400 }
      );
    }
    
    const orderId = await deleteExpense(parseInt(expenseId));
    if (orderId) {
      await recordOrderEvent({
        orderId,
        eventType: 'expense_deleted',
        actorId: userId ? parseInt(userId) : null,
        summary: 'تم حذف مصروف',
        metadata: { expense_id: parseInt(expenseId) }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

