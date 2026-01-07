async function testAdminDashboard() {
  try {
    // First, try to register an admin user
    console.log('Attempting to register admin user...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Password123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('Admin user registered successfully');
    } else if (registerData.message && registerData.message.includes('already registered')) {
      console.log('Admin user already exists, proceeding with login...');
    } else {
      console.log('Registration response:', registerData);
    }

    // Now login as admin
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.data.accessToken;
    console.log('Login successful, token obtained:', token ? 'YES' : 'NO');
    console.log('Full login response:', JSON.stringify(loginData, null, 2));

    // Test admin dashboard
    console.log('Testing admin dashboard...');
    const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const dashboardData = await dashboardResponse.json();

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard request failed: ${JSON.stringify(dashboardData)}`);
    }

    console.log('Admin dashboard response:');
    console.log(JSON.stringify(dashboardData, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminDashboard();