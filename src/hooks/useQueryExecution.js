import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing SQL query execution
 */
export function useQueryExecution() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      // Use fetch directly to get better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/execute-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle HTTP errors
        const errorMsg = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Check if the response contains an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      setResult(result);
    } catch (error) {
      console.error('Error executing query:', error);
      let errorMessage = 'Failed to execute query. Please check your SQL syntax.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      } else {
        errorMessage = String(error);
      }
      
      setResult({ error: errorMessage });
    } finally {
      setExecuting(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
  };

  return {
    query,
    setQuery,
    result,
    setResult,
    executing,
    executeQuery,
    clearQuery
  };
}

