const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../models/Order');
const ReturnRequest = require('../models/ReturnRequest');
const { createReturnRequest } = require('../controllers/returnController');

// ─── Preserve originals ───────────────────────────────────────────────────────
const originalOrderMethods = { findById: Order.findById };
const originalReturnMethods = {
  findOne: ReturnRequest.findOne,
  create: ReturnRequest.create,
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

function restoreState() {
  Order.findById = originalOrderMethods.findById;
  ReturnRequest.findOne = originalReturnMethods.findOne;
  ReturnRequest.create = originalReturnMethods.create;
}

test.afterEach(restoreState);

// ═══════════════════════════════════════════════════════════════════════════════
//  HAPPY PATH
// ═══════════════════════════════════════════════════════════════════════════════
test('Happy: customer successfully creates a return request for a delivered order', async () => {
  const deliveredOrder = {
    _id: 'order-001',
    user: 'user-100',
    isDelivered: true,
    totalPrice: 149.99,
  };

  Order.findById = async (id) => {
    assert.equal(id, 'order-001');
    return deliveredOrder;
  };

  ReturnRequest.findOne = async (query) => {
    assert.deepEqual(query, { order: 'order-001' });
    return null; // no existing return
  };

  ReturnRequest.create = async (payload) => ({
    _id: 'return-001',
    order: payload.order,
    user: payload.user,
    reason: payload.reason,
    status: 'Pending',
  });

  const req = {
    body: { orderId: 'order-001', reason: 'Product arrived damaged and is unusable' },
    user: { _id: 'user-100' },
  };
  const res = createResponse();

  await createReturnRequest(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body._id, 'return-001');
  assert.equal(res.body.order, 'order-001');
  assert.equal(res.body.user, 'user-100');
  assert.equal(res.body.status, 'Pending');
  assert.equal(res.body.reason, 'Product arrived damaged and is unusable');
});

// ═══════════════════════════════════════════════════════════════════════════════
//  EDGE CASE
// ═══════════════════════════════════════════════════════════════════════════════
test('Edge: rejects a duplicate return request for the same order (409)', async () => {
  const deliveredOrder = {
    _id: 'order-002',
    user: 'user-200',
    isDelivered: true,
  };

  Order.findById = async () => deliveredOrder;

  // A return request already exists for this order
  ReturnRequest.findOne = async () => ({
    _id: 'return-existing',
    order: 'order-002',
    status: 'Pending',
  });

  ReturnRequest.create = async () => {
    throw new Error('create should not be called');
  };

  const req = {
    body: { orderId: 'order-002', reason: 'Changed my mind about the purchase' },
    user: { _id: 'user-200' },
  };
  const res = createResponse();

  await createReturnRequest(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { message: 'A return request already exists for this order' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  NEGATIVE CASE
// ═══════════════════════════════════════════════════════════════════════════════
test('Negative: rejects return for an undelivered order (400)', async () => {
  const undeliveredOrder = {
    _id: 'order-003',
    user: 'user-300',
    isDelivered: false, // not yet delivered
  };

  Order.findById = async () => undeliveredOrder;

  ReturnRequest.findOne = async () => {
    throw new Error('findOne should not be called');
  };
  ReturnRequest.create = async () => {
    throw new Error('create should not be called');
  };

  const req = {
    body: { orderId: 'order-003', reason: 'I want to return this item right away' },
    user: { _id: 'user-300' },
  };
  const res = createResponse();

  await createReturnRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Only delivered orders can be returned' });
});
