/* =========================================================
   Hero: a voxel level blockout that slowly turns.
   Deliberately low-res — no antialiasing, pixelRatio pinned
   to 1 — so the edges stay chunky like the rest of the page.
   Degrades to the flat grid background if WebGL or the
   three.js CDN is unavailable.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("stage");
  if (!canvas || typeof THREE === "undefined") return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NEON = [0x2de2e6, 0xff2fb9, 0x9dfc4a, 0xffc857];

  var scene, camera, renderer, world;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
  } catch (e) {
    return; // no WebGL — the CSS grid behind the canvas carries the hero
  }
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05030f, 0.035);

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(14, 12, 16);
  camera.lookAt(0, 1.4, 0);

  world = new THREE.Group();
  scene.add(world);

  var grid = new THREE.GridHelper(30, 15, 0x2b1f5c, 0x1a1340);
  grid.position.y = -0.02;
  world.add(grid);

  // [x, z, width, height, depth] — a plaza, flanking towers, ramps and cover
  var layout = [
    [0, 0, 8, 0.5, 8],
    [-5, -5, 3, 3.2, 3], [5, -5, 3, 4.6, 3],
    [-5, 5, 3, 2.2, 3], [5, 5, 3, 3.6, 3],
    [0, -7.5, 5, 1.2, 2], [0, 7.5, 5, 1.8, 2],
    [-8, 0, 2, 5.4, 6], [8, 0, 2, 2.6, 6],
    [-2, -2, 1.2, 1.2, 1.2], [2, 2, 1.2, 1.6, 1.2], [2.4, -1.6, 1, 0.9, 2.4],
    [-9, -9, 2, 6.5, 2], [9, 9, 2, 5.2, 2]
  ];

  layout.forEach(function (b, i) {
    var geo = new THREE.BoxGeometry(b[2], b[3], b[4]);
    var fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x120d2e, transparent: true, opacity: 0.92
    }));
    fill.position.set(b[0], b[3] / 2, b[1]);

    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0.9 })
    );
    edges.position.copy(fill.position);

    world.add(fill, edges);
  });

  // player-path markers hovering over the blockout
  var markers = [];
  [[-5, -5], [0, 0], [5, -5], [5, 5], [0, 7.5]].forEach(function (p, i) {
    var m = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffc857 : 0x9dfc4a })
    );
    m.position.set(p[0], 5.6 + i * 0.35, p[1]);
    m.userData.base = m.position.y;
    m.userData.off = i * 0.8;
    world.add(m);
    markers.push(m);
  });

  var pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  window.addEventListener("pointermove", function (e) {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    // pull the camera back on narrow screens so the level still fits
    camera.fov = w < 640 ? 52 : 38;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  resize();

  var running = true;
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) frame();
  });

  var t = 0, queued = false;
  function frame() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (!running) return;
      if (!reduced) t += 0.006;

      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;

      world.rotation.y = t + pointer.x * 0.28;
      world.rotation.x = -0.02 + pointer.y * 0.06;

      markers.forEach(function (m) {
        m.position.y = m.userData.base + Math.sin(t * 4 + m.userData.off) * 0.28;
        m.rotation.y = t * 2;
      });

      renderer.render(scene, camera);
      frame();
    });
  }
  frame();
})();
