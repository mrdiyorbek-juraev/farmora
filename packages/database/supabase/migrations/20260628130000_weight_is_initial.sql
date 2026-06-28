-- Cattle Management — flag the creation weigh-in
-- The weight recorded when an animal is created is its "initial" weight. It
-- can be edited (to correct a typo) but must not be deleted, so the chart
-- always has an anchor point. A boolean flag marks it — robust even if a
-- later weigh-in is back-dated before it.
-- Apply locally with: pnpm --filter @repo/database db:reset
-- Apply to remote with: pnpm --filter @repo/database db:push

alter table weight_measurements
  add column if not exists is_initial boolean not null default false;
