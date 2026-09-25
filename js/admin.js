// Backwards-compatible admin helpers. Authentication is owned by auth.js.
(function () {
  window.adminLogout = async function () {
    if (typeof window.apiRequest !== 'function') return;
    await window.apiRequest('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };
})();
