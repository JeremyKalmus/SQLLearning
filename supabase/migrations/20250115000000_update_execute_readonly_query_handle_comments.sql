-- Update execute_readonly_query function to handle SQL comments
-- This allows queries with comments (-- and /* */) to be executed

CREATE OR REPLACE FUNCTION public.execute_readonly_query(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  column_order JSON;
  first_row RECORD;
  query_for_validation TEXT;
BEGIN
  -- Strip comments for validation (but keep original for execution)
  -- Remove multi-line comments /* ... */
  query_for_validation := regexp_replace(sql_query, '/\*.*?\*/', ' ', 'gs');
  -- Remove single-line comments -- ... (to end of line)
  query_for_validation := regexp_replace(query_for_validation, '--[^\r\n]*', ' ', 'g');
  -- Clean up whitespace
  query_for_validation := regexp_replace(query_for_validation, E'\\s+', ' ', 'g');
  query_for_validation := trim(query_for_validation);
  
  -- Validate that query is read-only (starts with SELECT or WITH)
  IF NOT (upper(query_for_validation) LIKE 'SELECT%' OR upper(query_for_validation) LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT and WITH (CTE) queries are allowed';
  END IF;

  -- Check for dangerous keywords (in query with comments stripped)
  IF upper(query_for_validation) ~* '\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b' THEN
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
  
  -- Get column order by parsing the SELECT statement
  -- This is the most reliable way to preserve SELECT column order
  DECLARE
    select_clause text;
    from_pos int;
    col_list text[];
    col_name text;
    col_names text[];
    query_normalized text;
    i int;
  BEGIN
    -- Normalize query (remove extra whitespace, handle case)
    query_normalized := regexp_replace(sql_query, E'\\s+', ' ', 'g');
    
    -- Find SELECT keyword position
    IF upper(query_normalized) LIKE 'SELECT%' THEN
      -- Find FROM keyword (case insensitive)
      from_pos := position(' FROM ' in upper(query_normalized));
      IF from_pos = 0 THEN
        from_pos := position(' FROM' in upper(query_normalized));
      END IF;
      
      IF from_pos > 0 THEN
        -- Extract SELECT clause (everything between SELECT and FROM)
        select_clause := trim(substring(query_normalized from 7 for from_pos - 7));
        
        -- Handle SELECT * case
        IF trim(upper(select_clause)) = '*' THEN
          -- For SELECT *, we'll need to get columns from the result
          -- Fall through to JSON extraction below
          select_clause := NULL;
        ELSE
          -- Split by comma, but be careful of commas in function calls
          -- Simple approach: split and clean each column
          col_list := string_to_array(select_clause, ',');
          
          -- Extract column names/aliases
          FOR i IN 1..array_length(col_list, 1) LOOP
            col_name := trim(col_list[i]);
            
            -- Remove AS alias if present (case insensitive)
            IF position(' AS ' in upper(col_name)) > 0 THEN
              -- Extract alias (the part after AS)
              DECLARE
                alias_part text;
              BEGIN
                alias_part := trim(split_part(col_name, ' AS ', 2));
                -- Remove quotes from alias
                alias_part := trim(both '"' from alias_part);
                alias_part := trim(both ''' from alias_part);
                col_names := array_append(col_names, alias_part);
              END;
            ELSIF position(' ' in col_name) > 0 THEN
              -- Might be an alias without AS (e.g., "col alias")
              -- Check if the second word is a keyword
              DECLARE
                first_part text;
                second_part text;
                is_keyword boolean;
              BEGIN
                first_part := trim(split_part(col_name, ' ', 1));
                second_part := trim(split_part(col_name, ' ', 2));
                is_keyword := upper(second_part) IN ('FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'INTERSECT', 'EXCEPT');
                
                IF NOT is_keyword AND second_part IS NOT NULL AND second_part != '' THEN
                  -- It's an alias
                  second_part := trim(both '"' from second_part);
                  second_part := trim(both ''' from second_part);
                  col_names := array_append(col_names, second_part);
                ELSE
                  -- No alias, extract column name
                  -- Remove table prefix if present
                  IF position('.' in first_part) > 0 THEN
                    first_part := split_part(first_part, '.', 2);
                  END IF;
                  -- Remove quotes
                  first_part := trim(both '"' from first_part);
                  first_part := trim(both ''' from first_part);
                  col_names := array_append(col_names, first_part);
                END IF;
              END;
            ELSE
              -- Simple column name
              -- Remove table prefix if present
              IF position('.' in col_name) > 0 THEN
                col_name := split_part(col_name, '.', 2);
              END IF;
              -- Remove quotes
              col_name := trim(both '"' from col_name);
              col_name := trim(both ''' from col_name);
              col_names := array_append(col_names, col_name);
            END IF;
          END LOOP;
          
          -- Convert to JSON
          IF array_length(col_names, 1) > 0 THEN
            column_order := array_to_json(col_names);
          END IF;
        END IF;
      END IF;
    END IF;
    
    -- If parsing failed or SELECT *, fall back to extracting from JSON
    IF column_order IS NULL AND json_array_length(result) > 0 THEN
      DECLARE
        first_row_json json;
      BEGIN
        first_row_json := result -> 0;
        -- Try json_each_text as fallback
        SELECT array_to_json(array_agg(key ORDER BY ordinality))
        INTO column_order
        FROM json_each_text(first_row_json) WITH ORDINALITY AS t(key, value, ordinality);
      END;
    END IF;
    
    -- Return result with column order
    RETURN json_build_object(
      'rows', result,
      'column_order', COALESCE(column_order, '[]'::json)
    );
  END;
  
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

