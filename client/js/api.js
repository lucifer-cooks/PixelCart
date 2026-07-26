// Centralized API client helper for PixelGear e-commerce
const API_BASE = '/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    // If token expired or invalid, redirect to login
    if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Try retrieving local JWT if cookies are blocked/unsupported
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  return headers;
};

const api = {
  get: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  post: async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Multi-part form uploads (e.g. for Admin product creation)
  upload: async (url, formData) => {
    const headers = {};
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },

  uploadPut: async (url, formData) => {
    const headers = {};
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    return handleResponse(res);
  }
};

window.api = api; // Expose globally
