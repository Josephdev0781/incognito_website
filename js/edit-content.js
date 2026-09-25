(function(){
  const STORAGE_PREFIX = 'editable_v1::';
  let lastAdminState = false;

  function storageKey(name){
    if (name.startsWith('editable_')) return name;
    return 'editable_' + name;
  }

  function isAdminSafe() {
    return typeof window.isAdmin === 'function' && window.isAdmin();
  }

  function cleanEditableHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('.edit-btn').forEach(button => button.remove());
    return template.innerHTML;
  }

  function loadSaved(element){
    const key = element.dataset.editable;
    if(!key) return;
    const saved = localStorage.getItem(storageKey(key));
    if(saved !== null){ element.innerHTML = cleanEditableHtml(saved); }
  }

  function saveContent(element, html){
    const key = element.dataset.editable;
    if(!key) return;
    const cleanedHtml = cleanEditableHtml(html);
    localStorage.setItem(storageKey(key), cleanedHtml);
    element.innerHTML = cleanedHtml;
  }

  function createModal(initialHtml, onSave){
    const overlay = document.createElement('div'); overlay.className = 'edit-overlay';
    const modal = document.createElement('div'); modal.className = 'edit-modal';
    const header = document.createElement('div'); header.className = 'edit-header';
    const title = document.createElement('h3'); title.textContent = 'Edit Content';
    const ta = document.createElement('textarea'); ta.className = 'edit-textarea'; ta.value = initialHtml;
    const btnSave = document.createElement('button'); btnSave.className = 'edit-save'; btnSave.textContent = 'Save Changes';
    const btnCancel = document.createElement('button'); btnCancel.className = 'edit-cancel'; btnCancel.textContent = 'Cancel';
    
    header.appendChild(title);
    modal.appendChild(header);
    modal.appendChild(ta);
    const row = document.createElement('div'); 
    row.className = 'edit-row'; 
    row.appendChild(btnCancel); 
    row.appendChild(btnSave);
    modal.appendChild(row);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function closeModal() { overlay.remove(); }
    btnCancel.addEventListener('click', closeModal);
    btnSave.addEventListener('click', ()=>{ onSave(ta.value); closeModal(); });

    document.addEventListener('keydown', function escHandler(e) {
      if(e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    modal.addEventListener('click', e => e.stopPropagation());
    overlay.addEventListener('click', closeModal);
    ta.focus(); ta.select();
  }

  function injectStyles(){
    if(document.getElementById('edit-content-styles')) return;
    const css = `
      .edit-overlay{ position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(3px); }
      .edit-modal{ width:90%; max-width:1000px; background:var(--card-bg,white); padding:1.5rem; border-radius:12px; box-shadow:0 15px 50px rgba(0,0,0,0.3); }
      .edit-header{ margin-bottom:1rem; }
      .edit-header h3{ margin:0; color:inherit; font-size:1.2rem; }
      .edit-textarea{ width:100%; min-height:400px; font-family:ui-monospace,Consolas,monospace; font-size:14px; line-height:1.5; padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.02); color:inherit; border:1px solid rgba(0,0,0,0.1); border-radius:8px; resize:vertical; }
      .edit-row{ display:flex; gap:12px; justify-content:flex-end; }
      .edit-save, .edit-cancel{ padding:0.7rem 1.2rem; border-radius:8px; font-size:14px; cursor:pointer; min-width:120px; }
      .edit-save{ background:var(--accent-color, #3498db); color:#fff; border:none; }
      .edit-save:hover{ background:var(--primary-color, #2c3e50); }
      .edit-cancel{ background:transparent; border:1px solid var(--border, rgba(0,0,0,0.1)); color:inherit; }
      .edit-cancel:hover{ background:rgba(0,0,0,0.05); }
      .edit-btn { position:absolute; top:12px; right:12px; padding:6px 12px; background:var(--accent-color,#3498db); color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; opacity:0.9; z-index:10; }
      .edit-btn:hover { opacity:1; transform:translateY(-1px); }
      [data-editable] { position:relative; }
    `;
    const s = document.createElement('style');
    s.id = 'edit-content-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function removeAllEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.remove());
  }

  function init(){
    injectStyles();

    const editableEls = document.querySelectorAll('[data-editable]');
    editableEls.forEach(el => {
      loadSaved(el);

      if (el.dataset.editInitialized === 'true') return;
      el.dataset.editInitialized = 'true';

      if (isAdminSafe()) {
        if (!el.style.position) el.style.position = 'relative';

        const btn = document.createElement('button');
        btn.className = 'edit-btn';
        btn.textContent = 'Edit';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isAdminSafe()) {
            createModal(cleanEditableHtml(el.innerHTML), newHtml => {
              saveContent(el, newHtml);
            });
          }
        });
        el.appendChild(btn);
      }
    });
  }

  function startAdminWatcher(){
    setInterval(() => {
      const currentAdmin = isAdminSafe();
      if (currentAdmin && !lastAdminState) {
        document.querySelectorAll('[data-editable]').forEach(el => {
          delete el.dataset.editInitialized;
        });
        init();
      } else if (!currentAdmin && lastAdminState) {
        removeAllEditButtons();
      }
      lastAdminState = currentAdmin;
    }, 1000);
    window.addEventListener('auth-ready', () => {
      document.querySelectorAll('[data-editable]').forEach(el => {
        delete el.dataset.editInitialized;
      });
      init();
      lastAdminState = isAdminSafe();
    });
  }

  function addEditableContent(name, html, container = document.body) {
    const el = document.createElement('div');
    el.dataset.editable = name;
    el.innerHTML = html;
    container.appendChild(el);
    if (window.editContent && typeof window.editContent.refresh === 'function') {
      window.editContent.refresh();
    }
    return el;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      startAdminWatcher();
    });
  } else {
    init();
    startAdminWatcher();
  }

  window.editContent = {
    save(name, html){ 
      const el = document.querySelector(`[data-editable="${name}"]`);
      if (el) saveContent(el, html);
      else localStorage.setItem(storageKey(name), html);
    },
    load(name){ return localStorage.getItem(storageKey(name)); },
    refresh(){ init(); },
    add(name, html, container){ return addEditableContent(name, html, container); }
  };

  window.logoutCleanup = function() {
    removeAllEditButtons();
    window.isAdmin = () => false;
    lastAdminState = false;
    console.log('Admin session ended; edit controls removed');
  };

  // Example dynamic Add Content button hookup
  const addContentBtn = document.querySelector('#add-content-btn'); // replace with your button ID
  if(addContentBtn) {
    addContentBtn.addEventListener('click', () => {
      const timestamp = Date.now();
      const name = `dynamic_${timestamp}`;
      const defaultHtml = '<p>New editable content</p>';
      const newEl = addEditableContent(name, defaultHtml, document.querySelector('#main-content'));
      if(isAdminSafe()) {
        createModal(defaultHtml, newHtml => {
          saveContent(newEl, newHtml);
        });
      }
    });
  }

})();