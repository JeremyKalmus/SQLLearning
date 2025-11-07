/*
  # Create Practice Database Tables (Shared Read-Only Data)

  ## Overview
  This migration creates the practice database tables that all users will share
  for SQL query practice. These tables contain realistic business data and are
  read-only for all users.

  ## Tables Created
  
  ### 1. customers
  - `customer_id` (int, primary key) - Unique customer identifier
  - `first_name` (text) - Customer first name
  - `last_name` (text) - Customer last name
  - `email` (text, unique) - Customer email address
  - `phone` (text) - Contact phone number
  - `city` (text) - Customer city
  - `state` (text) - Customer state
  - `country` (text) - Customer country
  - `registration_date` (date) - Date customer registered
  - `is_active` (boolean) - Whether customer account is active

  ### 2. products
  - `product_id` (int, primary key) - Unique product identifier
  - `product_name` (text) - Product name
  - `category` (text) - Product category
  - `price` (numeric) - Selling price
  - `cost` (numeric) - Cost to company
  - `stock_quantity` (int) - Current stock level
  - `supplier` (text) - Supplier name

  ### 3. orders
  - `order_id` (int, primary key) - Unique order identifier
  - `customer_id` (int, foreign key) - Reference to customer
  - `order_date` (date) - Date order was placed
  - `ship_date` (date) - Date order was shipped
  - `total_amount` (numeric) - Total order value
  - `status` (text) - Order status (Processing, Shipped, Completed)

  ### 4. order_items
  - `order_item_id` (int, primary key) - Unique order item identifier
  - `order_id` (int, foreign key) - Reference to order
  - `product_id` (int, foreign key) - Reference to product
  - `quantity` (int) - Quantity ordered
  - `unit_price` (numeric) - Price per unit at time of order
  - `discount` (numeric) - Discount percentage applied

  ### 5. employees
  - `employee_id` (int, primary key) - Unique employee identifier
  - `first_name` (text) - Employee first name
  - `last_name` (text) - Employee last name
  - `email` (text, unique) - Employee email
  - `department` (text) - Department name
  - `position` (text) - Job position
  - `salary` (numeric) - Annual salary
  - `hire_date` (date) - Date employee was hired
  - `manager_id` (int, foreign key) - Reference to manager (self-referencing)

  ### 6. sales
  - `sale_id` (int, primary key) - Unique sale identifier
  - `employee_id` (int, foreign key) - Reference to employee who made sale
  - `sale_date` (date) - Date of sale
  - `amount` (numeric) - Sale amount
  - `region` (text) - Sales region (North, South, East, West, Central)

  ## Security
  - All tables have RLS enabled
  - Users can only SELECT from these tables (read-only access)
  - No INSERT, UPDATE, or DELETE operations allowed for regular users
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  registration_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  supplier TEXT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  order_date DATE NOT NULL,
  ship_date DATE,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  employee_id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  salary NUMERIC(10,2) NOT NULL,
  hire_date DATE NOT NULL,
  manager_id INTEGER REFERENCES employees(employee_id)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  sale_id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
  sale_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  region TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for read-only access to authenticated users
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region);
