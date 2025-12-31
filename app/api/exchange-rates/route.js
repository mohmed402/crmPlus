import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllExchangeRates, createExchangeRate, getLatestExchangeRate } from '@/lib/finance';

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
    const latest = searchParams.get('latest');
    
    if (latest === 'true') {
      const rate = await getLatestExchangeRate();
      return NextResponse.json({ rate });
    }
    
    const rates = await getAllExchangeRates();
    return NextResponse.json({ rates });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;
    
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }
    
    const { date, fx_try_to_lyd } = await request.json();
    await createExchangeRate(date, fx_try_to_lyd);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create exchange rate' },
      { status: 500 }
    );
  }
}

