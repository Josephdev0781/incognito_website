if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
}

const toggle = document.querySelector('.theme-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  });
}

document.querySelectorAll('footer').forEach((footer) => {
  const walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
  const year = String(new Date().getFullYear());
  let node;
  while ((node = walker.nextNode())) {
    if (/©\s*\d{4}/.test(node.nodeValue)) {
      node.nodeValue = node.nodeValue.replace(/©\s*\d{4}/, `© ${year}`);
    }
  }
});
