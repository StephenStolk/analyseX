-- Plans: Single Report ($4.99 / ₹414 → 1 report), Starter ($15 / ₹1,245 → 10 reports), Pro ($19 / ₹1,577 → 30 reports)
-- This script is idempotent: it upserts by unique name.
-- It assumes columns: name (unique), price_usd numeric, price_inr numeric, reports_limit int, is_unlimited boolean.

INSERT INTO subscription_plans (name, price_usd, price_inr, reports_limit, is_unlimited)
VALUES
  ('Single Report', 4.99, 414, 1, false),
  ('Starter', 15, 1245, 10, false),
  ('Pro (Best Value)', 19, 1577, 30, false)
ON CONFLICT (name) DO UPDATE
SET price_usd = EXCLUDED.price_usd,
    price_inr = EXCLUDED.price_inr,
    reports_limit = EXCLUDED.reports_limit,
    is_unlimited = EXCLUDED.is_unlimited;
