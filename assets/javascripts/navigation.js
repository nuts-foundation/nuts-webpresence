window.addEventListener('scroll', function() {
  var header = document.getElementById("site-header");
  if (!header) {return;}

  if (window.pageYOffset > 0) {
    header.classList.add("fixed");
  } else {
    header.classList.remove("fixed");
  }
});
