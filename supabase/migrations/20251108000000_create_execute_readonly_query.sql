-- Create function to safely execute read-only SQL queries
-- This function allows users to execute SELECT queries on practice tables
CREATE OR REPLACE FUNCTION public.execute_readonly_query(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  column_order JSON;
  first_row RECORD;
BEGIN
  -- Validate that query is read-only (starts with SELECT or WITH)
  IF NOT (upper(trim(sql_query)) LIKE 'SELECT%' OR upper(trim(sql_query)) LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT and WITH (CTE) queries are allowed';
  END IF;

  -- Check for dangerous keywords
  IF upper(sql_query) ~* '\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Dangerous keyword detected. Only SELECT and WITH (CTEs) are allowed.';
  END IF;

  -- Strip trailing semicolons if present
  sql_query := rtrim(sql_query, '; ');
  
  -- Execute the query and return results as JSON with column order preserved
  -- First, get column names in SELECT order by executing the query and getting column info
  -- Then return data with column order preserved
  -- Since we've already validated the query is safe (SELECT/WITH only, no dangerous keywords),
  -- we can safely use string concatenation for dynamic SQL execution
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  
  -- If result is null (no rows), return empty array
  IF result IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  -- Get column order from the first row
  -- Execute a LIMIT 1 query to get column names in SELECT order
  EXECUTE format('SELECT * FROM (%s) t LIMIT 1', sql_query) INTO first_row;
  
  -- If we have a row, extract column names in order
  -- jsonb_each_text with WITH ORDINALITY preserves the order from the record
  IF first_row IS NOT NULL THEN
    -- Convert record to jsonb and extract keys in order
    -- jsonb_each_text preserves the insertion order when used with WITH ORDINALITY
    SELECT json_agg(key ORDER BY ordinality)
    INTO column_order
    FROM jsonb_each_text(to_jsonb(first_row)) WITH ORDINALITY AS t(key, value, ordinality);
    
    -- Return result with column order
    RETURN json_build_object(
      'rows', result,
      'column_order', COALESCE(column_order, '[]'::json)
    );
  END IF;
  
  -- If no rows, still return structure but with empty column_order
  RETURN json_build_object(
    'rows', result,
    'column_order', '[]'::json
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Provide more detailed error information
    RAISE EXCEPTION 'SQL Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(TEXT) TO authenticated;

