-- Create function to safely execute read-only SQL queries
-- This function allows users to execute SELECT queries on practice tables
CREATE OR REPLACE FUNCTION public.execute_readonly_query(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate that query is read-only (starts with SELECT or WITH)
  IF NOT (upper(trim(sql_query)) LIKE 'SELECT%' OR upper(trim(sql_query)) LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT and WITH (CTE) queries are allowed';
  END IF;

  -- Check for dangerous keywords
  IF upper(sql_query) ~* '\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Dangerous keyword detected. Only SELECT and WITH (CTEs) are allowed.';
  END IF;

  -- Execute the query and return results as JSON
  -- Since we've already validated the query is safe (SELECT/WITH only, no dangerous keywords),
  -- we can safely use string concatenation for dynamic SQL execution
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  
  -- If result is null (no rows), return empty array
  IF result IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Provide more detailed error information
    RAISE EXCEPTION 'SQL Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(TEXT) TO authenticated;

