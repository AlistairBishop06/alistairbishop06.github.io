// DOM REFS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const container        = document.getElementById('canvas-container');
const loadingEl        = document.getElementById('loading');
const loadingBar       = document.getElementById('loading-bar');
const overlayEl        = document.getElementById('overlay');
const enterBtn         = document.getElementById('enter-btn');
const bookInfoEl       = document.getElementById('book-info');
const bookInfoName     = document.getElementById('book-info-name');
const bookInfoDesc     = document.getElementById('book-info-desc');
const heldInfoEl       = document.getElementById('held-info');
const heldNameEl       = document.getElementById('held-name');
const heldActionTextEl = document.getElementById('held-action-text');
const deskPromptEl     = document.getElementById('desk-prompt');
const deskPromptTextEl = document.querySelector('#desk-prompt .desk-prompt-text');
const readmeBackdrop   = document.getElementById('readme-backdrop');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
