function updateFixedness() {
  var scrolledDown   = window.pageYOffset > 0;
  var mobileMenuOpen = document.getElementById('nav-trigger').checked;
  const header       = document.getElementById("site-header");

  if (!header) {return;}

  if(scrolledDown || mobileMenuOpen) {
    header.classList.add("fixed");
  } else {
    header.classList.remove("fixed");
  }
}

window.addEventListener('scroll', updateFixedness);

window.addEventListener('load', function() {
  document.getElementById('nav-trigger')
          .addEventListener('change', updateFixedness);
});
