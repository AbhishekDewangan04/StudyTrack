const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper for REST API calls
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || `HTTP Error ${response.status}` };
    }

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred during API request');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updatePreferences: (preferencesData) =>
    request('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    }),

  getGoogleAuthUrl: () =>
    request('/auth/google', {
      method: 'GET',
    }),
};

// Task API endpoints
export const taskAPI = {
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    return request(`/tasks${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  getStats: () => request('/tasks/stats', { method: 'GET' }),
  getTaskById: (id) => request(`/tasks/${id}`, { method: 'GET' }),
  createTask: (taskData) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  updateTask: (id, taskData) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),
  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Payment & PRO Subscription API endpoints
export const paymentAPI = {
  getConfig: () => request('/payments/config', { method: 'GET' }),
  createOrder: (planData = {}) =>
    request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),
  verifyPayment: (paymentData) =>
    request('/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
};

// Calendar & Email Notification API endpoints
export const calendarAPI = {
  getAuthUrl: () => request('/calendar/auth-url', { method: 'GET' }),
  getStatus: () => request('/calendar/status', { method: 'GET' }),
  disconnect: () => request('/calendar/disconnect', { method: 'POST' }),
  syncAll: () => request('/calendar/sync-all', { method: 'POST' }),
  syncTask: (taskId) => request(`/calendar/sync-task/${taskId}`, { method: 'POST' }),
};

// Productivity Analytics API endpoints
export const analyticsAPI = {
  getOverview: () => request('/analytics/overview', { method: 'GET' }),
  getSubjects: () => request('/analytics/subjects', { method: 'GET' }),
  getTrends: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    return request(`/analytics/trends${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
};

// Gemini AI Bot API endpoints
export const aiAPI = {
  getStudyAdvice: (payload = {}) =>
    request('/ai/study-advice', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

