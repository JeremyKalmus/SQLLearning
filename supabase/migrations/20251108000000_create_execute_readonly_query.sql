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
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(TEXT) TO authenticated;

