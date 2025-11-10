// Migration helper: remove saved `.edit-btn` HTML from localStorage values.
// Usage (open browser console on your site root and run):
//   window.cleanSavedEditButtons({backup: true});
// It will back up any modified key to `<key>.__backup_before_editbtn_cleanup__`.

window.cleanSavedEditButtons = function(options){
  options = options || {};
  const backup = options.backup !== false; // default true
  const removed = [];
  const unchanged = [];
  const keys = Object.keys(localStorage);
  const buttonRe = /<button[^>]*class=["']?[^"'>]*edit-btn[^"'>]*[^>]*>.*?<\/button>/gims;

  keys.forEach(key => {
    try {
      const val = localStorage.getItem(key);
      if (typeof val !== 'string' || val.length === 0) { unchanged.push(key); return; }
      if (buttonRe.test(val)) {
        // backup original
        if (backup) {
          const bakKey = `${key}.__backup_before_editbtn_cleanup__`;
          if (!localStorage.getItem(bakKey)) localStorage.setItem(bakKey, val);
        }
        // remove all matching button HTML
        const cleaned = val.replace(buttonRe, '');
        localStorage.setItem(key, cleaned); migrate.js 
        removed.push(key);
      } else {
        unchanged.push(key);
      }
    } catch (e) {
      console.warn('cleanSavedEditButtons: skip key', key, e);
    }
  });

  console.info('cleanSavedEditButtons completed. keys cleaned:', removed.length, removed);
  if (backup) console.info('Backups created for cleaned keys with suffix: __backup_before_editbtn_cleanup__');
  return { cleaned: removed, untouched: unchanged };
};
