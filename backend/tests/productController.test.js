const test = require('node:test');
const assert = require('node:assert/strict');

const Product = require('../models/Product');
const { getProducts } = require('../controllers/productController');

const originalProductMethods = {
  countDocuments: Product.countDocuments,
  find: Product.find,
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

function restoreProductMethods() {
  Product.countDocuments = originalProductMethods.countDocuments;
  Product.find = originalProductMethods.find;
}

test.afterEach(restoreProductMethods);

test('getProducts builds text search, filter, sort, and pagination queries', async () => {
  const products = [{ _id: 'p1', name: 'Red Shirt' }];
  const calls = {};

  Product.countDocuments = async (query) => {
    calls.countQuery = query;
    return 21;
  };

  Product.find = (query) => {
    calls.findQuery = query;
    const chain = {
      select(selection) {
        calls.selection = selection;
        return this;
      },
      sort(sort) {
        calls.sort = sort;
        return this;
      },
      limit(limit) {
        calls.limit = limit;
        return this;
      },
      skip(skip) {
        calls.skip = skip;
        return products;
      },
    };
    return chain;
  };

  const req = {
    query: {
      keyword: 'red shirt',
      category: 'Clothing',
      minPrice: '10',
      maxPrice: '50',
      page: '2',
      limit: '10',
    },
  };
  const res = createResponse();

  await getProducts(req, res);

  const expectedQuery = {
    isHidden: false,
    $text: { $search: 'red shirt' },
    category: 'Clothing',
    price: { $gte: 10, $lte: 50 },
  };

  assert.deepEqual(calls.countQuery, expectedQuery);
  assert.deepEqual(calls.findQuery, expectedQuery);
  assert.deepEqual(calls.selection, { score: { $meta: 'textScore' } });
  assert.deepEqual(calls.sort, { score: { $meta: 'textScore' } });
  assert.equal(calls.limit, 10);
  assert.equal(calls.skip, 10);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    products,
    page: 2,
    pages: 3,
    total: 21,
  });
});

test('getProducts caps page size and applies requested non-search sort', async () => {
  const calls = {};

  Product.countDocuments = async (query) => {
    calls.countQuery = query;
    return 60;
  };

  Product.find = (query) => {
    calls.findQuery = query;
    return {
      sort(sort) {
        calls.sort = sort;
        return this;
      },
      limit(limit) {
        calls.limit = limit;
        return this;
      },
      skip(skip) {
        calls.skip = skip;
        return [];
      },
    };
  };

  const req = { query: { sort: 'price', limit: '999', page: '-4' } };
  const res = createResponse();

  await getProducts(req, res);

  assert.deepEqual(calls.countQuery, { isHidden: false });
  assert.deepEqual(calls.findQuery, { isHidden: false });
  assert.deepEqual(calls.sort, { price: 1 });
  assert.equal(calls.limit, 50);
  assert.equal(calls.skip, 0);
  assert.deepEqual(res.body, {
    products: [],
    page: 1,
    pages: 2,
    total: 60,
  });
});

test('getProducts returns a 500 response when the product query fails', async () => {
  Product.countDocuments = async () => {
    throw new Error('database unavailable');
  };

  const req = { query: {} };
  const res = createResponse();

  await getProducts(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'database unavailable' });
});
