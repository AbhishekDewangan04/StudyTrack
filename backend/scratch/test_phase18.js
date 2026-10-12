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
  console.log('🧪 Starting Phase 18 Comprehensive Verification Tests...\n');

  // Test 1: GET /api/health
  console.log('1. Testing GET /api/health...');
  const healthRes = await request('/health');
  if (healthRes.status === 200 && healthRes.data.status === 'OK') {
    console.log('   ✅ Health endpoint returned 200 OK');
  } else {
    console.error('   ❌ Health endpoint failed:', healthRes);
    process.exit(1);
  }

  // Register / Login Test Users
  const user1Email = `phase18_u1_${Date.now()}@example.com`;
  const user2Email = `phase18_u2_${Date.now()}@example.com`;
  const pass = 'Password123!';

  console.log('\n2. Registering test users...');
  const u1Reg = await request('/auth/register', 'POST', { name: 'P18 User One', email: user1Email, password: pass });
  const u2Reg = await request('/auth/register', 'POST', { name: 'P18 User Two', email: user2Email, password: pass });

  const token1 = u1Reg.data.token;
  const token2 = u2Reg.data.token;

  if (!token1 || !token2) {
    console.error('   ❌ Failed to register test users');
    process.exit(1);
  }
  console.log('   ✅ Test users registered successfully');

  // Test 3: Normal Task Creation, Edit, Delete
  console.log('\n3. Testing normal task CRUD...');
  const deadlineNow = new Date(Date.now() + 86400000).toISOString();
  const normalTask = await request('/tasks', 'POST', {
    title: 'Normal Homework',
    subject: 'Math',
    deadline: deadlineNow,
  }, token1);

  if (normalTask.status === 201 && !normalTask.data.isRecurring && normalTask.data.recurrenceType === 'none') {
    console.log('   ✅ Normal task creation verified');
  } else {
    console.error('   ❌ Normal task creation failed:', normalTask);
    process.exit(1);
  }

  const editNormal = await request(`/tasks/${normalTask.data._id}`, 'PUT', { title: 'Updated Homework' }, token1);
  if (editNormal.status === 200 && editNormal.data.title === 'Updated Homework') {
    console.log('   ✅ Normal task editing verified');
  } else {
    console.error('   ❌ Normal task edit failed:', editNormal);
    process.exit(1);
  }

  // Test 4-6: Create Daily, Weekly, Monthly Recurring Tasks
  console.log('\n4. Creating Daily, Weekly, and Monthly recurring tasks...');
  const dailyTask = await request('/tasks', 'POST', {
    title: 'DSA Practice',
    subject: 'CS',
    deadline: deadlineNow,
    isRecurring: true,
    recurrenceType: 'daily',
    recurrenceEndDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    locationName: 'Central Library',
  }, token1);

  const weeklyTask = await request('/tasks', 'POST', {
    title: 'DBMS Revision',
    subject: 'Database',
    deadline: deadlineNow,
    isRecurring: true,
    recurrenceType: 'weekly',
  }, token1);

  const monthlyTask = await request('/tasks', 'POST', {
    title: 'Monthly Review',
    subject: 'Management',
    deadline: deadlineNow,
    isRecurring: true,
    recurrenceType: 'monthly',
  }, token1);

  if (
    dailyTask.status === 201 && dailyTask.data.recurrenceType === 'daily' &&
    weeklyTask.status === 201 && weeklyTask.data.recurrenceType === 'weekly' &&
    monthlyTask.status === 201 && monthlyTask.data.recurrenceType === 'monthly'
  ) {
    console.log('   ✅ Daily, Weekly, and Monthly recurring tasks created successfully');
  } else {
    console.error('   ❌ Recurring task creation failed:', { dailyTask, weeklyTask, monthlyTask });
    process.exit(1);
  }

  // Test 7-9: Edit & Disable Recurrence
  console.log('\n5. Testing recurrence modification & disabling...');
  const disableRec = await request(`/tasks/${dailyTask.data._id}`, 'PUT', {
    isRecurring: false,
  }, token1);

  if (disableRec.status === 200 && !disableRec.data.isRecurring && disableRec.data.recurrenceType === 'none') {
    console.log('   ✅ Disabling recurrence verified (isRecurring=false, recurrenceType=none)');
  } else {
    console.error('   ❌ Disable recurrence failed:', disableRec);
    process.exit(1);
  }

  // Test 10-11: Invalid recurrence type & date rejection
  console.log('\n6. Testing invalid recurrence validations...');
  const badType = await request('/tasks', 'POST', {
    title: 'Bad Recurrence',
    subject: 'Physics',
    deadline: deadlineNow,
    isRecurring: true,
    recurrenceType: 'yearly', // invalid type
  }, token1);

  const badDate = await request('/tasks', 'POST', {
    title: 'Bad End Date',
    subject: 'Physics',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    isRecurring: true,
    recurrenceType: 'daily',
    recurrenceEndDate: new Date(Date.now() - 86400000).toISOString(), // earlier than deadline
  }, token1);

  if (badType.status === 400 && badDate.status === 400) {
    console.log('   ✅ Invalid recurrence type and end date correctly rejected with 400 Bad Request');
  } else {
    console.error('   ❌ Invalid recurrence validation failed:', { badType, badDate });
    process.exit(1);
  }

  // Test 12-20: Advanced API Filtering & Search
  console.log('\n7. Testing API filters & search parameters...');
  const searchTitle = await request('/tasks?search=DBMS', 'GET', null, token1);
  const filterSubject = await request('/tasks?subject=Database', 'GET', null, token1);
  const filterRecurrence = await request('/tasks?recurrence=recurring', 'GET', null, token1);
  const filterLocation = await request('/tasks?location=withLocation', 'GET', null, token1);
  const combinedFilter = await request('/tasks?subject=Database&recurrence=recurring', 'GET', null, token1);

  if (
    searchTitle.status === 200 && searchTitle.data.length >= 1 &&
    filterSubject.status === 200 && filterSubject.data.length >= 1 &&
    filterRecurrence.status === 200 && filterRecurrence.data.some((t) => t.isRecurring) &&
    filterLocation.status === 200 &&
    combinedFilter.status === 200
  ) {
    console.log('   ✅ Advanced filtering & search parameters verified on backend API');
  } else {
    console.error('   ❌ Advanced filtering check failed:', { searchTitle, filterSubject, filterRecurrence, filterLocation, combinedFilter });
    process.exit(1);
  }

  // Test 21: Data Isolation
  console.log('\n8. Testing user task data isolation...');
  const u2Tasks = await request('/tasks', 'GET', null, token2);
  const u2AccessU1 = await request(`/tasks/${weeklyTask.data._id}`, 'GET', null, token2);

  if (u2Tasks.status === 200 && u2Tasks.data.length === 0 && u2AccessU1.status === 401) {
    console.log('   ✅ User data isolation & task ownership rules verified');
  } else {
    console.error('   ❌ Data isolation failed:', { u2Tasks, u2AccessU1 });
    process.exit(1);
  }

  // Test 22-26: Payments & Calendar endpoints
  console.log('\n9. Verifying Payment config and Calendar status endpoints...');
  const payConfig = await request('/payments/config', 'GET', null, token1);
  const calStatus = await request('/calendar/status', 'GET', null, token1);

  if (payConfig.status === 200 && calStatus.status === 200) {
    console.log('   ✅ Razorpay config & Calendar status endpoints working intact');
  } else {
    console.error('   ❌ Payment / Calendar status check failed:', { payConfig, calStatus });
    process.exit(1);
  }

  // Cleanup test tasks
  await request(`/tasks/${normalTask.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${dailyTask.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${weeklyTask.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${monthlyTask.data._id}`, 'DELETE', null, token1);

  console.log('\n🎉 ALL PHASE 18 COMPREHENSIVE TESTS PASSED SUCCESSFULLY!\n');
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('Test execution error:', err);
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(1);
});
