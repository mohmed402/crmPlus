import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createGeneralExpense, getGeneralExpenses, deleteGeneralExpense } from '@/lib/generalExpenses';

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      category: searchParams.get('category')
    };

    const expenses = await getGeneralExpenses(filters);
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching general expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || userRole !== 'owner') {
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

    const expenseId = await createGeneralExpense(
      { ...expenseData, amount_lyd: amountLyd },
      parseInt(userId)
    );

    return NextResponse.json({ 
      success: true,
      expenseId 
    });
  } catch (error) {
    console.error('Error creating general expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID required' },
        { status: 400 }
      );
    }

    await deleteGeneralExpense(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting general expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

