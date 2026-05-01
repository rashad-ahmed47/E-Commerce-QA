const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { registerUser, authUser } = require('../controllers/authController');

const originalUserMethods = {
  findOne: User.findOne,
  create: User.create,
};

const originalJwtSecret = process.env.JWT_SECRET;
const originalJwtExpire = process.env.JWT_EXPIRE;

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
  User.findOne = originalUserMethods.findOne;
  User.create = originalUserMethods.create;

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }

  if (originalJwtExpire === undefined) {
    delete process.env.JWT_EXPIRE;
  } else {
    process.env.JWT_EXPIRE = originalJwtExpire;
  }
}

test.afterEach(restoreState);

test('registerUser creates a new customer and returns a signed auth token', async () => {
  process.env.JWT_SECRET = 'unit-test-secret';
  process.env.JWT_EXPIRE = '1h';

  const createdUsers = [];
  User.findOne = async (query) => {
    assert.deepEqual(query, { email: 'jane@example.com' });
    return null;
  };
  User.create = async (payload) => {
    createdUsers.push(payload);
    return {
      _id: 'user-123',
      name: payload.name,
      email: payload.email,
      role: 'Customer',
    };
  };

  const req = {
    body: {
      name: 'Jane Buyer',
      email: 'jane@example.com',
      password: 'super-secret',
    },
  };
  const res = createResponse();

  await registerUser(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(createdUsers, [req.body]);
  assert.equal(res.body._id, 'user-123');
  assert.equal(res.body.name, 'Jane Buyer');
  assert.equal(res.body.email, 'jane@example.com');
  assert.equal(res.body.role, 'Customer');
  assert.equal(jwt.verify(res.body.token, 'unit-test-secret').id, 'user-123');
});

test('registerUser rejects duplicate email addresses', async () => {
  User.findOne = async () => ({ _id: 'existing-user' });
  User.create = async () => {
    throw new Error('create should not be called');
  };

  const req = {
    body: {
      name: 'Jane Buyer',
      email: 'jane@example.com',
      password: 'super-secret',
    },
  };
  const res = createResponse();

  await registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'User already exists' });
});

test('authUser logs in valid credentials, saves last activity, and returns a token', async () => {
  process.env.JWT_SECRET = 'login-secret';

  const savedUsers = [];
  const user = {
    _id: 'user-456',
    name: 'Max Customer',
    email: 'max@example.com',
    role: 'Customer',
    lastActivity: null,
    matchPassword: async (password) => password === 'correct-password',
    save: async function save() {
      savedUsers.push({ lastActivity: this.lastActivity });
    },
  };

  User.findOne = async (query) => {
    assert.deepEqual(query, { email: 'max@example.com' });
    return user;
  };

  const req = {
    body: {
      email: 'max@example.com',
      password: 'correct-password',
    },
  };
  const res = createResponse();

  await authUser(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(savedUsers.length, 1);
  assert.ok(savedUsers[0].lastActivity);
  assert.equal(res.body._id, 'user-456');
  assert.equal(res.body.email, 'max@example.com');
  assert.equal(jwt.verify(res.body.token, 'login-secret').id, 'user-456');
});

test('authUser rejects missing users and invalid passwords', async () => {
  User.findOne = async () => ({
    matchPassword: async () => false,
  });

  const invalidPasswordResponse = createResponse();
  await authUser(
    { body: { email: 'max@example.com', password: 'wrong-password' } },
    invalidPasswordResponse
  );

  assert.equal(invalidPasswordResponse.statusCode, 401);
  assert.deepEqual(invalidPasswordResponse.body, { message: 'Invalid email or password' });

  User.findOne = async () => null;

  const missingUserResponse = createResponse();
  await authUser(
    { body: { email: 'nobody@example.com', password: 'password' } },
    missingUserResponse
  );

  assert.equal(missingUserResponse.statusCode, 401);
  assert.deepEqual(missingUserResponse.body, { message: 'Invalid email or password' });
});
