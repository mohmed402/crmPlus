import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrUpdateOrderFinance } from '@/lib/finance';
import { recordOrderEvent } from '@/lib/orderEvents';

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;
    
    console.log('Finance API - Auth check:', { 
      userId, 
      userRole,
      hasUserId: !!userId,
      hasUserRole: !!userRole,
      isOwner: userRole === 'owner'
    });
    
    if (!userId) {
      console.error('Finance API - No user_id cookie found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (!userRole || userRole !== 'owner') {
      console.error('Finance API - User is not owner. Role:', userRole);
      return NextResponse.json(
        { error: 'Unauthorized - Owner only access' },
        { status: 403 }
      );
    }
    
    const financeData = await request.json();
    console.log('Saving finance data for order:', params.orderId, financeData);
    await createOrUpdateOrderFinance(parseInt(params.orderId), financeData);
    await recordOrderEvent({
      orderId: parseInt(params.orderId),
      eventType: 'finance_updated',
      actorId: parseInt(userId),
      summary: 'تم تحديث المعلومات المالية'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving finance data:', error);
    return NextResponse.json(
      { error: 'Failed to save finance data', details: error.message },
      { status: 500 }
    );
  }
}

