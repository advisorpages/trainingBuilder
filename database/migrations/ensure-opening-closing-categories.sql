BEGIN;

INSERT INTO categories (name, description, is_active, created_at, updated_at)
SELECT 'Opening', 'Session opening activities and icebreakers', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE LOWER(name) = 'opening'
);

INSERT INTO categories (name, description, is_active, created_at, updated_at)
SELECT 'Closing', 'Session closing activities and wrap-ups', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE LOWER(name) = 'closing'
);

COMMIT;
