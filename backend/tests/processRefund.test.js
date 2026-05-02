const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../models/Order');
const ReturnRequest = require('../models/ReturnRequest');
const { processRefund } = require('../controllers/returnController');

// ─── Preserve originals ───────────────────────────────────────────────────────
const originalOrderMethods = { findById: Order.findById };
const originalReturnMethods = { findById: ReturnRequest.findById };

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
  ReturnRequest.findById = originalReturnMethods.findById;
}

test.afterEach(restoreState);

// ═══════════════════════════════════════════════════════════════════════════════
//  HAPPY PATH
// ═══════════════════════════════════════════════════════════════════════════════
test('Happy: support agent approves a return and refund is issued', async () => {
  const order = {
    _id: 'order-100',
    totalPrice: 79.99,
    status: 'Delivered',
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  const returnReq = {
    _id: 'return-100',
    order: 'order-100',
    user: 'user-500',
    status: 'Pending',
    refundAmount: 0,
    refundedAt: undefined,
    adminNotes: undefined,
    processedBy: undefined,
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  ReturnRequest.findById = async (id) => {
    assert.equal(id, 'return-100');
    return returnReq;
  };

  Order.findById = async (id) => {
    assert.equal(id, 'order-100');
    return order;
  };

  const req = {
    params: { id: 'return-100' },
    body: { action: 'approve', adminNotes: 'Product confirmed damaged, full refund issued' },
    user: { _id: 'agent-001' },
  };
  const res = createResponse();

  await processRefund(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'Approved');
  assert.equal(res.body.refundAmount, 79.99);
  assert.ok(res.body.refundedAt);
  assert.equal(res.body.processedBy, 'agent-001');
  assert.equal(res.body.adminNotes, 'Product confirmed damaged, full refund issued');
  assert.equal(order.status, 'Returned');
  assert.equal(order.saveCalls, 1);
  assert.equal(returnReq.saveCalls, 1);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  EDGE CASE
// ═══════════════════════════════════════════════════════════════════════════════
test('Edge: rejects processing an already-processed return request (400)', async () => {
  const alreadyApproved = {
    _id: 'return-200',
    order: 'order-200',
    status: 'Approved', // already processed
    refundAmount: 50.00,
    async save() {
      throw new Error('save should not be called');
    },
  };

  ReturnRequest.findById = async (id) => {
    assert.equal(id, 'return-200');
    return alreadyApproved;
  };

  Order.findById = async () => {
    throw new Error('Order.findById should not be called');
  };

  const req = {
    params: { id: 'return-200' },
    body: { action: 'approve', adminNotes: 'Trying again' },
    user: { _id: 'agent-002' },
  };
  const res = createResponse();

  await processRefund(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'This return request has already been processed' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  NEGATIVE CASE
// ═══════════════════════════════════════════════════════════════════════════════
test('Negative: rejects an invalid action value (400)', async () => {
  ReturnRequest.findById = async () => {
    throw new Error('findById should not be called');
  };
  Order.findById = async () => {
    throw new Error('Order.findById should not be called');
  };

  const req = {
    params: { id: 'return-300' },
    body: { action: 'cancel' }, // invalid action — only "approve" or "reject" allowed
    user: { _id: 'agent-003' },
  };
  const res = createResponse();

  await processRefund(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Action must be either "approve" or "reject"' });
});
