import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGeneralExpenseById, updateGeneralExpense } from '@/lib/generalExpenses';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;

    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }

    const expense = await getGeneralExpenseById(parseInt(params.id));

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;

    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }

    const expenseData = await request.json();
    
    // Calculate amount in LYD
    let amountLyd;
    if (expenseData.currency === 'LYD') {
      amountLyd = parseFloat(expenseData.amount);
    } else if (expenseData.exchange_rate) {
      amountLyd = parseFloat(expenseData.amount) * parseFloat(expenseData.exchange_rate);
    } else {
      return NextResponse.json(
        { error: 'Exchange rate required for non-LYD currencies' },
        { status: 400 }
      );
    }

    await updateGeneralExpense(parseInt(params.id), {
      ...expenseData,
      amount_lyd: amountLyd
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

