const http = require('http');

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

async function runTests() {
  console.log('🧪 Starting Phase 17 Verification Tests...\n');

  // Test 1: GET /api/health
  console.log('1. Testing GET /api/health...');
  const healthRes = await request('/health');
  if (healthRes.status === 200 && healthRes.data.status === 'OK') {
    console.log('   ✅ Health endpoint returned 200 OK');
  } else {
    console.error('   ❌ Health endpoint failed:', healthRes);
    process.exit(1);
  }

  // Register / Login Test User
  const user1Email = `phase17_u1_${Date.now()}@example.com`;
  const user2Email = `phase17_u2_${Date.now()}@example.com`;
  const pass = 'Password123!';

  console.log('\n2. Registering test users...');
  const u1Reg = await request('/auth/register', 'POST', { name: 'User One', email: user1Email, password: pass });
  const u2Reg = await request('/auth/register', 'POST', { name: 'User Two', email: user2Email, password: pass });

  const token1 = u1Reg.data.token;
  const token2 = u2Reg.data.token;

  if (!token1 || !token2) {
    console.error('   ❌ Failed to register test users');
    process.exit(1);
  }
  console.log('   ✅ Test users registered successfully');

  // Test 3: Existing task creation WITHOUT location
  console.log('\n3. Creating task WITHOUT location...');
  const taskNoLoc = await request('/tasks', 'POST', {
    title: 'Task Without Location',
    subject: 'Math',
    deadline: new Date(Date.now() + 86400000).toISOString(),
  }, token1);

  if (taskNoLoc.status === 201 && taskNoLoc.data.locationName === '' && taskNoLoc.data.googleMapsUrl === '') {
    console.log('   ✅ Task created without location successfully');
  } else {
    console.error('   ❌ Failed task creation without location:', taskNoLoc);
    process.exit(1);
  }

  // Test 4: Task creation WITH location name & address
  console.log('\n4. Creating task WITH location name and address...');
  const taskWithLoc = await request('/tasks', 'POST', {
    title: 'DSA Assignment',
    subject: 'Computer Science',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    locationName: 'Central Library',
    locationAddress: 'NIT Raipur, Raipur',
  }, token1);

  const expectedMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Central%20Library%20NIT%20Raipur%2C%20Raipur';
  if (
    taskWithLoc.status === 201 &&
    taskWithLoc.data.locationName === 'Central Library' &&
    taskWithLoc.data.locationAddress === 'NIT Raipur, Raipur' &&
    taskWithLoc.data.googleMapsUrl === expectedMapsUrl
  ) {
    console.log('   ✅ Task with location created, Google Maps URL:', taskWithLoc.data.googleMapsUrl);
  } else {
    console.error('   ❌ Failed task creation with location:', taskWithLoc);
    process.exit(1);
  }

  // Test 5: Task creation WITH latitude and longitude (prefers coordinates)
  console.log('\n5. Creating task WITH latitude & longitude...');
  const taskWithCoords = await request('/tasks', 'POST', {
    title: 'Lab Practice',
    subject: 'Physics',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    locationName: 'Physics Lab',
    locationAddress: 'NIT Raipur',
    locationLatitude: 21.2497,
    locationLongitude: 81.6050,
  }, token1);

  const expectedCoordUrl = 'https://www.google.com/maps/search/?api=1&query=21.2497%2C81.605';
  if (
    taskWithCoords.status === 201 &&
    taskWithCoords.data.googleMapsUrl === expectedCoordUrl
  ) {
    console.log('   ✅ Task with coordinates prefers lat/lng URL:', taskWithCoords.data.googleMapsUrl);
  } else {
    console.error('   ❌ Failed task creation with coordinates:', taskWithCoords);
    process.exit(1);
  }

  // Test 6: Invalid coordinate rejection
  console.log('\n6. Testing invalid coordinate rejections...');
  const badLat = await request('/tasks', 'POST', {
    title: 'Bad Lat',
    subject: 'Math',
    deadline: new Date().toISOString(),
    locationLatitude: 120, // > 90
  }, token1);

  const badLng = await request('/tasks', 'POST', {
    title: 'Bad Lng',
    subject: 'Math',
    deadline: new Date().toISOString(),
    locationLongitude: -200, // < -180
  }, token1);

  if (badLat.status === 400 && badLng.status === 400) {
    console.log('   ✅ Invalid coordinates correctly rejected with 400 Bad Request');
  } else {
    console.error('   ❌ Invalid coordinate check failed:', { badLat, badLng });
    process.exit(1);
  }

  // Test 7: Edit Location
  console.log('\n7. Editing task location...');
  const editLoc = await request(`/tasks/${taskWithLoc.data._id}`, 'PUT', {
    locationName: 'Main Library Room 204',
    locationAddress: 'NIT Raipur Campus',
  }, token1);

  const expectedUpdatedUrl = 'https://www.google.com/maps/search/?api=1&query=Main%20Library%20Room%20204%20NIT%20Raipur%20Campus';
  if (
    editLoc.status === 200 &&
    editLoc.data.locationName === 'Main Library Room 204' &&
    editLoc.data.googleMapsUrl === expectedUpdatedUrl
  ) {
    console.log('   ✅ Location edited and URL updated successfully');
  } else {
    console.error('   ❌ Edit location failed:', editLoc);
    process.exit(1);
  }

  // Test 8: Remove location
  console.log('\n8. Removing location from task...');
  const removeLoc = await request(`/tasks/${taskWithLoc.data._id}`, 'PUT', {
    locationName: '',
    locationAddress: '',
    locationLatitude: null,
    locationLongitude: null,
  }, token1);

  if (
    removeLoc.status === 200 &&
    removeLoc.data.locationName === '' &&
    removeLoc.data.googleMapsUrl === ''
  ) {
    console.log('   ✅ Location removed successfully');
  } else {
    console.error('   ❌ Remove location failed:', removeLoc);
    process.exit(1);
  }

  // Test 9: Data Isolation / Ownership Check
  console.log('\n9. Testing user task isolation...');
  const unauthorizedAccess = await request(`/tasks/${taskNoLoc.data._id}`, 'GET', null, token2);
  const unauthorizedEdit = await request(`/tasks/${taskNoLoc.data._id}`, 'PUT', { title: 'Hacked' }, token2);
  const unauthorizedDelete = await request(`/tasks/${taskNoLoc.data._id}`, 'DELETE', null, token2);

  if (
    unauthorizedAccess.status === 401 &&
    unauthorizedEdit.status === 401 &&
    unauthorizedDelete.status === 401
  ) {
    console.log('   ✅ User data isolation & task ownership rules verified (401 Unauthorized for User 2)');
  } else {
    console.error('   ❌ Data isolation failed:', { unauthorizedAccess, unauthorizedEdit, unauthorizedDelete });
    process.exit(1);
  }

  // Test 10: Razorpay & Calendar Status endpoints intact
  console.log('\n10. Verifying Razorpay & Calendar status endpoints...');
  const razorpayConfig = await request('/payments/config', 'GET', null, token1);
  const calendarStatus = await request('/calendar/status', 'GET', null, token1);

  if (razorpayConfig.status === 200 && calendarStatus.status === 200) {
    console.log('   ✅ Razorpay config and Calendar status endpoints working normally');
  } else {
    console.error('   ❌ Razorpay / Calendar endpoints failed:', { razorpayConfig, calendarStatus });
    process.exit(1);
  }

  // Cleanup test task
  await request(`/tasks/${taskNoLoc.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${taskWithLoc.data._id}`, 'DELETE', null, token1);
  await request(`/tasks/${taskWithCoords.data._id}`, 'DELETE', null, token1);

  console.log('\n🎉 ALL PHASE 17 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
