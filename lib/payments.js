import { supabase } from './supabase';
import {
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  assertRefundAllowed,
  calculateNetPaid,
  deriveDepositPaid,
  toNumber,
  validateLedgerAmount
} from './money';
import { recordOrderEvent } from './orderEvents';

export async function getOrderPayments(orderId) {
  const { data, error } = await supabase
    .from('order_payments')
    .select(`
      id,
      order_id,
      kind,
      amount_lyd,
      method,
      note,
      paid_at,
      created_by,
      created_at,
      users:created_by (
        username
      )
    `)
    .eq('order_id', orderId)
    .order('paid_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error('Error getting order payments:', error);
    return [];
  }

  return (data || []).map((payment) => {
    const username = payment.users?.username || null;
    delete payment.users;
    return {
      ...payment,
      created_by_username: username,
      amount_lyd: toNumber(payment.amount_lyd)
    };
  });
}

export async function getOrderBalance(orderId) {
  const payments = await getOrderPayments(orderId);
  const netPaid = calculateNetPaid(payments);
  return {
    payments,
    netPaid,
    depositPaid: deriveDepositPaid(netPaid)
  };
}

export async function syncOrderPaymentCache(orderId) {
  const { netPaid, depositPaid } = await getOrderBalance(orderId);
  const { error } = await supabase
    .from('orders')
    .update({
      amount_paid: netPaid,
      deposit_paid: depositPaid
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error syncing order payment cache:', error);
    throw error;
  }

  return { netPaid, depositPaid };
}

export async function createOrderPayment(orderId, paymentData, actorId) {
  const kind = paymentData.kind || 'payment';
  if (!PAYMENT_KINDS.includes(kind)) {
    throw new Error('Invalid payment kind');
  }

  const method = paymentData.method || 'cash';
  if (!PAYMENT_METHODS.includes(method)) {
    throw new Error('Invalid payment method');
  }

  const amountCheck = validateLedgerAmount(paymentData.amount_lyd);
  if (!amountCheck.ok) {
    throw new Error(amountCheck.error);
  }

  if (kind === 'refund') {
    const { netPaid } = await getOrderBalance(orderId);
    const refundCheck = assertRefundAllowed(netPaid, amountCheck.value);
    if (!refundCheck.ok) {
      throw new Error(refundCheck.error);
    }
  }

  const insertData = {
    order_id: orderId,
    kind,
    amount_lyd: amountCheck.value,
    method,
    note: paymentData.note || null,
    paid_at: paymentData.paid_at || new Date().toISOString(),
    created_by: actorId || null
  };

  const { data, error } = await supabase
    .from('order_payments')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating order payment:', error);
    throw error;
  }

  await syncOrderPaymentCache(orderId);

  const eventType = kind === 'refund' ? 'payment_refunded' : 'payment_added';
  await recordOrderEvent({
    orderId,
    eventType,
    actorId,
    summary: kind === 'refund' ? 'تم تسجيل استرداد' : 'تم تسجيل دفعة',
    metadata: {
      payment_id: data.id,
      amount_lyd: amountCheck.value,
      method,
      kind
    }
  });

  return data.id;
}

export async function deleteOrderPayment(paymentId, actorId) {
  const { data: payment, error: fetchError } = await supabase
    .from('order_payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    throw new Error('Payment not found');
  }

  const { error } = await supabase
    .from('order_payments')
    .delete()
    .eq('id', paymentId);

  if (error) {
    console.error('Error deleting order payment:', error);
    throw error;
  }

  await syncOrderPaymentCache(payment.order_id);
  await recordOrderEvent({
    orderId: payment.order_id,
    eventType: 'payment_deleted',
    actorId,
    summary: 'تم حذف قيد دفع',
    metadata: {
      payment_id: payment.id,
      amount_lyd: toNumber(payment.amount_lyd),
      method: payment.method,
      kind: payment.kind
    }
  });

  return payment.order_id;
}
