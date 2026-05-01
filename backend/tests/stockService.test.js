const test = require('node:test');
const assert = require('node:assert/strict');

const Product = require('../models/Product');
const stockService = require('../services/stockService');
const emailService = require('../services/emailService');

const originalProductMethods = {
  findOneAndUpdate: Product.findOneAndUpdate,
  findById: Product.findById,
  findByIdAndUpdate: Product.findByIdAndUpdate,
};

const originalStockMethods = {
  restoreStock: stockService.restoreStock,
  triggerLowStockAlert: stockService.triggerLowStockAlert,
  triggerOutOfStockAlert: stockService.triggerOutOfStockAlert,
};

const originalSendEmail = emailService.sendEmail;

function restoreMethods() {
  Product.findOneAndUpdate = originalProductMethods.findOneAndUpdate;
  Product.findById = originalProductMethods.findById;
  Product.findByIdAndUpdate = originalProductMethods.findByIdAndUpdate;
  stockService.restoreStock = originalStockMethods.restoreStock;
  stockService.triggerLowStockAlert = originalStockMethods.triggerLowStockAlert;
  stockService.triggerOutOfStockAlert = originalStockMethods.triggerOutOfStockAlert;
  emailService.sendEmail = originalSendEmail;
}

test.afterEach(restoreMethods);

test('checkAndDeductStock atomically deducts every order item', async () => {
  const updates = [];
  const lowStockAlerts = [];
  const outOfStockAlerts = [];
  const updatedProducts = [
    { _id: 'p1', name: 'Keyboard', stockQuantity: 4, safetyThreshold: 5 },
    { _id: 'p2', name: 'Mouse', stockQuantity: 0, safetyThreshold: 5 },
  ];

  Product.findOneAndUpdate = async (query, update, options) => {
    updates.push({ query, update, options });
    return updatedProducts.shift();
  };
  stockService.triggerLowStockAlert = async (product) => lowStockAlerts.push(product.name);
  stockService.triggerOutOfStockAlert = async (product) => outOfStockAlerts.push(product.name);

  await stockService.checkAndDeductStock([
    { product: 'p1', qty: 2 },
    { product: 'p2', qty: 1 },
  ]);

  assert.deepEqual(updates, [
    {
      query: { _id: 'p1', stockQuantity: { $gte: 2 } },
      update: { $inc: { stockQuantity: -2 } },
      options: { new: true },
    },
    {
      query: { _id: 'p2', stockQuantity: { $gte: 1 } },
      update: { $inc: { stockQuantity: -1 } },
      options: { new: true },
    },
  ]);
  assert.deepEqual(lowStockAlerts, ['Keyboard']);
  assert.deepEqual(outOfStockAlerts, ['Mouse']);
});

test('checkAndDeductStock rolls back prior deductions when a later item is understocked', async () => {
  const rollbackItems = [];
  let updateAttempt = 0;

  Product.findOneAndUpdate = async () => {
    updateAttempt += 1;
    if (updateAttempt === 1) {
      return { _id: 'p1', name: 'Desk', stockQuantity: 9, safetyThreshold: 3 };
    }
    return null;
  };

  Product.findById = () => ({
    select: async (fields) => {
      assert.equal(fields, 'name');
      return { name: 'Chair' };
    },
  });

  stockService.restoreStock = async (items) => {
    rollbackItems.push(...items);
  };
  stockService.triggerLowStockAlert = async () => {};
  stockService.triggerOutOfStockAlert = async () => {};

  await assert.rejects(
    stockService.checkAndDeductStock([
      { product: 'p1', qty: 1 },
      { product: 'p2', qty: 3 },
    ]),
    /Insufficient stock for "Chair"/
  );

  assert.deepEqual(rollbackItems, [{ product: 'p1', qty: 1 }]);
});

test('checkAndDeductStock reports missing products after rolling back deductions', async () => {
  Product.findOneAndUpdate = async () => null;
  Product.findById = () => ({
    select: async () => null,
  });

  let restoreCalls = 0;
  stockService.restoreStock = async (items) => {
    restoreCalls += 1;
    assert.deepEqual(items, []);
  };

  await assert.rejects(
    stockService.checkAndDeductStock([{ product: 'missing-id', qty: 1 }]),
    /Product \(ID: missing-id\) not found/
  );
  assert.equal(restoreCalls, 1);
});

test('restoreStock increments returned product quantities', async () => {
  const calls = [];
  Product.findByIdAndUpdate = async (id, update) => {
    calls.push({ id, update });
  };

  await stockService.restoreStock([
    { product: 'p1', qty: 2 },
    { product: 'p2', qty: 5 },
  ]);
  await stockService.restoreStock([]);
  await stockService.restoreStock(null);

  assert.deepEqual(calls, [
    { id: 'p1', update: { $inc: { stockQuantity: 2 } } },
    { id: 'p2', update: { $inc: { stockQuantity: 5 } } },
  ]);
});

test('inventory alerts send low-stock and out-of-stock emails to the admin address', async () => {
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = 'ops@example.com';
  const emails = [];

  emailService.sendEmail = async (message) => {
    emails.push(message);
    return { accepted: [message.email] };
  };

  try {
    await stockService.triggerLowStockAlert({
      name: 'Camera',
      sku: 'CAM-1',
      stockQuantity: 2,
      safetyThreshold: 4,
    });
    await stockService.triggerOutOfStockAlert({
      name: 'Lens',
      sku: 'LEN-1',
    });
  } finally {
    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = previousAdminEmail;
    }
  }

  assert.equal(emails.length, 2);
  assert.equal(emails[0].email, 'ops@example.com');
  assert.match(emails[0].subject, /LOW STOCK ALERT: Camera/);
  assert.match(emails[0].message, /Remaining: 2 units/);
  assert.equal(emails[1].email, 'ops@example.com');
  assert.match(emails[1].subject, /OUT OF STOCK: Lens/);
  assert.match(emails[1].message, /Lens/);
});
