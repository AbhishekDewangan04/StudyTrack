const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const { io: Client } = require(path.join(__dirname, '../../frontend/node_modules/socket.io-client'));
const { initSocket } = require('../config/socket');
const User = require('../models/User');

console.log('🔌 Starting Socket.IO Authentication Verification Tests...\n');

let server;
let port;
let testUser;

async function setup() {
  const app = express();
  server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  const mockUserId = new mongoose.Types.ObjectId();
  testUser = {
    _id: mockUserId,
    name: 'Socket Test User',
    email: 'sockettest@example.com',
  };

  User.findById = function (id) {
    return {
      select: function () {
        if (id && id.toString() === mockUserId.toString()) {
          return Promise.resolve(testUser);
        }
        return Promise.resolve(null);
      },
    };
  };
}

function connectClient(auth) {
  return new Promise((resolve) => {
    const client = Client(`http://localhost:${port}`, {
      auth,
      transports: ['websocket'],
      reconnection: false,
    });

    client.on('connect', () => {
      resolve({ client, err: null });
    });

    client.on('connect_error', (err) => {
      resolve({ client, err });
    });
  });
}

async function runTests() {
  await setup();

  const secret = process.env.JWT_SECRET || 'studytrack_secret_key';
  const validToken = jwt.sign({ id: testUser._id }, secret, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: testUser._id }, secret, { expiresIn: '-1s' });
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsig';

  // Test 1: Valid JWT Token
  {
    console.log('1. Testing Socket connection with valid JWT token...');
    const { client, err } = await connectClient({ token: validToken });
    if (!err && client.connected) {
      console.log('   ✅ Valid token connected successfully');
    } else {
      console.error('   ❌ Valid token failed:', err ? err.message : 'Not connected');
      process.exit(1);
    }
    client.disconnect();
  }

  // Test 2: Missing JWT Token
  {
    console.log('\n2. Testing Socket connection with missing JWT token...');
    const { client, err } = await connectClient({});
    if (err && err.message.includes('Token missing')) {
      console.log('   ✅ Missing token correctly rejected with: Token missing');
    } else {
      console.error('   ❌ Missing token check failed:', err ? err.message : 'Unexpectedly connected');
      process.exit(1);
    }
    client.disconnect();
  }

  // Test 3: Invalid JWT Token
  {
    console.log('\n3. Testing Socket connection with invalid JWT token...');
    const { client, err } = await connectClient({ token: invalidToken });
    if (err && err.message.includes('Invalid token')) {
      console.log('   ✅ Invalid token correctly rejected with: Invalid token');
    } else {
      console.error('   ❌ Invalid token check failed:', err ? err.message : 'Unexpectedly connected');
      process.exit(1);
    }
    client.disconnect();
  }

  // Test 4: Expired JWT Token
  {
    console.log('\n4. Testing Socket connection with expired JWT token...');
    const { client, err } = await connectClient({ token: expiredToken });
    if (err && err.message.includes('Token expired')) {
      console.log('   ✅ Expired token correctly rejected with: Token expired');
    } else {
      console.error('   ❌ Expired token check failed:', err ? err.message : 'Unexpectedly connected');
      process.exit(1);
    }
    client.disconnect();
  }

  // Test 5: Token with 'Bearer ' prefix in auth.token
  {
    console.log('\n5. Testing Socket connection with "Bearer " prefixed token...');
    const { client, err } = await connectClient({ token: `Bearer ${validToken}` });
    if (!err && client.connected) {
      console.log('   ✅ "Bearer " prefixed token parsed & authenticated successfully');
    } else {
      console.error('   ❌ "Bearer " prefixed token check failed:', err ? err.message : 'Not connected');
      process.exit(1);
    }
    client.disconnect();
  }

  // Test 6: Fallback secret verification when JWT_SECRET is unset
  {
    console.log('\n6. Testing Socket connection fallback secret when JWT_SECRET is unset...');
    const oldSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const fallbackToken = jwt.sign({ id: testUser._id }, 'studytrack_secret_key', { expiresIn: '1h' });
    const { client, err } = await connectClient({ token: fallbackToken });
    if (!err && client.connected) {
      console.log('   ✅ Fallback secret verified socket token successfully');
    } else {
      console.error('   ❌ Fallback secret test failed:', err ? err.message : 'Not connected');
      process.exit(1);
    }
    client.disconnect();
    if (oldSecret) process.env.JWT_SECRET = oldSecret;
  }

  server.close();
  console.log('\n🎉 ALL SOCKET.IO AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Socket auth test error:', err);
  if (server) server.close();
  process.exit(1);
});
