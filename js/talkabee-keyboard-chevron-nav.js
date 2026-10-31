/* Talk A Bee: follow existing chevron links with Left / Right arrow keys. */
(function () {
  'use strict';
  if (window.__tbKeyboardChevronNavInstalled) return;
  window.__tbKeyboardChevronNavInstalled = true;
  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.isComposing) return;
    var target = event.target;
    if (target && target.closest && target.closest('input, textarea, select, option, [contenteditable], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="listbox"], [role="menu"], [role="dialog"]')) return;
    if (document.body.classList.contains('tb-hs-editing') || document.body.classList.contains('tb-overlay-editing')) return;
    var studio = document.getElementById('tb-studio');
    if (studio && studio.getClientRects().length && getComputedStyle(studio).visibility !== 'hidden') return;
    var overlayEditor = document.querySelector('#tb-overlay-editor, #tb-legacy-challenge-panel.open, #tb-challenge-editor.open');
    if (overlayEditor && overlayEditor.getClientRects().length) return;
    var nav = document.querySelector('nav.talkabee-prev-next-nav');
    if (!nav) return;
    var link = nav.querySelector(event.key === 'ArrowLeft' ? 'a[aria-label*="Previous"], a[title="Previous"]' : 'a[aria-label*="Next"], a[title="Next"]');
    if (!link || !link.getAttribute('href')) return;
    event.preventDefault();
    window.location.assign(link.href);
  });
})();
