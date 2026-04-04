// RENDER LOOP
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  frameCount++;

  updateMovement(dt);
  updateHeldBook(dt);
  updateBookTilts(dt);
  updateFlip(dt);

  if (frameCount % 2 === 0 && !bookOpen && !EDIT_MODE) updateRaycast();
  updateDeskProximity();

  propInstances.forEach(({ group }) => {
    if (group.userData.propKind !== 'candle') return;
    group.traverse(child => {
      if (child.isPointLight && child.userData.candleFlame) {
        child.intensity = 1.3 + Math.sin(frameCount * 0.18) * 0.2 + Math.random() * 0.1;
      }
    });
  });

  if (EDIT_MODE) editorTick();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
