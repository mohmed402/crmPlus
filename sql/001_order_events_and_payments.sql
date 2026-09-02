-- Order payment ledger and timeline.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS order_payments (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('payment', 'refund')),
  amount_lyd numeric(12, 2) NOT NULL CHECK (amount_lyd > 0),
  method text NOT NULL CHECK (method IN ('cash', 'transfer', 'other')),
  note text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_payments_order_id_idx
  ON order_payments (order_id, paid_at DESC);

CREATE TABLE IF NOT EXISTS order_events (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id integer REFERENCES users(id),
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx
  ON order_events (order_id, created_at DESC);

ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- Backfill opening ledger rows from the old amount_paid column.
INSERT INTO order_payments (order_id, kind, amount_lyd, method, note, paid_at, created_by)
SELECT
  o.id,
  'payment',
  o.amount_paid,
  'other',
  'رصيد مرحل',
  COALESCE(o.created_at, now()),
  o.created_by
FROM orders o
WHERE COALESCE(o.amount_paid, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM order_payments p WHERE p.order_id = o.id
  );

-- Seed a created event for existing orders so the timeline is not empty.
INSERT INTO order_events (order_id, event_type, actor_id, summary, metadata, created_at)
SELECT
  o.id,
  'order_created',
  o.created_by,
  'تم إنشاء الطلب',
  jsonb_build_object('status', o.status, 'amount_paid', o.amount_paid),
  COALESCE(o.created_at, now())
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_events e
  WHERE e.order_id = o.id AND e.event_type = 'order_created'
);
