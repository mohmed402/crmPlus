import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllCustomersWithStats } from '@/lib/customers';

export async function GET(request) {
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
    
    // Only owner/admin can access customer statistics
    if (userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const customers = await getAllCustomersWithStats();
    
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Failed to fetch customer statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer statistics' },
      { status: 500 }
    );
  }
}

