import { getDatabase } from './db';
import bcrypt from 'bcryptjs';

export function runSeed() {
  const db = getDatabase();

  // 1. Check if users already seeded
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
  if (userCount > 0) {
    console.log('Database already seeded, skipping duplicate seeds.');
    return;
  }

  console.log('Seeding initial data...');

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('admin123', 8);
  const cashierHash = bcrypt.hashSync('cashier123', 8);

  insertUser.run('usr-admin', 'admin', adminHash, 'Senthil Nathan (Admin)', 'admin');
  insertUser.run('usr-cashier', 'cashier1', cashierHash, 'Anitha R. (Cashier)', 'cashier');

  // 2. Employees (Murugan, Selvan, Anitha, Prakash)
  const insertEmp = db.prepare(`
    INSERT INTO employees (id, employee_code, name, phone, role, joining_date, salary_type, salary_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEmp.run('emp-001', 'EMP001', 'Murugan K.', '9876543210', 'Tea Master (டீ மாஸ்டர்)', '2023-01-15', 'daily', 600.0);
  insertEmp.run('emp-002', 'EMP002', 'Selvan M.', '9876543211', 'Kitchen Assistant (சமையல் உதவியாளர்)', '2023-03-01', 'daily', 500.0);
  insertEmp.run('emp-003', 'EMP003', 'Anitha R.', '9876543212', 'Counter Cashier (காசாளர்)', '2023-05-10', 'monthly', 15000.0);
  insertEmp.run('emp-004', 'EMP004', 'Prakash V.', '9876543213', 'Store & Delivery Assistant (சரக்கு & விநியோகம்)', '2023-06-20', 'monthly', 14000.0);

  // 3. Expense Categories
  const insertCat = db.prepare(`INSERT INTO expense_categories (id, name, description) VALUES (?, ?, ?)`);
  const categories = [
    ['exp-cat-1', 'Raw Materials (மூலப்பொருட்கள்)', 'Tea dust, milk, jaggery, coffee beans'],
    ['exp-cat-2', 'Food Ingredients (உணவு பொருட்கள்)', 'Flour, spices, oil for kitchen snacks'],
    ['exp-cat-3', 'Employee Salary (ஊழியர் சம்பளம்)', 'Wages and monthly salary payments'],
    ['exp-cat-4', 'Rent (கடை வாடகை)', 'Monthly shop and warehouse lease'],
    ['exp-cat-5', 'Electricity (மின்சாரம்)', 'TNEB commercial electricity bill'],
    ['exp-cat-6', 'Gas Cylinder (எரிவாயு)', 'Commercial LPG cooking cylinders'],
    ['exp-cat-7', 'Transportation (போக்குவரத்து)', 'Stock collection, auto and freight charges'],
    ['exp-cat-8', 'Packaging & Disposables (பேக்கிங் பொருட்கள்)', 'Paper cups, pouches, banana leaves'],
    ['exp-cat-9', 'Maintenance & Repairs (பராமரிப்பு)', 'Tea boiler service, grinder repair'],
    ['exp-cat-10', 'Other Miscellaneous (இதர செலவுகள்)', 'General supplies, municipal license']
  ];
  for (const cat of categories) {
    insertCat.run(cat[0], cat[1], cat[2]);
  }

  // 4. Products & Variants & Initial Inventory (Warehouse & Store)
  const insertProduct = db.prepare(`
    INSERT INTO products (id, category, tamil_name, english_name, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, variant_name, sku, unit, cost_price, selling_price, min_stock_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInventory = db.prepare(`
    INSERT INTO inventory_levels (id, variant_id, location, quantity)
    VALUES (?, ?, ?, ?)
  `);

  const insertMovement = db.prepare(`
    INSERT INTO inventory_movements (id, variant_id, movement_type, source_location, destination_location, quantity, unit_cost, reference_id, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Food Menu Items
  const foodItems = [
    { id: 'prod-f-1', tamil: 'செம்பருத்தி பால்', english: 'Hibiscus Milk', cost: 15, price: 35, unit: 'cup', min: 15, store: 50, wh: 100 },
    { id: 'prod-f-2', tamil: 'செம்பருத்தி சர்பத்', english: 'Hibiscus Sharbat', cost: 12, price: 30, unit: 'glass', min: 15, store: 60, wh: 120 },
    { id: 'prod-f-3', tamil: 'சங்கு பூ சர்பத்', english: 'Shankupushpam Sharbat', cost: 12, price: 30, unit: 'glass', min: 15, store: 55, wh: 100 },
    { id: 'prod-f-4', tamil: 'உளுந்து உப்பு கஞ்சி', english: 'Urad Dal Salt Porridge', cost: 18, price: 40, unit: 'bowl', min: 10, store: 40, wh: 80 },
    { id: 'prod-f-5', tamil: 'கேழ்வரகு கழி உருண்டை', english: 'Ragi Kali Ball', cost: 20, price: 45, unit: 'piece', min: 10, store: 35, wh: 70 },
    { id: 'prod-f-6', tamil: 'கேழ்வரகு உப்பு உருண்டை', english: 'Ragi Savory Dumpling', cost: 18, price: 40, unit: 'plate', min: 12, store: 45, wh: 90 },
    { id: 'prod-f-7', tamil: 'அம்மினி கார கொழுக்கட்டை', english: 'Mini Spicy Kozhukattai', cost: 16, price: 40, unit: 'plate', min: 12, store: 40, wh: 80 },
    { id: 'prod-f-8', tamil: 'இளநீர் பாயாசம்', english: 'Elaneer Payasam', cost: 25, price: 50, unit: 'cup', min: 15, store: 30, wh: 60 },
    { id: 'prod-f-9', tamil: 'முருங்கை கீரை வடை', english: 'Moringa Leaves Vadai', cost: 8, price: 20, unit: 'piece', min: 20, store: 80, wh: 150 },
    { id: 'prod-f-10', tamil: 'பீட்ரூட் காரட் வடை', english: 'Beetroot Carrot Vadai', cost: 8, price: 20, unit: 'piece', min: 20, store: 75, wh: 140 }
  ];

  for (const item of foodItems) {
    insertProduct.run(item.id, 'food', item.tamil, item.english, `${item.tamil} - Freshly prepared authentic snacks & beverages`);
    const varId = `var-${item.id}`;
    const sku = `SKU-FOOD-${item.id.replace('prod-f-', '')}`;
    insertVariant.run(varId, item.id, 'Standard', sku, item.unit, item.cost, item.price, item.min);
    insertInventory.run(`inv-s-${varId}`, varId, 'store', item.store);
    insertInventory.run(`inv-w-${varId}`, varId, 'warehouse', item.wh);

    insertMovement.run(`mov-s-${varId}`, varId, 'opening_stock', 'supplier', 'store', item.store, item.cost, 'OPEN-STOCK', 'Initial store stock', 'usr-admin');
    insertMovement.run(`mov-w-${varId}`, varId, 'opening_stock', 'supplier', 'warehouse', item.wh, item.cost, 'OPEN-STOCK', 'Initial warehouse stock', 'usr-admin');
  }

  // Retail Items: Cold Pressed Oils with 200ml, 500ml, 1L packaging variants
  const oils = [
    {
      id: 'prod-oil-1',
      tamil: 'தேங்காய் எண்ணெய் (மரச்செக்கு)',
      english: 'Cold Pressed Coconut Oil',
      variants: [
        { name: '200ml Bottle', sku: 'OIL-COC-200ML', unit: 'ml', cost: 65, price: 95, min: 10, store: 25, wh: 80 },
        { name: '500ml Bottle', sku: 'OIL-COC-500ML', unit: 'ml', cost: 150, price: 220, min: 10, store: 20, wh: 60 },
        { name: '1 Litre Can', sku: 'OIL-COC-1L', unit: 'litre', cost: 280, price: 410, min: 8, store: 15, wh: 50 },
      ]
    },
    {
      id: 'prod-oil-2',
      tamil: 'கடலை எண்ணெய் (மரச்செக்கு)',
      english: 'Cold Pressed Groundnut Oil',
      variants: [
        { name: '200ml Bottle', sku: 'OIL-GND-200ML', unit: 'ml', cost: 55, price: 80, min: 10, store: 30, wh: 90 },
        { name: '500ml Bottle', sku: 'OIL-GND-500ML', unit: 'ml', cost: 130, price: 190, min: 10, store: 22, wh: 65 },
        { name: '1 Litre Can', sku: 'OIL-GND-1L', unit: 'litre', cost: 245, price: 350, min: 8, store: 18, wh: 55 },
      ]
    },
    {
      id: 'prod-oil-3',
      tamil: 'நல்லெண்ணெய் (மரச்செக்கு)',
      english: 'Cold Pressed Sesame / Gingelly Oil',
      variants: [
        { name: '200ml Bottle', sku: 'OIL-SES-200ML', unit: 'ml', cost: 85, price: 120, min: 10, store: 25, wh: 70 },
        { name: '500ml Bottle', sku: 'OIL-SES-500ML', unit: 'ml', cost: 200, price: 290, min: 10, store: 18, wh: 50 },
        { name: '1 Litre Can', sku: 'OIL-SES-1L', unit: 'litre', cost: 380, price: 540, min: 5, store: 12, wh: 40 },
      ]
    }
  ];

  for (const oil of oils) {
    insertProduct.run(oil.id, 'retail', oil.tamil, oil.english, `${oil.tamil} - Pure cold pressed wood churned oil`);
    for (const v of oil.variants) {
      const varId = `var-${v.sku}`;
      insertVariant.run(varId, oil.id, v.name, v.sku, v.unit, v.cost, v.price, v.min);
      insertInventory.run(`inv-s-${varId}`, varId, 'store', v.store);
      insertInventory.run(`inv-w-${varId}`, varId, 'warehouse', v.wh);
      insertMovement.run(`mov-s-${varId}`, varId, 'opening_stock', 'supplier', 'store', v.store, v.cost, 'OPEN-STOCK', 'Initial retail stock', 'usr-admin');
      insertMovement.run(`mov-w-${varId}`, varId, 'opening_stock', 'supplier', 'warehouse', v.wh, v.cost, 'OPEN-STOCK', 'Initial warehouse stock', 'usr-admin');
    }
  }

  // Retail Items: Traditional Heritage Rice Varieties with 500g, 1kg, 5kg packaging variants
  const riceItems = [
    { id: 'prod-rice-1', tamil: 'கருப்பு கவுணி அரிசி', english: 'Karuppu Kavuni Rice (Black Rice)', costPerKg: 110, pricePerKg: 170 },
    { id: 'prod-rice-2', tamil: 'மாப்பிள்ளை சம்பா அரிசி', english: 'Mappillai Samba Rice', costPerKg: 85, pricePerKg: 130 },
    { id: 'prod-rice-3', tamil: 'காட்டு யாகம் அரிசி', english: 'Kaattu Yanam Rice', costPerKg: 95, pricePerKg: 145 },
    { id: 'prod-rice-4', tamil: 'ரத்தசாலி அரிசி', english: 'Rathasali Rice (Red Rice)', costPerKg: 120, pricePerKg: 180 },
    { id: 'prod-rice-5', tamil: 'பூங்கார் அரிசி', english: 'Poongar Rice', costPerKg: 80, pricePerKg: 125 },
    { id: 'prod-rice-6', tamil: 'தூயமல்லி அரிசி', english: 'Thooyamalli Rice', costPerKg: 75, pricePerKg: 115 },
    { id: 'prod-rice-7', tamil: 'மைசூர் மல்லி அரிசி', english: 'Mysore Malli Rice', costPerKg: 80, pricePerKg: 120 },
    { id: 'prod-rice-8', tamil: 'சீரக சம்பா அரிசி', english: 'Seeraga Samba Rice', costPerKg: 95, pricePerKg: 150 },
    { id: 'prod-rice-9', tamil: 'சொர்ண மயூரி அரிசி', english: 'Sorna Mayoori Rice', costPerKg: 85, pricePerKg: 130 },
  ];

  for (const rice of riceItems) {
    insertProduct.run(rice.id, 'retail', rice.tamil, rice.english, `${rice.tamil} - Traditional organic heritage rice rich in antioxidants`);
    const code = rice.id.replace('prod-rice-', '');
    
    // 500g variant
    const var500 = `var-rice-${code}-500g`;
    const cost500 = Math.round(rice.costPerKg * 0.55);
    const price500 = Math.round(rice.pricePerKg * 0.55);
    insertVariant.run(var500, rice.id, '500g Pack', `RICE-${code}-500G`, 'g', cost500, price500, 8);
    insertInventory.run(`inv-s-${var500}`, var500, 'store', 15);
    insertInventory.run(`inv-w-${var500}`, var500, 'warehouse', 40);

    // 1kg variant
    const var1kg = `var-rice-${code}-1kg`;
    insertVariant.run(var1kg, rice.id, '1kg Pack', `RICE-${code}-1KG`, 'kg', rice.costPerKg, rice.pricePerKg, 10);
    insertInventory.run(`inv-s-${var1kg}`, var1kg, 'store', 25);
    insertInventory.run(`inv-w-${var1kg}`, var1kg, 'warehouse', 70);

    // 5kg variant
    const var5kg = `var-rice-${code}-5kg`;
    const cost5kg = Math.round(rice.costPerKg * 4.8);
    const price5kg = Math.round(rice.pricePerKg * 4.8);
    insertVariant.run(var5kg, rice.id, '5kg Bag', `RICE-${code}-5KG`, 'kg', cost5kg, price5kg, 5);
    insertInventory.run(`inv-s-${var5kg}`, var5kg, 'store', 8);
    insertInventory.run(`inv-w-${var5kg}`, var5kg, 'warehouse', 30);
  }

  // Fresh items
  const freshItems = [
    { id: 'prod-fr-1', tamil: 'தேங்காய் (நாட்டுக்காய்)', english: 'Country Coconut', cost: 18, price: 30, unit: 'piece', store: 40, wh: 150 },
    { id: 'prod-fr-2', tamil: 'நாட்டு வாழைப்பழம் (பூவன் / செவ்வாழை)', english: 'Country Bananas', cost: 5, price: 10, unit: 'piece', store: 120, wh: 250 },
    { id: 'prod-fr-3', tamil: 'முடவாட்டுகால் கிழங்கு', english: 'Mudavattukal Kilangu (Medicinal Herb)', cost: 120, price: 200, unit: 'kg', store: 10, wh: 25 }
  ];

  for (const fr of freshItems) {
    insertProduct.run(fr.id, 'retail', fr.tamil, fr.english, `${fr.tamil} - Fresh direct-from-farm produce`);
    const varId = `var-${fr.id}`;
    insertVariant.run(varId, fr.id, 'Standard', `FRESH-${fr.id.replace('prod-fr-', '')}`, fr.unit, fr.cost, fr.price, 10);
    insertInventory.run(`inv-s-${varId}`, varId, 'store', fr.store);
    insertInventory.run(`inv-w-${varId}`, varId, 'warehouse', fr.wh);
  }

  // Pre-seed some realistic attendance for today and yesterday
  const insertAtt = db.prepare(`
    INSERT INTO attendance (id, employee_id, date, check_in, check_out, break_minutes, working_hours, overtime_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  insertAtt.run('att-1', 'emp-001', yesterday, '06:00', '15:30', 45, 8.75, 0.75, 'present', 'Morning tea & snacks shift');
  insertAtt.run('att-2', 'emp-002', yesterday, '06:30', '15:00', 30, 8.0, 0.0, 'present', 'Kitchen prep & vada batches');
  insertAtt.run('att-3', 'emp-003', yesterday, '08:00', '17:00', 60, 8.0, 0.0, 'present', 'Counter cashier shift');
  insertAtt.run('att-4', 'emp-004', yesterday, '09:00', '18:00', 60, 8.0, 0.0, 'present', 'Stock receiving & counter support');

  // Pre-seed Today's active attendance
  insertAtt.run('att-5', 'emp-001', todayStr, '06:00', null, 0, 0, 0, 'present', 'Morning tea boiling');
  insertAtt.run('att-6', 'emp-002', todayStr, '06:15', null, 0, 0, 0, 'present', 'Vadai batter preparation');
  insertAtt.run('att-7', 'emp-003', todayStr, '07:45', null, 0, 0, 0, 'present', 'Counter open');
  insertAtt.run('att-8', 'emp-004', todayStr, '08:30', null, 0, 0, 0, 'present', 'Morning warehouse dispatch');

  // Pre-seed some historical expenses
  const insertExp = db.prepare(`
    INSERT INTO expenses (id, expense_date, category_id, description, amount, payment_method, vendor_person, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExp.run('exp-1', yesterday, 'exp-cat-1', 'Fresh Country Cow Milk (40 Litres)', 1600, 'cash', 'Aavin / Local Farm', 'usr-admin');
  insertExp.run('exp-2', yesterday, 'exp-cat-8', 'Eco-friendly paper cups & packaging packets', 750, 'upi', 'Sri Murugan Packaging', 'usr-admin');
  insertExp.run('exp-3', todayStr, 'exp-cat-1', 'Fresh Country Cow Milk (45 Litres)', 1800, 'cash', 'Local Farm Dairy', 'usr-admin');
  insertExp.run('exp-4', todayStr, 'exp-cat-6', 'Commercial LPG Gas Cylinder Refill', 1950, 'upi', 'Bharat Gas Agency', 'usr-admin');

  console.log('Seeding completed successfully!');
}
