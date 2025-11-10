// Simple client-side admin helper (localStorage-backed, placeholder only)
(function(){
  const ADMIN_KEY = 'incognito_is_admin_v1';
  const PWD_KEY = 'incognito_admin_pwd_v1';

  // default password if none set
  const DEFAULT_PWD = 'admin123';

  window.adminLogin = function(){
    try{
      const pwd = prompt('Enter admin password');
      if(!pwd) return false;
      const stored = localStorage.getItem(PWD_KEY) || DEFAULT_PWD;
      if(pwd === stored){
        localStorage.setItem(ADMIN_KEY, '1');
        return true;
      }
      alert('Wrong password');
      return false;
    }catch(e){ console.error(e); return false; }
  };

  window.adminLogout = function(){ localStorage.removeItem(ADMIN_KEY); };
  window.isAdmin = function(){ return localStorage.getItem(ADMIN_KEY) === '1'; };
  window.setAdminPassword = function(newPwd){ if(!newPwd) return false; localStorage.setItem(PWD_KEY, newPwd); return true; };
})();
