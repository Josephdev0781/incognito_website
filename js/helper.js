const toggle = document.querySelector('.theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});
window.onload = () => {
  if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
};
