-- BUG-008: Standardize stored service currency to PHP.
-- The app serves the Subic Bay (PH) market, so all prices are pesos. Earlier
-- rows were stored as 'CAD' while the UI rendered the peso symbol, causing a
-- data/display mismatch. Normalize existing data and the column default to PHP.

UPDATE provider_service SET currency = 'PHP' WHERE currency IS NULL OR currency <> 'PHP';

ALTER TABLE provider_service ALTER COLUMN currency SET DEFAULT 'PHP';
