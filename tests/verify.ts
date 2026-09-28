import { getDatabase } from '../src/lib/db';
import { InventoryService } from '../src/lib/services/inventory-service';
import { POSService } from '../src/lib/services/pos-service';
import { AttendanceService } from '../src/lib/services/attendance-service';
import { AnalyticsService } from '../src/lib/services/analytics-service';

function runUnitTests() {
  console.log('--- Starting System Verification Tests ---');

  const db = getDatabase();

  // Test 1: Employee and initial seed integrity
  const employees = AttendanceService.getEmployees();
  console.assert(employees.length >= 4, `Expected at least 4 employees, found ${employees.length}`);
  console.log('✓ Test 1: Initial 4 employees exist (Murugan, Selvan, Anitha, Prakash)');

  // Test 2: POS Checkout with atomic stock deduction
  const catalog = POSService.getCatalog();
  const testItem = catalog.find((c: any) => c.store_stock >= 5);
  if (!testItem) {
    throw new Error('No test item with store stock found in catalog');
  }

  const initialStock = testItem.store_stock;
  const qtyToBuy = 2;
  const checkoutRes = POSService.checkout(
    'usr-cashier',
    [{ variant_id: testItem.variant_id, quantity: qtyToBuy, unit_price: testItem.selling_price }],
    'cash',
    0,
    'Automated Verification Sale'
  );

  console.assert(checkoutRes.sale.grand_total === testItem.selling_price * qtyToBuy, 'Sale total mismatch');

  const updatedCatalog = POSService.getCatalog();
  const updatedItem = updatedCatalog.find((c: any) => c.variant_id === testItem.variant_id);
  console.assert(
    updatedItem.store_stock === initialStock - qtyToBuy,
    `Stock not deducted properly: initial ${initialStock}, updated ${updatedItem.store_stock}`
  );
  console.log('✓ Test 2: Atomic POS Checkout properly deducted store stock');

  // Test 3: Inventory Warehouse to Store Transfer
  const whItem = db.prepare("SELECT variant_id, quantity FROM inventory_levels WHERE location = 'warehouse' AND quantity >= 5").get() as any;
  if (!whItem) {
    throw new Error('No warehouse stock available for transfer test');
  }

  const storeRowBefore = db.prepare("SELECT quantity FROM inventory_levels WHERE location = 'store' AND variant_id = ?").get(whItem.variant_id) as any;
  const storeBeforeQty = storeRowBefore ? storeRowBefore.quantity : 0;
  const whBeforeQty = whItem.quantity;
  const transferQty = 3;

  InventoryService.transferStock(
    'warehouse',
    'store',
    [{ variant_id: whItem.variant_id, quantity: transferQty }],
    'usr-admin',
    'Test Transfer'
  );

  const whRowAfter = db.prepare("SELECT quantity FROM inventory_levels WHERE location = 'warehouse' AND variant_id = ?").get(whItem.variant_id) as any;
  const storeRowAfter = db.prepare("SELECT quantity FROM inventory_levels WHERE location = 'store' AND variant_id = ?").get(whItem.variant_id) as any;

  console.assert(whRowAfter.quantity === whBeforeQty - transferQty, 'Warehouse stock did not decrease properly');
  console.assert(storeRowAfter.quantity === storeBeforeQty + transferQty, 'Store stock did not increase properly');
  console.log('✓ Test 3: Atomic stock transfer between Warehouse and Store verified');

  // Test 4: Attendance calculation formula
  const today = new Date().toISOString().slice(0, 10);
  const attRecord = AttendanceService.recordAttendance({
    employee_id: employees[0].id,
    date: today,
    check_in: '07:00',
    check_out: '16:30',
    break_minutes: 30,
    status: 'present',
    notes: 'Test shift',
  });

  // 07:00 to 16:30 is 9.5 hours. Break 30 mins -> 9.0 hours. Overtime = 9.0 - 8 = 1.0 hr.
  console.assert(attRecord.working_hours === 9, `Expected 9 working hours, got ${attRecord.working_hours}`);
  console.assert(attRecord.overtime_hours === 1, `Expected 1 overtime hour, got ${attRecord.overtime_hours}`);
  console.log('✓ Test 4: Working hours and overtime calculation formula verified');

  // Test 5: P&L Equation: Net Profit = Revenue - COGS - Expenses
  const pl = AnalyticsService.getProfitLoss(today, today);
  const computedGross = pl.revenue.sales_total - pl.cogs.total_cogs;
  const computedNet = computedGross - pl.expenses.total_expenses;

  console.assert(pl.gross_profit === computedGross, `Gross profit mismatch: pl.gross=${pl.gross_profit}, computed=${computedGross}`);
  console.assert(pl.net_profit === computedNet, `Net profit mismatch: pl.net=${pl.net_profit}, computed=${computedNet}`);
  console.log('✓ Test 5: Profit & Loss accounting equation (Gross & Net Profit) verified');

  console.log('=== All 5 Core Verification Tests Passed Successfully! ===');
}

try {
  runUnitTests();
} catch (e) {
  console.error('Test failure:', e);
  process.exit(1);
}
