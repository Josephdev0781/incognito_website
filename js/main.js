// Enhanced Navigation and Interactions
document.addEventListener("DOMContentLoaded", async () => {
  // Navbar functionality (guard elements in case pages differ)
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links") || document.querySelector('.nav-links');
  const navbar = document.querySelector(".navbar");

  if (menuToggle && navLinks) {
    // Toggle menu with animation
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show");
      menuToggle.classList.toggle("active");
    });
  }

  // Build grouped navigation (centralized rendering)
  try {
    if (!navLinks) {
      return;
    } else {
      // Avoid depending on auth.js load order by reading auth_user directly
      const loggedIn = window.getCurrentUser ? !!(await window.getCurrentUser()) : false;

    // Render grouped navigation (always) so links are consistently grouped for both anonymous and logged-in users
    const groupedHTML = `
      <li><a href="index.html">Home</a></li>
      <li class="nav-group">
        <button class="group-btn" type="button">Explore</button>
        <ul class="group-menu">
          <li><a href="2.guides.html">Guides</a></li>
          <li><a href="videos.html">Videos</a></li>
          <li><a href="predictions.html">Predictions</a></li>
        </ul>
      </li>
      <li class="nav-group">
        <button class="group-btn" type="button">Services</button>
        <ul class="group-menu">
          <li><a href="services.html">Services</a></li>
          <li><a href="cybersecurity.html">Ethical Hacking and Cyber Security</a></li>
        </ul>
      </li>
      <li class="nav-group">
        <button class="group-btn" type="button">Tools</button>
        <ul class="group-menu">
          <li><a href="tools.html">Tools and Softwares</a></li>
        </ul>
      </li>
      <li><a href="contact.html">Contact</a></li>
    `;

    // Overwrite the nav with the grouped structure so grouping is consistent
    navLinks.innerHTML = groupedHTML;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.querySelectorAll('a[href]').forEach(link => {
      const targetPage = link.getAttribute('href').split('/').pop();
      if (targetPage === currentPage) {
        link.classList.add('active');
        const parentGroup = link.closest('.nav-group');
        if (parentGroup) parentGroup.querySelector('.group-btn').classList.add('active');
      }
    });

    // add click toggles for touch devices (so menus can open on tap)
    navLinks.querySelectorAll('.group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parent = btn.closest('.nav-group');
        if(!parent) return;
        // close other open groups
        navLinks.querySelectorAll('.nav-group').forEach(g=>{ if(g!==parent) g.classList.remove('open'); });
        parent.classList.toggle('open');
      });
    });

    if (loggedIn) {
      // remove any login/register links if present
      const existingAuth = navLinks.querySelector('.auth-links');
      if (existingAuth) existingAuth.remove();

      // ensure logout link exists (no email shown)
      if (!navLinks.querySelector('#nav-logout')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="login.html" id="nav-logout">Logout</a>`;
        navLinks.appendChild(li);
        const logout = document.getElementById('nav-logout');
        if (logout) logout.addEventListener('click', (e)=>{ e.preventDefault(); if(window.handleLogout) window.handleLogout(); });
      }
    } else {
      // anonymous users: append auth links on the right
      if (!navLinks.querySelector('.auth-links')) {
        const authLi = document.createElement('li');
        authLi.className = 'auth-links';
        authLi.innerHTML = '<a class="nav-action" href="login.html">Login</a><a class="nav-action nav-action-primary" href="register.html">Register</a>';
        navLinks.appendChild(authLi);
      }
    }
    }
  } catch(err){ console.warn('nav render error', err); }

  // Fallback: ensure Login/Register are visible for anonymous users if they were removed
  try {
    if (navLinks) {
      const loggedIn = window.isLoggedIn ? window.isLoggedIn() : false;
      const hasAuth = !!navLinks.querySelector('.auth-links');
      if (!loggedIn && !hasAuth) {
        const authLi = document.createElement('li');
        authLi.className = 'auth-links';
        authLi.innerHTML = '<a class="nav-action" href="login.html">Login</a><a class="nav-action nav-action-primary" href="register.html">Register</a>';
        // place auth links at the end
        navLinks.appendChild(authLi);
      }
      // If logged in, remove auth-links and ensure a Logout button exists (do not remove other links)
      if (loggedIn) {
        const existingAuth = navLinks.querySelector('.auth-links');
        if (existingAuth) existingAuth.remove();
        if (!navLinks.querySelector('#nav-logout')) {
          const li = document.createElement('li');
          li.innerHTML = `<a href="login.html" id="nav-logout">Logout</a>`;
          navLinks.appendChild(li);
          const logout = document.getElementById('nav-logout');
          if (logout) logout.addEventListener('click', (e)=>{ e.preventDefault(); if(window.handleLogout) window.handleLogout(); });
        }
      }
    }
  } catch(e){ console.warn('nav fallback error', e); }

  // Navbar scroll effect
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    if (!navbar) return;
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
      navbar.classList.remove("scroll-up");
      return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains("scroll-down")) {
      navbar.classList.remove("scroll-up");
      navbar.classList.add("scroll-down");
    } else if (currentScroll < lastScroll && navbar.classList.contains("scroll-down")) {
      navbar.classList.remove("scroll-down");
      navbar.classList.add("scroll-up");
    }
    lastScroll = currentScroll;
  });

  // Smooth scroll for anchor links (guard target existence)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if(!target) return; // allow normal behavior if anchor target missing
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Add 3D tilt effect to cards (if present)
  const cards = document.querySelectorAll('.guide-card, .service-card, .video-card, .card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
  });

  function handleTilt(e) {
    const card = this;
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const angleX = (e.clientY - cardCenterY) * 0.03;
    const angleY = (cardCenterX - e.clientX) * 0.03;
    
    card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateZ(10px)`;
  }

  function resetTilt() {
    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
  }

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach((element) => {
    observer.observe(element);
  });

  // Theme toggle (in-DOMContentLoaded to ensure body exists)
  let themeToggle = document.querySelector('.theme-toggle');
  if(!themeToggle){
    themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.textContent = 'Dark';
    document.body.appendChild(themeToggle);
  }
  if(themeToggle){
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      themeToggle.textContent = document.body.classList.contains('dark-theme') ? 'Light' : 'Dark';
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
  }

  // Apply saved theme
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if(themeToggle) themeToggle.textContent = 'Light';
  }

  // Contact form handling (if present)
  const contactForm = document.querySelector('.contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const submitBtn = contactForm.querySelector('.submit-btn');
      const original = submitBtn.textContent;
      const data = new FormData(contactForm);
      const subject = encodeURIComponent(data.get('subject'));
      const body = encodeURIComponent(
        `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`
      );
      window.location.href = `mailto:mwaririjoseph81@gmail.com?subject=${subject}&body=${body}`;
      submitBtn.textContent = original;
      submitBtn.disabled = false;
    });
  }

  // Video thumbnail click to embed (if dataset video-id present)
  document.querySelectorAll('.video-thumbnail').forEach(thumbnail=>{
    const vid = thumbnail.dataset.videoId;
    thumbnail.addEventListener('click', function(){
      const id = this.dataset.videoId;
      if(!id) return; // nothing to do
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      this.innerHTML=''; this.appendChild(iframe);
    });
  });

  // Admin quick-button: bind to adminLogin/adminLogout and reload so editors appear
  try{
    const adminBtn = document.getElementById('admin-login-btn') || document.querySelector('.admin-btn');
    if(adminBtn){
      const updateText = ()=>{ if(window.isAdmin && window.isAdmin()) adminBtn.textContent = 'Admin (on)'; else adminBtn.textContent = 'Admin'; };
      updateText();
      adminBtn.addEventListener('click', ()=>{
        if(window.isAdmin && window.isAdmin()){
          if(window.adminLogout) window.adminLogout();
          updateText();
          location.reload();
        } else {
          if(window.adminLogin && window.adminLogin()){
            updateText();
            // reload so edit-content.js can append edit buttons in init
            location.reload();
          }
        }
      });
    }
  }catch(e){ console.warn('admin button init error', e); }
});
