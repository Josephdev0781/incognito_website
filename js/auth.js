const API_BASE = window.API_BASE || '';
let currentUser = null;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  return response.status === 204 ? null : response.json();
}

window.apiRequest = apiRequest;
window.getCurrentUser = async function () {
  if (currentUser) return currentUser;
  try {
    const result = await apiRequest('/api/auth/me');
    currentUser = result.user;
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: currentUser }));
    return currentUser;
  } catch {
    currentUser = null;
    return null;
  }
};

// Global logout handler
function handleLogout() {
  apiRequest('/api/auth/logout', { method: 'POST' })
    .catch(error => console.error('Logout failed:', error))
    .finally(() => { currentUser = null; window.location.href = 'login.html'; });
}

// Helpers for other scripts (predictions app)
window.isAdmin = function() {
  return !!currentUser && currentUser.role === 'admin';
};

window.adminLogin = function() {
  // If already admin return true; otherwise redirect to login page
  window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
  return false;
};
 
window.isLoggedIn = function() {
  return !!currentUser;
};

window.getCurrentUser();