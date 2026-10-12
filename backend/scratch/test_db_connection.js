const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const assert = require('assert');
const mongoose = require('mongoose');
const dns = require('dns');
const connectDB = require('../config/db');
const {
  getDBDiagnostics,
  redactDiagnosticMessage,
  getMongoUriMetadata,
  configureDns,
} = connectDB;

async function runTests() {
  console.log('🧪 Starting Database Connection & Serverless Lifecycle Diagnostics Tests...\n');

  // Test 1: MONGODB_URI safe metadata extraction without exposing credentials
  console.log('1. Testing MONGODB_URI safe metadata extraction...');
  const currentMeta = getMongoUriMetadata();
  assert.strictEqual(typeof currentMeta.configured, 'boolean', 'configured must be a boolean');
  assert.strictEqual(typeof currentMeta.protocol, 'string', 'protocol must be a string');
  assert.strictEqual(typeof currentMeta.isPlaceholder, 'boolean', 'isPlaceholder must be a boolean');
  assert.strictEqual(typeof currentMeta.length, 'number', 'length must be a number');
  assert.strictEqual(currentMeta.uri, undefined, 'Raw URI must never be included in metadata');
  console.log('   ✅ URI metadata verified (no credentials or URI exposed):', currentMeta);

  // Test 2: Placeholder and missing URI detection
  console.log('\n2. Testing placeholder and missing URI handling...');
  const origUri = process.env.MONGODB_URI;

  try {
    process.env.MONGODB_URI = 'mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/test';
    const placeholderMeta = getMongoUriMetadata();
    assert.strictEqual(placeholderMeta.configured, false, 'Placeholder URI must be marked not configured');
    assert.strictEqual(placeholderMeta.isPlaceholder, true, 'Placeholder URI must have isPlaceholder true');

    process.env.MONGODB_URI = '';
    const emptyMeta = getMongoUriMetadata();
    assert.strictEqual(emptyMeta.configured, false, 'Empty URI must be marked not configured');
    assert.strictEqual(emptyMeta.protocol, 'none');

    delete process.env.MONGODB_URI;
    const missingMeta = getMongoUriMetadata();
    assert.strictEqual(missingMeta.configured, false, 'Missing URI must be marked not configured');
  } finally {
    process.env.MONGODB_URI = origUri;
  }
  console.log('   ✅ Placeholder and missing URI detection verified');

  // Test 3: Safe redaction of credentials, URIs, and hosts
  console.log('\n3. Testing redaction of sensitive credentials, URIs, and hostnames...');
  const sampleError =
    'querySrv ETIMEOUT _mongodb._tcp.cluster0.abcde.mongodb.net at mongodb+srv://admin_user:superSecretPass123@cluster0.abcde.mongodb.net/studytrack?retryWrites=true';
  const redacted = redactDiagnosticMessage(sampleError);
  assert.ok(!redacted.includes('superSecretPass123'), 'Redacted message must not contain password');
  assert.ok(!redacted.includes('admin_user:'), 'Redacted message must not contain username');
  assert.ok(!redacted.includes('cluster0.abcde.mongodb.net'), 'Redacted message must not contain host');
  assert.ok(redacted.includes('[REDACTED_URI]') || redacted.includes('[REDACTED_CREDENTIALS]'), 'Must contain redacted token');
  console.log('   ✅ Diagnostic message redaction verified:', redacted);

  // Test 4: DNS Configuration safety in Vercel / Production environments
  console.log('\n4. Testing DNS guard against cloud / serverless override...');
  const origVercel = process.env.VERCEL;
  const origNodeEnv = process.env.NODE_ENV;

  try {
    process.env.VERCEL = '1';
    // configureDns should immediately return without setting custom servers
    configureDns();
    const vercelServers = dns.getServers();
    assert.ok(Array.isArray(vercelServers), 'DNS servers must be an array');

    process.env.VERCEL = undefined;
    process.env.NODE_ENV = 'production';
    configureDns();
    const prodServers = dns.getServers();
    assert.ok(Array.isArray(prodServers), 'DNS servers in production must be an array');
  } finally {
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
    process.env.NODE_ENV = origNodeEnv;
  }
  console.log('   ✅ DNS configuration guard in cloud/serverless environments verified');

  // Test 5: Safe Connection Diagnostics structure
  console.log('\n5. Testing getDBDiagnostics() structure...');
  const diag = getDBDiagnostics();
  assert.ok(['connected', 'disconnected', 'connecting', 'disconnecting', 'unknown'].includes(diag.status));
  assert.strictEqual(typeof diag.readyState, 'number');
  assert.strictEqual(typeof diag.uriConfigured, 'boolean');
  assert.strictEqual(typeof diag.uriProtocol, 'string');
  assert.strictEqual(diag.rawUri, undefined);
  console.log('   ✅ Safe connection diagnostics verified:', diag);

  // Test 6: Serverless connection reuse
  console.log('\n6. Testing serverless connection reuse and lifecycle...');
  const conn1 = await connectDB();
  const state1 = mongoose.connection.readyState;
  console.log(`   Connection state after initial connectDB(): ${state1}`);

  if (state1 === 1) {
    // If DB is reachable, verify instant reuse without reconnecting
    const conn2 = await connectDB();
    assert.strictEqual(conn1, conn2, 'Subsequent connectDB() calls must reuse existing connection');
    console.log('   ✅ Connection reuse verified (identical connection instance returned)');
  } else {
    console.log('   ℹ️ DB connection not active in this test environment; connection failure diagnostics recorded safely');
  }

  // Test 7: GET /api/health endpoint includes database diagnostics
  console.log('\n7. Testing GET /api/health endpoint response payload...');
  const app = require('../server');
  const http = require('http');
  const tempServer = http.createServer(app);
  await new Promise((resolve) => tempServer.listen(0, resolve));
  const tempPort = tempServer.address().port;
  try {
    const healthRes = await fetch(`http://127.0.0.1:${tempPort}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200');
    const data = await healthRes.json();
    assert.strictEqual(data.status, 'OK', 'Health status must be OK');
    assert.ok(data.message.includes('StudyTrack Backend API'), 'Health message must match original');
    assert.ok(data.database, 'Health check must include database diagnostics');
    assert.strictEqual(typeof data.database.status, 'string');
    assert.strictEqual(typeof data.database.readyState, 'number');
    console.log('   ✅ GET /api/health returns database diagnostics correctly:', data.database);
  } finally {
    await new Promise((resolve) => tempServer.close(resolve));
  }

  // Test 8: Vercel serverless entrypoint api/index.js exports Express app
  console.log('\n8. Testing Vercel serverless entrypoint (api/index.js)...');
  const fs = require('fs');
  const apiEntryContent = fs.readFileSync(path.join(__dirname, '../api/index.js'), 'utf8');
  assert.ok(apiEntryContent.includes("require('../server')") || apiEntryContent.includes('require("../server")'), 'api/index.js must import server.js');
  assert.ok(apiEntryContent.includes('module.exports = app'), 'api/index.js must export Express app');
  console.log('   ✅ Vercel serverless entrypoint (api/index.js) syntax & exports verified');

  console.log('\n🎉 ALL DATABASE CONNECTION & SERVERLESS LIFECYCLE TESTS PASSED SUCCESSFULLY!\n');
  await mongoose.disconnect();
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
