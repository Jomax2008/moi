/* main.js — branche les clics et démarre l'application */
(function () {
  'use strict';
  const JA = window.JA, A = JA.app;

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = A.acts[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.bind) A.onInput(t);
  });

  // Dans un navigateur (tests) : même verrouillage au retour que dans l'appli
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt) { window.__fg(Date.now() - hiddenAt); hiddenAt = 0; }
  });

  const s = A.state;
  JA.applyTheme(s.profile.theme, s.profile.age);
  A.safe(() => { if (A.NA && s.settings.secure) A.NA.setSecure(true); });
  A.render();
  if (!s.onboarded) A.openOnboarding();
  else {
    A.syncAll();
    if (s.settings.pin) A.lockApp();
  }
})();
