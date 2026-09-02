import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTotalProfit, getTotalExpenses } from '@/lib/finance';
import { getTotalGeneralExpenses } from '@/lib/generalExpenses';
import { calculateNetProfit } from '@/lib/money';

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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const totalProfit = await getTotalProfit(filters);
    const totalExpenses = await getTotalExpenses(filters); // Order-specific expenses
    const generalExpenses = await getTotalGeneralExpenses(startDate, endDate); // General business expenses
    
    return NextResponse.json({
      totalProfit,
      totalExpenses, // Order-specific expenses
      generalExpenses, // General business expenses
      totalAllExpenses: totalExpenses + generalExpenses, // Combined expenses (display only)
      netProfit: calculateNetProfit(totalProfit, generalExpenses) // Order profit already includes order expenses
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

