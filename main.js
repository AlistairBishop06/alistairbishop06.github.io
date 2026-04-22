/**
 * Entry loader.
 * The project source is split across `scripts/` for readability.
 */

(function loadArchiveScripts() {
  const sources = [
    'scripts/00-config.js',
    'scripts/01-dom.js',
    'scripts/02-scene.js',
    'scripts/03-room.js',
    'scripts/04-shelves.js',
    'scripts/04-cassetteShelves.js',
    'scripts/05-world.js',
    'scripts/06-books.js',
    'scripts/06-cassettes.js',
    'scripts/07-player.js',
    'scripts/08-bookTilt.js',
    'scripts/09-heldBook.js',
    'scripts/09-heldCassette.js',
    'scripts/10-openBook.js',
    'scripts/11-readme.js',
    'scripts/12-checkout.js',
    'scripts/13-repos.js',
    'scripts/14-render.js',
    'scripts/16-audio.js',
    'scripts/15-editor.js',
  ];

  let chain = Promise.resolve();
  for (const src of sources) {
    chain = chain.then(() => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(el);
    }));
  }

  chain.catch(err => console.error(err));
})();
