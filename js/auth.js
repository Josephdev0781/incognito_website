// Authentication helpers only. Nav rendering is handled centrally in main.js.
// This file exposes helpers used across pages (isAdmin, isLoggedIn, handleLogout, adminLogin).

// Global logout handler
function handleLogout() {
  // remove auth token
  localStorage.removeItem('auth_user');

  // Rollback in-memory purchases persisted in localStorage so they don't remain after logout.
  // This resets the `purchased` flags for tools and predictions (non-destructive to other fields).
  try {
    const TOOLS_KEY = 'tools_v1';
    const PRED_KEY = 'predictions_v1';

    const tools = JSON.parse(localStorage.getItem(TOOLS_KEY) || '[]');
    if (Array.isArray(tools) && tools.length) {
      let changed = false;
      tools.forEach(t => { if (t && t.purchased) { t.purchased = false; changed = true; } });
      if (changed) localStorage.setItem(TOOLS_KEY, JSON.stringify(tools));
    }

    const preds = JSON.parse(localStorage.getItem(PRED_KEY) || '[]');
    if (Array.isArray(preds) && preds.length) {
      let changed = false;
      preds.forEach(p => { if (p && p.purchased) { p.purchased = false; changed = true; } });
      if (changed) localStorage.setItem(PRED_KEY, JSON.stringify(preds));
    }
  } catch (err) {
    // non-fatal; log for debugging
    console.error('Error while rolling back purchases on logout:', err);
  }

  // Redirect to login page
  window.location.href = 'login.html';
}

// Helpers for other scripts (predictions app)
window.isAdmin = function() {
  try {
    const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return !!u.isAdmin;
  } catch (e) { return false; }
};

window.adminLogin = function() {
  // If already admin return true; otherwise redirect to login page
  const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (u && u.isAdmin) return true;
  // preserve return path after login (optional)
  localStorage.setItem('post_login_redirect', window.location.href);
  window.location.href = 'login.html';
  return false;
};
 
window.isLoggedIn = function() {
  try {
    const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return !!u && !!u.email;
  } catch (e) { return false; }
}; 