// Data modification statements

export const dataModificationSection = {
  id: 'data-modification',
  title: 'Data Modification',
  searchTerms: ['insert', 'update', 'delete', 'modify', 'change', 'add', 'remove'],
  items: [
    {
      subtitle: 'INSERT',
      code: `-- Insert single row
INSERT INTO table_name (column1, column2)
VALUES ('value1', 'value2');

-- Insert multiple rows
INSERT INTO table_name (column1, column2)
VALUES
    ('value1', 'value2'),
    ('value3', 'value4');

-- Insert from SELECT
INSERT INTO table_name (column1, column2)
SELECT column1, column2
FROM other_table
WHERE condition;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'UPDATE',
      code: `UPDATE table_name
SET column1 = 'new_value',
    column2 = column2 * 1.1
WHERE condition;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'DELETE',
      code: `DELETE FROM table_name
WHERE condition;`,
      description: null,
      tip: null
    }
  ]
};
