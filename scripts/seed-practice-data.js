import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const seedData = async () => {
  console.log('Starting to seed practice database...');

  const firstNames = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Jennifer', 'James', 'Mary',
    'William', 'Patricia', 'Richard', 'Linda', 'Joseph', 'Barbara', 'Thomas', 'Elizabeth', 'Charles', 'Susan'];

  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];

  const citiesStates = [
    ['New York', 'NY'], ['Los Angeles', 'CA'], ['Chicago', 'IL'], ['Houston', 'TX'], ['Phoenix', 'AZ'],
    ['Philadelphia', 'PA'], ['San Antonio', 'TX'], ['San Diego', 'CA'], ['Dallas', 'TX'], ['San Jose', 'CA'],
    ['Austin', 'TX'], ['Jacksonville', 'FL'], ['Seattle', 'WA'], ['Denver', 'CO'], ['Boston', 'MA'],
    ['San Francisco', 'CA'], ['Portland', 'OR'], ['Las Vegas', 'NV'], ['Atlanta', 'GA'], ['Miami', 'FL']
  ];

  const customers = [];
  const baseDate = new Date('2023-01-01');

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const [city, state] = citiesStates[Math.floor(Math.random() * citiesStates.length)];
    const registrationDate = new Date(baseDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);

    customers.push({
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
      city,
      state,
      country: 'USA',
      registration_date: registrationDate.toISOString().split('T')[0],
      is_active: Math.random() > 0.25
    });
  }

  console.log('Inserting customers...');
  const { error: customersError } = await supabase.from('customers').insert(customers);
  if (customersError) console.error('Error inserting customers:', customersError);

  const products = [
    { product_name: 'Laptop Pro 15', category: 'Electronics', price: 1299.99, cost: 899.99, stock_quantity: 45, supplier: 'TechCorp' },
    { product_name: 'Wireless Mouse', category: 'Electronics', price: 29.99, cost: 15.00, stock_quantity: 200, supplier: 'TechCorp' },
    { product_name: 'USB-C Cable', category: 'Electronics', price: 19.99, cost: 8.00, stock_quantity: 350, supplier: 'TechCorp' },
    { product_name: 'Office Chair', category: 'Furniture', price: 299.99, cost: 150.00, stock_quantity: 30, supplier: 'ComfortCo' },
    { product_name: 'Standing Desk', category: 'Furniture', price: 499.99, cost: 250.00, stock_quantity: 25, supplier: 'ComfortCo' },
    { product_name: 'Monitor 27"', category: 'Electronics', price: 349.99, cost: 200.00, stock_quantity: 60, supplier: 'TechCorp' },
    { product_name: 'Keyboard Mechanical', category: 'Electronics', price: 149.99, cost: 80.00, stock_quantity: 85, supplier: 'TechCorp' },
    { product_name: 'Desk Lamp', category: 'Furniture', price: 49.99, cost: 20.00, stock_quantity: 120, supplier: 'ComfortCo' },
    { product_name: 'Notebook Set', category: 'Stationery', price: 12.99, cost: 5.00, stock_quantity: 400, supplier: 'PaperPlus' },
    { product_name: 'Pen Pack', category: 'Stationery', price: 8.99, cost: 3.00, stock_quantity: 500, supplier: 'PaperPlus' }
  ];

  console.log('Inserting products...');
  const { error: productsError } = await supabase.from('products').insert(products);
  if (productsError) console.error('Error inserting products:', productsError);

  const { data: insertedCustomers } = await supabase.from('customers').select('customer_id');
  const { data: insertedProducts } = await supabase.from('products').select('product_id, price');

  const orders = [];
  const orderItems = [];
  const orderBaseDate = new Date('2024-01-01');

  for (let i = 0; i < 200; i++) {
    const customerId = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)].customer_id;
    const orderDate = new Date(orderBaseDate.getTime() + Math.random() * 300 * 24 * 60 * 60 * 1000);
    const shipDate = new Date(orderDate.getTime() + (1 + Math.random() * 7) * 24 * 60 * 60 * 1000);
    const status = ['Completed', 'Completed', 'Completed', 'Shipped', 'Processing'][Math.floor(Math.random() * 5)];

    let totalAmount = 0;
    const numItems = Math.floor(1 + Math.random() * 4);
    const orderItemsForThisOrder = [];

    for (let j = 0; j < numItems; j++) {
      const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const quantity = Math.floor(1 + Math.random() * 5);
      const discount = [0, 0, 0, 0.05, 0.10][Math.floor(Math.random() * 5)];
      const itemTotal = product.price * quantity * (1 - discount);
      totalAmount += itemTotal;

      orderItemsForThisOrder.push({
        product_id: product.product_id,
        quantity,
        unit_price: product.price,
        discount
      });
    }

    orders.push({
      customer_id: customerId,
      order_date: orderDate.toISOString().split('T')[0],
      ship_date: shipDate.toISOString().split('T')[0],
      total_amount: Math.round(totalAmount * 100) / 100,
      status
    });
  }

  console.log('Inserting orders...');
  const { data: insertedOrders, error: ordersError } = await supabase.from('orders').insert(orders).select('order_id');
  if (ordersError) console.error('Error inserting orders:', ordersError);

  console.log('Creating order items...');
  let orderItemIndex = 0;
  for (let i = 0; i < orders.length; i++) {
    const numItems = Math.floor(1 + Math.random() * 4);
    for (let j = 0; j < numItems; j++) {
      const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const quantity = Math.floor(1 + Math.random() * 5);
      const discount = [0, 0, 0, 0.05, 0.10][Math.floor(Math.random() * 5)];

      orderItems.push({
        order_id: insertedOrders[i].order_id,
        product_id: product.product_id,
        quantity,
        unit_price: product.price,
        discount
      });
    }
  }

  console.log('Inserting order items...');
  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
  if (orderItemsError) console.error('Error inserting order items:', orderItemsError);

  const departments = ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'];
  const positions = {
    'Sales': ['Director', 'Manager', 'Senior Rep', 'Rep'],
    'Marketing': ['Director', 'Manager', 'Specialist', 'Coordinator'],
    'IT': ['Director', 'Manager', 'Developer', 'Engineer'],
    'HR': ['Director', 'Manager', 'Specialist', 'Coordinator'],
    'Finance': ['Director', 'Manager', 'Analyst', 'Accountant'],
    'Operations': ['Director', 'Manager', 'Coordinator', 'Specialist']
  };

  const employees = [];
  let employeeId = 1;
  const managers = {};

  for (const dept of departments) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hireDate = new Date(2019, 0, 1 + Math.floor(Math.random() * 365));

    employees.push({
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: dept,
      position: 'Director',
      salary: 90000 + Math.random() * 30000,
      hire_date: hireDate.toISOString().split('T')[0],
      manager_id: null
    });

    const directorIndex = employees.length - 1;

    for (let i = 0; i < 3; i++) {
      const empFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const empLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const empHireDate = new Date(2020, 0, 1 + Math.floor(Math.random() * 1000));

      employees.push({
        first_name: empFirstName,
        last_name: empLastName,
        email: `${empFirstName.toLowerCase()}.${empLastName.toLowerCase()}${employeeId}@company.com`,
        department: dept,
        position: positions[dept][1 + Math.floor(Math.random() * (positions[dept].length - 1))],
        salary: 40000 + Math.random() * 50000,
        hire_date: empHireDate.toISOString().split('T')[0],
        manager_id: null
      });
      employeeId++;
    }
  }

  console.log('Inserting employees...');
  const { data: insertedEmployees, error: employeesError } = await supabase.from('employees').insert(employees).select('employee_id, department, position');
  if (employeesError) console.error('Error inserting employees:', employeesError);

  const salesEmployees = insertedEmployees.filter(e => e.department === 'Sales');
  const sales = [];
  const salesBaseDate = new Date('2024-01-01');

  for (let i = 0; i < 500; i++) {
    const employee = salesEmployees[Math.floor(Math.random() * salesEmployees.length)];
    const saleDate = new Date(salesBaseDate.getTime() + Math.random() * 300 * 24 * 60 * 60 * 1000);
    const amount = 100 + Math.random() * 4900;
    const region = ['North', 'South', 'East', 'West', 'Central'][Math.floor(Math.random() * 5)];

    sales.push({
      employee_id: employee.employee_id,
      sale_date: saleDate.toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
      region
    });
  }

  console.log('Inserting sales...');
  const { error: salesError } = await supabase.from('sales').insert(sales);
  if (salesError) console.error('Error inserting sales:', salesError);

  console.log('Practice database seeded successfully!');
};

seedData().catch(console.error);
