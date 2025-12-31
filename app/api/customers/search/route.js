import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { searchCustomers, getCustomerByPhone } from '@/lib/customers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const query = searchParams.get('q');
    
    if (phone) {
      // Search by phone number
      const customer = await getCustomerByPhone(phone);
      return NextResponse.json({ customer });
    }
    
    if (query) {
      // General search
      const customers = await searchCustomers(query);
      return NextResponse.json({ customers });
    }
    
    return NextResponse.json({ customers: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}

