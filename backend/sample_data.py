import sqlite3
import os
from datetime import datetime, timedelta
import random

class SampleDataGenerator:
    """Generates realistic sample data for SQL practice"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), '../database/practice.db')
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def initialize_database(self):
        """Create and populate the practice database"""
        if os.path.exists(self.db_path):
            return  # Database already exists

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create tables
        self._create_tables(cursor)

        # Populate with sample data
        self._populate_data(cursor)

        conn.commit()
        conn.close()

    def _create_tables(self, cursor):
        """Create all practice tables"""

        # Customers table
        cursor.execute('''
            CREATE TABLE customers (
                customer_id INTEGER PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                city TEXT,
                state TEXT,
                country TEXT,
                registration_date DATE NOT NULL,
                is_active INTEGER DEFAULT 1
            )
        ''')

        # Products table
        cursor.execute('''
            CREATE TABLE products (
                product_id INTEGER PRIMARY KEY,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                cost DECIMAL(10,2) NOT NULL,
                stock_quantity INTEGER DEFAULT 0,
                supplier TEXT
            )
        ''')

        # Orders table
        cursor.execute('''
            CREATE TABLE orders (
                order_id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                order_date DATE NOT NULL,
                ship_date DATE,
                total_amount DECIMAL(10,2) NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
            )
        ''')

        # Order items table
        cursor.execute('''
            CREATE TABLE order_items (
                order_item_id INTEGER PRIMARY KEY,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                discount DECIMAL(5,2) DEFAULT 0,
                FOREIGN KEY (order_id) REFERENCES orders(order_id),
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            )
        ''')

        # Employees table
        cursor.execute('''
            CREATE TABLE employees (
                employee_id INTEGER PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                department TEXT NOT NULL,
                position TEXT NOT NULL,
                salary DECIMAL(10,2) NOT NULL,
                hire_date DATE NOT NULL,
                manager_id INTEGER,
                FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
            )
        ''')

        # Sales table
        cursor.execute('''
            CREATE TABLE sales (
                sale_id INTEGER PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                sale_date DATE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                region TEXT NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
            )
        ''')

    def _populate_data(self, cursor):
        """Populate tables with sample data"""

        # Generate more customers
        first_names = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Jennifer', 'James', 'Mary',
                      'William', 'Patricia', 'Richard', 'Linda', 'Joseph', 'Barbara', 'Thomas', 'Elizabeth', 'Charles', 'Susan',
                      'Christopher', 'Jessica', 'Daniel', 'Sarah', 'Matthew', 'Karen', 'Anthony', 'Nancy', 'Mark', 'Betty',
                      'Donald', 'Margaret', 'Steven', 'Sandra', 'Paul', 'Ashley', 'Andrew', 'Kimberly', 'Joshua', 'Emily',
                      'Kenneth', 'Donna', 'Kevin', 'Michelle', 'Brian', 'Carol', 'George', 'Amanda', 'Timothy', 'Melissa']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                     'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
                     'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
                     'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams']
        cities_states = [
            ('New York', 'NY'), ('Los Angeles', 'CA'), ('Chicago', 'IL'), ('Houston', 'TX'), ('Phoenix', 'AZ'),
            ('Philadelphia', 'PA'), ('San Antonio', 'TX'), ('San Diego', 'CA'), ('Dallas', 'TX'), ('San Jose', 'CA'),
            ('Austin', 'TX'), ('Jacksonville', 'FL'), ('Fort Worth', 'TX'), ('Columbus', 'OH'), ('Charlotte', 'NC'),
            ('San Francisco', 'CA'), ('Indianapolis', 'IN'), ('Seattle', 'WA'), ('Denver', 'CO'), ('Washington', 'DC'),
            ('Boston', 'MA'), ('El Paso', 'TX'), ('Nashville', 'TN'), ('Detroit', 'MI'), ('Oklahoma City', 'OK'),
            ('Portland', 'OR'), ('Las Vegas', 'NV'), ('Memphis', 'TN'), ('Louisville', 'KY'), ('Baltimore', 'MD'),
            ('Milwaukee', 'WI'), ('Albuquerque', 'NM'), ('Tucson', 'AZ'), ('Fresno', 'CA'), ('Sacramento', 'CA'),
            ('Kansas City', 'MO'), ('Mesa', 'AZ'), ('Atlanta', 'GA'), ('Omaha', 'NE'), ('Raleigh', 'NC'),
            ('Miami', 'FL'), ('Long Beach', 'CA'), ('Virginia Beach', 'VA'), ('Oakland', 'CA'), ('Minneapolis', 'MN'),
            ('Tulsa', 'OK'), ('Tampa', 'FL'), ('Arlington', 'TX'), ('New Orleans', 'LA'), ('Wichita', 'KS')
        ]
        
        customers = []
        base_date = datetime(2023, 1, 1)
        for i in range(100):  # Generate 100 customers
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f'{first_name.lower()}.{last_name.lower()}{i}@email.com'
            phone = f'555-{random.randint(1000, 9999)}'
            city, state = random.choice(cities_states)
            registration_date = base_date + timedelta(days=random.randint(0, 365))
            is_active = random.choice([1, 1, 1, 0])  # 75% active
            customers.append((first_name, last_name, email, phone, city, state, 'USA', registration_date.strftime('%Y-%m-%d'), is_active))
        
        cursor.executemany('''
            INSERT INTO customers (first_name, last_name, email, phone, city, state, country, registration_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', customers)

        # Generate more products
        product_templates = [
            ('Laptop Pro 15', 'Electronics', 1299.99, 899.99, 'TechCorp'),
            ('Wireless Mouse', 'Electronics', 29.99, 15.00, 'TechCorp'),
            ('USB-C Cable', 'Electronics', 19.99, 8.00, 'TechCorp'),
            ('Office Chair', 'Furniture', 299.99, 150.00, 'ComfortCo'),
            ('Standing Desk', 'Furniture', 499.99, 250.00, 'ComfortCo'),
            ('Monitor 27"', 'Electronics', 349.99, 200.00, 'TechCorp'),
            ('Keyboard Mechanical', 'Electronics', 149.99, 80.00, 'TechCorp'),
            ('Desk Lamp', 'Furniture', 49.99, 20.00, 'ComfortCo'),
            ('Notebook Set', 'Stationery', 12.99, 5.00, 'PaperPlus'),
            ('Pen Pack', 'Stationery', 8.99, 3.00, 'PaperPlus'),
        ]
        
        # Add variations and more products
        electronics = ['Laptop', 'Tablet', 'Smartphone', 'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Router', 'Switch', 'Hard Drive']
        furniture = ['Chair', 'Desk', 'Lamp', 'Bookshelf', 'Cabinet', 'Table', 'Sofa', 'Stool', 'Stand', 'Drawer']
        stationery = ['Notebook', 'Pen', 'Pencil', 'Marker', 'Eraser', 'Ruler', 'Stapler', 'Clip', 'Folder', 'Binder']
        
        products = []
        for template in product_templates:
            products.append((template[0], template[1], template[2], template[3], random.randint(10, 500), template[4]))
        
        # Add more electronics
        for name in electronics[5:]:
            products.append((f'{name} Pro', 'Electronics', round(random.uniform(50, 500), 2), round(random.uniform(20, 250), 2), random.randint(10, 200), 'TechCorp'))
        
        # Add more furniture
        for name in furniture[3:]:
            products.append((f'{name} Modern', 'Furniture', round(random.uniform(100, 800), 2), round(random.uniform(50, 400), 2), random.randint(5, 100), 'ComfortCo'))
        
        # Add more stationery
        for name in stationery[2:]:
            products.append((f'{name} Set', 'Stationery', round(random.uniform(5, 50), 2), round(random.uniform(2, 25), 2), random.randint(50, 500), 'PaperPlus'))
        
        cursor.executemany('''
            INSERT INTO products (product_name, category, price, cost, stock_quantity, supplier)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', products)

        # Sample orders and order items
        base_date = datetime(2024, 1, 1)
        order_id = 1
        order_item_id = 1

        for i in range(200):  # Create 200 orders
            customer_id = random.randint(1, 100)  # Match number of customers
            order_date = base_date + timedelta(days=random.randint(0, 300))
            ship_date = order_date + timedelta(days=random.randint(1, 7))
            status = random.choice(['Completed', 'Completed', 'Completed', 'Shipped', 'Processing'])

            # Create order items
            num_items = random.randint(1, 4)
            total_amount = 0
            items = []

            for _ in range(num_items):
                # Get total number of products
                cursor.execute('SELECT COUNT(*) FROM products')
                product_count = cursor.fetchone()[0]
                product_id = random.randint(1, product_count)
                
                # Get actual product price from database
                cursor.execute('SELECT price FROM products WHERE product_id = ?', (product_id,))
                product_row = cursor.fetchone()
                unit_price = product_row[0] if product_row else random.uniform(10, 500)
                
                quantity = random.randint(1, 5)
                discount = random.choice([0, 0, 0, 0.05, 0.10])
                item_total = unit_price * quantity * (1 - discount)
                total_amount += item_total

                items.append((order_item_id, order_id, product_id, quantity, unit_price, discount))
                order_item_id += 1

            # Insert order
            cursor.execute('''
                INSERT INTO orders (order_id, customer_id, order_date, ship_date, total_amount, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (order_id, customer_id, order_date.strftime('%Y-%m-%d'),
                  ship_date.strftime('%Y-%m-%d'), round(total_amount, 2), status))

            # Insert order items
            cursor.executemany('''
                INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, discount)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', items)

            order_id += 1

        # Generate more employees
        departments = ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations', 'Customer Service']
        positions_by_dept = {
            'Sales': ['Director', 'Manager', 'Senior Rep', 'Rep', 'Associate'],
            'Marketing': ['Director', 'Manager', 'Specialist', 'Coordinator', 'Analyst'],
            'IT': ['Director', 'Manager', 'Developer', 'Engineer', 'Support'],
            'HR': ['Director', 'Manager', 'Specialist', 'Coordinator', 'Recruiter'],
            'Finance': ['Director', 'Manager', 'Analyst', 'Accountant', 'Clerk'],
            'Operations': ['Director', 'Manager', 'Coordinator', 'Specialist', 'Associate'],
            'Customer Service': ['Manager', 'Supervisor', 'Rep', 'Associate', 'Intern']
        }
        salary_ranges = {
            'Director': (90000, 120000),
            'Manager': (70000, 95000),
            'Senior Rep': (60000, 80000),
            'Developer': (75000, 100000),
            'Engineer': (70000, 95000),
            'Specialist': (50000, 70000),
            'Rep': (40000, 60000),
            'Coordinator': (45000, 65000),
            'Analyst': (55000, 75000),
            'Accountant': (50000, 70000),
            'Supervisor': (50000, 70000),
            'Associate': (35000, 50000),
            'Clerk': (30000, 45000),
            'Recruiter': (45000, 65000),
            'Support': (40000, 60000),
            'Intern': (25000, 35000)
        }
        
        employees = []
        employee_id = 1
        managers = {}  # Track managers by department
        
        for dept in departments:
            # Create director/manager first
            pos = 'Director' if dept in ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'] else 'Manager'
            first_name = random.choice(first_names[:20])
            last_name = random.choice(last_names[:20])
            email = f'{first_name.lower()}.{last_name.lower()}@company.com'
            salary_range = salary_ranges.get(pos, (70000, 95000))
            salary = round(random.uniform(salary_range[0], salary_range[1]), 2)
            hire_date = datetime(2019, 1, 1) + timedelta(days=random.randint(0, 365))
            employees.append((employee_id, first_name, last_name, email, dept, pos, salary, hire_date.strftime('%Y-%m-%d'), None))
            managers[dept] = employee_id
            employee_id += 1
            
            # Create 3-5 employees per department
            num_emps = random.randint(3, 5)
            for _ in range(num_emps):
                pos = random.choice(positions_by_dept[dept])
                first_name = random.choice(first_names[:20])
                last_name = random.choice(last_names[:20])
                email = f'{first_name.lower()}.{last_name.lower()}{employee_id}@company.com'
                salary_range = salary_ranges.get(pos, (40000, 70000))
                salary = round(random.uniform(salary_range[0], salary_range[1]), 2)
                hire_date = datetime(2020, 1, 1) + timedelta(days=random.randint(0, 1000))
                employees.append((employee_id, first_name, last_name, email, dept, pos, salary, hire_date.strftime('%Y-%m-%d'), managers[dept]))
                employee_id += 1
        
        cursor.executemany('''
            INSERT INTO employees (employee_id, first_name, last_name, email, department, position, salary, hire_date, manager_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', employees)

        # Sample sales
        sales_base = datetime(2024, 1, 1)
        sales_data = []
        sale_id = 1

        # Get sales employee IDs
        cursor.execute("SELECT employee_id FROM employees WHERE department = 'Sales'")
        sales_employee_ids = [row[0] for row in cursor.fetchall()]
        
        for i in range(500):  # 500 sales records
            employee_id = random.choice(sales_employee_ids) if sales_employee_ids else random.randint(1, 3)
            sale_date = sales_base + timedelta(days=random.randint(0, 300))
            amount = round(random.uniform(100, 5000), 2)
            region = random.choice(['North', 'South', 'East', 'West', 'Central'])
            sales_data.append((sale_id, employee_id, sale_date.strftime('%Y-%m-%d'), amount, region))
            sale_id += 1

        cursor.executemany('''
            INSERT INTO sales (sale_id, employee_id, sale_date, amount, region)
            VALUES (?, ?, ?, ?, ?)
        ''', sales_data)
