import sqlite3
import os
import re

class SQLChecker:
    """Validates and executes SQL queries safely"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), '../database/practice.db')

        # Dangerous keywords that should not be allowed
        self.dangerous_keywords = [
            'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER',
            'CREATE', 'TRUNCATE', 'REPLACE', 'PRAGMA'
        ]

    def is_safe_query(self, query):
        """Check if query is safe to execute (read-only)"""
        query_upper = query.upper().strip()

        # Check for dangerous keywords
        for keyword in self.dangerous_keywords:
            if re.search(r'\b' + keyword + r'\b', query_upper):
                return False, f"Query contains forbidden keyword: {keyword}"

        # Must start with SELECT or WITH (for CTEs)
        if not (query_upper.startswith('SELECT') or query_upper.startswith('WITH')):
            return False, "Only SELECT queries and CTEs are allowed"

        return True, "Query is safe"

    def execute_query(self, query, params=None):
        """Execute a SQL query and return results"""

        # Validate query safety
        is_safe, message = self.is_safe_query(query)
        if not is_safe:
            raise ValueError(message)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        cursor = conn.cursor()

        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            # Fetch results
            rows = cursor.fetchall()

            # Convert to list of dictionaries
            result = []
            for row in rows:
                result.append(dict(row))

            conn.close()
            return result

        except sqlite3.Error as e:
            conn.close()
            raise Exception(f"SQL Error: {str(e)}")

    def get_schema(self):
        """Get the schema information for all tables"""

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]

        schema = {}

        for table in tables:
            # Get column information
            cursor.execute(f"PRAGMA table_info({table})")
            columns = []

            for col in cursor.fetchall():
                columns.append({
                    'name': col[1],
                    'type': col[2],
                    'nullable': not col[3],
                    'primary_key': bool(col[5])
                })

            # Get foreign keys
            cursor.execute(f"PRAGMA foreign_key_list({table})")
            foreign_keys = []

            for fk in cursor.fetchall():
                foreign_keys.append({
                    'column': fk[3],
                    'references_table': fk[2],
                    'references_column': fk[4]
                })

            schema[table] = {
                'columns': columns,
                'foreign_keys': foreign_keys
            }

        conn.close()
        return schema

    def get_sample_data(self, table, limit=5):
        """Get sample rows from a table"""

        if not table:
            return {'error': 'Table name is required'}

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # Validate table exists
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table,)
            )
            if not cursor.fetchone():
                conn.close()
                return {'error': f'Table "{table}" does not exist'}

            # Get sample data
            cursor.execute(f"SELECT * FROM {table} LIMIT ?", (limit,))
            rows = cursor.fetchall()

            result = []
            for row in rows:
                result.append(dict(row))

            conn.close()
            return {'table': table, 'rows': result}

        except sqlite3.Error as e:
            conn.close()
            return {'error': str(e)}

    def get_table_row_count(self, table):
        """Get the total number of rows in a table"""

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except sqlite3.Error as e:
            conn.close()
            raise Exception(f"Error counting rows: {str(e)}")
