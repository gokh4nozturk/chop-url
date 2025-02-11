-- Visits tablosuna yeni lokasyon kolonları ekleme
ALTER TABLE visits ADD COLUMN region text;
ALTER TABLE visits ADD COLUMN region_code text;
ALTER TABLE visits ADD COLUMN timezone text;
ALTER TABLE visits ADD COLUMN longitude text;
ALTER TABLE visits ADD COLUMN latitude text;
ALTER TABLE visits ADD COLUMN postal_code text; 