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
  if (window.AudioFX) window.AudioFX.tick(dt);

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

  // Real-time clock hands (local time)
  propInstances.forEach(({ group }) => {
    if (group.userData.propKind !== 'clock') return;
    const hands = group.userData.clockHands;
    if (!hands) return;

    const d = new Date();
    const ms = d.getMilliseconds();
    const s = d.getSeconds() + ms / 1000;
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;

    const secA = (s / 60) * Math.PI * 2;
    const minA = (m / 60) * Math.PI * 2;
    const hourA = (h / 12) * Math.PI * 2;

    if (hands.secondHand) hands.secondHand.rotation.z = -secA;
    if (hands.minuteHand) hands.minuteHand.rotation.z = -minA;
    if (hands.hourHand) hands.hourHand.rotation.z = -hourA;
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
