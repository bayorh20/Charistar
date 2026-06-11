const WP_JWT_URL = import.meta.env.VITE_WP_JWT_URL;
const WP_API_URL = import.meta.env.VITE_WP_API_URL;

export const loginUser = async (username, password) => {
  const response = await fetch(`${WP_JWT_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const registerUser = async (email, username, password) => {
  const response = await fetch(`${WP_API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      username,
      password,
      roles: ['customer']
    })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${WP_API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};
