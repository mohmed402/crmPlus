import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrderPayment, deleteOrderPayment } from '@/lib/payments';

const ERROR_MESSAGES = {
  'Amount must be greater than 0': 'المبلغ يجب أن يكون أكبر من صفر',
  'Refund cannot exceed amount paid': 'لا يمكن أن يتجاوز الاسترداد المبلغ المدفوع',
  'Invalid payment kind': 'نوع الدفعة غير صالح',
  'Invalid payment method': 'طريقة الدفع غير صالحة',
  'Payment not found': 'قيد الدفع غير موجود'
};

function translateError(message) {
  return ERROR_MESSAGES[message] || message || 'فشل في حفظ الدفعة';
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const kind = body.kind || 'payment';

    if (kind === 'refund' && userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }

    const paymentId = await createOrderPayment(
      parseInt(params.id),
      body,
      parseInt(userId)
    );

    return NextResponse.json({ success: true, paymentId });
  } catch (error) {
    console.error('Error creating payment:', error);
    const status = error.message === 'Refund cannot exceed amount paid'
      || error.message === 'Amount must be greater than 0'
      || error.message?.startsWith('Invalid')
      ? 400
      : 500;
    return NextResponse.json(
      { error: translateError(error.message) },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    await deleteOrderPayment(parseInt(paymentId), parseInt(userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    const status = error.message === 'Payment not found' ? 404 : 500;
    return NextResponse.json(
      { error: translateError(error.message) },
      { status }
    );
  }
}
