// Offline shell behavior. Loaded as an external script so the page can enforce
// a strict Content-Security-Policy (script-src 'self', no inline handlers).

(function () {
  'use strict';

  var retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      window.location.reload();
    });
  }

  // Auto-reload when the connection is restored.
  window.addEventListener('online', function () {
    window.location.reload();
  });
})();
