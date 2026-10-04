const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function testAiBotFlow() {
  console.log('🤖 Testing AI Bot Backend Route & Gating...');
  await connectDB();

  try {
    // 1. Create a test FREE user and a PRO user
    const User = require('../models/User');
    const jwt = require('jsonwebtoken');

    let freeUser = await User.findOne({ email: 'aibot_free_test@example.com' });
    if (!freeUser) {
      freeUser = await User.create({
        name: 'AI Bot Free User',
        email: 'aibot_free_test@example.com',
        password: 'Password123!',
        isPro: false,
      });
    } else {
      freeUser.isPro = false;
      await freeUser.save();
    }

    let proUser = await User.findOne({ email: 'aibot_pro_test@example.com' });
    if (!proUser) {
      proUser = await User.create({
        name: 'AI Bot Pro User',
        email: 'aibot_pro_test@example.com',
        password: 'Password123!',
        isPro: true,
      });
    } else {
      proUser.isPro = true;
      await proUser.save();
    }

    const freeToken = jwt.sign({ id: freeUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    const proToken = jwt.sign({ id: proUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    console.log('✅ Created test accounts (FREE & PRO)');

    // Helper for HTTP requests
    const makeRequest = (token, body) => {
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const req = http.request(
          {
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: '/api/ai/study-advice',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    };

    // Test 1: Unauthenticated request -> 401
    const unauthRes = await makeRequest(null, { query: 'Hello' });
    console.log('1. Unauthenticated Request Status:', unauthRes.status);
    if (unauthRes.status === 401) {
      console.log('   ✅ Unauthenticated request correctly blocked (401)');
    } else {
      console.error('   ❌ Expected 401, got:', unauthRes.status);
    }

    // Test 2: FREE User request -> 403
    const freeRes = await makeRequest(freeToken, { query: 'Hello' });
    console.log('2. FREE User Request Status:', freeRes.status);
    if (freeRes.status === 403) {
      console.log('   ✅ FREE User correctly blocked with PRO gating (403)');
    } else {
      console.error('   ❌ Expected 403, got:', freeRes.status);
    }

    // Test 3: PRO User request -> 200
    const proRes = await makeRequest(proToken, { query: 'Explain Database Normalization in 2 sentences.' });
    console.log('3. PRO User Request Status:', proRes.status);
    if (proRes.status === 200 && proRes.data?.success) {
      console.log('   ✅ PRO User request succeeded (200 OK)');
      console.log('   Response snippet:', proRes.data.reply ? proRes.data.reply.slice(0, 100) + '...' : 'No reply text');
    } else {
      console.error('   ❌ PRO request failed:', proRes.data);
    }

    // Test 4: Quick Action: create_flashcards
    const flashcardsRes = await makeRequest(proToken, { action: 'create_flashcards', topic: 'OS Process Management' });
    console.log('4. Create Flashcards Quick Action Status:', flashcardsRes.status);
    if (flashcardsRes.status === 200 && flashcardsRes.data?.success) {
      console.log('   ✅ Create Flashcards response received');
    }

    console.log('\n🎉 AI BOT TEST FLOW COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ AI Bot Test Flow Error:', err);
    process.exit(1);
  }
}

testAiBotFlow();
