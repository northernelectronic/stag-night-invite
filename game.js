/* Playfair Fun & Games: Stag Night invite (sample). Vanilla canvas, no third-party requests. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let config = {
    hostName: "The Best Man", groomName: "Dave", sample: true,
    landingLine: "The Best Man is sending you an invite. Pass the level to find out what it is!",
    landingSubline: "Fair warning: this level fights back.", howToPlay: [],
    eventName: "Dave's Stag Weekend", date: "", time: "", location: "", extraNote: "",
    rsvpEndpoint: "local", rsvpStorageKey: "playfair-stag-sample-rsvp",
    madeBy: "Playfair Fun & Games", tagline: "You're Invited to Play", failsBeforeAssist: 3, privacyNote: "",
  };
  const screens = {};
  ["loading", "landing", "howto", "game", "reveal"].forEach((n) => (screens[n] = $("screen-" + n)));

  /* ================= AUDIO ================= */
  let actx = null, master = null, muted = false, noiseBuf = null;
  function unlockAudio() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        master = actx.createGain(); master.gain.value = 0.55; master.connect(actx.destination);
        noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (actx.state === "suspended") actx.resume();
      const b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource();
      s.buffer = b; s.connect(master); s.start(0);
    } catch (e) {}
  }
  function tone(f, d, type, v, f2, delay) {
    if (!actx || muted) return;
    const t = actx.currentTime + (delay || 0);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(d, v, freq, q, delay, f2) {
    if (!actx || muted) return;
    const t = actx.currentTime + (delay || 0);
    const s = actx.createBufferSource(); s.buffer = noiseBuf;
    const f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(freq || 1000, t); f.Q.value = q || 1;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + d);
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
  }
  function burp(delay, len) {
    if (!actx || muted) return;
    const t = actx.currentTime + (delay || 0), L = len || 0.55;
    const o = actx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(105, t); o.frequency.linearRampToValueAtTime(78, t + L);
    const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 28; lg.gain.value = 22;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 6;
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    g.gain.setValueAtTime(0.3, t + L * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + L + 0.05); lfo.stop(t + L + 0.05);
  }
  const sfx = {
    tap: () => tone(660, 0.08, "triangle", 0.15, 880),
    throw: () => { noise(0.12, 0.12, 900, 1.5, 0, 2600); tone(320, 0.08, "triangle", 0.06, 520); },
    superThrow: () => { noise(0.16, 0.14, 600, 2, 0, 3000); tone(220, 0.16, "sawtooth", 0.07, 660); },
    hit: () => { tone(380, 0.14, "sine", 0.22, 140); noise(0.06, 0.12, 500, 2); },
    shoo: () => { [880, 1175, 1568].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, null, i * 0.06)); noise(0.3, 0.06, 5000, 1); },
    hurt: () => { tone(240, 0.18, "square", 0.08, 110); },
    grab: () => { tone(500, 0.25, "sine", 0.12, 760); },
    kiss: () => { tone(900, 0.12, "sine", 0.12, 520); },
    beer: () => { for (let i = 0; i < 4; i++) tone(190 - i * 12, 0.09, "sine", 0.25, 120, i * 0.13); burp(0.6, 0.5); },
    pill: () => { tone(400, 0.35, "sine", 0.18, 1400); [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.15, "triangle", 0.08, null, 0.25 + i * 0.07)); },
    empty: () => { tone(1400, 0.03, "square", 0.05); tone(900, 0.03, "square", 0.05, null, 0.08); },
    reload: () => { tone(700, 0.04, "square", 0.05); tone(1100, 0.05, "square", 0.05, null, 0.06); },
    ding: () => { tone(1319, 0.9, "sine", 0.18); tone(1047, 1.1, "sine", 0.16, null, 0.32); },
    door: () => noise(0.25, 0.05, 300, 1),
    caught: () => { [523, 440, 349, 262].forEach((f, i) => tone(f, 0.2, "triangle", 0.12, null, i * 0.14)); },
    blargh: () => { noise(0.7, 0.18, 300, 1.2, 0, 140); tone(160, 0.6, "sawtooth", 0.06, 70); },
    splash: () => noise(0.25, 0.12, 1800, 1),
  };

  /* ================= MAP ================= */
  const T = 48, MW = 23, MH = 27;
  const F = 0, W = 1, ICE = 2, CART = 3, PLANT = 4, ELEV = 5;
  const grid = new Uint8Array(MW * MH).fill(W);
  const carve = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * MW + x] = v || F; };
  carve(1, 2, 21, 4); carve(1, 2, 3, 14); carve(1, 12, 21, 14); carve(19, 12, 21, 24); carve(1, 22, 21, 24);
  carve(4, 8, 5, 9); carve(17, 17, 18, 18); carve(9, 25, 11, 25);
  carve(18, 1, 20, 1, ELEV);
  const put = (x, y, v) => (grid[y * MW + x] = v);
  put(5, 8, ICE); put(21, 12, ICE);
  put(8, 23, CART); put(15, 24, CART); put(21, 19, CART); put(12, 13, CART); put(6, 14, CART); put(1, 7, CART); put(9, 2, CART); put(13, 4, CART);
  put(17, 17, PLANT); put(21, 24, PLANT); put(1, 14, PLANT); put(1, 22, PLANT); put(21, 4, PLANT); put(3, 12, PLANT);
  const gAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH ? W : grid[y * MW + x]);
  let elevatorOpen = 0; // 0 closed .. 1 open (visual); passable when state.elevUnlocked
  function solidTile(x, y) {
    const v = gAt(x, y);
    if (v === F) return false;
    if (v === ELEV) return !(state && state.elevUnlocked && elevatorOpen > 0.7);
    return true;
  }
  const floorish = (x, y) => { const v = gAt(x, y); return v === F || v === ICE || v === CART || v === PLANT; };
  const doors = [];
  (function findDoors() {
    let n = 0;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (gAt(x, y) !== W) continue;
      let face = null, sx = 0, sy = 0;
      if (floorish(x, y + 1) && (x * 2 + y) % 3 === 0) { face = "S"; sx = x; sy = y + 1; }
      else if (floorish(x + 1, y) && y % 3 === 1) { face = "E"; sx = x + 1; sy = y; }
      else if (floorish(x - 1, y) && y % 3 === 1) { face = "W"; sx = x - 1; sy = y; }
      else if (floorish(x, y - 1) && x % 3 === 1) { face = "N"; sx = x; sy = y - 1; }
      if (!face || gAt(sx, sy) !== F) continue;
      doors.push({ x, y, face, sx: sx * T + T / 2, sy: sy * T + T / 2, num: 701 + n++, open: 0 });
    }
  })();

  let mapCanvas = null, mapScale = 0;
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function renderMap(scale) {
    if (mapCanvas && Math.abs(mapScale - scale) < 0.01) return;
    mapScale = scale;
    mapCanvas = document.createElement("canvas");
    mapCanvas.width = Math.ceil(MW * T * scale); mapCanvas.height = Math.ceil(MH * T * scale);
    const c = mapCanvas.getContext("2d");
    c.scale(scale, scale);
    c.fillStyle = "#1a0a12"; c.fillRect(0, 0, MW * T, MH * T);
    // carpet
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (!floorish(x, y)) continue;
      const px = x * T, py = y * T, cx = px + T / 2, cy = py + T / 2;
      c.fillStyle = (x + y) % 2 ? "#701632" : "#6a1430"; c.fillRect(px, py, T, T);
      c.strokeStyle = "rgba(214,168,72,.55)"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx, py + 3); c.lineTo(px + T - 3, cy); c.lineTo(cx, py + T - 3); c.lineTo(px + 3, cy); c.closePath(); c.stroke();
      c.fillStyle = "#1f3557"; c.beginPath(); c.moveTo(cx, cy - 9); c.lineTo(cx + 9, cy); c.lineTo(cx, cy + 9); c.lineTo(cx - 9, cy); c.closePath(); c.fill();
      c.fillStyle = "#d9ac4b"; c.beginPath(); c.arc(cx, cy, 3, 0, 7); c.fill();
      [[px, py], [px + T, py], [px, py + T], [px + T, py + T]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 2.5, 0, 7); c.fill(); });
    }
    // carpet border along walls
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (!floorish(x, y)) continue;
      const px = x * T, py = y * T;
      const edge = (dx, dy, fx, fy, fw, fh, lx1, ly1, lx2, ly2) => {
        if (gAt(x + dx, y + dy) === W) {
          c.fillStyle = "#2b0f22"; c.fillRect(fx, fy, fw, fh);
          c.strokeStyle = "#d9ac4b"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx1, ly1); c.lineTo(lx2, ly2); c.stroke();
        }
      };
      edge(0, -1, px, py, T, 7, px, py + 8.5, px + T, py + 8.5);
      edge(0, 1, px, py + T - 7, T, 7, px, py + T - 8.5, px + T, py + T - 8.5);
      edge(-1, 0, px, py, 7, T, px + 8.5, py, px + 8.5, py + T);
      edge(1, 0, px + T - 7, py, 7, T, px + T - 8.5, py, px + T - 8.5, py + T);
    }
    // walls
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (gAt(x, y) !== W) continue;
      const px = x * T, py = y * T;
      c.fillStyle = "#24121f"; c.fillRect(px, py, T, T);
      c.fillStyle = "#33192c"; c.fillRect(px + 2, py + 2, T - 4, T - 4);
      const south = floorish(x, y + 1) || gAt(x, y + 1) === ELEV;
      if (south) {
        const fy = py + 12;
        c.fillStyle = "#ecdcb9"; c.fillRect(px, fy, T, T - 12);
        c.fillStyle = "#dcc596"; for (let i = 0; i < T; i += 8) c.fillRect(px + i + 2, fy, 3, T - 12);
        c.fillStyle = "#7b5532"; c.fillRect(px, fy, T, 3);
        c.fillStyle = "#5a3922"; c.fillRect(px, py + T - 11, T, 11);
        c.fillStyle = "#8a6038"; c.fillRect(px, py + T - 11, T, 2);
      }
      if (floorish(x + 1, y) && !south) { c.fillStyle = "#5a3922"; c.fillRect(px + T - 5, py, 5, T); }
      if (floorish(x - 1, y) && !south) { c.fillStyle = "#5a3922"; c.fillRect(px, py, 5, T); }
      if (floorish(x, y - 1)) { c.fillStyle = "#5a3922"; c.fillRect(px, py, T, 5); }
    }
    // doors
    c.textAlign = "center"; c.textBaseline = "middle";
    doors.forEach((d) => {
      const px = d.x * T, py = d.y * T;
      c.lineWidth = 2; c.strokeStyle = "#2e1a0c";
      if (d.face === "S") {
        rr(c, px + 9, py + 16, 30, 32, 3); c.fillStyle = "#8a5530"; c.fill(); c.stroke();
        c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1.5; c.strokeRect(px + 13, py + 21, 22, 10); c.strokeRect(px + 13, py + 34, 22, 10);
        c.fillStyle = "#e3b341"; rr(c, px + 16, py + 14, 16, 7, 2); c.fill();
        c.fillStyle = "#3b2414"; c.font = "bold 6px sans-serif"; c.fillText(String(d.num), px + 24, py + 17.8);
        c.fillStyle = "#ffd75a"; c.beginPath(); c.arc(px + 34, py + 34, 2.5, 0, 7); c.fill();
        if (d.num % 4 === 0) { c.fillStyle = "#d7263d"; rr(c, px + 32, py + 36, 7, 11, 2); c.fill(); }
      } else {
        let rx, ry, rw, rh;
        if (d.face === "E") { rx = px + T - 9; ry = py + 7; rw = 9; rh = 34; }
        else if (d.face === "W") { rx = px; ry = py + 7; rw = 9; rh = 34; }
        else { rx = px + 7; ry = py; rw = 34; rh = 9; }
        rr(c, rx, ry, rw, rh, 2); c.fillStyle = "#8a5530"; c.fill(); c.stroke();
        c.fillStyle = "#ffd75a"; c.beginPath();
        c.arc(d.face === "N" ? rx + rw - 6 : rx + rw / 2, d.face === "N" ? ry + rh / 2 : ry + rh - 6, 2.2, 0, 7); c.fill();
      }
    });
    // sconces with warm glow spill
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (gAt(x, y) !== W || !floorish(x, y + 1) || x % 2 !== 1) continue;
      if (doors.some((d) => d.x === x && d.y === y)) continue;
      const cx = x * T + T / 2, cy = y * T + 26;
      const g = c.createRadialGradient(cx, cy + 20, 2, cx, cy + 24, 60);
      g.addColorStop(0, "rgba(255,214,130,.28)"); g.addColorStop(1, "rgba(255,214,130,0)");
      c.fillStyle = g; c.fillRect(cx - 60, cy - 30, 120, 120);
      c.fillStyle = "#c9922e"; rr(c, cx - 4, cy - 2, 8, 10, 2); c.fill();
      c.fillStyle = "#fff1c2"; c.beginPath(); c.moveTo(cx - 7, cy - 2); c.lineTo(cx + 7, cy - 2); c.lineTo(cx + 4, cy - 10); c.lineTo(cx - 4, cy - 10); c.closePath(); c.fill();
    }
    // props
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const v = gAt(x, y), px = x * T, py = y * T, cx = px + T / 2, cy = py + T / 2;
      if (v === ICE) {
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(cx, py + T - 3, 21, 5, 0, 0, 7); c.fill();
        const g = c.createLinearGradient(px, 0, px + T, 0); g.addColorStop(0, "#9aa7b3"); g.addColorStop(0.5, "#eef3f7"); g.addColorStop(1, "#8794a0");
        rr(c, px + 4, py + 2, 40, 44, 5); c.fillStyle = g; c.fill(); c.strokeStyle = "#3b4652"; c.lineWidth = 2; c.stroke();
        c.fillStyle = "#2a8fd6"; rr(c, px + 10, py + 8, 28, 12, 3); c.fill();
        c.fillStyle = "#fff"; c.font = "bold 9px sans-serif"; c.fillText("ICE", cx, py + 14.5);
        c.fillStyle = "#4a5866"; rr(c, px + 12, py + 25, 24, 14, 3); c.fill();
        c.fillStyle = "#cdeeff"; c.fillRect(px + 16, py + 31, 5, 5); c.fillRect(px + 23, py + 32, 5, 5); c.fillRect(px + 28, py + 30, 4, 4);
      } else if (v === CART) {
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(cx, py + T - 4, 21, 5, 0, 0, 7); c.fill();
        rr(c, px + 4, py + 10, 40, 30, 5); c.fillStyle = "#fbf8f2"; c.fill(); c.strokeStyle = "#5c4a3a"; c.lineWidth = 2; c.stroke();
        c.fillStyle = "#e6ddd0"; c.fillRect(px + 5, py + 34, 38, 5);
        const g = c.createRadialGradient(cx - 4, cy - 6, 2, cx, cy, 14); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#9aa3ad");
        c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy + 2, 13, 10, 0, Math.PI, 0); c.lineTo(cx + 15, cy + 3); c.lineTo(cx - 15, cy + 3); c.closePath(); c.fill();
        c.strokeStyle = "#55606a"; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = "#cfd6dc"; c.beginPath(); c.arc(cx, cy - 9, 2.5, 0, 7); c.fill();
        c.fillStyle = "#d7263d"; c.beginPath(); c.arc(px + 10, py + 16, 3, 0, 7); c.fill();
      } else if (v === PLANT) {
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(cx, py + T - 5, 15, 5, 0, 0, 7); c.fill();
        c.fillStyle = "#b8612e"; rr(c, cx - 11, cy + 4, 22, 17, 4); c.fill(); c.strokeStyle = "#5a2b12"; c.lineWidth = 2; c.stroke();
        [[-10, -2, 11], [9, -4, 11], [0, -12, 12], [-4, 2, 9], [6, 4, 9]].forEach(([dx, dy, r], i) => {
          c.fillStyle = i % 2 ? "#2f8f46" : "#3fae58"; c.beginPath(); c.arc(cx + dx, cy + dy, r, 0, 7); c.fill();
          c.strokeStyle = "#1c5a2b"; c.lineWidth = 1.5; c.stroke();
        });
      }
    }
  }

  /* ================= STATE ================= */
  const canvas = $("stage"), ctx = canvas.getContext("2d");
  let cssW = 390, cssH = 700, dpr = 1, zoom = 1, vignette = null;
  let state = null, raf = 0, last = 0, fails = 0, easy = false, running = false;
  const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  const CHECKPOINTS = [
    { x: 2.5, y: 23.5 }, { x: 20, y: 23 }, { x: 20, y: 13 }, { x: 2, y: 13 }, { x: 2, y: 3 },
  ];
  const WAYPOINTS = [{ x: 20, y: 23 }, { x: 20, y: 13 }, { x: 2, y: 13 }, { x: 2, y: 3 }, { x: 19.5, y: 1.6 }];
  const OBJECTIVES = [
    "Floor 7: head down the hall →", "Floor 7: up the east wing ↑", "Floor 7: back along the middle hall ←",
    "Floor 7: up the west wing ↑", "Shoo the Diva to open the elevator!",
  ];
  const TYPES = {
    glam: { hp: 3, speed: 92, r: 15, dmg: 12, dress: "#ff4fa3", dress2: "#ff9fd0", hair: "#ffd34d", scale: 1 },
    skater: { hp: 2, speed: 158, r: 14, dmg: 9, dress: "#1fc8c8", dress2: "#a8f4f0", hair: "#ff7a3d", scale: 0.95 },
    clinger: { hp: 5, speed: 82, r: 16, dmg: 0, dress: "#8f45ff", dress2: "#c9a2ff", hair: "#3a2216", scale: 1.05 },
    diva: { hp: 24, speed: 58, r: 26, dmg: 14, dress: "#f2c230", dress2: "#fff0a8", hair: "#7a2bff", scale: 1.5 },
  };
  const SKIN = ["#f5d0b5", "#f1c27d", "#c68642", "#8d5524", "#e8b896"];
  const SAYS = ["Yoo-hoo!", "Come here, handsome!", "Just one dance!", "Where ya going?", "Party's this way!", "Ooh, antlers!", "Hey groom!"];
  const MAX_AMMO = 10, SUPER_TIME = 5;

  function newState() {
    const cp = CHECKPOINTS[0];
    return {
      phase: "play", t: 0, paused: false,
      p: { x: cp.x * T, y: cp.y * T, r: 14, hp: 100, ammo: MAX_AMMO, reload: 0, fire: 0, inv: 0, superT: 0,
        aimX: 1, aimY: 0, face: 1, walk: 0, moving: false, kx: 0, ky: 0, grabbedBy: null, beers: 0, hurtT: 0 },
      cam: { x: 0, y: 0 }, shake: 0, stage: 0, escorts: [], sausages: [], kisses: [], parts: [], pops: [],
      pickups: [], spawnT: 2.5, shooed: 0, boss: null, elevUnlocked: false, elevAnim: 0,
      flow: new Int16Array(MW * MH), flowTile: -1, win: null, caughtT: 0, hintT: 6, superFlash: 0,
    };
  }
  function placePickups(s) {
    const add = (type, x, y) => s.pickups.push({ type, x: x * T + T / 2, y: y * T + T / 2, bob: Math.random() * 6 });
    add("beer", 10, 25); add("beer", 17, 22); add("pill", 13, 23);
    add("beer", 18, 18); add("pill", 20, 15);
    add("beer", 15, 12); add("pill", 7, 13); add("beer", 2, 13);
    add("beer", 4, 9); add("pill", 2, 7);
    add("beer", 6, 3); add("pill", 11, 3); add("beer", 15, 2);
  }

  /* ================= INPUT ================= */
  const keys = {};
  const sticks = { move: null, aim: null };
  let mouse = { x: 0, y: 0, down: false, active: false };
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyR" && state && state.p.ammo < MAX_AMMO && state.p.reload <= 0) startReload();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code) && !screens.game.hidden) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => (keys[e.code] = false));
  function canvasPt(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.addEventListener("pointerdown", (e) => {
    unlockAudio();
    const pt = canvasPt(e);
    if (e.pointerType === "mouse") { mouse.down = true; mouse.active = true; mouse.x = pt.x; mouse.y = pt.y; return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (pt.x < cssW * 0.5 && !sticks.move) sticks.move = { id: e.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y };
    else if (!sticks.aim) sticks.aim = { id: e.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y };
  });
  canvas.addEventListener("pointermove", (e) => {
    const pt = canvasPt(e);
    if (e.pointerType === "mouse") { mouse.x = pt.x; mouse.y = pt.y; mouse.active = true; return; }
    for (const k of ["move", "aim"]) {
      const s = sticks[k];
      if (s && s.id === e.pointerId) {
        s.x = pt.x; s.y = pt.y;
        const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), max = 56;
        if (d > max) { s.ox = s.x - (dx / d) * max; s.oy = s.y - (dy / d) * max; }
      }
    }
  });
  const endPtr = (e) => {
    if (e.pointerType === "mouse") { mouse.down = false; return; }
    for (const k of ["move", "aim"]) if (sticks[k] && sticks[k].id === e.pointerId) sticks[k] = null;
  };
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);
  canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  /* ================= HELPERS ================= */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function resolveWalls(e, r) {
    const x0 = Math.floor((e.x - r) / T), x1 = Math.floor((e.x + r) / T), y0 = Math.floor((e.y - r) / T), y1 = Math.floor((e.y + r) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!solidTile(tx, ty)) continue;
      const nx = clamp(e.x, tx * T, tx * T + T), ny = clamp(e.y, ty * T, ty * T + T);
      let dx = e.x - nx, dy = e.y - ny, d = Math.hypot(dx, dy);
      if (d < r) {
        if (d < 0.001) { dx = e.x - (tx * T + T / 2); dy = e.y - (ty * T + T / 2); d = Math.hypot(dx, dy) || 1; e.x += (dx / d) * r; e.y += (dy / d) * r; }
        else { e.x += (dx / d) * (r - d); e.y += (dy / d) * (r - d); }
      }
    }
  }
  function moveBody(e, dx, dy, r) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.5)));
    for (let i = 0; i < steps; i++) { e.x += dx / steps; e.y += dy / steps; resolveWalls(e, r); }
  }
  function lineOfSight(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 16);
    for (let i = 1; i < n; i++) {
      const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n;
      if (gAt(Math.floor(x / T), Math.floor(y / T)) === W) return false;
    }
    return true;
  }
  function computeFlow() {
    const p = state.p, pt = Math.floor(p.y / T) * MW + Math.floor(p.x / T);
    if (pt === state.flowTile) return;
    state.flowTile = pt;
    const f = state.flow; f.fill(-1);
    const q = new Int16Array(MW * MH); let h = 0, tl = 0;
    if (pt < 0 || pt >= MW * MH) return;
    f[pt] = 0; q[tl++] = pt;
    while (h < tl) {
      const i = q[h++], x = i % MW, y = (i / MW) | 0;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of nb) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        const j = ny * MW + nx;
        if (f[j] !== -1 || gAt(nx, ny) !== F) continue;
        f[j] = f[i] + 1; q[tl++] = j;
      }
    }
  }
  function flowDist(x, y) { const tx = Math.floor(x / T), ty = Math.floor(y / T); if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return -1; return state.flow[ty * MW + tx]; }
  function pop(x, y, text, color, size, life) { state.pops.push({ x, y, text, color: color || "#fff", size: size || 16, life: life || 0.9, max: life || 0.9 }); }
  function burst(x, y, kind, n, colors, spd) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(0.3, 1) * (spd || 160);
      state.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === "feather" ? 40 : 0), life: rand(0.5, 1.1), max: 1.1,
        kind, color: colors[i % colors.length], rot: rand(0, 6), vr: rand(-8, 8), size: rand(3, 6) });
    }
  }

  /* ================= GAMEPLAY ================= */
  function diffMul() { return (1 + state.stage * 0.07 + Math.min(state.t, 150) * 0.0012) * (easy ? 0.75 : 1); }
  function spawnEscort(type, near) {
    computeFlow();
    const p = state.p;
    let cands = doors.filter((d) => { const fd = flowDist(d.sx, d.sy); const ed = Math.hypot(d.sx - p.x, d.sy - p.y); return fd >= 5 && fd <= 13 && ed > 230; });
    if (near) cands = cands.filter((d) => flowDist(d.sx, d.sy) <= 9);
    if (!cands.length) return null;
    const d = cands[(Math.random() * cands.length) | 0];
    const tp = TYPES[type];
    const e = { type, x: d.sx, y: d.sy, vx: 0, vy: 0, hp: tp.hp * (easy && type === "diva" ? 0.5 : 1), maxHp: tp.hp, r: tp.r,
      state: "chase", t: 0, flash: 0, walk: rand(0, 6), face: 1, say: Math.random() < 0.5 ? SAYS[(Math.random() * SAYS.length) | 0] : "",
      sayT: 1.6, skin: SKIN[(Math.random() * SKIN.length) | 0], seed: Math.random() * 10, kissT: 2, alpha: 1, zig: rand(0, 6) };
    d.open = 1; sfx.door();
    state.escorts.push(e);
    return e;
  }
  function spawnBoss() {
    const tp = TYPES.diva;
    const e = { type: "diva", x: 19.5 * T, y: 2.6 * T, vx: 0, vy: 0, hp: tp.hp * (easy ? 0.5 : 1), maxHp: tp.hp * (easy ? 0.5 : 1), r: tp.r,
      state: "chase", t: 0, flash: 0, walk: 0, face: -1, say: "Not so fast, groom!", sayT: 2.4, skin: "#c68642", seed: 3, kissT: 2.2, alpha: 1, zig: 0, pillDrop: false };
    state.boss = e; state.escorts.push(e);
    sfx.ding(); state.elevAnim = 1.2;
  }
  function pickType() {
    const s = state.stage, r = Math.random();
    if (s === 0) return r < 0.85 ? "glam" : "skater";
    if (s === 1) return r < 0.6 ? "glam" : r < 0.85 ? "skater" : "clinger";
    return r < 0.45 ? "glam" : r < 0.72 ? "skater" : "clinger";
  }
  function startReload() { const p = state.p; p.reload = easy ? 0.6 : 1.15; sfx.reload(); }
  function hurt(amount, fromX, fromY) {
    const p = state.p;
    if (state.phase !== "play") return;
    p.hp -= amount * (easy ? 0.5 : 1);
    p.hurtT = 0.35; state.shake = Math.max(state.shake, 7); sfx.hurt();
    if (fromX !== undefined) { const dx = p.x - fromX, dy = p.y - fromY, d = Math.hypot(dx, dy) || 1; p.kx = (dx / d) * 380; p.ky = (dy / d) * 380; }
    if (p.hp <= 0) caught();
  }
  function caught() {
    const p = state.p;
    p.hp = 0; state.phase = "caught"; state.caughtT = 2.0; fails++;
    if (p.grabbedBy) p.grabbedBy = null;
    sfx.caught();
    if (fails >= (config.failsBeforeAssist || 3)) { easy = true; $("assist-bar").hidden = false; }
  }
  function respawn() {
    const cp = CHECKPOINTS[state.stage], p = state.p;
    p.x = cp.x * T; p.y = cp.y * T; p.hp = 100; p.ammo = MAX_AMMO; p.reload = 0; p.superT = 0; p.inv = 1.5; p.kx = p.ky = 0; p.grabbedBy = null;
    state.escorts = state.escorts.filter((e) => e.type === "diva");
    if (state.boss) { state.boss.x = 19.5 * T; state.boss.y = 3 * T; state.boss.state = "chase"; }
    state.kisses = []; state.sausages = []; state.spawnT = 2.2; state.phase = "play"; state.flowTile = -1;
    pop(p.x, p.y - 60, easy ? "Easy mode on!" : "Again!", "#ffe28a", 20, 1.4);
  }
  function shoo(e, sx, sy) {
    e.state = "shoo"; e.t = 0;
    const dx = e.x - sx, dy = e.y - sy, d = Math.hypot(dx, dy) || 1;
    e.vx = (dx / d) * 280; e.vy = (dy / d) * 280; e.say = ["Hmph!", "Rude!", "Ew, sausage!", "Fine, bye!"][(Math.random() * 4) | 0]; e.sayT = 1.2;
    const tp = TYPES[e.type];
    burst(e.x, e.y - 24, "feather", e.type === "diva" ? 30 : 14, [tp.dress, tp.dress2, "#ffffff"], 200);
    burst(e.x, e.y - 24, "glitter", e.type === "diva" ? 30 : 12, ["#ffe28a", "#ffffff", "#ff9de2"], 260);
    sfx.shoo(); state.shooed++;
    if (state.p.grabbedBy === e) state.p.grabbedBy = null;
    if (e.type === "diva") {
      state.boss = null; state.elevUnlocked = true; sfx.ding();
      pop(19.5 * T, 2.4 * T, "DING! Elevator open!", "#ffe28a", 22, 2.2);
      $("hud-obj").textContent = "The elevator is open. GO!";
      state.escorts.forEach((o) => { if (o !== e && o.state !== "shoo") shoo(o, state.p.x, state.p.y); });
    } else if (Math.random() < 0.13) state.pickups.push({ type: "beer", x: e.x, y: e.y, bob: 0 });
    else if (Math.random() < 0.04 && !state.pickups.some((k) => k.type === "pill")) state.pickups.push({ type: "pill", x: e.x, y: e.y, bob: 0 });
  }
  function nearestEnemy(range, coneDir) {
    const p = state.p; let best = null, bd = range;
    for (const e of state.escorts) {
      if (e.state === "shoo") continue;
      const dx = e.x - p.x, dy = e.y - 20 - p.y, d = Math.hypot(dx, dy);
      if (d > bd) continue;
      if (coneDir && (dx * coneDir.x + dy * coneDir.y) / d < 0.93) continue;
      if (!lineOfSight(p.x, p.y, e.x, e.y)) continue;
      best = e; bd = d;
    }
    return best;
  }
  function fireSausage() {
    const p = state.p, sup = p.superT > 0;
    let ax = p.aimX, ay = p.aimY;
    const t = nearestEnemy(380, { x: ax, y: ay });
    if (t) { const dx = t.x - p.x, dy = t.y - 18 - (p.y - 18), d = Math.hypot(dx, dy) || 1; ax = dx / d; ay = dy / d; }
    const spd = sup ? 600 : 500;
    state.sausages.push({ x: p.x + ax * 16, y: p.y - 18 + ay * 16, vx: ax * spd, vy: ay * spd, life: sup ? 1.0 : 0.85, sup, hit: new Set(), t: 0, spin: rand(-1, 1) });
    if (!sup) { p.ammo--; if (p.ammo <= 0) startReload(); }
    p.fire = sup ? 0.13 : 0.2;
    sup ? sfx.superThrow() : sfx.throw();
  }

  function update(dt) {
    const s = state, p = s.p;
    s.t += dt;
    if (s.hintT > 0) s.hintT -= dt;
    s.shake = Math.max(0, s.shake - dt * 30);
    s.superFlash = Math.max(0, s.superFlash - dt);
    doors.forEach((d) => (d.open = Math.max(0, d.open - dt * 1.5)));
    if (s.elevAnim > 0) s.elevAnim -= dt;
    const wantOpen = s.elevUnlocked || s.elevAnim > 0 || s.phase === "win";
    let target = wantOpen ? 1 : 0;
    if (s.phase === "win" && s.win.t > 1.0) target = 0;
    elevatorOpen += clamp(target - elevatorOpen, -dt * 1.6, dt * 1.6);

    if (s.phase === "caught") { s.caughtT -= dt; updateFx(dt); if (s.caughtT <= 0) respawn(); return; }
    if (s.phase === "win") { updateWin(dt); updateFx(dt); return; }

    // movement input
    let mx = 0, my = 0;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1;
    if (sticks.move) { const dx = sticks.move.x - sticks.move.ox, dy = sticks.move.y - sticks.move.oy; mx = dx / 56; my = dy / 56; }
    let ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; ml = 1; }
    if (ml < 0.12) { mx = my = 0; ml = 0; }
    let speed = 178 * (p.grabbedBy ? 0.42 : 1);
    moveBody(p, mx * speed * dt + p.kx * dt, my * speed * dt + p.ky * dt, p.r);
    p.kx *= Math.pow(0.002, dt); p.ky *= Math.pow(0.002, dt);
    p.moving = ml > 0; if (p.moving) p.walk += dt * 11 * ml;

    // aim + fire
    let firing = false;
    if (sticks.aim) {
      const dx = sticks.aim.x - sticks.aim.ox, dy = sticks.aim.y - sticks.aim.oy, d = Math.hypot(dx, dy);
      if (d > 10) { p.aimX = dx / d; p.aimY = dy / d; }
      else { const t = nearestEnemy(420); if (t) { const ex = t.x - p.x, ey = t.y - p.y, el = Math.hypot(ex, ey) || 1; p.aimX = ex / el; p.aimY = ey / el; } }
      firing = true;
    } else if (mouse.active && !isTouch) {
      const wx = mouse.x / zoom + s.cam.x, wy = mouse.y / zoom + s.cam.y;
      const dx = wx - p.x, dy = wy - (p.y - 18), d = Math.hypot(dx, dy) || 1; p.aimX = dx / d; p.aimY = dy / d;
      firing = mouse.down;
    } else if (ml > 0) { p.aimX = mx / ml; p.aimY = my / ml; }
    if (keys.Space) { firing = true; const t = nearestEnemy(420); if (t) { const ex = t.x - p.x, ey = t.y - p.y, el = Math.hypot(ex, ey) || 1; p.aimX = ex / el; p.aimY = ey / el; } }
    if (Math.abs(p.aimX) > 0.2) p.face = p.aimX > 0 ? 1 : -1;
    p.fire -= dt; p.inv -= dt; p.hurtT -= dt;
    if (p.superT > 0) { p.superT = Math.max(0, p.superT - dt); if (p.superT === 0) pop(p.x, p.y - 60, "Sausages back to normal", "#cfe9ff", 14, 1.1); }
    if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.ammo = MAX_AMMO; sfx.reload(); } }
    if (firing && p.fire <= 0) {
      if (p.superT > 0 || (p.reload <= 0 && p.ammo > 0)) fireSausage();
      else if (p.reload <= 0 && p.ammo <= 0) startReload();
    }

    // checkpoints
    const tx = p.x / T, ty = p.y / T;
    const nextStage =
      s.stage === 0 && tx > 18.6 && ty > 21 ? 1 :
      s.stage === 1 && ty < 15.2 && tx > 18 ? 2 :
      s.stage === 2 && tx < 4 && ty < 15 ? 3 :
      s.stage === 3 && ty < 5 && tx < 4 ? 4 : -1;
    if (nextStage > 0) {
      s.stage = nextStage;
      $("hud-obj").textContent = OBJECTIVES[s.stage];
      const n = (easy ? 1 : 2) + (s.stage === 4 ? 0 : s.stage);
      for (let i = 0; i < n; i++) spawnEscort(i === 0 && s.stage >= 2 ? "clinger" : pickType(), true);
      pop(p.x, p.y - 70, s.stage === 4 ? "The Diva is here!" : "Here they come!", "#ff9de2", 18, 1.3);
      if (s.stage === 4) spawnBoss();
    }
    // trickle spawns
    s.spawnT -= dt;
    const alive = s.escorts.filter((e) => e.state !== "shoo").length;
    const maxAlive = Math.round((s.stage === 4 ? 5 : 3 + s.stage * 1.8) * (easy ? 0.6 : 1));
    if (s.spawnT <= 0) {
      if (alive < maxAlive) spawnEscort(pickType());
      s.spawnT = Math.max(0.85, 2.3 - s.stage * 0.32 - s.t * 0.004) * (easy ? 1.6 : 1);
    }
    // win
    if (s.elevUnlocked && elevatorOpen > 0.7 && p.y < 2 * T + 4 && p.x > 18 * T && p.x < 21 * T) startWin();

    computeFlow();
    updateEscorts(dt);
    updateProjectiles(dt);
    // pickups
    for (let i = s.pickups.length - 1; i >= 0; i--) {
      const k = s.pickups[i]; k.bob += dt * 4;
      if (Math.hypot(k.x - p.x, k.y - p.y) < 30) {
        s.pickups.splice(i, 1);
        if (k.type === "beer") {
          p.hp = Math.min(100, p.hp + 35); p.beers++; sfx.beer();
          pop(p.x, p.y - 64, "GLUG GLUG", "#ffe28a", 15, 0.7); setTimeout(() => state && pop(state.p.x, state.p.y - 70, "BURP!", "#fff", 24, 1), 600);
          burst(p.x, p.y - 30, "foam", 10, ["#fffbe8", "#ffe7a3"], 120);
        } else {
          p.superT = SUPER_TIME; s.superFlash = 0.5; sfx.pill();
          pop(p.x, p.y - 66, "SUPER SAUSAGES! 5s", "#7fd8ff", 18, 1.3);
          burst(p.x, p.y - 30, "glitter", 18, ["#7fd8ff", "#ffffff", "#2a7fff"], 220);
        }
      }
    }
    updateFx(dt);
    updateCamera(dt);
  }
  function updateEscorts(dt) {
    const s = state, p = s.p, dm = diffMul();
    for (const e of s.escorts) {
      e.t += dt; e.flash -= dt; e.sayT -= dt;
      if (e.state === "shoo") { e.x += e.vx * dt; e.y += e.vy * dt; e.walk += dt * 18; e.alpha = Math.max(0, 1 - e.t / 1.1); if (Math.random() < 0.3) burst(e.x, e.y - 20, "feather", 1, [TYPES[e.type].dress2], 40); continue; }
      if (e.state === "grab") {
        e.x = p.x - p.face * 14; e.y = p.y + 2; e.walk += dt * 4;
        hurtDrain(dt);
        continue;
      }
      const tp = TYPES[e.type];
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      let gx = dx / d, gy = dy / d;
      if (d > 90 || !lineOfSight(e.x, e.y, p.x, p.y)) {
        const ex = Math.floor(e.x / T), ey = Math.floor(e.y / T), here = s.flow[ey * MW + ex];
        let best = here, bx = ex, by = ey;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const v = gGet(ex + ox, ey + oy);
          if (v >= 0 && (best < 0 || v < best)) { best = v; bx = ex + ox; by = ey + oy; }
        }
        if (bx !== ex || by !== ey) { const tx = bx * T + T / 2 - e.x, ty = by * T + T / 2 - e.y, tl = Math.hypot(tx, ty) || 1; gx = tx / tl; gy = ty / tl; }
      }
      let sp = tp.speed * dm;
      if (e.type === "skater") { const z = Math.sin(e.t * 5 + e.zig) * 0.55; const nx = -gy, ny = gx; gx += nx * z; gy += ny * z; const l = Math.hypot(gx, gy); gx /= l; gy /= l; }
      e.vx += (gx * sp - e.vx) * Math.min(1, dt * 6); e.vy += (gy * sp - e.vy) * Math.min(1, dt * 6);
      // separation
      for (const o of s.escorts) {
        if (o === e || o.state !== "chase") continue;
        const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy);
        if (od > 0 && od < e.r + o.r) { e.x += (ox / od) * (e.r + o.r - od) * 0.5; e.y += (oy / od) * (e.r + o.r - od) * 0.5; }
      }
      moveBody(e, e.vx * dt, e.vy * dt, e.r * 0.8);
      e.walk += dt * (e.type === "skater" ? 9 : 12); e.face = e.vx >= 0 ? 1 : -1;
      if (e.sayT < -4 && Math.random() < dt * 0.15) { e.say = SAYS[(Math.random() * SAYS.length) | 0]; e.sayT = 1.5; }
      // diva kisses
      if (e.type === "diva") {
        e.kissT -= dt;
        if (e.kissT <= 0 && d < 460 && lineOfSight(e.x, e.y - 30, p.x, p.y - 20)) {
          const n = e.hp < e.maxHp * 0.5 ? 3 : 1, base = Math.atan2(p.y - 20 - (e.y - 40), p.x - e.x);
          for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.28; state.kisses.push({ x: e.x, y: e.y - 40, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, life: 2.5 }); }
          sfx.kiss(); e.kissT = (easy ? 2.4 : 1.6); e.say = "Mwah!"; e.sayT = 0.8;
        }
        if (!e.pillDrop && e.hp < e.maxHp * 0.5) { e.pillDrop = true; state.pickups.push({ type: "pill", x: 6 * T, y: 3.5 * T, bob: 0 }); pop(6 * T, 3 * T, "Blue pill!", "#7fd8ff", 16, 1.4); }
      }
      // contact
      if (d < e.r + p.r && p.inv <= 0 && s.phase === "play") {
        if (e.type === "clinger" && !p.grabbedBy) { e.state = "grab"; p.grabbedBy = e; e.say = "Gotcha, groom!"; e.sayT = 1.4; sfx.grab(); }
        else if (e.type !== "clinger") { hurt(tp.dmg, e.x, e.y); p.inv = 0.75; e.vx = -gx * 200; e.vy = -gy * 200; e.say = e.type === "diva" ? "Come to mama!" : "Hug!"; e.sayT = 0.8; }
      }
    }
    s.escorts = s.escorts.filter((e) => !(e.state === "shoo" && e.t > 1.1));
  }
  function gGet(x, y) { if (x < 0 || y < 0 || x >= MW || y >= MH) return -1; return state.flow[y * MW + x]; }
  function hurtDrain(dt) {
    const p = state.p;
    p.hp -= 17 * dt * (easy ? 0.5 : 1);
    if (Math.random() < dt * 3) state.shake = Math.max(state.shake, 3);
    if (p.hp <= 0) caught();
  }
  function updateProjectiles(dt) {
    const s = state, p = s.p;
    for (let i = s.sausages.length - 1; i >= 0; i--) {
      const b = s.sausages[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.t += dt;
      if (b.sup && Math.random() < 0.6) s.parts.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.35, max: 0.35, kind: "spark", color: "#9be3ff", rot: 0, vr: 0, size: rand(2, 4) });
      let dead = b.life <= 0;
      const g = gAt(Math.floor(b.x / T), Math.floor((b.y + 18) / T));
      if (g !== F && g !== ELEV) { dead = true; burst(b.x, b.y, "star", 4, ["#ffd0a8", "#c8643c"], 80); }
      if (!dead) for (const e of s.escorts) {
        if (e.state === "shoo" || b.hit.has(e)) continue;
        const hy = e.y - 22 * TYPES[e.type].scale;
        if (Math.hypot(e.x - b.x, hy - b.y) < e.r + (b.sup ? 12 : 7) + 6) {
          e.hp -= b.sup ? 3 : 1; e.flash = 0.14; b.hit.add(e);
          const bl = Math.hypot(b.vx, b.vy) || 1; const kb = e.type === "diva" ? 30 : b.sup ? 160 : 90;
          e.vx += (b.vx / bl) * kb * 2; e.vy += (b.vy / bl) * kb * 2;
          burst(b.x, b.y, "star", b.sup ? 9 : 5, b.sup ? ["#9be3ff", "#ffffff"] : ["#ffe28a", "#ffffff"], 150);
          sfx.hit();
          if (Math.random() < 0.3 || b.sup) pop(b.x, b.y - 10, b.sup ? "WHOMP!" : ["SMACK!", "BONK!", "SLAP!"][(Math.random() * 3) | 0], b.sup ? "#9be3ff" : "#fff", b.sup ? 18 : 14, 0.6);
          if (e.state === "grab") { e.state = "chase"; p.grabbedBy = null; p.inv = 0.6; e.x -= p.face * 30; e.vx = -p.face * 220; }
          if (e.hp <= 0) shoo(e, p.x, p.y);
          if (!b.sup) { dead = true; break; }
        }
      }
      if (dead) s.sausages.splice(i, 1);
    }
    for (let i = s.kisses.length - 1; i >= 0; i--) {
      const k = s.kisses[i]; k.x += k.vx * dt; k.y += k.vy * dt; k.life -= dt;
      let dead = k.life <= 0 || gAt(Math.floor(k.x / T), Math.floor((k.y + 20) / T)) === W;
      if (!dead && Math.hypot(k.x - p.x, k.y - (p.y - 22)) < 20) {
        dead = true; if (p.inv <= 0) { hurt(9); p.inv = 0.4; pop(p.x, p.y - 60, "MWAH!", "#ff5d8f", 16, 0.7); burst(p.x, p.y - 30, "heart", 6, ["#ff3d7f", "#ff9de2"], 120); }
      }
      if (dead) s.kisses.splice(i, 1);
    }
  }
  function updateFx(dt) {
    const s = state;
    for (let i = s.parts.length - 1; i >= 0; i--) {
      const q = s.parts[i]; q.life -= dt;
      if (q.life <= 0) { s.parts.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
      if (q.kind === "feather") { q.vx *= Math.pow(0.1, dt); q.vy = q.vy * Math.pow(0.1, dt) + 30 * dt; q.x += Math.sin(q.life * 9) * 0.6; }
      else if (q.kind === "vomit") { q.vy += 900 * dt; }
      else { q.vx *= Math.pow(0.05, dt); q.vy *= Math.pow(0.05, dt); }
    }
    for (let i = s.pops.length - 1; i >= 0; i--) { const q = s.pops[i]; q.life -= dt; q.y -= 32 * dt; if (q.life <= 0) s.pops.splice(i, 1); }
  }
  function viewW() { return cssW / zoom; }
  function viewH() { return cssH / zoom; }
  function updateCamera(dt, snap) {
    const s = state, p = s.p;
    const tx = p.x + p.aimX * 40 - viewW() / 2, ty = p.y - 20 + p.aimY * 40 - viewH() / 2;
    const k = snap ? 1 : Math.min(1, dt * 6);
    s.cam.x += (tx - s.cam.x) * k; s.cam.y += (ty - s.cam.y) * k;
    s.cam.x = clamp(s.cam.x, -20, MW * T - viewW() + 20); s.cam.y = clamp(s.cam.y, -40, MH * T - viewH() + 20);
    if (viewW() > MW * T) s.cam.x = (MW * T - viewW()) / 2;
  }

  /* ================= WIN SEQUENCE ================= */
  function startWin() {
    const s = state;
    s.phase = "win"; s.win = { t: 0, gag: false, wiped: false };
    s.p.grabbedBy = null; s.escorts.forEach((e) => { if (e.state !== "shoo") shoo(e, s.p.x, s.p.y); });
    s.sausages = []; s.kisses = []; sticks.move = sticks.aim = null;
    $("assist-bar").hidden = true;
    $("hud-obj").textContent = "Ding! Going down…";
  }
  function updateWin(dt) {
    const s = state, w = s.win, p = s.p;
    w.t += dt;
    if (w.t < 1.0) {
      const tx = 19.5 * T, ty = 1.45 * T;
      p.x += (tx - p.x) * Math.min(1, dt * 4) + Math.sin(w.t * 14) * 1.2; p.y += (ty - p.y) * Math.min(1, dt * 4);
      p.walk += dt * 9; p.moving = true; p.aimX = 0; p.aimY = 1; p.face = Math.sin(w.t * 6) > 0 ? 1 : -1;
    } else p.moving = false;
    if (w.t >= 1.0 && !w.dinged) { w.dinged = true; sfx.door(); }
    if (w.t > 2.1 && !w.gag) { w.gag = true; w.g = 0; sfx.ding(); }
    if (w.gag) {
      const g0 = w.g; w.g += dt;
      if (g0 < 1.0 && w.g >= 1.0) burp(0, 0.8);
      if (g0 < 2.3 && w.g >= 2.3) sfx.blargh();
      if (w.g > 2.3 && w.g < 3.2) {
        const m = gagMouth();
        for (let i = 0; i < 2; i++) s.parts.push({ x: m.x + rand(-3, 3), y: m.y, vx: rand(-25, 10) * gagLayout.sc / 3, vy: rand(-40, 20), life: 0.42, max: 0.6, kind: "vomit", color: Math.random() < 0.5 ? "#8bd14a" : "#b6e86b", rot: 0, vr: 0, size: rand(4, 8), screen: true });
      }
      if (g0 < 3.2 && w.g >= 3.2) sfx.splash();
      if (w.g > 4.8 && !w.wiped) { w.wiped = true; wipeToReveal(); }
    }
    updateCamera(dt);
  }
  let gagLayout = { x: 0, y: 0, sc: 3 };
  function gagMouth() { const L = gagLayout; return { x: L.x + 4 * L.sc, y: L.y - 39 * L.sc, dir: 1 }; }
  function wipeToReveal() {
    const wipe = $("wipe");
    wipe.className = ""; void wipe.offsetWidth; wipe.className = "cover";
    setTimeout(() => {
      stopLoop(); showScreen("reveal");
      wipe.className = "out";
      setTimeout(() => (wipe.className = ""), 700);
    }, 620);
  }

  /* ================= DRAWING ================= */
  function drawSausage(c, x, y, ang, sup, t, sc) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc || 1, sc || 1);
    if (sup) {
      const g = c.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, "rgba(120,215,255,.75)"); g.addColorStop(1, "rgba(120,215,255,0)");
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 32, 20, 0, 0, 7); c.fill();
      rr(c, -17, -7, 34, 14, 7); c.fillStyle = "#c2502a"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#2a7fff"; c.stroke();
      c.strokeStyle = "#ffd6b8"; c.lineWidth = 2.5; c.lineCap = "round"; c.beginPath(); c.moveTo(-11, -3); c.lineTo(11, -3); c.stroke();
      c.strokeStyle = "#eaf9ff"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-15, 0); c.lineTo(-20, -4); c.moveTo(15, 0); c.lineTo(20, 4); c.stroke();
    } else {
      const wob = Math.sin((t || 0) * 22) * 5;
      c.lineCap = "round";
      c.strokeStyle = "#5a220d"; c.lineWidth = 10; c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, wob, 11, 0); c.stroke();
      c.strokeStyle = "#cf6a3c"; c.lineWidth = 7; c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, wob, 11, 0); c.stroke();
      c.strokeStyle = "#f6b48a"; c.lineWidth = 2; c.beginPath(); c.moveTo(-7, -2); c.quadraticCurveTo(0, wob - 2, 7, -2); c.stroke();
    }
    c.restore();
  }
  function lighten(hex, a) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * a); g = Math.round(g + (255 - g) * a); b = Math.round(b + (255 - b) * a);
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function mix(h1, h2, a) {
    const p = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const A = p(h1), B = p(h2); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * a)).join(",") + ")";
  }
  const INK = "#1c1a17";
  function drawGroom(c, x, y, o) {
    o = o || {};
    const sc = o.scale || 1, ph = o.walk || 0, face = o.face || 1, moving = o.moving;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = "rgba(0,0,0,.32)"; c.beginPath(); c.ellipse(0, 0, 15, 5.5, 0, 0, 7); c.fill();
    if (o.superOn) { const g = c.createRadialGradient(0, -22, 4, 0, -22, 36); g.addColorStop(0, "rgba(120,215,255,.0)"); g.addColorStop(0.7, "rgba(120,215,255,.35)"); g.addColorStop(1, "rgba(120,215,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, -22, 36, 0, 7); c.fill(); }
    const swing = moving ? Math.sin(ph) * 4 : 0, bob = moving ? Math.abs(Math.sin(ph)) * 2 : 0;
    c.lineWidth = 2; c.strokeStyle = INK;
    // legs
    [[-5, swing], [5, -swing]].forEach(([lx, sw]) => {
      rr(c, lx - 3.5, -15 + Math.min(0, sw) * 0.3, 7, 13, 3); c.fillStyle = "#2f4a7a"; c.fill(); c.stroke();
      c.fillStyle = "#2a1a12"; c.beginPath(); c.ellipse(lx + face * 1.5, -2 + sw * 0.15, 5, 3, 0, 0, 7); c.fill();
    });
    c.translate(0, -bob);
    // back arm
    c.strokeStyle = INK; c.lineWidth = 6.5; c.lineCap = "round"; c.beginPath(); c.moveTo(-face * 9, -27); c.lineTo(-face * 12, -17 + swing * 0.5); c.stroke();
    c.strokeStyle = "#f2c29b"; c.lineWidth = 4; c.beginPath(); c.moveTo(-face * 9, -27); c.lineTo(-face * 12, -17 + swing * 0.5); c.stroke();
    // torso
    rr(c, -11, -33, 22, 21, 8); c.fillStyle = "#ffffff"; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.save(); rr(c, -11, -33, 22, 21, 8); c.clip();
    c.fillStyle = "#d7263d"; c.beginPath(); c.moveTo(-13, -33); c.lineTo(-6, -33); c.lineTo(13, -16); c.lineTo(13, -10); c.closePath(); c.fill();
    c.fillStyle = "#ffe28a"; c.font = "bold 4.5px sans-serif"; c.save(); c.translate(1, -23); c.rotate(0.72); c.textAlign = "center"; c.fillText("GROOM", 0, 1.5); c.restore();
    c.restore();
    // head
    const hy = -43, green = o.green || 0;
    c.fillStyle = green ? mix("#f2c29b", "#9fd36a", green) : "#f2c29b";
    c.beginPath(); c.arc(0, hy, 11, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#6b3e1f"; c.beginPath(); c.arc(0, hy - 2, 11, Math.PI * 1.08, Math.PI * 1.92); c.lineTo(8, hy - 6); c.quadraticCurveTo(0, hy - 9, -9, hy - 5); c.closePath(); c.fill();
    // antlers
    c.strokeStyle = "#7a4a22"; c.lineWidth = 3; c.lineCap = "round";
    c.beginPath(); c.arc(0, hy, 11.5, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.strokeStyle = "#a8743f"; c.lineWidth = 3.2;
    [-1, 1].forEach((sd) => {
      c.beginPath(); c.moveTo(sd * 7, hy - 9); c.quadraticCurveTo(sd * 12, hy - 18, sd * 9, hy - 25);
      c.moveTo(sd * 10, hy - 17); c.lineTo(sd * 16, hy - 21); c.moveTo(sd * 9.6, hy - 21); c.lineTo(sd * 5, hy - 26); c.stroke();
    });
    // face
    const fx = face * 3;
    const drunk = Math.min(1, (o.beers || 0) / 4);
    c.fillStyle = "rgba(255,90,90," + (0.25 + drunk * 0.35) + ")"; c.beginPath(); c.arc(fx - 6, hy + 3, 2.6, 0, 7); c.arc(fx + 6, hy + 3, 2.6, 0, 7); c.fill();
    c.fillStyle = INK;
    if (o.hurt) { c.lineWidth = 1.6; c.strokeStyle = INK; c.beginPath(); c.moveTo(fx - 5, hy - 3); c.lineTo(fx - 2, hy); c.moveTo(fx - 2, hy - 3); c.lineTo(fx - 5, hy); c.moveTo(fx + 2, hy - 3); c.lineTo(fx + 5, hy); c.moveTo(fx + 5, hy - 3); c.lineTo(fx + 2, hy); c.stroke(); }
    else { c.beginPath(); c.ellipse(fx - 3.5, hy - 1.5, 1.6, 2.2, 0, 0, 7); c.ellipse(fx + 3.5, hy - 1.5, 1.6, 2.2, 0, 0, 7); c.fill(); }
    c.lineWidth = 1.6; c.strokeStyle = INK;
    if (o.mouth === "open") { c.fillStyle = "#5a1020"; c.beginPath(); c.ellipse(fx, hy + 5, 3.4, 3, 0, 0, 7); c.fill(); }
    else if (o.mouth === "puff") { c.fillStyle = "#9fd36a"; c.beginPath(); c.arc(fx - 5, hy + 4, 3.5, 0, 7); c.arc(fx + 5, hy + 4, 3.5, 0, 7); c.fill(); c.beginPath(); c.moveTo(fx - 2, hy + 5); c.lineTo(fx + 2, hy + 5); c.stroke(); }
    else { c.beginPath(); c.arc(fx, hy + 3, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    // throwing arm
    const aim = o.aimAng !== undefined ? o.aimAng : 0;
    const sx = face * 9, sy = -27, hx = sx + Math.cos(aim) * 13, hyy = sy + Math.sin(aim) * 13;
    c.strokeStyle = INK; c.lineWidth = 6.5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hyy); c.stroke();
    c.strokeStyle = "#f2c29b"; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hyy); c.stroke();
    if (o.holding) drawSausage(c, hx + Math.cos(aim) * 4, hyy + Math.sin(aim) * 4, aim + 0.4, o.superOn, o.t, 0.7);
    if (o.bucket) {
      const bx = 0, by = -14;
      c.fillStyle = "#c9d3dc"; c.beginPath(); c.moveTo(bx - 11, by - 8); c.lineTo(bx + 11, by - 8); c.lineTo(bx + 8, by + 8); c.lineTo(bx - 8, by + 8); c.closePath(); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
      c.fillStyle = "#8a96a2"; c.beginPath(); c.ellipse(bx, by - 8, 11, 3, 0, 0, 7); c.fill(); c.stroke();
      c.fillStyle = "#2a8fd6"; c.font = "bold 5px sans-serif"; c.textAlign = "center"; c.fillText("ICE", bx, by + 2);
    }
    c.restore();
  }
  function drawEscort(c, e, now) {
    const tp = TYPES[e.type], sc = tp.scale;
    c.save(); c.globalAlpha = e.alpha;
    let x = e.x, y = e.y;
    if (e.flash > 0) x += Math.sin(now * 90) * 2;
    c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, 0, 14, 5, 0, 0, 7); c.fill();
    const face = e.state === "shoo" ? (e.vx > 0 ? 1 : -1) : e.face;
    const ph = e.walk, sw = Math.sin(ph) * 3.5, bob = Math.abs(Math.sin(ph)) * 1.8;
    c.lineWidth = 2; c.strokeStyle = INK; c.lineCap = "round";
    // legs (tights) + shoes / skates
    [[-4.5, sw], [4.5, -sw]].forEach(([lx, s]) => {
      c.strokeStyle = INK; c.lineWidth = 5.5; c.beginPath(); c.moveTo(lx, -14); c.lineTo(lx + s * 0.4, -3); c.stroke();
      c.strokeStyle = "#3a2440"; c.lineWidth = 3.2; c.beginPath(); c.moveTo(lx, -14); c.lineTo(lx + s * 0.4, -3); c.stroke();
      if (e.type === "skater") {
        c.fillStyle = "#fff"; rr(c, lx + s * 0.4 - 4, -5, 8, 4, 2); c.fill(); c.lineWidth = 1.2; c.stroke();
        c.fillStyle = "#ff5d8f"; c.beginPath(); c.arc(lx + s * 0.4 - 2.5, 0, 1.8, 0, 7); c.arc(lx + s * 0.4 + 2.5, 0, 1.8, 0, 7); c.fill();
      } else { c.fillStyle = e.type === "diva" ? "#ffe28a" : "#d7263d"; c.beginPath(); c.ellipse(lx + s * 0.4 + face, -2, 3.6, 2, 0, 0, 7); c.fill(); }
    });
    c.translate(0, -bob);
    // dress (knee length, sleeves)
    c.lineWidth = 2; c.strokeStyle = INK;
    c.beginPath(); c.moveTo(-8, -34); c.lineTo(8, -34); c.quadraticCurveTo(10, -24, 14, -12); c.quadraticCurveTo(0, -9, -14, -12); c.quadraticCurveTo(-10, -24, -8, -34); c.closePath();
    const dg = c.createLinearGradient(0, -34, 0, -10); dg.addColorStop(0, tp.dress2); dg.addColorStop(0.35, tp.dress); dg.addColorStop(1, tp.dress);
    c.fillStyle = dg; c.fill(); c.stroke();
    c.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) { const a = (now * 3 + e.seed + i * 1.7) % 3; if (a < 1.4) { c.globalAlpha = e.alpha * (1 - a / 1.4); c.beginPath(); c.arc(-7 + ((i * 37 + e.seed * 10) % 14), -30 + ((i * 23) % 16), 1.2, 0, 7); c.fill(); } }
    c.globalAlpha = e.alpha;
    c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-9, -24); c.quadraticCurveTo(0, -21, 9, -24); c.stroke();
    // arms reaching for the groom
    const reach = e.state === "shoo" ? -0.9 : e.state === "grab" ? 0.2 : -0.15 + Math.sin(now * 6 + e.seed) * 0.15;
    [-1, 1].forEach((sd) => {
      const ax = sd * 7, ay = -31, ex = ax + face * 14 + sd * 2, ey = ay + 6 + reach * 14 * (sd === face ? 1 : 0.6);
      c.strokeStyle = INK; c.lineWidth = 5.5; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = e.skin; c.lineWidth = 3.4; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = tp.dress; c.lineWidth = 4; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (ex - ax) * 0.4, ay + (ey - ay) * 0.4); c.stroke();
    });
    if (e.type === "clinger") {
      c.fillStyle = "#ff9de2";
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i * 0.11); c.beginPath(); c.arc(Math.cos(a) * 10, -33 + Math.sin(a) * 4 + (i % 2), 3.2, 0, 7); c.fill(); }
      c.beginPath(); c.arc(-11, -27, 3, 0, 7); c.arc(-12, -22, 3, 0, 7); c.arc(11, -27, 3, 0, 7); c.fill();
    }
    // head + big hair
    const hy = -43;
    c.fillStyle = tp.hair; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.arc(-8, hy + 2, 7, 0, 7); c.arc(8, hy + 2, 7, 0, 7); c.arc(0, hy - 7, 11, 0, 7); c.arc(-9, hy - 4, 7, 0, 7); c.arc(9, hy - 4, 7, 0, 7); c.fill(); c.stroke();
    if (e.type === "skater") { c.beginPath(); c.ellipse(-face * 13, hy - 2, 4, 8, -face * 0.5, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = e.skin; c.beginPath(); c.arc(face * 1, hy, 9.5, 0, 7); c.fill(); c.stroke();
    c.fillStyle = tp.hair; c.beginPath(); c.arc(face * 1, hy - 3, 9.5, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    const fx = face * 3;
    if (e.state === "shoo") {
      c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx - 5, hy - 1); c.lineTo(fx - 2, hy - 1); c.moveTo(fx + 2, hy - 1); c.lineTo(fx + 5, hy - 1); c.stroke();
    } else {
      c.fillStyle = INK; c.beginPath(); c.ellipse(fx - 3.2, hy - 1, 1.5, 2.1, 0, 0, 7); c.ellipse(fx + 3.2, hy - 1, 1.5, 2.1, 0, 0, 7); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx - 5, hy - 3); c.lineTo(fx - 6.5, hy - 4.5); c.moveTo(fx + 5, hy - 3); c.lineTo(fx + 6.5, hy - 4.5); c.stroke();
    }
    c.fillStyle = "rgba(255,80,120,.4)"; c.beginPath(); c.arc(fx - 5.5, hy + 3, 2.2, 0, 7); c.arc(fx + 5.5, hy + 3, 2.2, 0, 7); c.fill();
    c.fillStyle = "#d1003a"; c.beginPath();
    if (e.state === "shoo") { c.ellipse(fx, hy + 5, 2.2, 1.2, 0, 0, 7); } else { c.ellipse(fx, hy + 4.5, 3, 2, 0, 0, Math.PI); } c.fill();
    if (e.type === "diva") {
      c.fillStyle = "#ffd23f"; c.strokeStyle = INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-8, hy - 15); c.lineTo(-8, hy - 23); c.lineTo(-4, hy - 18); c.lineTo(0, hy - 25); c.lineTo(4, hy - 18); c.lineTo(8, hy - 23); c.lineTo(8, hy - 15); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#ff3d7f"; c.beginPath(); c.arc(0, hy - 18, 1.6, 0, 7); c.fill();
    }
    if (e.flash > 0) { c.globalAlpha = 0.55 * e.alpha; c.fillStyle = "#fff"; c.beginPath(); c.arc(0, hy, 12, 0, 7); c.ellipse(0, -22, 13, 13, 0, 0, 7); c.fill(); c.globalAlpha = e.alpha; }
    c.restore();
    // hp pips + speech
    if (e.state !== "shoo" && e.hp < e.maxHp) {
      const w = e.type === "diva" ? 64 : 26, by = e.y - 72 * sc;
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, e.x - w / 2, by, w, 5, 2.5); c.fill();
      c.fillStyle = "#ff5d8f"; rr(c, e.x - w / 2, by, w * clamp(e.hp / e.maxHp, 0, 1), 5, 2.5); c.fill();
    }
    if (e.say && e.sayT > 0) bubble(c, e.x, e.y - 74 * sc - 8, e.say, e.alpha);
  }
  function bubble(c, x, y, text, alpha) {
    c.save(); c.globalAlpha = alpha === undefined ? 1 : alpha;
    c.font = "bold 11px 'Avenir Next', 'Segoe UI', sans-serif";
    const w = c.measureText(text).width + 14;
    c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 1.8;
    rr(c, x - w / 2, y - 18, w, 18, 9); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 4, y - 1); c.lineTo(x, y + 6); c.lineTo(x + 4, y - 1); c.closePath(); c.fill();
    c.fillStyle = INK; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, x, y - 9);
    c.restore();
  }
  function drawPickup(c, k) {
    const b = Math.sin(k.bob) * 3;
    c.save(); c.translate(k.x, k.y);
    c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.ellipse(0, 10, 11, 4, 0, 0, 7); c.fill();
    const g = c.createRadialGradient(0, -4 + b, 2, 0, -4 + b, 24);
    g.addColorStop(0, k.type === "beer" ? "rgba(255,220,110,.45)" : "rgba(110,200,255,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.beginPath(); c.arc(0, -4 + b, 24, 0, 7); c.fill();
    c.translate(0, b); c.lineWidth = 2; c.strokeStyle = INK;
    if (k.type === "beer") {
      c.beginPath(); c.arc(8, -3, 5, -Math.PI / 2, Math.PI / 2); c.lineWidth = 3; c.stroke(); c.lineWidth = 2;
      rr(c, -8, -12, 16, 20, 3); const bg = c.createLinearGradient(-8, 0, 8, 0); bg.addColorStop(0, "#e59a1c"); bg.addColorStop(0.5, "#ffc94a"); bg.addColorStop(1, "#d88a12");
      c.fillStyle = bg; c.fill(); c.stroke();
      c.fillStyle = "#fffbe8"; c.beginPath(); c.arc(-5, -12, 4.5, 0, 7); c.arc(0, -14, 5, 0, 7); c.arc(5, -12, 4.5, 0, 7); c.fill();
      c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(-5, -7, 2, 12);
    } else {
      c.rotate(-0.5);
      rr(c, -11, -5, 22, 10, 5); c.fillStyle = "#8fd6ff"; c.fill();
      c.save(); rr(c, -11, -5, 22, 10, 5); c.clip(); c.fillStyle = "#1f6fff"; c.fillRect(-11, -5, 11, 10); c.restore();
      rr(c, -11, -5, 22, 10, 5); c.stroke();
      c.fillStyle = "rgba(255,255,255,.75)"; rr(c, -7, -3.5, 12, 2.5, 1.2); c.fill();
    }
    c.restore();
  }
  function drawElevator(c, now) {
    const x0 = 18 * T, y0 = 1 * T, w = 3 * T, h = T;
    c.fillStyle = "#3b2a12"; c.fillRect(x0 - 4, y0 - 6, w + 8, h + 6);
    const ig = c.createLinearGradient(0, y0, 0, y0 + h); ig.addColorStop(0, "#fff3cf"); ig.addColorStop(1, "#d9b469");
    c.fillStyle = ig; c.fillRect(x0, y0, w, h);
    c.fillStyle = "#b38b3e"; c.fillRect(x0, y0 + h - 14, w, 3);
    const half = (w / 2) * (1 - elevatorOpen * 0.92);
    const dg = c.createLinearGradient(x0, 0, x0 + w, 0); dg.addColorStop(0, "#8a6a24"); dg.addColorStop(0.25, "#e8c56a"); dg.addColorStop(0.5, "#9c7a2e"); dg.addColorStop(0.75, "#e8c56a"); dg.addColorStop(1, "#8a6a24");
    c.fillStyle = dg; c.fillRect(x0, y0, half, h); c.fillRect(x0 + w - half, y0, half, h);
    c.strokeStyle = "#5a4214"; c.lineWidth = 2; c.strokeRect(x0, y0, half, h); c.strokeRect(x0 + w - half, y0, half, h);
    // sign
    c.fillStyle = "#1c0812"; rr(c, x0 + w / 2 - 40, y0 - 30, 80, 20, 5); c.fill();
    c.strokeStyle = "#e3b341"; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = state.elevUnlocked ? "#7dff9a" : "#ff5d8f"; c.font = "bold 10px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(state.elevUnlocked ? "▲ ELEVATOR ▲" : "ELEVATOR 7", x0 + w / 2, y0 - 20);
    if (state.elevUnlocked && state.phase === "play") {
      const a = 0.4 + Math.sin(now * 6) * 0.3;
      c.fillStyle = "rgba(125,255,154," + a + ")"; c.beginPath(); c.moveTo(x0 + w / 2, y0 + h + 6); c.lineTo(x0 + w / 2 + 14, y0 + h + 22); c.lineTo(x0 + w / 2 - 14, y0 + h + 22); c.closePath(); c.fill();
    }
  }
  function drawParts(c, screen) {
    for (const q of state.parts) {
      if (!!q.screen !== screen) continue;
      const a = clamp(q.life / q.max, 0, 1);
      c.globalAlpha = a; c.fillStyle = q.color;
      if (q.kind === "feather") { c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.beginPath(); c.ellipse(0, 0, q.size * 1.6, q.size * 0.6, 0, 0, 7); c.fill(); c.restore(); }
      else if (q.kind === "glitter" || q.kind === "star" || q.kind === "spark") {
        const r = q.size; c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.beginPath();
        for (let i = 0; i < 4; i++) { c.lineTo(0, -r * 1.4); c.rotate(Math.PI / 4); c.lineTo(0, -r * 0.4); c.rotate(Math.PI / 4); }
        c.closePath(); c.fill(); c.restore();
      } else if (q.kind === "heart") { heart(c, q.x, q.y, q.size * 1.4); }
      else { c.beginPath(); c.arc(q.x, q.y, q.size, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
  }
  function heart(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.4, x, y - s * 0.4);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); c.fill();
  }
  function hudSausage(c, x, y, on) {
    c.save(); c.globalAlpha = on ? 1 : 0.25; c.translate(x, y); c.rotate(-0.5);
    rr(c, -6, -2.6, 12, 5.2, 2.6); c.fillStyle = "#cf6a3c"; c.fill(); c.lineWidth = 1.2; c.strokeStyle = "#3a1508"; c.stroke(); c.restore();
  }
  function render(now) {
    const s = state; if (!s) return;
    const S = zoom * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1a0a12"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (s.phase === "win" && s.win.gag) { renderGag(now); return; }
    const shx = s.shake ? rand(-s.shake, s.shake) : 0, shy = s.shake ? rand(-s.shake, s.shake) : 0;
    const cx = s.cam.x + shx / zoom, cy = s.cam.y + shy / zoom;
    ctx.drawImage(mapCanvas, Math.round(-cx * S), Math.round(-cy * S));
    ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
    // door open flashes
    for (const d of doors) if (d.open > 0) { ctx.globalAlpha = d.open; ctx.fillStyle = "#ffe9a8"; const px = d.x * T, py = d.y * T; if (d.face === "S") ctx.fillRect(px + 9, py + 16, 30, 32); else if (d.face === "N") ctx.fillRect(px + 7, py, 34, 9); else ctx.fillRect(d.face === "E" ? px + T - 9 : px, py + 7, 9, 34); ctx.globalAlpha = 1; }
    drawElevator(ctx, now);
    // entities y-sorted
    const ents = [];
    for (const k of s.pickups) ents.push({ y: k.y - 6, f: () => drawPickup(ctx, k) });
    for (const e of s.escorts) ents.push({ y: e.y, f: () => drawEscort(ctx, e, now) });
    const p = s.p;
    if (!(s.phase === "win" && s.win.t > 1.6)) ents.push({ y: p.y, f: () => {
      if (p.inv > 0 && s.phase === "play" && Math.floor(now * 20) % 2 === 0) ctx.globalAlpha = 0.5;
      drawGroom(ctx, p.x, p.y, { walk: p.walk, moving: p.moving, face: p.face, aimAng: Math.atan2(p.aimY, p.aimX), holding: p.superT > 0 || (p.ammo > 0 && p.reload <= 0),
        superOn: p.superT > 0, hurt: p.hurtT > 0 || s.phase === "caught", beers: p.beers, t: now, green: s.phase === "win" ? Math.min(1, s.win.t / 1.5) * 0.5 : 0 });
      ctx.globalAlpha = 1;
    } });
    ents.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    for (const b of s.sausages) drawSausage(ctx, b.x, b.y, b.sup ? Math.atan2(b.vy, b.vx) : b.t * 14 * (b.spin > 0 ? 1 : -1), b.sup, b.t, b.sup ? 1.15 : 1);
    ctx.fillStyle = "#ff3d7f"; for (const k of s.kisses) { heart(ctx, k.x, k.y, 7); }
    drawParts(ctx, false);
    // guide chevron
    if (s.phase === "play") {
      const wp = WAYPOINTS[Math.min(s.stage, 4)];
      if (!(s.stage === 4 && !s.elevUnlocked)) {
        const a = Math.atan2(wp.y * T - p.y, wp.x * T - p.x), r = 34 + Math.sin(now * 5) * 3;
        ctx.save(); ctx.translate(p.x + Math.cos(a) * r, p.y - 6 + Math.sin(a) * r); ctx.rotate(a);
        ctx.fillStyle = "rgba(255,226,138,.9)"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    for (const q of s.pops) {
      const a = clamp(q.life / q.max * 1.5, 0, 1);
      ctx.globalAlpha = a; ctx.font = "900 " + q.size + "px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.color; ctx.fillText(q.text, q.x, q.y);
    }
    ctx.globalAlpha = 1;
    // screen space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (vignette) ctx.drawImage(vignette, 0, 0, cssW, cssH);
    if (p.superT > 0) { ctx.strokeStyle = "rgba(110,200,255," + (0.35 + Math.sin(now * 10) * 0.15) + ")"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, cssW - 8, cssH - 8); }
    if (p.grabbedBy || p.hurtT > 0) { ctx.fillStyle = "rgba(255,40,90," + (p.grabbedBy ? 0.12 + Math.sin(now * 12) * 0.06 : 0.18) + ")"; ctx.fillRect(0, 0, cssW, cssH); }
    if (s.superFlash > 0) { ctx.fillStyle = "rgba(160,225,255," + s.superFlash + ")"; ctx.fillRect(0, 0, cssW, cssH); }
    drawHud(now);
    if (s.phase === "caught") {
      ctx.fillStyle = "rgba(28,8,18,.6)"; ctx.fillRect(0, 0, cssW, cssH);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 40px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText("CAUGHT!", cssW / 2, cssH * 0.42); ctx.fillStyle = "#ff5d8f"; ctx.fillText("CAUGHT!", cssW / 2, cssH * 0.42);
      ctx.font = "700 15px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.fillStyle = "#fff";
      ctx.fillText("Dave got hugged into submission.", cssW / 2, cssH * 0.42 + 38);
      ctx.fillText(easy ? "Easy mode is on. Try again!" : "Back to the last corner…", cssW / 2, cssH * 0.42 + 60);
    }
  }
  function drawHud(now) {
    const s = state, p = s.p, c = ctx, top = 52;
    // health
    c.fillStyle = "rgba(20,6,14,.6)"; rr(c, 10, top, 168, 22, 11); c.fill();
    const hpw = 136 * clamp(p.hp / 100, 0, 1);
    const hg = c.createLinearGradient(34, 0, 170, 0); hg.addColorStop(0, p.hp < 35 ? "#ff3d5a" : "#ffcf3d"); hg.addColorStop(1, p.hp < 35 ? "#ff7a8a" : "#7ee05a");
    c.fillStyle = hg; rr(c, 36, top + 4, Math.max(6, hpw), 14, 7); c.fill();
    c.fillStyle = "#ff3d7f"; heart(c, 22, top + 11, 6.5);
    c.fillStyle = "#fff"; c.font = "800 10px 'Avenir Next', sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText((config.groomName || "Dave").toUpperCase() + (p.grabbedBy ? " · SHAKE HER OFF!" : ""), 42, top + 11.5);
    // ammo
    c.fillStyle = "rgba(20,6,14,.6)"; rr(c, 10, top + 27, 168, 18, 9); c.fill();
    if (p.superT > 0) { c.fillStyle = "#9be3ff"; c.font = "900 11px 'Avenir Next', sans-serif"; c.fillText("∞ SUPER SAUSAGES", 20, top + 36.5); }
    else if (p.reload > 0) {
      const tot = easy ? 0.6 : 1.15; c.fillStyle = "#ffe28a"; rr(c, 16, top + 32, 156 * (1 - p.reload / tot), 8, 4); c.fill();
      c.fillStyle = "#fff"; c.font = "800 9px 'Avenir Next', sans-serif"; c.fillText("RELOADING SAUSAGES…", 20, top + 36.5);
    } else for (let i = 0; i < MAX_AMMO; i++) hudSausage(c, 22 + i * 15.5, top + 36, i < p.ammo);
    // score
    c.textAlign = "right"; c.fillStyle = "#fff"; c.font = "800 12px 'Avenir Next', sans-serif";
    c.fillText("Shooed " + s.shooed, cssW - 12, top + 9);
    // super ring countdown
    if (p.superT > 0) {
      const rx = 40, ry = top + 84, frac = p.superT / SUPER_TIME;
      c.fillStyle = "rgba(10,30,60,.75)"; c.beginPath(); c.arc(rx, ry, 25, 0, 7); c.fill();
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 5; c.beginPath(); c.arc(rx, ry, 21, 0, 7); c.stroke();
      c.strokeStyle = "#5cc8ff"; c.lineCap = "round"; c.beginPath(); c.arc(rx, ry, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.stroke(); c.lineCap = "butt";
      c.fillStyle = "#fff"; c.textAlign = "center"; c.font = "900 18px 'Avenir Next', sans-serif"; c.fillText(String(Math.ceil(p.superT)), rx, ry + 1);
      c.font = "900 9px 'Avenir Next', sans-serif"; c.fillStyle = "#9be3ff"; c.fillText("SUPER", rx, ry + 34);
      c.fillStyle = "rgba(10,30,60,.75)"; rr(c, rx - 26, ry + 41, 52, 6, 3); c.fill();
      c.fillStyle = "#5cc8ff"; rr(c, rx - 26, ry + 41, 52 * frac, 6, 3); c.fill();
    }
    if (s.boss) {
      const bw = Math.min(220, cssW - 60), bx = (cssW - bw) / 2, by = cssH - (isTouch ? 34 : 30) - (!$("assist-bar").hidden ? 90 : 0);
      c.fillStyle = "rgba(20,6,14,.7)"; rr(c, bx - 4, by - 16, bw + 8, 30, 10); c.fill();
      c.fillStyle = "#ffe28a"; c.font = "900 10px 'Avenir Next', sans-serif"; c.textAlign = "center"; c.fillText("THE DIVA", cssW / 2, by - 7);
      c.fillStyle = "#ff5d8f"; rr(c, bx, by, bw * clamp(s.boss.hp / s.boss.maxHp, 0, 1), 8, 4); c.fill();
    }
    // sticks
    c.textAlign = "center";
    const drawStick = (st, col) => {
      c.strokeStyle = col; c.lineWidth = 3; c.globalAlpha = 0.5; c.beginPath(); c.arc(st.ox, st.oy, 56, 0, 7); c.stroke();
      c.globalAlpha = 0.75; c.fillStyle = col; c.beginPath(); c.arc(st.x, st.y, 24, 0, 7); c.fill(); c.globalAlpha = 1;
    };
    if (sticks.move) drawStick(sticks.move, "#ffe28a");
    if (sticks.aim) drawStick(sticks.aim, "#ff5d8f");
    if (s.hintT > 0 && s.phase === "play") {
      c.globalAlpha = Math.min(1, s.hintT); c.fillStyle = "rgba(20,6,14,.7)";
      const msg = isTouch ? "Left thumb: move  ·  Right thumb: aim + throw" : "WASD: move  ·  Mouse: aim  ·  Click: throw";
      c.font = "800 12px 'Avenir Next', sans-serif"; const w = c.measureText(msg).width + 24;
      rr(c, (cssW - w) / 2, cssH - 62, w, 28, 14); c.fill(); c.fillStyle = "#fff"; c.fillText(msg, cssW / 2, cssH - 47.5);
      if (isTouch && !sticks.move && !sticks.aim) {
        c.globalAlpha *= 0.35; c.strokeStyle = "#ffe28a"; c.lineWidth = 3; c.beginPath(); c.arc(cssW * 0.22, cssH - 150, 48, 0, 7); c.stroke();
        c.strokeStyle = "#ff5d8f"; c.beginPath(); c.arc(cssW * 0.78, cssH - 150, 48, 0, 7); c.stroke();
      }
      c.globalAlpha = 1;
    }
  }
  function renderGag(now) {
    const s = state, w = s.win, g = w.g, c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sh = g < 1.8 ? Math.sin(now * 40) * 2 : 0;
    c.save(); c.translate(sh, 0);
    const bg = c.createLinearGradient(0, 0, 0, cssH); bg.addColorStop(0, "#5a3d14"); bg.addColorStop(0.5, "#c9a24a"); bg.addColorStop(1, "#6e4c18");
    c.fillStyle = bg; c.fillRect(-10, 0, cssW + 20, cssH);
    c.strokeStyle = "rgba(255,240,200,.25)"; c.lineWidth = 2;
    for (let x = 20; x < cssW; x += 46) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, cssH * 0.8); c.stroke(); }
    c.fillStyle = "#3b2414"; c.fillRect(-10, cssH * 0.55, cssW + 20, 10);
    c.fillStyle = "#7a1d3f"; c.fillRect(-10, cssH * 0.8, cssW + 20, cssH * 0.2);
    c.strokeStyle = "rgba(227,179,65,.5)"; for (let x = -20; x < cssW + 20; x += 30) { c.beginPath(); c.moveTo(x, cssH * 0.8); c.lineTo(x + 15, cssH); c.stroke(); }
    // floor indicator
    const floors = ["7", "6", "5", "4", "3", "2", "1", "G"];
    const fi = Math.min(floors.length - 1, Math.floor(g / 0.26));
    c.fillStyle = "#1c0812"; rr(c, cssW / 2 - 50, 70, 100, 50, 10); c.fill(); c.strokeStyle = "#e3b341"; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#ff8a3d"; c.font = "900 30px 'Avenir Next', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((fi < floors.length - 1 ? "▼ " : "") + floors[fi], cssW / 2, 96);
    // Dave
    const sc = Math.min(cssW / 80, cssH / 150);
    gagLayout = { x: cssW / 2, y: cssH * 0.86, sc };
    const green = g < 1.4 ? 0.3 : Math.min(1, 0.3 + (g - 1.4));
    const mouth = g > 0.9 && g < 1.8 ? "open" : g >= 1.8 && g < 2.3 ? "puff" : g >= 2.3 && g < 3.2 ? "open" : "";
    drawGroom(c, cssW / 2 + Math.sin(now * 3) * 4, cssH * 0.86, { scale: sc, face: 1, walk: 0, aimAng: 0.9, holding: false, green, mouth, bucket: g > 1.6, beers: 6 });
    c.restore();
    drawParts(c, true);
    if (g > 0.9 && g < 1.9) bubbleBig(cssW / 2 + 70, cssH * 0.86 - 70 * sc, "BUUURP!");
    const cap = g > 3.4 ? "What happens on Floor 7…" : g > 2.4 ? "Worth it." : "";
    if (cap) {
      c.font = "900 22px 'Avenir Next', 'Segoe UI', sans-serif"; c.textAlign = "center"; c.lineWidth = 6; c.strokeStyle = INK;
      c.strokeText(cap, cssW / 2, 165); c.fillStyle = "#ffe28a"; c.fillText(cap, cssW / 2, 165);
    }
  }
  function bubbleBig(x, y, text) {
    const c = ctx; c.save(); c.font = "900 22px 'Avenir Next', sans-serif";
    const w = c.measureText(text).width + 26; x = Math.min(x, cssW - w / 2 - 6);
    c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 3; rr(c, x - w / 2, y - 40, w, 40, 20); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 30, y - 2); c.lineTo(x - 44, y + 14); c.lineTo(x - 16, y - 2); c.closePath(); c.fill();
    c.fillStyle = "#2f8f46"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, x, y - 20); c.restore();
  }

  /* ================= LOOP / SCREENS ================= */
  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(200, r.width); cssH = Math.max(300, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    zoom = Math.min(cssW / (8.6 * T), cssH / (9.5 * T));
    zoom = Math.max(zoom, 0.55);
    let sc = zoom * dpr;
    const px = MW * T * MH * T * sc * sc;
    if (px > 9e6) sc *= Math.sqrt(9e6 / px), dpr = sc / zoom;
    renderMap(zoom * dpr);
    vignette = document.createElement("canvas"); vignette.width = Math.round(cssW); vignette.height = Math.round(cssH);
    const v = vignette.getContext("2d"); const g = v.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.35, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
    g.addColorStop(0, "rgba(20,4,12,0)"); g.addColorStop(1, "rgba(20,4,12,.55)"); v.fillStyle = g; v.fillRect(0, 0, cssW, cssH);
    if (state) updateCamera(0, true);
  }
  window.addEventListener("resize", () => { if (!screens.game.hidden) resize(); });
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000; let dt = t - last; last = t;
    if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
    if (state && !state.paused) update(dt);
    render(t);
  }
  function startLoop() { if (running) return; running = true; last = performance.now() / 1000; raf = requestAnimationFrame(frame); }
  function stopLoop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener("visibilitychange", () => { last = performance.now() / 1000; for (const k in keys) keys[k] = false; });
  function startLevel() {
    state = newState(); placePickups(state); elevatorOpen = 0;
    $("hud-obj").textContent = OBJECTIVES[0];
    $("assist-bar").hidden = !easy;
    resize(); updateCamera(0, true);
    startLoop();
  }
  function showScreen(name) {
    Object.keys(screens).forEach((k) => (screens[k].hidden = k !== name));
    if (name === "game") startLevel(); else stopLoop();
    if (name === "reveal") setupRsvp();
    window.scrollTo(0, 0);
  }

  /* ================= CONFIG / UI ================= */
  function applyConfig() {
    const sample = !!config.sample;
    ["sample-badge", "sample-badge-2"].forEach((id) => ($(id).hidden = !sample));
    $("landing-line").textContent = config.landingLine || (config.hostName + " is sending you an invite. Pass the level to find out what it is!");
    $("landing-subline").textContent = config.landingSubline || "";
    const ol = $("howto-lines"); ol.innerHTML = "";
    (config.howToPlay || []).forEach((t) => { const li = document.createElement("li"); li.textContent = t; ol.appendChild(li); });
    $("event-name").textContent = config.eventName;
    $("field-date").textContent = config.date; $("field-time").textContent = config.time;
    $("field-location").textContent = config.location; $("field-host").textContent = config.hostName;
    $("extra-note").hidden = !config.extraNote; $("extra-note-text").textContent = config.extraNote || "";
    $("privacy-note").textContent = config.privacyNote || "No ads. No tracking.";
    document.querySelectorAll(".madeby").forEach((f) => { f.innerHTML = ""; const a = document.createElement("span"); a.innerHTML = "Made by <b></b>"; a.querySelector("b").textContent = config.madeBy; const t = document.createElement("span"); t.className = "tag"; t.textContent = config.tagline; f.appendChild(a); f.appendChild(t); });
  }
  function loadConfig() {
    return fetch("./config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => { config = Object.assign(config, c); applyConfig(); }).catch(() => applyConfig());
  }
  $("btn-begin").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("howto"); });
  $("btn-start").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("game"); });
  $("btn-skip").addEventListener("click", () => { unlockAudio(); sfx.tap(); stopLoop(); wipeToReveal(); });
  $("btn-replay").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("howto"); });
  $("btn-mute").addEventListener("click", () => { muted = !muted; $("btn-mute").textContent = muted ? "Sound off" : "Sound on"; if (!muted) unlockAudio(); });

  /* ================= RSVP ================= */
  const isLocalRsvp = () => { const ep = String(config.rsvpEndpoint || "local").trim(); return !ep || ep.toLowerCase() === "local"; };
  const storeKey = () => config.rsvpStorageKey || "playfair-stag-sample-rsvp";
  function rsvpPayload(form) {
    return {
      guestName: String(form.guestName.value || "").trim(), attending: form.attending.value, stayingOver: !!form.stayingOver.checked,
      message: String(form.message.value || "").trim(), eventName: config.eventName, date: config.date, time: config.time,
      location: config.location, hostName: config.hostName, sample: !!config.sample, submittedAt: new Date().toISOString(),
    };
  }
  function saveLocal(payload) {
    let list = []; try { list = JSON.parse(localStorage.getItem(storeKey()) || "[]"); if (!Array.isArray(list)) list = []; } catch (e) {}
    list.push(payload);
    try { localStorage.setItem(storeKey(), JSON.stringify(list)); localStorage.setItem(storeKey() + "-latest", JSON.stringify(payload)); } catch (e) {}
  }
  function showThanks(payload, localOnly) {
    $("rsvp-form").hidden = true; $("rsvp-thanks").hidden = false;
    const ans = payload.attending === "yes" ? "You're in!" : payload.attending === "maybe" ? "Marked as a maybe." : "Sorry you can't make it.";
    $("rsvp-thanks-lead").textContent = "Thanks, " + payload.guestName + "!";
    $("rsvp-thanks-body").textContent = ans + (payload.stayingOver ? " Room request noted." : "") +
      (localOnly ? " (Sample invite: this RSVP is saved on this device only and was not sent to anyone.)" : " Your RSVP is on its way to " + config.hostName + ".");
  }
  function setupRsvp() {
    const form = $("rsvp-form");
    try { const latest = JSON.parse(localStorage.getItem(storeKey() + "-latest") || "null"); if (latest && latest.guestName) showThanks(latest, isLocalRsvp()); } catch (e) {}
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";
    const err = $("rsvp-error"), btn = $("rsvp-submit");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault(); err.hidden = true;
      const payload = rsvpPayload(form);
      if (!payload.guestName) { err.hidden = false; err.textContent = "Please add your name."; form.guestName.focus(); return; }
      saveLocal(payload);
      if (isLocalRsvp()) { showThanks(payload, true); return; }
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(config.rsvpEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); showThanks(payload, false); })
        .catch(() => { err.hidden = false; err.textContent = "Could not send yet, but your RSVP is saved on this device. Please try again later."; btn.disabled = false; btn.textContent = "Send RSVP"; });
    });
  }

  /* ================= TEST HOOKS ================= */
  window.__invite = {
    show: showScreen, getState: () => state, config: () => config,
    pause: (v) => { if (state) state.paused = v !== false; },
    setStage(n) { const cp = CHECKPOINTS[n]; state.stage = n; state.p.x = cp.x * T; state.p.y = cp.y * T; $("hud-obj").textContent = OBJECTIVES[n]; state.flowTile = -1; updateCamera(0, true); },
    poseGameplay() {
      const s = state; s.p.x = 9 * T; s.p.y = 23.4 * T; s.p.aimX = 1; s.p.aimY = -0.1; s.p.face = 1; s.p.ammo = 6; s.hintT = 0; s.p.hp = 72; s.p.beers = 1;
      s.escorts = []; const mk = (type, x, y, hp) => { const e = Object.assign({ type, x: x * T, y: y * T, vx: -40, vy: 0, hp: hp, maxHp: TYPES[type].hp, r: TYPES[type].r, state: "chase", t: 0, flash: 0, walk: x, face: -1, say: "", sayT: 0, skin: SKIN[(x * 3) % 5 | 0], seed: x, kissT: 9, alpha: 1, zig: 0 }); s.escorts.push(e); return e; };
      mk("glam", 12, 23.2, 2).say = "Come here, handsome!"; s.escorts[0].sayT = 5; mk("skater", 13.2, 24.2, 2); mk("clinger", 14.4, 22.7, 3);
      s.sausages = [{ x: 10.6 * T, y: 22.9 * T, vx: 500, vy: -5, life: 1, sup: false, hit: new Set(), t: 0.3, spin: 1 }];
      burst(11.8 * T, 22.6 * T, "star", 6, ["#ffe28a", "#fff"], 60); pop(11.8 * T, 22.4 * T, "SMACK!", "#fff", 14, 2);
      s.paused = false; updateCamera(0, true);
    },
    poseSuper() {
      this.poseGameplay(); const s = state; s.p.superT = 3.4; s.sausages = [
        { x: 10.4 * T, y: 22.95 * T, vx: 600, vy: -10, life: 1, sup: true, hit: new Set(), t: 0.2, spin: 1 },
        { x: 11.6 * T, y: 22.9 * T, vx: 600, vy: -10, life: 1, sup: true, hit: new Set(), t: 0.2, spin: 1 }];
      pop(11.8 * T, 22.3 * T, "WHOMP!", "#9be3ff", 18, 2); updateCamera(0, true);
    },
    forceWin() { const s = state; s.stage = 4; s.boss = null; s.escorts = []; s.elevUnlocked = true; elevatorOpen = 1; s.p.x = 19.5 * T; s.p.y = 2.5 * T; s.p.superT = 0; startWin(); },
    damage: (n) => hurt(n || 10),
  };

  function boot() {
    Promise.resolve(loadConfig()).then(() => { showScreen("landing"); if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {}); });
  }
  boot();
})();
