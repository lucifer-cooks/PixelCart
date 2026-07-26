const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const server = require('../server');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper to make HTTP requests in tests
const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');
  let testUserToken = '';
  let productId = '';

  try {
    // Wait for MongoDB to connect and seed (In-memory setup takes 4-5 seconds on first start)
    await new Promise(resolve => setTimeout(resolve, 7000));

    // Test 1: Fetch Products (Should return successfully)
    console.log('Test 1: Fetching products...');
    const productsRes = await makeRequest('GET', '/products');
    assert.strictEqual(productsRes.statusCode, 200);
    assert.strictEqual(productsRes.body.success, true);
    assert.ok(Array.isArray(productsRes.body.products));
    console.log('✔ Test 1 Passed! Products fetched successfully.');

    if (productsRes.body.products.length > 0) {
      productId = productsRes.body.products[0]._id;
    }

    // Test 2: User Login
    console.log('Test 2: Logging in as customer...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'customer@pixelgear.com',
      password: 'customer123'
    });
    assert.strictEqual(loginRes.statusCode, 200);
    assert.strictEqual(loginRes.body.success, true);
    assert.ok(loginRes.body.token);
    testUserToken = loginRes.body.token;
    console.log('✔ Test 2 Passed! Customer logged in successfully.');

    // Test 3: Get active cart
    console.log('Test 3: Fetching cart...');
    const cartRes = await makeRequest('GET', '/cart', null, {
      'Authorization': `Bearer ${testUserToken}`
    });
    assert.strictEqual(cartRes.statusCode, 200);
    assert.strictEqual(cartRes.body.success, true);
    assert.ok(cartRes.body.cart);
    console.log('✔ Test 3 Passed! Cart retrieved successfully.');

    // Test 4: Add to Cart
    if (productId) {
      console.log('Test 4: Adding product to cart...');
      const addCartRes = await makeRequest('POST', '/cart', {
        productId,
        quantity: 2
      }, {
        'Authorization': `Bearer ${testUserToken}`
      });
      assert.strictEqual(addCartRes.statusCode, 200);
      assert.strictEqual(addCartRes.body.success, true);
      assert.ok(addCartRes.body.cart.items.length > 0);
      console.log('✔ Test 4 Passed! Product added to cart.');
    } else {
      console.log('⚠ Test 4 Skipped: No product ID available. Please run seeding script first.');
    }

    // Test 5: Confirm checkout order placement
    if (productId) {
      console.log('Test 5: Placing simulated order checkout...');
      const orderRes = await makeRequest('POST', '/checkout/confirm', {
        shippingAddress: {
          street: '123 Test Lane',
          city: 'Test City',
          state: 'TE',
          zipCode: '12345',
          country: 'Testland'
        },
        billingAddress: {
          street: '123 Test Lane',
          city: 'Test City',
          state: 'TE',
          zipCode: '12345',
          country: 'Testland'
        },
        paymentIntentId: 'test_sim_payment_intent',
        paymentStatus: 'paid'
      }, {
        'Authorization': `Bearer ${testUserToken}`
      });
      assert.strictEqual(orderRes.statusCode, 201);
      assert.strictEqual(orderRes.body.success, true);
      assert.ok(orderRes.body.order);
      console.log('✔ Test 5 Passed! Simulated checkout order confirmed.');
    } else {
      console.log('⚠ Test 5 Skipped: No product ID available.');
    }

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections and stop server
    mongoose.connection.close();
    server.close(() => {
      console.log('Test server closed.');
      process.exit(0);
    });
  }
};

runTests();
