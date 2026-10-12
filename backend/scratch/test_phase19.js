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
  console.log('🧪 Starting Phase 19 Analytics & Productivity Insights Tests...\n');

  // Test 1: GET /api/health
  console.log('1. Testing GET /api/health...');
  const healthRes = await request('/health');
  if (healthRes.status === 200 && healthRes.data.status === 'OK') {
    console.log('   ✅ Health endpoint returned 200 OK');
  } else {
    console.error('   ❌ Health endpoint failed:', healthRes);
    process.exit(1);
  }

  // Test 2: Security & Unauthenticated Access
  console.log('\n2. Testing Unauthorized Analytics Requests (401 Check)...');
  const unauthOverview = await request('/analytics/overview', 'GET');
  const unauthSubjects = await request('/analytics/subjects', 'GET');
  const unauthTrends = await request('/analytics/trends', 'GET');

  if (unauthOverview.status === 401 && unauthSubjects.status === 401 && unauthTrends.status === 401) {
    console.log('   ✅ Unauthenticated requests correctly returned 401 Unauthorized');
  } else {
    console.error('   ❌ Security check failed for unauthenticated access:', { unauthOverview, unauthSubjects, unauthTrends });
    process.exit(1);
  }

  // Register Test Users
  const user1Email = `phase19_u1_${Date.now()}@example.com`;
  const user2Email = `phase19_u2_${Date.now()}@example.com`;
  const pass = 'Password123!';

  console.log('\n3. Registering test users...');
  const u1Reg = await request('/auth/register', 'POST', { name: 'P19 User One', email: user1Email, password: pass });
  const u2Reg = await request('/auth/register', 'POST', { name: 'P19 User Two', email: user2Email, password: pass });

  const token1 = u1Reg.data.token;
  const token2 = u2Reg.data.token;

  if (!token1 || !token2) {
    console.error('   ❌ Failed to register test users');
    process.exit(1);
  }
  console.log('   ✅ Test users registered successfully');

  // Test 4: Empty Task Account Analytics
  console.log('\n4. Testing Analytics for Empty Task Account...');
  const emptyOverview = await request('/analytics/overview', 'GET', null, token1);
  const emptySubjects = await request('/analytics/subjects', 'GET', null, token1);

  if (
    emptyOverview.status === 200 &&
    emptyOverview.data.totalTasks === 0 &&
    emptyOverview.data.completedTasks === 0 &&
    emptyOverview.data.mostProductiveSubject === null &&
    emptySubjects.status === 200 &&
    emptySubjects.data.length === 0
  ) {
    console.log('   ✅ Empty account analytics handled gracefully');
  } else {
    console.error('   ❌ Empty account analytics failed:', { emptyOverview, emptySubjects });
    process.exit(1);
  }

  // Test 5: Populate Tasks for User 1 & Verify Analytics Calculation
  console.log('\n5. Creating tasks with subjects, locations, recurring rules, and completions...');
  const deadlineFuture = new Date(Date.now() + 86400000).toISOString();
  const deadlinePast = new Date(Date.now() - 86400000).toISOString();

  // Task 1: Completed Data Structures
  const t1 = await request('/tasks', 'POST', {
    title: 'DSA Assignment 1',
    subject: 'Data Structures',
    deadline: deadlineFuture,
    locationName: 'Central Library',
    locationAddress: 'NIT Raipur',
  }, token1);
  await request(`/tasks/${t1.data._id}`, 'PUT', { status: 'Completed' }, token1);

  // Task 2: Completed Data Structures
  const t2 = await request('/tasks', 'POST', {
    title: 'DSA Lab Report',
    subject: 'Data Structures',
    deadline: deadlineFuture,
  }, token1);
  await request(`/tasks/${t2.data._id}`, 'PUT', { status: 'Completed' }, token1);

  // Task 3: Pending DBMS (Recurring)
  const t3 = await request('/tasks', 'POST', {
    title: 'DBMS Project',
    subject: 'Database',
    deadline: deadlineFuture,
    isRecurring: true,
    recurrenceType: 'weekly',
  }, token1);

  // Task 4: Overdue Math Task
  const t4 = await request('/tasks', 'POST', {
    title: 'Calculus Quiz',
    subject: 'Mathematics',
    deadline: deadlinePast,
  }, token1);

  // Test 6: Verify Overview Analytics Data
  console.log('\n6. Verifying GET /api/analytics/overview results...');
  const overviewRes = await request('/analytics/overview', 'GET', null, token1);

  if (
    overviewRes.status === 200 &&
    overviewRes.data.totalTasks === 4 &&
    overviewRes.data.completedTasks === 2 &&
    overviewRes.data.pendingTasks === 2 &&
    overviewRes.data.overdueTasks === 1 &&
    overviewRes.data.completionPercentage === 50 &&
    overviewRes.data.recurringTasksCount === 1 &&
    overviewRes.data.locationTasksCount === 1 &&
    overviewRes.data.mostProductiveSubject === 'Data Structures' &&
    overviewRes.data.currentStreak >= 1
  ) {
    console.log('   ✅ Analytics overview metrics verified:');
    console.log('      - Total: 4, Completed: 2, Pending: 2, Overdue: 1');
    console.log('      - Completion Rate: 50%');
    console.log('      - Recurring Tasks: 1, Location Tasks: 1');
    console.log('      - Top Subject:', overviewRes.data.mostProductiveSubject);
    console.log('      - Current Streak:', overviewRes.data.currentStreak, 'days');
  } else {
    console.error('   ❌ Overview analytics failed:', overviewRes.data);
    process.exit(1);
  }

  // Test 7: Verify Subject Analytics Data
  console.log('\n7. Verifying GET /api/analytics/subjects results...');
  const subjectsRes = await request('/analytics/subjects', 'GET', null, token1);

  const dsaSubject = subjectsRes.data.find((s) => s.subject === 'Data Structures');
  if (
    subjectsRes.status === 200 &&
    dsaSubject &&
    dsaSubject.total === 2 &&
    dsaSubject.completed === 2 &&
    dsaSubject.completionRate === 100
  ) {
    console.log('   ✅ Subject aggregation verified for "Data Structures" (100% completion rate)');
  } else {
    console.error('   ❌ Subject analytics failed:', subjectsRes.data);
    process.exit(1);
  }

  // Test 8: Verify Trends Analytics Data
  console.log('\n8. Verifying GET /api/analytics/trends results...');
  const trendsRes = await request('/analytics/trends', 'GET', null, token1);

  if (
    trendsRes.status === 200 &&
    Array.isArray(trendsRes.data.weeklyTrend) &&
    trendsRes.data.weeklyTrend.length === 7 &&
    trendsRes.data.overdueCount === 1
  ) {
    console.log('   ✅ Analytics trends endpoint verified (past 7 days weekly trend array returned)');
  } else {
    console.error('   ❌ Trends analytics failed:', trendsRes.data);
    process.exit(1);
  }

  // Test 9: Data Isolation Verification
  console.log('\n9. Testing User Data Isolation on Analytics APIs...');
  const u2Overview = await request('/analytics/overview', 'GET', null, token2);
  const u2Subjects = await request('/analytics/subjects', 'GET', null, token2);

  if (
    u2Overview.status === 200 &&
    u2Overview.data.totalTasks === 0 &&
    u2Subjects.status === 200 &&
    u2Subjects.data.length === 0
  ) {
    console.log('   ✅ User 2 analytics completely isolated from User 1 data (returns 0 total tasks)');
  } else {
    console.error('   ❌ Data isolation failed for user analytics:', { u2Overview, u2Subjects });
    process.exit(1);
  }

  // Test 10: Existing Integrations & Health Endpoint
  console.log('\n10. Verifying Payment & Calendar Status Endpoints intact...');
  const payConfig = await request('/payments/config', 'GET', null, token1);
  const calStatus = await request('/calendar/status', 'GET', null, token1);

  if (payConfig.status === 200 && calStatus.status === 200) {
    console.log('   ✅ Payment config & Calendar status endpoints working intact');
  } else {
    console.error('   ❌ Integrations check failed:', { payConfig, calStatus });
    process.exit(1);
  }

  // Cleanup test tasks
  await request(`/tasks/${t1.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${t2.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${t3.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${t4.data._id}`, 'DELETE', null, token1);

  console.log('\n🎉 ALL PHASE 19 COMPREHENSIVE TESTS PASSED SUCCESSFULLY!\n');
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('Test execution error:', err);
  if (tempServer) await new Promise((resolve) => tempServer.close(resolve));
  process.exit(1);
});
