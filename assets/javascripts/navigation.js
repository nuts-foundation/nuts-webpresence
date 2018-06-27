function stickyNavigation() {
  var header = document.getElementById("js-nav");
  var headerHeight = header.offsetHeight;

  if (window.pageYOffset > headerHeight) {
    header.classList.add("fixed");
  } else {
    header.classList.remove("fixed");
  }
}

// When the user scrolls the page, execute myFunction
window.onscroll = function() { stickyNavigation() };
