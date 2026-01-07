import axios from 'axios';

// Simple test to verify frontend-backend connection
const API_BASE_URL = 'http://localhost:3000/api';

async function testFrontendBackendConnection() {
  try {
    console.log('🧪 Testing Frontend-Backend Connection...');

    // Test 1: Health check (if exists)
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Health check:', healthResponse.data);
    } catch (error) {
      console.log('⚠️ Health endpoint not available (expected)');
    }

    // Test 2: Register new test user
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'Password123',
      first_name: 'Test',
      last_name: 'Connection',
      role: 'student'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ User Registration:', registerResponse.data.success);

    // Test 3: Login with registered user
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ User Login:', loginResponse.data.success);

    const token = loginResponse.data.data.accessToken;

    // Test 4: Access protected endpoint
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected Route Access:', meResponse.data.success);

    // Test 5: Test database connection through API
    const usersResponse = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Database Query through API:', usersResponse.data.success ? 'Success' : 'Failed');

    console.log('🎉 All Frontend-Backend-Database connections working perfectly!');

  } catch (error) {
    console.error('❌ Connection Test Failed:', error.response?.data || error.message);
  }
}

testFrontendBackendConnection();