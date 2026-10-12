const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const url = new URL(`${API_BASE}${endpoint}`);
  const headers = {
    'Content-Type': 'application/json',
    'X-Test-Environment': 'true',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  return { status: res.status, data };
}

let tempServer = null;
async function ensureServer() {
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) return;
  } catch (err) {
    const app = require('../server');
    tempServer = await new Promise((resolve) => {
      const s = app.listen(5000, () => resolve(s));
    });
  }
}

async function runTests() {
  await ensureServer();
  console.log('🧪 Starting Profile/Preferences Persistence & Analytics Trend Tests...\n');

  // Test 1: Health check
  console.log('1. Verifying GET /api/health...');
  const healthRes = await request('/health');
  if (healthRes.status !== 200 || healthRes.data.status !== 'OK') {
    console.error('   ❌ Health check failed:', healthRes);
    process.exit(1);
  }
  console.log('   ✅ Health endpoint verified');

  // Test 2: User Registration & Default Preferences
  console.log('\n2. Testing User Registration and Default Preferences...');
  const timestamp = Date.now();
  const user1Email = `pref_test_u1_${timestamp}@example.com`;
  const user2Email = `pref_test_u2_${timestamp}@example.com`;
  const password = 'Password123!';

  const regRes1 = await request('/auth/register', 'POST', {
    name: 'Original Name',
    email: user1Email,
    password,
  });

  if (regRes1.status !== 201 || !regRes1.data.token) {
    console.error('   ❌ User registration failed:', regRes1);
    process.exit(1);
  }

  const token1 = regRes1.data.token;
  const initialPrefs = regRes1.data.preferences;
  if (!initialPrefs || initialPrefs.defaultTaskLayout !== 'table') {
    console.error('   ❌ Default preferences not properly initialized:', initialPrefs);
    process.exit(1);
  }
  console.log('   ✅ User registered with default preferences (defaultTaskLayout = table)');

  // Test 3: Updating Profile Details (PUT /api/auth/profile)
  console.log('\n3. Testing Profile Updates (Name & Email)...');
  const updatedEmail = `pref_test_u1_updated_${timestamp}@example.com`;
  const profileUpdateRes = await request('/auth/profile', 'PUT', {
    name: 'Abhishek Updated',
    email: updatedEmail,
  }, token1);

  if (profileUpdateRes.status !== 200 || profileUpdateRes.data.name !== 'Abhishek Updated' || profileUpdateRes.data.email !== updatedEmail) {
    console.error('   ❌ Profile update failed:', profileUpdateRes);
    process.exit(1);
  }
  console.log('   ✅ Profile updated successfully via PUT /api/auth/profile');

  // Test 4: Verifying Profile Persistence on Refresh (GET /api/auth/me)
  console.log('\n4. Verifying Profile Persistence after simulated refresh (GET /api/auth/me)...');
  const meRes = await request('/auth/me', 'GET', null, token1);
  if (meRes.status !== 200 || meRes.data.name !== 'Abhishek Updated' || meRes.data.email !== updatedEmail) {
    console.error('   ❌ Profile changes did not persist in MongoDB:', meRes);
    process.exit(1);
  }
  console.log('   ✅ Profile persistence confirmed: name and email retained in database');

  // Test 5: Validation rules on Profile Updates
  console.log('\n5. Testing Profile Validation (empty name & duplicate email)...');
  const emptyNameRes = await request('/auth/profile', 'PUT', { name: '   ' }, token1);
  if (emptyNameRes.status !== 400) {
    console.error('   ❌ Empty name should have returned 400, got:', emptyNameRes.status);
    process.exit(1);
  }

  // Register User 2
  const regRes2 = await request('/auth/register', 'POST', {
    name: 'User Two',
    email: user2Email,
    password,
  });
  const token2 = regRes2.data.token;

  // Attempt to steal User 2's email
  const dupEmailRes = await request('/auth/profile', 'PUT', { email: user2Email }, token1);
  if (dupEmailRes.status !== 400) {
    console.error('   ❌ Duplicate email update should have returned 400, got:', dupEmailRes.status);
    process.exit(1);
  }
  console.log('   ✅ Profile validations correctly reject empty names and duplicate emails');

  // Test 6: Updating Preferences (PUT /api/auth/preferences)
  console.log('\n6. Testing Preferences Update (PUT /api/auth/preferences)...');
  const prefUpdateRes = await request('/auth/preferences', 'PUT', {
    defaultTaskLayout: 'grid',
    overdueAlerts: false,
    emailAlerts: true,
    taskReminders: false,
  }, token1);

  if (prefUpdateRes.status !== 200 || !prefUpdateRes.data.success || prefUpdateRes.data.preferences.defaultTaskLayout !== 'grid') {
    console.error('   ❌ Preferences update failed:', prefUpdateRes);
    process.exit(1);
  }
  console.log('   ✅ Preferences updated successfully (defaultTaskLayout = grid)');

  // Test 7: Verifying Preferences Persistence on Refresh (GET /api/auth/me)
  console.log('\n7. Verifying Preferences Persistence after simulated refresh...');
  const meAfterPref = await request('/auth/me', 'GET', null, token1);
  if (
    meAfterPref.status !== 200 ||
    meAfterPref.data.preferences.defaultTaskLayout !== 'grid' ||
    meAfterPref.data.preferences.overdueAlerts !== false ||
    meAfterPref.data.preferences.taskReminders !== false
  ) {
    console.error('   ❌ Preferences did not persist across refresh in MongoDB:', meAfterPref.data.preferences);
    process.exit(1);
  }
  console.log('   ✅ Preferences persistence confirmed: all flags and defaultTaskLayout retained');

  // Test 8: User Isolation for Preferences and Profile
  console.log('\n8. Testing User Isolation for Preferences...');
  const user2Me = await request('/auth/me', 'GET', null, token2);
  if (
    user2Me.status !== 200 ||
    user2Me.data.preferences.defaultTaskLayout !== 'table' ||
    user2Me.data.preferences.overdueAlerts !== true
  ) {
    console.error('   ❌ User isolation failed! User 2 affected by User 1 preferences:', user2Me.data.preferences);
    process.exit(1);
  }
  console.log('   ✅ User isolation confirmed: User 2 preferences remain isolated with default settings');

  // Test 9: Analytics Trends Data Structure Verification
  console.log('\n9. Testing Analytics Trends API fields (created/completed compatibility)...');
  // Create 2 tasks for User 1: 1 completed, 1 pending
  const t1 = await request('/tasks', 'POST', {
    title: 'Study Math',
    subject: 'Mathematics',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: 'Completed',
  }, token1);

  const t2 = await request('/tasks', 'POST', {
    title: 'Read Physics Chapter',
    subject: 'Physics',
    deadline: new Date(Date.now() + 172800000).toISOString(),
    status: 'Pending',
  }, token1);

  const trendsRes = await request('/analytics/trends', 'GET', null, token1);
  if (trendsRes.status !== 200 || !Array.isArray(trendsRes.data.weeklyTrend)) {
    console.error('   ❌ Trends endpoint failed:', trendsRes);
    process.exit(1);
  }

  const weeklyTrend = trendsRes.data.weeklyTrend;
  if (weeklyTrend.length !== 7) {
    console.error('   ❌ Weekly trend length is not 7:', weeklyTrend.length);
    process.exit(1);
  }

  // Verify that every single trend item contains created, completed, createdCount, completedCount
  const hasAllFields = weeklyTrend.every((item) =>
    typeof item.created === 'number' &&
    typeof item.completed === 'number' &&
    typeof item.createdCount === 'number' &&
    typeof item.completedCount === 'number' &&
    typeof item.day === 'string' &&
    typeof item.date === 'string'
  );

  if (!hasAllFields) {
    console.error('   ❌ Missing required chart fields in weeklyTrend items:', weeklyTrend[0]);
    process.exit(1);
  }
  console.log('   ✅ All trend items contain both created/completed and createdCount/completedCount');

  // Test 10: Multi-Period Query Support
  console.log('\n10. Testing Analytics Multi-Period Query Support (?period=30 Days)...');
  const trends30Res = await request('/analytics/trends?period=30 Days', 'GET', null, token1);
  if (trends30Res.status !== 200 || !Array.isArray(trends30Res.data.trendData) || trends30Res.data.trendData.length !== 30) {
    console.error('   ❌ Multi-period trends failed:', trends30Res.data);
    process.exit(1);
  }
  console.log('   ✅ Multi-period query returned 30-day trendData array with consistent fields');

  // Test 11: Zero-Task Account Graceful Analytics
  console.log('\n11. Testing Zero-Task Account Graceful Analytics...');
  const u2Overview = await request('/analytics/overview', 'GET', null, token2);
  const u2Subjects = await request('/analytics/subjects', 'GET', null, token2);
  const u2Trends = await request('/analytics/trends', 'GET', null, token2);

  if (
    u2Overview.status !== 200 || u2Overview.data.totalTasks !== 0 ||
    u2Subjects.status !== 200 || u2Subjects.data.length !== 0 ||
    u2Trends.status !== 200 || u2Trends.data.weeklyTrend.length !== 7
  ) {
    console.error('   ❌ Zero-task account analytics failed:', { u2Overview, u2Subjects, u2Trends });
    process.exit(1);
  }
  console.log('   ✅ Zero-task account returns 0 metrics and clean weeklyTrend structure without error');

  // Cleanup tasks
  if (t1.data && t1.data._id) await request(`/tasks/${t1.data._id}`, 'DELETE', null, token1);
  if (t2.data && t2.data._id) await request(`/tasks/${t2.data._id}`, 'DELETE', null, token1);

  console.log('\n🎉 ALL PROFILE/PREFERENCE PERSISTENCE & ANALYTICS TESTS PASSED SUCCESSFULLY!\n');
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('Test execution error:', err);
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(1);
});
