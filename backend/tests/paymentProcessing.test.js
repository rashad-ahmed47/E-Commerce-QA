const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../models/Order');
const { updateOrderToPaid } = require('../controllers/orderController');

const originalOrderMethods = {
  findById: Order.findById,
};

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function restoreOrderMethods() {
  Order.findById = originalOrderMethods.findById;
}

test.afterEach(restoreOrderMethods);

test('updateOrderToPaid marks an order paid with payment provider details', async () => {
  const order = {
    _id: 'order-123',
    isPaid: false,
    paidAt: undefined,
    paymentResult: undefined,
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  Order.findById = async (id) => {
    assert.equal(id, 'order-123');
    return order;
  };

  const req = {
    params: { id: 'order-123' },
    user: { email: 'buyer@example.com' },
    body: {
      id: 'payment-abc',
      status: 'COMPLETED',
      update_time: '2026-04-30T10:30:00.000Z',
      email_address: 'payer@example.com',
    },
  };
  const res = createResponse();

  await updateOrderToPaid(req, res);

  assert.equal(order.isPaid, true);
  assert.ok(order.paidAt);
  assert.deepEqual(order.paymentResult, {
    id: 'payment-abc',
    status: 'COMPLETED',
    update_time: '2026-04-30T10:30:00.000Z',
    email_address: 'payer@example.com',
  });
  assert.equal(order.saveCalls, 1);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, order);
});

test('updateOrderToPaid uses safe defaults for simulated payments', async () => {
  const order = {
    async save() {
      return this;
    },
  };

  Order.findById = async () => order;

  const res = createResponse();

  await updateOrderToPaid(
    {
      params: { id: 'order-456' },
      user: { email: 'buyer@example.com' },
      body: {},
    },
    res
  );

  assert.equal(order.isPaid, true);
  assert.ok(order.paidAt);
  assert.equal(order.paymentResult.id, 'simulated_id');
  assert.equal(order.paymentResult.status, 'COMPLETED');
  assert.match(order.paymentResult.update_time, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(order.paymentResult.email_address, 'buyer@example.com');
  assert.equal(res.statusCode, 200);
});

test('updateOrderToPaid returns 404 when the order does not exist', async () => {
  Order.findById = async (id) => {
    assert.equal(id, 'missing-order');
    return null;
  };

  const res = createResponse();

  await updateOrderToPaid(
    {
      params: { id: 'missing-order' },
      user: { email: 'buyer@example.com' },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Order not found' });
});

test('updateOrderToPaid returns 500 when payment persistence fails', async () => {
  Order.findById = async () => ({
    async save() {
      throw new Error('database unavailable');
    },
  });

  const res = createResponse();

  await updateOrderToPaid(
    {
      params: { id: 'order-789' },
      user: { email: 'buyer@example.com' },
      body: { id: 'payment-xyz' },
    },
    res
  );

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'database unavailable' });
});
