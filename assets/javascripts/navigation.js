function updateFixedness() {
  const scrolledDown   = window.pageYOffset > 0;
  const mobileMenuOpen = document.getElementById('nav-trigger').checked;
  const body         = document.querySelector('body');

  if(scrolledDown || mobileMenuOpen) {
    body.classList.add("fixed");
  } else {
    body.classList.remove("fixed");
  }
}

window.addEventListener('scroll', updateFixedness);

window.addEventListener('load', function() {
  document.getElementById('nav-trigger')
          .addEventListener('change', updateFixedness);
});
