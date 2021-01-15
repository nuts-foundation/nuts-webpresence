window.addEventListener('click', evnt => {
  if ( evnt.target.closest('section.popup div.close') !== null ||
       evnt.target.matches('div.overlay') )
    doClosePopups();
});

window.addEventListener('hashchange', (e) => handleNavigationEvent(e));
window.addEventListener('load',       (e) => handleNavigationEvent(e));

function handleNavigationEvent() {
  let hash = window.location.hash
  if (hash.startsWith('#')) hash = hash.substr(1);

  if (hash)
    openPopup(hash);
  else
    closePopups();
}

function doClosePopups() {
  window.location.hash = '';
}

function closePopups() {
  const popup = document.querySelectorAll(`section.popup`);
  const overlay = document.querySelector('div.overlay');
  if ( !popup || !overlay ) return;
  overlay.classList.remove('active');
  setTimeout(() => popup.forEach(p => p.classList.remove('active')), 200);

  // Pause YouTube video
  const ytvideo = document.querySelector('iframe#explainer-frame');
  ytvideo.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
}

function openPopup(popup) {
  popup = document.querySelector(`section.popup#${popup}`);
  const overlay = document.querySelector('div.overlay');
  if ( !popup || !overlay ) return;
  overlay.classList.add('active');
  popup.classList.add('active');
}
