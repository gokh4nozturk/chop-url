-- Add new location columns to visits table if they don't exist
SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('visits') WHERE name = 'timezone')
    THEN 'ALTER TABLE visits ADD COLUMN timezone text;'
END AS sql_statement
WHERE sql_statement IS NOT NULL;

SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('visits') WHERE name = 'longitude')
    THEN 'ALTER TABLE visits ADD COLUMN longitude text;'
END AS sql_statement
WHERE sql_statement IS NOT NULL;

SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('visits') WHERE name = 'latitude')
    THEN 'ALTER TABLE visits ADD COLUMN latitude text;'
END AS sql_statement
WHERE sql_statement IS NOT NULL;

SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('visits') WHERE name = 'postal_code')
    THEN 'ALTER TABLE visits ADD COLUMN postal_code text;'
END AS sql_statement
WHERE sql_statement IS NOT NULL; 