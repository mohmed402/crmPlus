import { supabase } from './supabase';

export const FINANCIAL_EVENT_TYPES = ['finance_updated', 'expense_added', 'expense_deleted'];

const STATUS_LABELS = {
  New: 'جديد',
  Shipped: 'تم الشحن',
  Delivered: 'تم التسليم',
  Cancelled: 'ملغي'
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '-';
}

export async function recordOrderEvent({
  orderId,
  eventType,
  actorId = null,
  summary,
  metadata = {}
}) {
  const { error } = await supabase
    .from('order_events')
    .insert({
      order_id: orderId,
      event_type: eventType,
      actor_id: actorId,
      summary,
      metadata
    });

  if (error) {
    console.error('Error recording order event:', error);
  }
}

export async function getOrderEvents(orderId, { includeFinancial = false } = {}) {
  const { data, error } = await supabase
    .from('order_events')
    .select(`
      id,
      order_id,
      event_type,
      actor_id,
      summary,
      metadata,
      created_at,
      users:actor_id (
        username
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting order events:', error);
    return [];
  }

  const events = (data || []).map((event) => {
    const username = event.users?.username || null;
    delete event.users;
    return {
      ...event,
      actor_username: username
    };
  });

  if (includeFinancial) {
    return events;
  }

  return events.filter((event) => !FINANCIAL_EVENT_TYPES.includes(event.event_type));
}
