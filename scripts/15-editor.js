//  EDITOR SYSTEM  (only active with ?edit)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let editorSelectedObject = null; // the Three.js Group being dragged
let editorSelectedType   = null; // 'shelf' | 'desk' | prop key string
let editorSelectedShelf    = null; // shelf metadata when type === 'shelf'
let editorSelectedPropId   = null;
let editorSelectedPropKind = null;
let editorRmbLook          = false;
let editorDragPlane      = null; // THREE.Plane for mouse-world intersection
let editorDragOffset     = new THREE.Vector3();
let editorIsDragging     = false;
let editorDragGroundY    = 0;
const editorRaycaster    = new THREE.Raycaster();

function initEditor() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #editor-panel {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 280px;
      background: rgba(8,5,3,0.96);
      border-left: 1px solid rgba(232,213,163,0.12);
      display: flex;
      flex-direction: column;
      z-index: 200;
      font-family: 'Georgia', serif;
      color: #e8d5a3;
      overflow: hidden;
    }
    #editor-panel h2 {
      font-size: 0.75rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #a08050;
      padding: 18px 18px 0;
      margin-bottom: 14px;
    }
    #editor-panel .ed-section {
      padding: 0 18px 14px;
      border-bottom: 1px solid rgba(232,213,163,0.08);
      margin-bottom: 4px;
    }
    #editor-panel .ed-label {
      font-size: 0.62rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #6a5030;
      margin-bottom: 8px;
    }
    #editor-panel .ed-add-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 10px;
      margin-bottom: 5px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.15);
      border-radius: 3px;
      color: #c8a870;
      font-family: 'Georgia', serif;
      font-size: 0.8rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s, border-color 0.2s;
    }
    #editor-panel .ed-add-btn:hover { background: rgba(232,213,163,0.06); border-color: rgba(232,213,163,0.3); }
    #editor-panel .ed-add-btn .swatch { width:10px; height:20px; border-radius:2px; flex-shrink:0; }
    #editor-panel .ed-props { flex:1; overflow-y:auto; padding: 12px 18px; }
    #editor-panel .ed-hint {
      font-size: 0.72rem;
      color: #4a3820;
      text-align: center;
      padding: 30px 10px;
      line-height: 1.6;
    }
    #editor-panel .ed-prop-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #editor-panel .ed-prop-label {
      font-size: 0.75rem;
      color: #8a7050;
      min-width: 50px;
    }
    #editor-panel .ed-prop-input {
      width: 80px;
      padding: 4px 8px;
      background: rgba(232,213,163,0.05);
      border: 1px solid rgba(232,213,163,0.18);
      border-radius: 3px;
      color: #e8d5a3;
      font-family: 'Courier New', monospace;
      font-size: 0.78rem;
      text-align: right;
    }
    #editor-panel .ed-prop-input:focus { outline: none; border-color: rgba(232,213,163,0.45); }
    #editor-panel .ed-rot-row {
      display: flex; gap: 6px; margin-bottom: 10px;
    }
    #editor-panel .ed-rot-btn {
      flex: 1;
      padding: 5px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.18);
      border-radius: 3px;
      color: #c8a870;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'Georgia', serif;
    }
    #editor-panel .ed-rot-btn:hover { background: rgba(232,213,163,0.08); }
    #editor-panel .ed-delete-btn {
      width: 100%;
      padding: 7px;
      margin-top: 4px;
      background: transparent;
      border: 1px solid rgba(180,60,40,0.35);
      border-radius: 3px;
      color: #c05040;
      font-family: 'Georgia', serif;
      font-size: 0.75rem;
      cursor: pointer;
    }
    #editor-panel .ed-delete-btn:hover { background: rgba(180,60,40,0.1); }
    #editor-panel .ed-bottom {
      padding: 14px 18px;
      border-top: 1px solid rgba(232,213,163,0.08);
    }
    #editor-panel .ed-export-btn {
      width: 100%;
      padding: 10px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.35);
      border-radius: 3px;
      color: #e8d5a3;
      font-family: 'Georgia', serif;
      font-size: 0.82rem;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: background 0.2s;
    }
    #editor-panel .ed-export-btn:hover { background: rgba(232,213,163,0.08); }
    #editor-panel .ed-selected-name {
      font-size: 0.88rem;
      color: #e8d5a3;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(232,213,163,0.1);
    }
    #editor-badge {
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(200,150,30,0.18);
      border: 1px solid rgba(200,150,30,0.4);
      color: #e8d5a3;
      font-family: 'Georgia', serif;
      font-size: 0.72rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 6px 18px;
      z-index: 300;
      pointer-events: none;
    }
    body.edit-mode #canvas-container { right: 280px; }
    body.edit-mode canvas { cursor: crosshair !important; }
    body.edit-mode .ed-obj-selected { cursor: move !important; }
    #editor-panel .ed-decor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    #editor-panel .ed-decor-grid .ed-add-btn { margin-bottom: 0; font-size: 0.7rem; padding: 6px 8px; }
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  // Badge
  const badge = document.createElement('div');
  badge.id = 'editor-badge';
  badge.textContent = 'âœ¦ Editor â€” WASD walk Â· Space / Shift up-down Â· hold right-drag to look Â· click-drag to move';
  document.body.appendChild(badge);

  // Hide game UI that clutters the editor
  overlayEl.classList.add('hidden');

  // Panel
  const panel = document.createElement('div');
  panel.id = 'editor-panel';
  panel.innerHTML = `
    <h2>Library Editor</h2>

    <div class="ed-section">
      <div class="ed-label">Add furniture</div>
      <button class="ed-add-btn" id="ed-add-shelf">
        <div class="swatch" style="background:#4a2e10"></div>Shelf unit
      </button>
    </div>

    <div class="ed-section">
      <div class="ed-label">Place decor</div>
      <div class="ed-decor-grid">
        <button class="ed-add-btn" data-ed-prop="table"><div class="swatch" style="background:#4a2a0d"></div>Table</button>
        <button class="ed-add-btn" data-ed-prop="chair"><div class="swatch" style="background:#3d1a0a"></div>Chair</button>
        <button class="ed-add-btn" data-ed-prop="plant"><div class="swatch" style="background:#2d5a28"></div>Plant</button>
        <button class="ed-add-btn" data-ed-prop="rug"><div class="swatch" style="background:#7a3020"></div>Rug</button>
        <button class="ed-add-btn" data-ed-prop="globe"><div class="swatch" style="background:#1a4080"></div>Globe</button>
        <button class="ed-add-btn" data-ed-prop="light"><div class="swatch" style="background:#d8c8a0"></div>Light</button>
        <button class="ed-add-btn" data-ed-prop="candle"><div class="swatch" style="background:#e8d08a"></div>Candle</button>
        <button class="ed-add-btn" data-ed-prop="bookStack"><div class="swatch" style="background:#503070"></div>Book stack</button>
      </div>
    </div>

    <div class="ed-props" id="ed-props">
      <div class="ed-hint">Click furniture or decor to select.<br><br>Drag on the floor plane to move X/Z. Adjust Y in the panel.</div>
    </div>

    <div class="ed-bottom">
      <button class="ed-export-btn" id="ed-export-btn">Copy layout.json â†—</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('ed-add-shelf').addEventListener('click', () => editorAddShelf());
  panel.querySelectorAll('[data-ed-prop]').forEach(btn => {
    btn.addEventListener('click', () => editorAddProp(btn.getAttribute('data-ed-prop')));
  });
  document.getElementById('ed-export-btn').addEventListener('click', editorCopyJSON);

  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  renderer.domElement.addEventListener('mousedown', e => {
    if (e.button === 2) editorRmbLook = true;
  });
  document.addEventListener('mouseup', e => {
    if (e.button === 2) editorRmbLook = false;
  });
  document.addEventListener('mousemove', e => {
    if (!editorRmbLook) return;
    yawObj.rotation.y -= e.movementX * 0.002;
    pitchObj.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchObj.rotation.x - e.movementY * 0.002));
  });

  // Mouse events on the canvas
  renderer.domElement.addEventListener('mousedown', editorOnMouseDown);
  renderer.domElement.addEventListener('mousemove', editorOnMouseMove);
  renderer.domElement.addEventListener('mouseup',   editorOnMouseUp);

  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  // Position camera above for a better editorial view
  yawObj.position.set(0, PLAYER_HEIGHT, 14);
  editorUpdateShelfNumbers();
}

// â”€â”€â”€ editor helpers â”€â”€â”€

function editorGetMouseNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1
  );
}

function editorUpdateShelfNumbers() {
  shelfGroups.forEach((sg, index) => {
    const orderNum = index + 1;
    let sprite = sg.group.children.find(c => c.userData.isOrderLabel);
    
    // If the sprite exists but has the wrong number (e.g., after a deletion), remove it
    if (sprite && sprite.userData.orderNum !== orderNum) {
      sg.group.remove(sprite);
      sprite.material.map.dispose();
      sprite.material.dispose();
      sprite = null;
    }

    // Create a new sprite if needed
    if (!sprite) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Draw background circle
      ctx.fillStyle = 'rgba(232, 213, 163, 0.9)'; // Matches editor UI theme
      ctx.beginPath();
      ctx.arc(64, 64, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#1a1005';
      ctx.font = 'bold 50px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orderNum.toString(), 64, 64);
      
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false }); // depthTest: false makes it visible through walls
      sprite = new THREE.Sprite(mat);
      
      sprite.scale.set(1.2, 1.2, 1);
      // Position it dynamically based on your shelf height constants
      sprite.position.set(0, SHELF_ROWS * SHELF_SPACING + 1.2, 0);
      sprite.userData = { isOrderLabel: true, orderNum };
      sprite.renderOrder = 999; 
      
      sg.group.add(sprite);
    }
  });
}

function editorPickObject(e) {
  const ndc = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);

  // Collect all selectable meshes
  const candidates = [];
  shelfGroups.forEach(sg => sg.group.traverse(c => { if (c.isMesh) candidates.push(c); }));
  if (deskGroup) deskGroup.traverse(c => { if (c.isMesh) candidates.push(c); });
  propInstances.forEach(({ group: pg }) => {
    if (pg.traverse) pg.traverse(c => { if (c.isMesh) candidates.push(c); });
    else if (pg.isMesh) candidates.push(pg);
  });

  const hits = editorRaycaster.intersectObjects(candidates, false);
  if (!hits.length) return null;

  const hit = hits[0].object;

  // Walk up to find the owning group
  if (hit.userData.shelfGroup) {
    const sg = shelfGroups.find(s => s.group === hit.userData.shelfGroup);
    return { group: hit.userData.shelfGroup, type: 'shelf', shelfData: sg };
  }
  if (hit.userData.deskGroup) {
    return { group: hit.userData.deskGroup, type: 'desk' };
  }
  if (hit.userData.propGroup) {
    const g = hit.userData.propGroup;
    return {
      group: g,
      type: 'prop',
      propKind: g.userData.propKind || g.userData.propKey || 'prop',
      propId: g.userData.propId,
    };
  }
  if (hit.userData.isPropGroup) {
    return {
      group: hit,
      type: 'prop',
      propKind: hit.userData.propKind || hit.userData.propKey || 'prop',
      propId: hit.userData.propId,
    };
  }
  return null;
}

function editorHighlight(group, on) {
  group.traverse(child => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => { if (m.emissive) m.emissive.setScalar(on ? 0.12 : 0); });
      } else {
        if (child.material.emissive) child.material.emissive.setScalar(on ? 0.12 : 0);
      }
    }
  });
}

function editorSelect(picked) {
  if (editorSelectedObject) editorHighlight(editorSelectedObject, false);
  editorSelectedObject = picked ? picked.group : null;
  editorSelectedType   = picked ? picked.type  : null;
  editorSelectedShelf  = picked ? picked.shelfData : null;
  editorSelectedPropId   = picked && picked.type === 'prop' ? picked.propId : null;
  editorSelectedPropKind = picked && picked.type === 'prop' ? picked.propKind : null;
  if (editorSelectedObject) editorHighlight(editorSelectedObject, true);
  editorRenderProps();
}

function editorRenderProps() {
  const el = document.getElementById('ed-props');
  if (!editorSelectedObject) {
    el.innerHTML = '<div class="ed-hint">Click furniture or decor to select.<br><br>Drag to move X/Z. Set Y in the panel Â· rotate with buttons.</div>';
    return;
  }

  const p = editorSelectedObject.position;
  const rDeg = Math.round((editorSelectedObject.rotation.y * 180 / Math.PI) % 360);
  const title = editorSelectedType === 'prop'
    ? `${editorSelectedPropKind} Â· ${editorSelectedPropId}`
    : editorSelectedType;

  el.innerHTML = `
    <div class="ed-selected-name">${title}</div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">X</span>
      <input class="ed-prop-input" id="ed-px" type="number" step="0.05" value="${p.x.toFixed(2)}" />
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Z</span>
      <input class="ed-prop-input" id="ed-pz" type="number" step="0.05" value="${p.z.toFixed(2)}" />
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Y</span>
      <input class="ed-prop-input" id="ed-py" type="number" step="0.05" value="${p.y.toFixed(2)}" />
    </div>
    <div class="ed-label" style="margin-top:8px;margin-bottom:6px;">Rotation</div>
    <div class="ed-rot-row">
      <button class="ed-rot-btn" id="ed-rot-l">â†º 90Â°</button>
      <button class="ed-rot-btn" id="ed-rot-r">â†» 90Â°</button>
      <button class="ed-rot-btn" id="ed-rot-flip">180Â°</button>
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Angle</span>
      <input class="ed-prop-input" id="ed-rot-deg" type="number" step="5" value="${rDeg}" />
    </div>
    ${editorSelectedType === 'shelf' ? `<button class="ed-delete-btn" id="ed-delete-btn">Remove shelf</button>` : ''}
    ${editorSelectedType === 'prop' ? `<button class="ed-delete-btn" id="ed-delete-prop-btn">Remove this decor</button>` : ''}
  `;

  document.getElementById('ed-px').addEventListener('change', e => {
    editorSelectedObject.position.x = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-pz').addEventListener('change', e => {
    editorSelectedObject.position.z = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-py').addEventListener('change', e => {
    editorSelectedObject.position.y = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-rot-l').addEventListener('click', () => editorRotate(-Math.PI/2));
  document.getElementById('ed-rot-r').addEventListener('click', () => editorRotate( Math.PI/2));
  document.getElementById('ed-rot-flip').addEventListener('click', () => editorRotate(Math.PI));
  document.getElementById('ed-rot-deg').addEventListener('change', e => {
    editorSelectedObject.rotation.y = parseFloat(e.target.value) * Math.PI / 180;
    editorSyncShelfSlots();
    editorRenderProps();
  });
  const delBtn = document.getElementById('ed-delete-btn');
  if (delBtn) delBtn.addEventListener('click', editorDeleteSelected);
  const delPropBtn = document.getElementById('ed-delete-prop-btn');
  if (delPropBtn) delPropBtn.addEventListener('click', editorDeleteSelectedProp);
}

function editorRotate(delta) {
  if (!editorSelectedObject) return;
  editorSelectedObject.rotation.y += delta;
  editorSyncShelfSlots();
  editorRenderProps();
}

// After moving/rotating a shelf, recompute its world-space slot positions
function editorSyncShelfSlots() {
  if (editorSelectedType !== 'shelf' || !editorSelectedShelf) return;

  const group    = editorSelectedObject;
  const sd       = editorSelectedShelf;
  const unitW    = 3.0;
  const baseH    = 0.2;

  group.updateWorldMatrix(true, true);

  sd.slotIndices.forEach((slotIdx, i) => {
    const row  = Math.floor(i / BOOKS_PER_SHELF);
    const col  = i % BOOKS_PER_SHELF;
    const shelfY     = baseH + 0.45 + row * SHELF_SPACING;
    const slotStartX = -unitW / 2 + 0.2;
    const slotWidth  = (unitW - 0.4) / BOOKS_PER_SHELF;

    const localPos = new THREE.Vector3(
      slotStartX + col * slotWidth + slotWidth / 2,
      shelfY + SHELF_H / 2 + 0.001,
      0
    );
    const worldPos = localPos.clone().applyMatrix4(group.matrixWorld);
    shelfSlots[slotIdx].position.copy(worldPos);
    shelfSlots[slotIdx].rotY = group.rotation.y;
  });

  // Also reposition any books already placed on this shelf
  books.forEach(b => {
    if (!b.isHeld && sd.slotIndices.includes(b.slotIndex)) {
      const slot = shelfSlots[b.slotIndex];
      b.mesh.position.copy(slot.position);
      b.mesh.position.y += b.mesh.userData.bookHeight / 2;
      b.mesh.rotation.y  = slot.rotY;
      b.originalPosition.copy(b.mesh.position);
      b.originalRotation.copy(b.mesh.rotation);
    }
  });
}

function editorAddShelf() {
  addShelfUnit(0, 0, 0);
  editorSelect({ group: shelfGroups[shelfGroups.length - 1].group, type: 'shelf', shelfData: shelfGroups[shelfGroups.length - 1] });
  editorUpdateShelfNumbers();
}

function editorGatherPropsConfig() {
  return propInstances.map(({ id, group: g }) => ({
    id,
    kind: g.userData.propKind,
    x: g.position.x,
    z: g.position.z,
    y: g.position.y,
    rotY: g.rotation ? g.rotation.y : 0,
  }));
}

function editorAddProp(kind) {
  if (!PROP_DEFAULTS[kind]) return;
  const list = editorGatherPropsConfig();
  list.push({
    kind,
    x: 0,
    z: 0,
    y: PROP_DEFAULTS[kind].y,
    rotY: 0,
  });
  buildProps(list);
  editorSelect(null);
}

function editorDeleteSelectedProp() {
  if (!editorSelectedPropId) return;
  const idx = propInstances.findIndex(p => p.id === editorSelectedPropId);
  if (idx < 0) return;
  scene.remove(propInstances[idx].group);
  propInstances.splice(idx, 1);
  editorSelect(null);
}

function editorDeleteSelected() {
  if (!editorSelectedObject || editorSelectedType !== 'shelf') return;
  const sd = editorSelectedShelf;
  // Remove books on this shelf
  sd.slotIndices.forEach(si => {
    const bi = books.findIndex(b => b.slotIndex === si);
    if (bi >= 0) { scene.remove(books[bi].mesh); books.splice(bi, 1); }
  });
  // Free the slots
  sd.slotIndices.forEach(si => { shelfSlots[si] = null; });
  // Remove from scene + arrays
  scene.remove(editorSelectedObject);
  const idx = shelfGroups.findIndex(s => s.group === editorSelectedObject);
  if (idx >= 0) shelfGroups.splice(idx, 1);
  editorSelect(null);
  editorUpdateShelfNumbers();
}

// Mouse drag in world space on the ground plane
function editorOnMouseDown(e) {
  if (e.button !== 0) return;
  const picked = editorPickObject(e);
  if (!picked) { editorSelect(null); return; }
  editorSelect(picked);

  editorDragGroundY = editorSelectedObject.position.y;
  editorDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -editorDragGroundY);
  const ndc  = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);
  const pt   = new THREE.Vector3();
  editorRaycaster.ray.intersectPlane(editorDragPlane, pt);
  editorDragOffset.copy(pt).sub(editorSelectedObject.position);
  editorIsDragging = true;
}

function editorOnMouseMove(e) {
  if (!editorIsDragging || !editorSelectedObject || !editorDragPlane) return;

  const ndc = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);
  const pt = new THREE.Vector3();
  editorRaycaster.ray.intersectPlane(editorDragPlane, pt);

  editorSelectedObject.position.x = snapEditorAxis(pt.x - editorDragOffset.x);
  editorSelectedObject.position.z = snapEditorAxis(pt.z - editorDragOffset.z);
  editorSelectedObject.position.y = editorDragGroundY;

  editorSyncShelfSlots();
  editorRenderProps();
}

function editorOnMouseUp(e) {
  editorIsDragging = false;
}

// Build JSON representation of current layout
function editorBuildJSON() {
  const shelves = shelfGroups.map(sg => ({
    x:    parseFloat(sg.group.position.x.toFixed(2)),
    z:    parseFloat(sg.group.position.z.toFixed(2)),
    rotY: parseFloat(sg.group.rotation.y.toFixed(4)),
  }));

  const desk = deskGroup
    ? { x: parseFloat(deskGroup.position.x.toFixed(2)), z: parseFloat(deskGroup.position.z.toFixed(2)) }
    : { x: 0, z: 6 };

  const props = editorGatherPropsConfig().map(entry => ({
    id:   entry.id,
    kind: entry.kind,
    x:    parseFloat(entry.x.toFixed(2)),
    z:    parseFloat(entry.z.toFixed(2)),
    y:    parseFloat(entry.y.toFixed(2)),
    rotY: parseFloat(entry.rotY.toFixed(4)),
  }));

  return JSON.stringify({ shelves, desk, props }, null, 2);
}

function editorCopyJSON() {
  const json = editorBuildJSON();
  navigator.clipboard.writeText(json).then(() => {
    const btn = document.getElementById('ed-export-btn');
    btn.textContent = 'Copied! Paste into layout.json';
    setTimeout(() => { btn.textContent = 'Copy layout.json â†—'; }, 2500);
  }).catch(() => {
    // Fallback: show in a textarea
    const ta = document.createElement('textarea');
    ta.style.cssText = 'position:fixed;top:20px;left:20px;width:calc(100%-320px);height:200px;z-index:999;background:#1a1005;color:#e8d5a3;font-family:monospace;font-size:12px;border:1px solid #a08050;padding:10px;';
    ta.value = json;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    setTimeout(() => document.body.removeChild(ta), 3000);
  });
}

// editor update tick â€” camera movement
function editorTick() {
  // Free-look WASD in edit mode (no pointer lock needed)
  // handled by updateMovement already
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INIT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function init() {
  buildRoom();

  // Load layout.json (falls back to defaults if missing)
  const layout = await loadLayout();
  buildFromLayout(layout);

  await fetchAndBuildBooks(p => {
    loadingBar.style.width = (p * 100).toFixed(0) + '%';
  });

  loadingEl.classList.add('hidden');

  if (EDIT_MODE) {
    // Editor mode â€” no overlay, free camera, panel
    initEditor();
    clock.start();
    animate();
    return;
  }

  enterBtn.addEventListener('click', () => {
    overlayEl.classList.add('hidden');
    renderer.domElement.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) pointerLocked = false;
  });

  setupControls();
  animate();
}

init();
