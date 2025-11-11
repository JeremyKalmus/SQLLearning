-- Update execute_readonly_query to support multiple read-only queries and return all result sets

CREATE OR REPLACE FUNCTION public.execute_readonly_query(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  all_results JSONB[] := ARRAY[]::JSONB[];
  single_result JSON;
  query_for_validation TEXT;
  queries TEXT[];
  single_query TEXT;
  query_parts TEXT[];
  i INT;
  arr_len INT;
BEGIN
  -- Strip comments for validation
  query_for_validation := regexp_replace(sql_query, '/\*.*?\*/', ' ', 'gs');
  query_for_validation := regexp_replace(query_for_validation, '--[^\r\n]*', ' ', 'g');
  query_for_validation := regexp_replace(query_for_validation, E'\\s+', ' ', 'g');
  query_for_validation := trim(query_for_validation);
  
  -- Split and validate each query
  query_parts := regexp_split_to_array(query_for_validation, ';');
  arr_len := COALESCE(array_length(query_parts, 1), 0);
  
  IF arr_len > 0 THEN
    FOR i IN 1..arr_len LOOP
      IF trim(query_parts[i]) != '' AND trim(query_parts[i]) IS NOT NULL THEN
        IF NOT (upper(trim(query_parts[i])) LIKE 'SELECT%' OR upper(trim(query_parts[i])) LIKE 'WITH%') THEN
          RAISE EXCEPTION 'Only SELECT and WITH (CTE) queries are allowed';
        END IF;
        IF upper(trim(query_parts[i])) ~* '\\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\\b' THEN
          RAISE EXCEPTION 'Dangerous keyword detected. Only SELECT and WITH (CTEs) are allowed.';
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Split original query (with comments preserved)
  queries := regexp_split_to_array(sql_query, ';');
  arr_len := COALESCE(array_length(queries, 1), 0);
  
  -- Execute each query and collect results
  IF arr_len > 0 THEN
    FOR i IN 1..arr_len LOOP
      single_query := trim(queries[i]);
      
      -- Strip comments to check if it's a real query
      query_for_validation := regexp_replace(single_query, '/\*.*?\*/', ' ', 'gs');
      query_for_validation := regexp_replace(query_for_validation, '--[^\r\n]*', ' ', 'g');
      query_for_validation := regexp_replace(query_for_validation, E'\\s+', ' ', 'g');
      query_for_validation := trim(query_for_validation);
      
      IF query_for_validation != '' AND query_for_validation IS NOT NULL THEN
        single_query := rtrim(single_query, '; ');
        
        BEGIN
          EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || single_query || ') t' INTO single_result;
          
          IF single_result IS NULL THEN
            single_result := '[]'::json;
          END IF;
          
          all_results := array_append(all_results, json_build_object(
            'queryIndex', i,
            'query', single_query,
            'rows', single_result,
            'rowCount', json_array_length(single_result),
            'column_order', '[]'::json
          )::jsonb);
        EXCEPTION
          WHEN OTHERS THEN
            all_results := array_append(all_results, json_build_object(
              'queryIndex', i,
              'query', single_query,
              'error', SQLERRM,
              'rows', '[]'::json,
              'rowCount', 0,
              'column_order', '[]'::json
            )::jsonb);
        END;
      END IF;
    END LOOP;
  END IF;
  
  RETURN array_to_json(all_results)::json;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;
