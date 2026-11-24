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
      decodeVoices();
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

  /* ================= VOICE CLIPS (generated offline TTS, ~100 KB) ================= */
  const ESC_LINES = [["esc_sweetie", "Hey sweetie!"], ["esc_company", "Looking for company?"], ["esc_date", "Need a date, sugar?"], ["esc_handsome", "Where you goin', handsome?"], ["esc_mama", "Come give mama a hug!"], ["esc_shy", "Don't be shy, honey!"]];
  const SHOO_LINES = [["shoo_hmph", "Hmph!"], ["shoo_rude", "Rude!"], ["shoo_rude2", "Well! Rude!"], ["shoo_hmph2", "Hmph! Fine!"]];
  const DAVE_THROW = [["dave_lika", "You lika da sausage, eh?!"], ["dave_that", "Take that-a! That-a! That-a!"], ["dave_mamma", "Mamma mia, here comes da sausage!"]];
  const DAVE_FIRM = ["dave_firm", "Extra firm, baby!"];
  const VOICE_NAMES = [...ESC_LINES, ...SHOO_LINES, ...DAVE_THROW, DAVE_FIRM].map((l) => l[0]);
  const vraw = {}, vbuf = {};
  const vcd = { esc: 2.5, shoo: 0, dave: 2.0, lastEsc: "", lastDave: "" };
  VOICE_NAMES.forEach((n) => { vraw[n] = fetch("./audio/" + n + ".mp3").then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null); });
  let voicesDecoding = false;
  function decodeVoices() {
    if (voicesDecoding || !actx) return; voicesDecoding = true;
    VOICE_NAMES.forEach((n) => vraw[n].then((ab) => { if (!ab) return; try { const pr = actx.decodeAudioData(ab, (b) => (vbuf[n] = b), () => {}); if (pr && pr.then) pr.then((b) => (vbuf[n] = b)).catch(() => {}); } catch (e) {} }));
  }
  // One voice at a time: nothing ever cuts off a line. Escort lines are skipped while busy;
  // Dave's blue-pill line ("Extra firm, baby!") always plays: if busy it waits in a
  // priority slot and plays the moment the current line ends; nothing else starts meanwhile.
  let vBusyUntil = 0, vQueue = null;
  const voiceBusy = () => !actx || actx.currentTime < vBusyUntil;
  function playVoice(name, rate, vol) {
    if (!actx || muted || !vbuf[name] || voiceBusy()) return false;
    const src = actx.createBufferSource(), g = actx.createGain();
    src.buffer = vbuf[name]; src.playbackRate.value = rate || 1; g.gain.value = vol || 1.4;
    src.connect(g); g.connect(master); src.start();
    vBusyUntil = actx.currentTime + vbuf[name].duration / (rate || 1) + 0.25;
    window.__voiceLog = (window.__voiceLog || []).concat(name); (window.__voiceT = window.__voiceT || []).push([name, +actx.currentTime.toFixed(2), +(vBusyUntil - 0.25).toFixed(2)]);
    return true;
  }
  const pickLine = (arr, last) => { let l; for (let i = 0; i < 4; i++) { l = arr[(Math.random() * arr.length) | 0]; if (l[0] !== last) break; } return l; };
  function escVoiceRate(e) { if (!e.vp) e.vp = e.type === "diva" ? 0.88 : e.type === "skater" ? rand(1.06, 1.14) : rand(0.94, 1.06); return e.vp; }
  function voiceTick(dt) {
    vcd.esc -= dt; vcd.shoo -= dt; vcd.dave -= dt;
    const s = state; if (!s || s.phase !== "play") { vQueue = null; return; }
    if (vQueue) { if (!voiceBusy()) { const q = vQueue; vQueue = null; sayDave(q.line, 1.6); return; } }
    if (vcd.esc > 0 || voiceBusy()) return;
    let best = null, bd = 1e9;
    s.escorts.forEach((e) => { if (e.state !== "chase") return; const d = Math.hypot(e.x - s.p.x, e.y - s.p.y); if (d < bd) { bd = d; best = e; } });
    if (!best || bd > 8 * T || bd < 1.2 * T) return;
    const l = pickLine(ESC_LINES, vcd.lastEsc);
    if (playVoice(l[0], escVoiceRate(best), 1.3)) { vcd.lastEsc = l[0]; best.say = l[1]; best.sayT = 1.8; vcd.esc = rand(3.5, 6); }
    else vcd.esc = 0.5;
  }
  function voiceShoo(e) {
    if (vQueue || vcd.shoo > 0 || Math.random() > 0.6) return;
    const l = pickLine(SHOO_LINES, "");
    if (playVoice(l[0], escVoiceRate(e), 1.2)) { e.say = l[1]; e.sayT = 1.2; vcd.shoo = 1.6; vcd.esc = Math.max(vcd.esc, 1.5); }
  }
  function voiceDaveThrow(sup) {
    if (vcd.dave > 0 || Math.random() > 0.45) return;
    const l = pickLine(DAVE_THROW, vcd.lastDave);
    if (vQueue) return;
    if (sayDave(l, 1.5)) { vcd.lastDave = l[0]; vcd.dave = rand(5, 8); }
  }
  function sayDave(line, vol) { if (playVoice(line[0], 1, vol)) { state.daveSay = line[1]; state.daveSayT = Math.max(1.8, vbuf[line[0]].duration + 0.4); return true; } return false; }
  function voiceDave(line) { if (!sayDave(line, 1.6)) { if (actx && !muted && vbuf[line[0]]) vQueue = { line }; } else vcd.dave = Math.max(vcd.dave, 4); }

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
        aimX: 1, aimY: 0, ang: 0, face: 1, walk: 0, moving: false, kx: 0, ky: 0, grabbedBy: null, beers: 0, hurtT: 0 },
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
    if (FPV) { fpPointerDown(e, pt); return; }
    if (e.pointerType === "mouse") { mouse.down = true; mouse.active = true; mouse.x = pt.x; mouse.y = pt.y; return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (pt.x < cssW * 0.5 && !sticks.move) sticks.move = { id: e.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y };
    else if (!sticks.aim) sticks.aim = { id: e.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y };
  });
  canvas.addEventListener("pointermove", (e) => {
    const pt = canvasPt(e);
    if (FPV) { fpPointerMove(e, pt); return; }
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
    if (FPV) { fpPointerUp(e); return; }
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
        kind, color: colors[i % colors.length], rot: rand(0, 6), vr: rand(-8, 8), size: rand(3, 6), z: rand(18, 48), vz: rand(-20, 110) });
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
      sayT: 1.6, skin: SKIN[(Math.random() * SKIN.length) | 0], seed: Math.random() * 10, kissT: 2, alpha: 1, zig: rand(0, 6), vi: Math.random() < 0.5 ? 0 : 1 };
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
    sfx.shoo(); state.shooed++; voiceShoo(e);
    if (state.p.grabbedBy === e) state.p.grabbedBy = null;
    if (e.type === "diva") {
      state.boss = null; state.elevUnlocked = true; sfx.ding();
      pop(19.5 * T, 2.4 * T, "DING! Elevator open!", "#ffe28a", 22, 2.2);
      $("hud-obj").textContent = "The elevator is open. GO!";
      state.escorts.forEach((o) => { if (o !== e && o.state !== "shoo") shoo(o, state.p.x, state.p.y); });
    } else if (Math.random() < 0.13) state.pickups.push({ type: "beer", x: e.x, y: e.y, bob: 0 });
    else if (Math.random() < 0.04 && !state.pickups.some((k) => k.type === "pill")) state.pickups.push({ type: "pill", x: e.x, y: e.y, bob: 0 });
  }
  function nearestEnemy(range, coneDir, coneCos) {
    const p = state.p; let best = null, bd = range, yo = FPV ? 0 : 20, cc = coneCos || 0.93;
    for (const e of state.escorts) {
      if (e.state === "shoo") continue;
      const dx = e.x - p.x, dy = e.y - yo - p.y, d = Math.hypot(dx, dy);
      if (d > bd) continue;
      if (coneDir && (dx * coneDir.x + dy * coneDir.y) / d < cc) continue;
      if (!lineOfSight(p.x, p.y, e.x, e.y)) continue;
      best = e; bd = d;
    }
    return best;
  }
  function fireSausage() {
    const p = state.p, sup = p.superT > 0;
    let ax = p.aimX, ay = p.aimY;
    const t = nearestEnemy(380, { x: ax, y: ay }, FPV ? 0.975 : 0.93);
    if (t) { const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; ax = dx / d; ay = dy / d; }
    const yo = FPV ? 0 : 18; if (FPV) fpS.throwT = 0.22;
    const spd = sup ? 600 : 500;
    state.sausages.push({ x: p.x + ax * 16, y: p.y - yo + ay * 16, vx: ax * spd, vy: ay * spd, life: sup ? 1.0 : 0.85, sup, hit: new Set(), t: 0, spin: rand(-1, 1) });
    if (!sup) { p.ammo--; if (p.ammo <= 0) startReload(); }
    p.fire = sup ? 0.13 : 0.2;
    sup ? sfx.superThrow() : sfx.throw();
    voiceDaveThrow(sup);
  }

  function update(dt) {
    const s = state, p = s.p;
    s.t += dt;
    voiceTick(dt); if (s.daveSayT > 0) s.daveSayT -= dt;
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
    if (FPV) {
      let fw = 0, st = 0, turn = 0;
      if (keys.KeyW || keys.ArrowUp) fw += 1; if (keys.KeyS || keys.ArrowDown) fw -= 1;
      if (keys.KeyA) st -= 1; if (keys.KeyD) st += 1;
      if (keys.ArrowLeft || keys.KeyQ) turn -= 1; if (keys.ArrowRight || keys.KeyE) turn += 1;
      if (sticks.move) { fw = -(sticks.move.y - sticks.move.oy) / 56; st = (sticks.move.x - sticks.move.ox) / 56; }
      p.ang += turn * 2.6 * dt;
      const c = Math.cos(p.ang), sn = Math.sin(p.ang);
      mx = c * fw - sn * st; my = sn * fw + c * st;
    } else {
    if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1;
    if (sticks.move) { const dx = sticks.move.x - sticks.move.ox, dy = sticks.move.y - sticks.move.oy; mx = dx / 56; my = dy / 56; }
    }
    let ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; ml = 1; }
    if (ml < 0.12) { mx = my = 0; ml = 0; }
    let speed = 178 * (p.grabbedBy ? 0.42 : 1);
    moveBody(p, mx * speed * dt + p.kx * dt, my * speed * dt + p.ky * dt, p.r);
    p.kx *= Math.pow(0.002, dt); p.ky *= Math.pow(0.002, dt);
    p.moving = ml > 0; if (p.moving) p.walk += dt * 11 * ml;

    // aim + fire
    let firing = false;
    if (FPV) {
      p.aimX = Math.cos(p.ang); p.aimY = Math.sin(p.ang);
      firing = !!fpS.fire || (mouse.down && !isTouch) || !!keys.Space;
      if (firing) { const t = nearestEnemy(420, { x: p.aimX, y: p.aimY }, 0.94); if (t) { let da = Math.atan2(t.y - p.y, t.x - p.x) - p.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); p.ang += clamp(da, -2.2 * dt, 2.2 * dt); } }
      fpS.bob = p.moving ? Math.sin(p.walk) * 3 : 0;
      if (fpS.throwT > 0) fpS.throwT -= dt;
    } else if (sticks.aim) {
      const dx = sticks.aim.x - sticks.aim.ox, dy = sticks.aim.y - sticks.aim.oy, d = Math.hypot(dx, dy);
      if (d > 10) { p.aimX = dx / d; p.aimY = dy / d; }
      else { const t = nearestEnemy(420); if (t) { const ex = t.x - p.x, ey = t.y - p.y, el = Math.hypot(ex, ey) || 1; p.aimX = ex / el; p.aimY = ey / el; } }
      firing = true;
    } else if (mouse.active && !isTouch) {
      const wx = mouse.x / zoom + s.cam.x, wy = mouse.y / zoom + s.cam.y;
      const dx = wx - p.x, dy = wy - (p.y - 18), d = Math.hypot(dx, dy) || 1; p.aimX = dx / d; p.aimY = dy / d;
      firing = mouse.down;
    } else if (ml > 0) { p.aimX = mx / ml; p.aimY = my / ml; }
    if (keys.Space && !FPV) { firing = true; const t = nearestEnemy(420); if (t) { const ex = t.x - p.x, ey = t.y - p.y, el = Math.hypot(ex, ey) || 1; p.aimX = ex / el; p.aimY = ey / el; } }
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
          p.superT = SUPER_TIME; s.superFlash = 0.5; sfx.pill(); voiceDave(DAVE_FIRM);
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
          for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.28; state.kisses.push({ x: e.x, y: e.y - (FPV ? 0 : 40), vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, life: 2.5 }); }
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
      if (b.sup) { (b.trail || (b.trail = [])).push({ x: b.x, y: b.y }); if (b.trail.length > 9) b.trail.shift(); }
      if (b.sup && Math.random() < 0.6) s.parts.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.35, max: 0.35, kind: "spark", color: "#9be3ff", rot: 0, vr: 0, size: rand(2, 4) });
      let dead = b.life <= 0;
      const g = gAt(Math.floor(b.x / T), Math.floor((b.y + (FPV ? 0 : 18)) / T));
      if (g !== F && g !== ELEV) { dead = true; burst(b.x, b.y, "star", 4, ["#ffd0a8", "#c8643c"], 80); }
      if (!dead) for (const e of s.escorts) {
        if (e.state === "shoo" || b.hit.has(e)) continue;
        const hy = FPV ? e.y : e.y - 22 * TYPES[e.type].scale;
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
      let dead = k.life <= 0 || gAt(Math.floor(k.x / T), Math.floor((k.y + (FPV ? 0 : 20)) / T)) === W;
      if (!dead && Math.hypot(k.x - p.x, k.y - (p.y - (FPV ? 0 : 22))) < 20) {
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
      if (q.z !== undefined) { q.vz -= (q.kind === "feather" ? 40 : 160) * dt; q.z = Math.max(1, q.z + q.vz * dt); }
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
    if (FPV) {
      if (w.t < 1.0) { p.x += (19.5 * T - p.x) * Math.min(1, dt * 4); p.y += (2.3 * T - p.y) * Math.min(1, dt * 4); let da = -Math.PI / 2 - p.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); p.ang += da * Math.min(1, dt * 6); p.walk += dt * 9; p.moving = true; fpS.bob = Math.sin(p.walk) * 3; }
      else if (!w.turned) { w.turned = true; p.x = 19.5 * T; p.y = 2.22 * T; p.ang = Math.PI / 2 + 0.06; p.moving = false; fpS.bob = 0; }
    } else if (w.t < 1.0) {
      const tx = 19.5 * T, ty = 1.45 * T;
      p.x += (tx - p.x) * Math.min(1, dt * 4) + Math.sin(w.t * 14) * 1.2; p.y += (ty - p.y) * Math.min(1, dt * 4);
      p.walk += dt * 9; p.moving = true; p.aimX = 0; p.aimY = 1; p.face = Math.sin(w.t * 6) > 0 ? 1 : -1;
    } else p.moving = false;
    if (w.t >= 1.0 && !w.dinged) { w.dinged = true; sfx.door(); }
    if (w.t > 2.1 && !w.gag) { w.gag = true; w.g = 0; sfx.ding(); }
    if (w.gag) {
      const g0 = w.g; w.g += dt;
      gagSounds(g0, w.g); gagUpdate(w, dt);
      if (w.g > GAG.wipe && !w.wiped) { w.wiped = true; wipeToReveal(); }
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
    if (FPV) { fpRender(now); return; }
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
    if (sticks.aim && !FPV) drawStick(sticks.aim, "#ff5d8f");
    if (s.hintT > 0 && s.phase === "play") {
      c.globalAlpha = Math.min(1, s.hintT); c.fillStyle = "rgba(20,6,14,.7)";
      const msg = FPV ? (isTouch ? "Left thumb: move  ·  Drag right: look  ·  Hold THROW" : "WASD: move  ·  Mouse: look  ·  Click: throw") : isTouch ? "Left thumb: move  ·  Right thumb: aim + throw" : "WASD: move  ·  Mouse: aim  ·  Click: throw";
      c.font = "800 12px 'Avenir Next', sans-serif"; const w = c.measureText(msg).width + 24;
      rr(c, (cssW - w) / 2, cssH - 62, w, 28, 14); c.fill(); c.fillStyle = "#fff"; c.fillText(msg, cssW / 2, cssH - 47.5);
      if (isTouch && !sticks.move && !sticks.aim && !FPV) {
        c.globalAlpha *= 0.35; c.strokeStyle = "#ffe28a"; c.lineWidth = 3; c.beginPath(); c.arc(cssW * 0.22, cssH - 150, 48, 0, 7); c.stroke();
        c.strokeStyle = "#ff5d8f"; c.beginPath(); c.arc(cssW * 0.78, cssH - 150, 48, 0, 7); c.stroke();
      }
      c.globalAlpha = 1;
    }
  }
  /* ================= WIN GAG v3: disheveled Dave + cartoon puke ================= */
  const GAG = { hurk: 1.75, stream0: 2.4, stream1: 3.55, overflow: 3.05, worth: 3.95, floor7: 4.75, wipe: 5.9 };
  function gagGeo() {
    const k = Math.min(cssW / 300, cssH / 560), fy = cssH * 0.86;
    return { k, fy, dx: cssW * 0.34, bx: cssW * 0.78, by: fy - 4 * k };
  }
  function lerpC(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
    return "rgb(" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",") + ")";
  }
  function kissMark(c, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = "#e0245e";
    c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-6, -8, 0, -3); c.quadraticCurveTo(6, -8, 10, 0); c.quadraticCurveTo(0, 3, -10, 0); c.fill();
    c.beginPath(); c.moveTo(-10, 1); c.quadraticCurveTo(0, 11, 10, 1); c.quadraticCurveTo(0, 4, -10, 1); c.fill();
    c.restore();
  }
  function gagUpdate(w, dt) {
    const G = gagGeo(), g = w.g;
    w.drops = w.drops || []; w.fill = w.fill || 0; w.puddle = w.puddle || 0;
    if (g > GAG.stream0 && g < GAG.stream1) {
      w.fill = Math.min(1.3, w.fill + dt * 1.15);
      if (Math.random() < 0.6) for (let i = 0; i < 1; i++) w.drops.push({ x: G.bx + rand(-18, 18) * G.k, y: G.by - 70 * G.k, vx: rand(-160, 160) * G.k / 1.3, vy: rand(-330, -120) * G.k / 1.3, r: rand(3, 8) * G.k, chunk: Math.random() < 0.25, life: 1.4 });
      if (Math.random() < 0.25) { const m = w.mouth || { x: G.dx, y: G.fy - 250 * G.k }; w.drops.push({ x: m.x + rand(-6, 6) * G.k, y: m.y, vx: rand(20, 120) * G.k, vy: rand(-80, 20) * G.k, r: rand(2.5, 5) * G.k, chunk: false, life: 1.2 }); }
    }
    if (g > GAG.overflow) w.puddle = Math.min(1, w.puddle + dt * 0.7);
    w.drops.forEach((d) => { d.vy += 900 * G.k / 1.3 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; if (d.y > G.fy + 6 * G.k && !d.landed) { d.landed = true; d.vy *= -0.18; d.vx *= 0.3; d.y = G.fy + 6 * G.k; d.life = Math.min(d.life, 0.35); } });
    w.drops = w.drops.filter((d) => d.life > 0);
  }
  function gagSounds(g0, g) {
    const at = (t) => g0 < t && g >= t;
    if (at(1.0)) burp(0, 0.85);
    if (at(GAG.hurk)) { tone(230, 0.14, "square", 0.09, 140); }
    if (at(GAG.hurk + 0.32)) { tone(250, 0.16, "square", 0.1, 130); }
    if (at(GAG.stream0)) { noise(1.1, 0.24, 280, 1.1, 0, 110); tone(150, 1.0, "sawtooth", 0.07, 55); burp(0.05, 0.9); }
    [2.55, 2.85, 3.15, 3.4].forEach((t) => { if (at(t)) noise(0.22, 0.13, 1500 + Math.random() * 700, 1.2); });
    [3.6, 3.75, 3.9].forEach((t, i) => { if (at(t)) tone(1200 - i * 150, 0.07, "sine", 0.08, 500); });
    if (at(GAG.worth - 0.1)) tone(330, 0.55, "sine", 0.09, 220);
  }
  function drawSpiralEye(c, x, y, r, a) {
    c.save(); c.translate(x, y); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    c.rotate(a); c.beginPath(); for (let t = 0; t < 14; t += 0.25) { const rr2 = r * 0.85 * t / 14; c.lineTo(Math.cos(t) * rr2, Math.sin(t) * rr2); } c.lineWidth = 2.2; c.stroke(); c.restore();
  }
  function drawWreckedDave(c, now, g, G, w) {
    const k = G.k;
    const sway = g < GAG.stream0 ? Math.sin(now * 2.3) * 0.075 + Math.sin(now * 5.1) * 0.02 : g < GAG.stream1 ? 0.12 : Math.sin(now * 1.8) * 0.05;
    const green = clamp((g - 0.3) / 1.6, 0, 1) * (g > GAG.stream1 + 0.3 ? clamp(1 - (g - GAG.stream1 - 0.3) * 0.8, 0.35, 1) : 1);
    const skin = lerpC("#f2c29b", "#9ccf5a", green * 0.85), skinD = lerpC("#d99b74", "#6fa83c", green * 0.85);
    const puff = g > GAG.hurk && g < GAG.stream0 ? clamp((g - GAG.hurk) / (GAG.stream0 - GAG.hurk - 0.1), 0, 1) : 0;
    const spew = g >= GAG.stream0 && g < GAG.stream1;
    c.save(); c.translate(G.dx, G.fy); c.scale(k, k);
    c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.ellipse(0, 4, 70, 12, 0, 0, 7); c.fill();
    c.rotate(sway);
    c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4;
    // legs
    c.fillStyle = "#2b2f45";
    c.beginPath(); c.moveTo(-34, -120); c.lineTo(-38, -8); c.lineTo(-12, -8); c.lineTo(-4, -110); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(34, -120); c.lineTo(40, -8); c.lineTo(14, -8); c.lineTo(4, -110); c.closePath(); c.fill(); c.stroke();
    // left shoe, right sock (shoe missing)
    c.fillStyle = "#1b1b1f"; c.beginPath(); c.ellipse(-30, -4, 24, 10, -0.05, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(-38, -8, 8, 3, 0, 0, 7); c.fill();
    c.fillStyle = "#e9e4da"; c.beginPath(); c.ellipse(30, -4, 21, 9, 0.05, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#c28a72"; c.beginPath(); c.arc(46, -5, 4.5, 0, 7); c.fill(); c.lineWidth = 2; c.stroke(); c.lineWidth = 4;
    c.strokeStyle = "#b9b2a6"; c.lineWidth = 2; c.beginPath(); c.moveTo(14, -10); c.lineTo(20, -4); c.moveTo(22, -12); c.lineTo(28, -5); c.stroke(); c.strokeStyle = INK; c.lineWidth = 4;
    // belt + torso (shirt untucked, half open)
    c.fillStyle = "#3a2a1c"; c.fillRect(-38, -128, 76, 10); c.strokeRect(-38, -128, 76, 10);
    c.save(); c.rotate(spew ? 0.08 : 0);
    c.fillStyle = "#f7f4ee";
    c.beginPath(); c.moveTo(-44, -220); c.quadraticCurveTo(-52, -160, -48, -104); c.lineTo(-30, -98); c.lineTo(-16, -110); c.lineTo(-2, -100);
    c.lineTo(10, -112); c.lineTo(26, -96); c.lineTo(46, -112); c.quadraticCurveTo(52, -160, 44, -220); c.closePath(); c.fill(); c.stroke();
    // open collar V with chest
    c.fillStyle = skin; c.beginPath(); c.moveTo(-18, -222); c.lineTo(6, -168); c.lineTo(20, -222); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "#6a4a30"; c.lineWidth = 1.8; [[-2, -200], [6, -192], [2, -184]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 3, y - 4, x + 5, y); c.stroke(); });
    c.strokeStyle = INK; c.lineWidth = 4;
    c.fillStyle = "#fff"; [[-22, -226, -6, -206], [24, -226, 8, -204]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.lineTo(a + (a < 0 ? -10 : 10), b + 6); c.closePath(); c.fill(); c.stroke(); });
    // buttons (one hanging)
    c.fillStyle = "#cfc8bc"; c.beginPath(); c.arc(8, -150, 3, 0, 7); c.fill(); c.beginPath(); c.arc(10, -128, 3, 0, 7); c.fill();
    c.strokeStyle = "#8d877d"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(4, -165); c.lineTo(-2, -158); c.stroke(); c.fillStyle = "#cfc8bc"; c.beginPath(); c.arc(-3, -156, 3, 0, 7); c.fill();
    c.strokeStyle = INK; c.lineWidth = 4;
    // stains + GROOM sash crumpled
    c.fillStyle = "rgba(150,90,30,.25)"; c.beginPath(); c.ellipse(-24, -140, 9, 6, 0.4, 0, 7); c.fill();
    c.fillStyle = "#d7263d"; c.beginPath(); c.moveTo(-44, -214); c.lineTo(-30, -222); c.lineTo(46, -128); c.lineTo(36, -116); c.closePath(); c.fill(); c.stroke();
    c.save(); c.translate(-2, -170); c.rotate(0.86); c.fillStyle = "#fff"; c.font = "900 12px 'Avenir Next', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("GROOM", 0, 1); c.restore();
    kissMark(c, 28, -196, 0.9, 0.3); kissMark(c, -30, -150, 0.8, -0.5); kissMark(c, 22, -142, 0.7, 0.2);
    // arms: left gripping handrail behind, right on belly / wiping mouth after
    c.fillStyle = "#f7f4ee";
    c.beginPath(); c.moveTo(-42, -214); c.quadraticCurveTo(-86, -176, -96, -140); c.lineTo(-80, -132); c.quadraticCurveTo(-66, -168, -36, -186); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = skin; c.beginPath(); c.arc(-90, -134, 11, 0, 7); c.fill(); c.stroke();
    const wipe = g > GAG.stream1 + 0.05 && g < GAG.worth + 0.3;
    if (wipe) { c.fillStyle = "#f7f4ee"; c.beginPath(); c.moveTo(42, -212); c.quadraticCurveTo(70, -196, 30, -236); c.lineTo(20, -228); c.quadraticCurveTo(50, -200, 34, -190); c.closePath(); c.fill(); c.stroke(); c.fillStyle = skin; c.beginPath(); c.arc(24, -236, 11, 0, 7); c.fill(); c.stroke(); }
    else if (g > GAG.worth + 0.3) { // thumbs up
      c.fillStyle = "#f7f4ee"; c.beginPath(); c.moveTo(42, -212); c.quadraticCurveTo(100, -196, 112, -214); c.lineTo(104, -228); c.quadraticCurveTo(90, -210, 36, -190); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = skin; c.save(); c.translate(103, -246); c.rotate(-0.35); rr(c, -6, -20, 15, 26, 7); c.fill(); c.stroke(); c.restore(); rr(c, 98, -244, 30, 26, 9); c.fill(); c.stroke(); c.lineWidth = 2.5; [-236, -229, -222].forEach((yy) => { c.beginPath(); c.moveTo(116, yy); c.lineTo(127, yy); c.stroke(); }); c.lineWidth = 4;
      c.strokeStyle = "#ffe28a"; c.lineWidth = 3; [[132, -262, 142, -270], [134, -246, 146, -246], [126, -276, 130, -288]].forEach(([a, b2, x2, y2]) => { c.beginPath(); c.moveTo(a, b2); c.lineTo(x2, y2); c.stroke(); }); c.strokeStyle = INK; c.lineWidth = 4;
    } else { c.fillStyle = "#f7f4ee"; c.beginPath(); c.moveTo(42, -212); c.quadraticCurveTo(66, -170, 30, -150); c.lineTo(24, -162); c.quadraticCurveTo(46, -176, 34, -196); c.closePath(); c.fill(); c.stroke(); c.fillStyle = skin; c.beginPath(); c.ellipse(20, -152, 13, 10, 0, 0, 7); c.fill(); c.stroke(); }
    // head
    const hx = 0, hy = -262 + (spew ? 6 : 0), hs = 1 + puff * 0.04;
    c.save(); c.translate(hx, hy); c.rotate(spew ? 0.32 : -sway * 0.6); c.scale(hs, hs);
    c.fillStyle = skin; c.beginPath(); c.arc(-44, 2, 9, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(44, 2, 9, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, 0, 44, 46, 0, 0, 7); c.fill(); c.stroke();
    // messy hair
    c.fillStyle = "#5a3416";
    c.beginPath(); c.moveTo(-42, -12);
    [[-50, -40], [-34, -30], [-36, -62], [-16, -42], [-10, -72], [4, -46], [22, -70], [22, -42], [46, -54], [36, -28], [52, -26], [42, -10]].forEach(([x, y], i) => c.lineTo(x + Math.sin(now * 3 + i) * 1.5, y));
    c.quadraticCurveTo(0, -30, -42, -12); c.closePath(); c.fill(); c.stroke();
    // tie around forehead
    c.fillStyle = "#2a5fd1"; c.beginPath(); c.moveTo(-45, -18); c.quadraticCurveTo(0, -30, 45, -18); c.lineTo(44, -6); c.quadraticCurveTo(0, -18, -44, -6); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "#8fb3ff"; c.lineWidth = 2; for (let x = -36; x < 40; x += 12) { c.beginPath(); c.moveTo(x, -20 - (x * x) / 900 * 4 + 6); c.lineTo(x + 6, -8 - (x * x) / 900 * 4); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 4;
    const fl = Math.sin(now * 6) * 6;
    c.fillStyle = "#2a5fd1"; c.beginPath(); c.moveTo(42, -16); c.lineTo(78, -30 + fl); c.lineTo(84, -18 + fl); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(42, -12); c.lineTo(70, 6 - fl); c.lineTo(80, -2 - fl); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(44, -13, 6, 0, 7); c.fill(); c.stroke();
    // kiss marks on face
    kissMark(c, -26, -32 + 4, 0.8, -0.3); kissMark(c, 30, 20, 0.9, 0.4);
    // eyes
    if (spew) { c.lineWidth = 4; [[-16, -2], [16, -2]].forEach(([x, y], i) => { c.beginPath(); c.moveTo(x - 8, y - 6); c.lineTo(x + 8, y + (i ? 6 : -0) - 2); c.moveTo(x - 8, y + 4); c.lineTo(x + 8, y - 2); c.stroke(); }); }
    else if (g > GAG.stream1) { [[-16, -2], [16, -2]].forEach(([x, y]) => { c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, y, 10, 9, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = skin; c.beginPath(); c.ellipse(x, y - 4, 11, 6, 0, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(x + 1, y + 3, 3, 0, 7); c.fill(); }); }
    else { const r = 11 + puff * 3; drawSpiralEye(c, -17, -2, r, now * 7); drawSpiralEye(c, 17, -2, r, -now * 7 + 1); }
    // nose
    c.fillStyle = lerpC("#e98c74", "#7cb84a", green * 0.8); c.beginPath(); c.ellipse(0, 12, 8, 6, 0, 0, 7); c.fill(); c.lineWidth = 3; c.stroke(); c.lineWidth = 4;
    // cheeks + mouth
    if (puff > 0) {
      const cr = 10 + puff * 14; c.fillStyle = skinD;
      c.beginPath(); c.arc(-24, 24, cr, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(24, 24, cr, 0, 7); c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(-28, 18, cr * 0.3, 0, 7); c.fill(); c.beginPath(); c.arc(20, 18, cr * 0.3, 0, 7); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(0, 28, 6, 3 + puff * 2, 0, 0, 7); c.fill();
      c.strokeStyle = "rgba(120,170,60,.9)"; c.lineWidth = 3; c.beginPath(); c.moveTo(-50, -40); c.lineTo(-58, -50); c.moveTo(50, -40); c.lineTo(58, -50); c.stroke(); c.strokeStyle = INK; c.lineWidth = 4;
    } else if (spew) {
      c.fillStyle = "#3a1020"; c.beginPath(); c.ellipse(4, 28, 16, 14, 0, 0, 7); c.fill(); c.stroke();
    } else if (g > GAG.stream1) {
      c.beginPath(); c.moveTo(-14, 26); c.quadraticCurveTo(0, 36, 16, 24); c.stroke();
      c.fillStyle = "#9ed45a"; c.beginPath(); c.ellipse(12, 34 + ((now * 20) % 10), 3, 4, 0, 0, 7); c.fill();
    } else {
      c.beginPath(); c.moveTo(-14, 28); for (let x = -14; x <= 14; x += 4) c.lineTo(x, 28 + Math.sin(x * 0.8 + now * 9) * 2.5); c.stroke();
      c.fillStyle = "rgba(240,120,140,.45)"; c.beginPath(); c.arc(-28, 16, 8, 0, 7); c.fill(); c.beginPath(); c.arc(28, 16, 8, 0, 7); c.fill();
    }
    // sweat drops
    if (g < GAG.stream0 + 0.2) { c.fillStyle = "#bfe8ff"; const sy = (now * 60) % 30; c.beginPath(); c.moveTo(48, -30 + sy); c.quadraticCurveTo(56, -18 + sy, 48, -14 + sy); c.quadraticCurveTo(40, -18 + sy, 48, -30 + sy); c.fill(); c.lineWidth = 2; c.stroke(); c.lineWidth = 4; }
    c.restore();
    c.restore(); // torso rot
    c.restore();
    // mouth world pos for stream
    const ang = sway + (spew ? 0.08 : 0), hr = spew ? 0.32 : 0;
    const lx = 4, ly = hy + 28; const ca = Math.cos(ang), sa = Math.sin(ang), ch = Math.cos(hr + ang), shh = Math.sin(hr + ang);
    const hxW = hx * ca - hy * sa, hyW = hx * sa + hy * ca;
    w.mouth = { x: G.dx + (hxW + (lx * ch - 28 * shh)) * k, y: G.fy + (hyW + (lx * shh + 28 * ch)) * k };
    // dizzy stars / bubbles
    if (g < GAG.hurk) for (let i = 0; i < 3; i++) { const a = now * 3 + i * 2.1; const x = G.dx + Math.cos(a) * 60 * k, y = G.fy + (-345 + Math.sin(a) * 12) * k; c.fillStyle = "#ffe28a"; c.strokeStyle = INK; c.lineWidth = 2; star(c, x, y, 9 * k); }
  }
  function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); c.stroke(); }
  function drawBucket(c, G, w, now, front) {
    const k = G.k, x = G.bx, y = G.fy, bw = 46 * k, bh = 66 * k, tw = 58 * k;
    if (!front) {
      c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.ellipse(x, y + 4 * k, 64 * k, 11 * k, 0, 0, 7); c.fill();
      if (w.puddle > 0) { c.fillStyle = "#8fc443"; c.strokeStyle = "#4d7a1d"; c.lineWidth = 3; c.beginPath(); const pr = w.puddle; c.ellipse(x - 6 * k, y + 6 * k, (40 + 70 * pr) * k, (8 + 10 * pr) * k, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(x - 30 * k, y + 2 * k, 14 * k, 3 * k, 0, 0, 7); c.fill(); }
      return;
    }
    const g2 = c.createLinearGradient(x - tw, 0, x + tw, 0); g2.addColorStop(0, "#8d9aa6"); g2.addColorStop(0.35, "#eef3f7"); g2.addColorStop(0.6, "#b8c4ce"); g2.addColorStop(1, "#6f7b86");
    c.fillStyle = g2; c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x - tw, y - bh); c.lineTo(x - bw, y); c.lineTo(x + bw, y); c.lineTo(x + tw, y - bh); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#2a6fb3"; c.font = `900 ${Math.round(18 * k)}px 'Avenir Next', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ICE", x, y - bh * 0.45);
    // rim + contents
    c.fillStyle = "#53606b"; c.beginPath(); c.ellipse(x, y - bh, tw, 10 * k, 0, 0, 7); c.fill(); c.stroke();
    if (w.fill > 0.05) {
      const f = Math.min(1, w.fill); c.fillStyle = "#9ed45a"; c.beginPath(); c.ellipse(x, y - bh, tw * 0.92 * f + 4, 8 * k * f + 1, 0, 0, 7); c.fill();
      if (w.fill > 1) { // overflow crown + drips
        const o = Math.min(1, (w.fill - 1) * 4);
        c.fillStyle = "#9ed45a"; c.strokeStyle = "#4d7a1d"; c.lineWidth = 3;
        c.beginPath(); c.moveTo(x - tw - 4, y - bh); for (let i = 0; i <= 8; i++) { const xx = x - tw + i * tw / 4; c.quadraticCurveTo(xx - tw / 8, y - bh - (22 + Math.sin(i * 1.7 + now * 6) * 7) * k * o, xx, y - bh - 4 * k); } c.lineTo(x + tw + 4, y - bh + 4 * k); c.quadraticCurveTo(x, y - bh + 14 * k, x - tw - 4, y - bh); c.fill(); c.stroke();
        [[-0.85, 0.9], [-0.3, 0.55], [0.5, 0.75], [0.9, 1]].forEach(([fx, L], i) => { const len = (bh * 0.9) * L * o * (0.7 + 0.3 * Math.sin(now * 2 + i)); const xx = x + fx * tw * (1 - 0.15); c.beginPath(); c.moveTo(xx - 6 * k, y - bh); c.lineTo(xx - 5 * k, y - bh + len); c.arc(xx, y - bh + len, 5 * k, Math.PI, 0, true); c.lineTo(xx + 5 * k, y - bh); c.closePath(); c.fill(); c.stroke(); });
        c.fillStyle = "#ffb347"; [[-0.5, -8], [0.2, -12], [0.6, -6]].forEach(([fx, dy]) => { c.beginPath(); c.arc(x + fx * tw, y - bh + dy * k * o, 4 * k, 0, 7); c.fill(); });
      }
    }
  }
  function drawStream(c, G, w, now, g) {
    if (!(g >= GAG.stream0 && g < GAG.stream1 + 0.12) || !w.mouth) return;
    const k = G.k, m = w.mouth, ex = G.bx - 6 * k, ey = G.fy - 70 * k;
    const cx = m.x + (ex - m.x) * 0.85, cy = m.y - 30 * k;
    const head = clamp((g - GAG.stream0) / 0.16, 0, 1), tail = clamp((g - GAG.stream1 + 0.1) / 0.2, 0, 1);
    const P = (t) => [(1 - t) * (1 - t) * m.x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * m.y + 2 * (1 - t) * t * cy + t * t * ey];
    const N = 40, base = 13 * k * (g > GAG.stream1 - 0.3 ? clamp((GAG.stream1 - g) / 0.3 + 0.3, 0.3, 1) : 1);
    const pts = []; for (let i = 0; i <= N; i++) { const t = i / N; if (t <= head && t >= tail) pts.push([t, ...P(t)]); }
    if (pts.length > 1) {
      c.lineCap = "round"; c.lineJoin = "round";
      for (let pass = 0; pass < 3; pass++) {
        c.strokeStyle = pass === 0 ? "#3f6d16" : pass === 1 ? "#a6dc5c" : "rgba(220,255,170,.7)";
        for (let i = 1; i < pts.length; i++) {
          const t = pts[i][0], wv = (0.8 + 0.3 * Math.sin(t * 18 - now * 28)) * (1 - 0.2 * t);
          c.lineWidth = pass === 0 ? base * 2 * wv + 7 : pass === 1 ? base * 2 * wv : base * 0.5 * wv;
          c.beginPath(); c.moveTo(pts[i - 1][1] - (pass === 2 ? base * 0.4 : 0), pts[i - 1][2] - (pass === 2 ? base * 0.5 : 0)); c.lineTo(pts[i][1] - (pass === 2 ? base * 0.4 : 0), pts[i][2] - (pass === 2 ? base * 0.5 : 0)); c.stroke();
        }
      }
    }
    const chunkC = ["#ffb347", "#f6e05e", "#e0763a", "#ffd2a0"];
    for (let i = 0; i < 9; i++) { const t = ((now * 1.6 + i / 9) % 1); if (t > head || t < tail) continue; const [x, y] = P(t); c.fillStyle = chunkC[i % 4]; c.strokeStyle = "#5a3a12"; c.lineWidth = 1.5; c.beginPath(); c.rect(x - 4 * k + Math.sin(i) * 4 * k, y - 3 * k, 6 * k, 5 * k); c.fill(); c.stroke(); }
    if (head >= 1) { // splash crown at bucket
      c.fillStyle = "#a6dc5c"; c.strokeStyle = "#3f6d16"; c.lineWidth = 3;
      for (let i = 0; i < 6; i++) { const a = -Math.PI + (i + 0.5) * Math.PI / 6, L = (18 + 10 * Math.sin(now * 25 + i * 2)) * k; c.beginPath(); c.ellipse(ex + Math.cos(a) * L, ey + Math.sin(a) * L * 0.8, 5 * k, 8 * k, a + Math.PI / 2, 0, 7); c.fill(); c.stroke(); }
    }
  }
  function drawDrops(c, w) {
    (w.drops || []).forEach((d) => { c.globalAlpha = clamp(d.life * 3, 0, 1); c.fillStyle = d.chunk ? "#ffb347" : "#a6dc5c"; c.strokeStyle = d.chunk ? "#7a4a12" : "#3f6d16"; c.lineWidth = 2;
      c.beginPath(); if (d.landed) c.ellipse(d.x, d.y, d.r * 1.5, d.r * 0.5, 0, 0, 7); else c.ellipse(d.x, d.y, d.r * 0.85, d.r * 1.15, Math.atan2(d.vy, d.vx) + Math.PI / 2, 0, 7); c.fill(); c.stroke(); });
    c.globalAlpha = 1;
  }
  function drawElevatorInterior(c, g, now) {
    const H = cssH, Wd = cssW;
    const bg = c.createLinearGradient(0, 0, Wd, 0); bg.addColorStop(0, "#6b4a17"); bg.addColorStop(0.18, "#c79a3e"); bg.addColorStop(0.5, "#f0cf7a"); bg.addColorStop(0.82, "#c79a3e"); bg.addColorStop(1, "#6b4a17");
    c.fillStyle = bg; c.fillRect(-20, 0, Wd + 40, H);
    // brushed lines
    c.globalAlpha = 0.12; c.strokeStyle = "#fff7dc"; c.lineWidth = 1; for (let x = 0; x < Wd; x += 3) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + ((x * 7) % 5) - 2, H * 0.86); c.stroke(); } c.globalAlpha = 1;
    // panels
    const pw = Wd * 0.26; [Wd * 0.04, Wd * 0.37, Wd * 0.7].forEach((x, i) => {
      c.strokeStyle = "rgba(80,50,10,.55)"; c.lineWidth = 3; rr(c, x, H * 0.16, pw, H * 0.36, 8); c.stroke();
      c.strokeStyle = "rgba(255,245,210,.5)"; c.lineWidth = 1.5; rr(c, x + 3, H * 0.16 + 3, pw - 6, H * 0.36 - 6, 6); c.stroke();
      if (i === 1) { const mg = c.createLinearGradient(x, H * 0.16, x + pw, H * 0.52); mg.addColorStop(0, "rgba(255,255,255,.28)"); mg.addColorStop(0.5, "rgba(255,255,255,.05)"); mg.addColorStop(1, "rgba(255,255,255,.2)"); c.fillStyle = mg; rr(c, x + 3, H * 0.16 + 3, pw - 6, H * 0.36 - 6, 6); c.fill(); }
    });
    // handrail
    const hy = H * 0.6; const hg = c.createLinearGradient(0, hy - 8, 0, hy + 8); hg.addColorStop(0, "#5a3416"); hg.addColorStop(0.4, "#a8643a"); hg.addColorStop(1, "#3a1f0c");
    c.fillStyle = hg; rr(c, -10, hy - 8, Wd + 20, 16, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    // floor: marble with carpet runner
    const fy = H * 0.8; const fg = c.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, "#3a2212"); fg.addColorStop(1, "#1d0f08"); c.fillStyle = fg; c.fillRect(-20, fy, Wd + 40, H - fy);
    c.fillStyle = "#7a1d3f"; c.beginPath(); c.moveTo(Wd * 0.1, fy); c.lineTo(Wd * 0.9, fy); c.lineTo(Wd * 1.05, H); c.lineTo(-Wd * 0.05, H); c.closePath(); c.fill();
    c.strokeStyle = "#e3b341"; c.lineWidth = 3; c.beginPath(); c.moveTo(Wd * 0.14, fy + 4); c.lineTo(Wd * 0.86, fy + 4); c.lineTo(Wd * 0.98, H - 6); c.lineTo(Wd * 0.02, H - 6); c.closePath(); c.stroke();
    c.strokeStyle = "rgba(0,0,0,.6)"; c.lineWidth = 4; c.beginPath(); c.moveTo(-20, fy); c.lineTo(Wd + 20, fy); c.stroke();
    // ceiling light strip
    const lg = c.createLinearGradient(0, 0, 0, 40); lg.addColorStop(0, "#fff8e0"); lg.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = lg; c.fillRect(0, 0, Wd, 40);
    // button panel
    const bx = Wd - 34, by = H * 0.3; c.fillStyle = "#2a1a0c"; rr(c, bx - 14, by, 28, 120, 8); c.fill(); c.strokeStyle = "#e3b341"; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 7; i++) { c.fillStyle = i === 6 ? (Math.sin(now * 6) > 0 ? "#ffcf5a" : "#a37a2a") : "#7a6a52"; c.beginPath(); c.arc(bx, by + 12 + i * 16, 5, 0, 7); c.fill(); }
  }
  function renderGag(now) {
    const s = state, w = s.win, g = w.g, c = ctx, G = gagGeo();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shake = g > GAG.hurk && g < GAG.stream0 ? 3 : g >= GAG.stream0 && g < GAG.stream1 ? 2 : g < 1.4 ? 1.2 : 0;
    c.save(); c.translate(Math.sin(now * 47) * shake, Math.cos(now * 39) * shake * 0.6);
    drawElevatorInterior(c, g, now);
    // floor indicator
    const floors = ["7", "6", "5", "4", "3", "2", "1", "G"], fi = Math.min(floors.length - 1, Math.floor(g / 0.42));
    c.fillStyle = "#1c0812"; rr(c, cssW / 2 - 56, 64, 112, 50, 12); c.fill(); c.strokeStyle = "#e3b341"; c.lineWidth = 3; c.stroke();
    c.shadowColor = "#ff8a3d"; c.shadowBlur = 12; c.fillStyle = "#ff8a3d"; c.font = "900 30px 'Avenir Next', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((fi < floors.length - 1 ? "▼ " : "") + floors[fi], cssW / 2, 90); c.shadowBlur = 0;
    drawBucket(c, G, w, now, false);
    drawWreckedDave(c, now, g, G, w);
    drawBucket(c, G, w, now, true);
    drawStream(c, G, w, now, g);
    drawDrops(c, w);
    // stink lines after
    if (g > GAG.stream1) { c.strokeStyle = "rgba(140,190,70,.7)"; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const x = G.bx + (i - 1) * 18 * G.k, y0 = G.fy - 100 * G.k; c.beginPath(); for (let t = 0; t < 1; t += 0.1) c.lineTo(x + Math.sin(t * 9 + now * 4 + i) * 5, y0 - t * 60 * G.k - ((now * 20) % 10)); c.stroke(); } }
    c.restore();
    // vignette + green tint
    const vg = c.createRadialGradient(cssW / 2, cssH * 0.55, cssH * 0.25, cssW / 2, cssH * 0.55, cssH * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(20,8,4,.55)"); c.fillStyle = vg; c.fillRect(0, 0, cssW, cssH);
    if (g > GAG.hurk && g < GAG.stream1) { c.fillStyle = `rgba(120,200,60,${0.08 + 0.05 * Math.sin(now * 8)})`; c.fillRect(0, 0, cssW, cssH); }
    // text
    if (g > 1.0 && g < 1.65) bubbleBig(G.dx + 90 * G.k, G.fy - 330 * G.k, "BUUURP!");
    if (g > GAG.hurk && g < GAG.stream0) { c.save(); c.font = "italic 900 24px 'Avenir Next', sans-serif"; c.textAlign = "center"; c.lineWidth = 5; c.strokeStyle = INK; c.fillStyle = "#c8f08a"; const t = g > GAG.hurk + 0.32 ? "hurk… HURK…" : "hurk…"; c.strokeText(t, G.dx + 40, G.fy - 350 * G.k); c.fillText(t, G.dx + 40, G.fy - 350 * G.k); c.restore(); }
    if (g >= GAG.stream0 && g < GAG.stream1 + 0.2) { const p = clamp((g - GAG.stream0) / 0.15, 0, 1); c.save(); c.translate(cssW / 2 + Math.sin(now * 50) * 3, 168); c.rotate(-0.06); c.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p); c.font = "900 46px 'Avenir Next', 'Segoe UI', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 10; c.strokeStyle = INK; c.strokeText("BLAAARGH!", 0, 0); c.fillStyle = "#9ed45a"; c.fillText("BLAAARGH!", 0, 0); c.restore(); }
    const cap = g > GAG.floor7 ? "What happens on Floor 7…" : g > GAG.worth ? "Worth it." : "";
    if (cap) { c.save(); c.font = (g > GAG.floor7 ? "900 24px" : "900 40px") + " 'Avenir Next', 'Segoe UI', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 8; c.strokeStyle = INK; c.strokeText(cap, cssW / 2, 168); c.fillStyle = "#ffe28a"; c.fillText(cap, cssW / 2, 168); if (g > GAG.floor7) { c.font = "900 30px 'Avenir Next', sans-serif"; c.strokeText("Worth it.", cssW / 2, 210); c.fillText("Worth it.", cssW / 2, 210); } c.restore(); }
  }
  function bubbleBig(x, y, text) {
    const c = ctx; c.save(); c.font = "900 22px 'Avenir Next', sans-serif";
    const w = c.measureText(text).width + 26; x = Math.min(x, cssW - w / 2 - 6);
    c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 3; rr(c, x - w / 2, y - 40, w, 40, 20); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 30, y - 2); c.lineTo(x - 44, y + 14); c.lineTo(x - 16, y - 2); c.closePath(); c.fill();
    c.fillStyle = "#2f8f46"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, x, y - 20); c.restore();
  }

  /* ================= FIRST-PERSON: TEXTURES + SPRITES ================= */
  const FPV = !/[?&]view=topdown/.test(location.search);
  const WALL_H = 84, EYE = 38, FOVH = 1.2, TANF = Math.tan(FOVH / 2), TEX = 128, TEXK = TEX / T, LMS = 6;
  const FOGC = [34, 13, 22], FOG0 = 60, FOG1 = 600;
  const TIERS = [0.8, 0.6, 0.45];
  const qp = /[?&]q=(\d)/.exec(location.search);
  const fpS = { tier: qp ? +qp[1] : (isTouch ? 1 : 0), lockTier: !!qp, IW: 0, IH: 0, buf: null, img: null, cv: null, cx: null, z: null,
    tex: null, ft: 0, fn: 0, look: null, fire: null, throwT: 0, bob: 0, hor: 0, proj: 0 };
  const mkC = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  function noiseFx(g, w, h, a) { const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * a; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0); }
  function makeTex(w, h, draw, emis) {
    const c = mkC(w, h), g = c.getContext("2d"); draw(g, w, h);
    const id = g.getImageData(0, 0, w, h);
    for (let i = 3; i < id.data.length; i += 4) id.data[i] = 255;
    if (emis) { const m = mkC(w, h), mg = m.getContext("2d"); emis(mg, w, h); const md = mg.getImageData(0, 0, w, h).data; for (let i = 3; i < md.length; i += 4) if (md[i] > 100) id.data[i] = 254; }
    return { w, h, d: new Uint32Array(id.data.buffer) };
  }
  function damask(g, x, y) { g.beginPath(); g.ellipse(x, y, 3.5, 6, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 7, y + 6); g.quadraticCurveTo(x, y - 1, x + 7, y + 6); g.lineTo(x, y + 10); g.closePath(); g.fill(); g.beginPath(); g.arc(x, y - 8, 1.8, 0, 7); g.fill(); }
  function wpBase(g, w, h) {
    g.fillStyle = "#ead7ad"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = "#dcc18d"; g.fillRect(x + 13, 8, 6, 70); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + 13, 8, 1, 70); }
    g.fillStyle = "rgba(168,118,58,.38)";
    for (let y = 22, r = 0; y < 76; y += 22, r++) for (let x = (r % 2) * 16 + 0; x < w + 8; x += 32) damask(g, x, y);
    g.fillStyle = "#4a2c18"; g.fillRect(0, 0, w, 5); g.fillStyle = "#f5e8cc"; g.fillRect(0, 5, w, 3); g.fillStyle = "#b08a58"; g.fillRect(0, 8, w, 1);
    g.fillStyle = "#7a4e2c"; g.fillRect(0, 76, w, 6); g.fillStyle = "#b07e50"; g.fillRect(0, 76, w, 2); g.fillStyle = "#3a2214"; g.fillRect(0, 81, w, 1);
    g.fillStyle = "#5e3a22"; g.fillRect(0, 82, w, 38);
    for (let x = 4; x < w; x += 32) { g.fillStyle = "#43271a"; g.fillRect(x, 87, 24, 28); g.fillStyle = "#6e4628"; g.fillRect(x + 2, 89, 20, 24); g.fillStyle = "rgba(255,220,170,.16)"; g.fillRect(x + 2, 89, 20, 2); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + 2, 111, 20, 2); }
    g.fillStyle = "#2e1a0e"; g.fillRect(0, 120, w, 8); g.fillStyle = "#6a4426"; g.fillRect(0, 120, w, 1);
  }
  function texWall() { return makeTex(TEX, TEX, (g, w, h) => { wpBase(g, w, h); noiseFx(g, w, h, 9); }); }
  function texSconce() {
    return makeTex(TEX, TEX, (g, w, h) => {
      wpBase(g, w, h);
      const rg = g.createRadialGradient(64, 36, 4, 64, 40, 62); rg.addColorStop(0, "rgba(255,226,150,.85)"); rg.addColorStop(0.5, "rgba(255,200,110,.3)"); rg.addColorStop(1, "rgba(255,200,110,0)");
      g.fillStyle = rg; g.fillRect(0, 0, w, 82);
      noiseFx(g, w, h, 8);
      g.fillStyle = "#8a6420"; g.fillRect(60, 40, 8, 18); g.fillStyle = "#e3b341"; g.beginPath(); g.ellipse(64, 58, 8, 4, 0, 0, 7); g.fill();
      g.fillStyle = "#c9922e"; g.fillRect(62, 38, 4, 6);
      g.fillStyle = "#fff4cf"; g.beginPath(); g.moveTo(50, 40); g.lineTo(78, 40); g.lineTo(72, 22); g.lineTo(56, 22); g.closePath(); g.fill();
      g.strokeStyle = "#c9922e"; g.lineWidth = 1.5; g.stroke();
    }, (g) => { g.fillStyle = "#fff"; g.beginPath(); g.moveTo(51, 39); g.lineTo(77, 39); g.lineTo(71, 23); g.lineTo(57, 23); g.closePath(); g.fill(); });
  }
  function texArt(kind) {
    return makeTex(TEX, TEX, (g, w, h) => {
      wpBase(g, w, h); noiseFx(g, w, h, 8);
      g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(34, 20, 64, 50);
      const fg = g.createLinearGradient(0, 16, 0, 68); fg.addColorStop(0, "#ffe08a"); fg.addColorStop(1, "#9a6a1e");
      g.fillStyle = fg; g.fillRect(30, 16, 68, 52);
      const sky = g.createLinearGradient(0, 22, 0, 62); sky.addColorStop(0, kind ? "#f7a35c" : "#7fb6d9"); sky.addColorStop(1, kind ? "#ffd9a0" : "#d9ecf2");
      g.fillStyle = sky; g.fillRect(36, 22, 56, 40);
      g.fillStyle = kind ? "#6a3a2a" : "#3d6b4a"; g.beginPath(); g.moveTo(36, 62); g.quadraticCurveTo(52, 44, 66, 54); g.quadraticCurveTo(80, 40, 92, 52); g.lineTo(92, 62); g.closePath(); g.fill();
      g.fillStyle = "#2a1a10"; g.beginPath(); g.ellipse(64, 52, 7, 3.5, 0, 0, 7); g.fill(); g.fillRect(58, 53, 1.6, 7); g.fillRect(68, 53, 1.6, 7);
      g.beginPath(); g.ellipse(71, 47, 2.5, 3, 0.3, 0, 7); g.fill();
      g.strokeStyle = "#2a1a10"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(71, 44); g.lineTo(68, 37); g.moveTo(69.5, 40); g.lineTo(66, 39); g.moveTo(72, 44); g.lineTo(76, 37); g.moveTo(74, 40); g.lineTo(78, 39); g.stroke();
      g.fillStyle = "#c9922e"; g.fillRect(60, 70, 8, 3);
    });
  }
  function texDoor(num, dnd, open) {
    return makeTex(TEX, TEX, (g, w, h) => {
      wpBase(g, w, h); noiseFx(g, w, h, 8);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(21, 11, 86, 117);
      g.fillStyle = "#6b4226"; g.fillRect(24, 12, 80, 116); g.fillStyle = "#93603a"; g.fillRect(24, 12, 80, 3); g.fillRect(24, 12, 3, 116);
      if (open) {
        const ig = g.createLinearGradient(0, 18, 0, 128); ig.addColorStop(0, "#fff2c4"); ig.addColorStop(1, "#d89a48");
        g.fillStyle = ig; g.fillRect(30, 18, 68, 110);
        g.fillStyle = "#b8743a"; g.fillRect(40, 92, 48, 18); g.fillStyle = "#fff"; g.fillRect(42, 86, 44, 8);
        g.fillStyle = "#7a4a2a"; g.beginPath(); g.moveTo(30, 18); g.lineTo(42, 24); g.lineTo(42, 122); g.lineTo(30, 128); g.closePath(); g.fill();
        return;
      }
      const dg = g.createLinearGradient(30, 0, 98, 0); dg.addColorStop(0, "#74462a"); dg.addColorStop(0.5, "#9c643a"); dg.addColorStop(1, "#6a3e22");
      g.fillStyle = dg; g.fillRect(30, 18, 68, 110);
      for (let y = 20; y < 128; y += 3) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(30, y, 68, 1); }
      [[36, 48, 26, 30], [66, 48, 26, 30], [36, 86, 26, 34], [66, 86, 26, 34]].forEach(([x, y, pw, ph]) => {
        g.fillStyle = "rgba(0,0,0,.32)"; g.fillRect(x, y, pw, ph); g.fillStyle = "rgba(255,214,170,.22)"; g.fillRect(x + 2, y + 2, pw - 2, ph - 2); g.fillStyle = dg; g.fillRect(x + 3, y + 3, pw - 6, ph - 6);
      });
      const bg = g.createLinearGradient(0, 24, 0, 41); bg.addColorStop(0, "#fff3b8"); bg.addColorStop(0.45, "#e2b24a"); bg.addColorStop(1, "#8a6420");
      g.fillStyle = "#3a2408"; g.fillRect(45, 23, 38, 19); g.fillStyle = bg; g.fillRect(46, 24, 36, 17);
      g.fillStyle = "#4a2e08"; g.font = "bold 13px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(num), 64, 33);
      g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(47, 25, 34, 2);
      g.fillStyle = "#e3b341"; g.beginPath(); g.arc(64, 45, 1.8, 0, 7); g.fill();
      const kg = g.createRadialGradient(88, 79, 1, 90, 82, 7); kg.addColorStop(0, "#fff6c8"); kg.addColorStop(1, "#8a6018"); g.fillStyle = kg; g.beginPath(); g.arc(90, 82, 5.5, 0, 7); g.fill();
      g.fillStyle = "#c9a24a"; g.fillRect(87, 88, 6, 11); g.fillStyle = "#3a2408"; g.fillRect(89, 91, 2, 4);
      if (dnd) { g.fillStyle = "#d7263d"; g.fillRect(82, 92, 16, 24); g.fillStyle = "#fff"; g.font = "bold 4.5px Arial"; g.fillText("DO NOT", 90, 101); g.fillText("DISTURB", 90, 107); }
    });
  }
  const elevCache = {};
  function texElev(open) {
    const key = Math.round(open * 10);
    if (elevCache[key]) return elevCache[key];
    const o = key / 10;
    return (elevCache[key] = makeTex(384, TEX, (g, w, h) => {
      wpBase(g, w, h);
      const fg = g.createLinearGradient(0, 0, 0, h); fg.addColorStop(0, "#ffe7a0"); fg.addColorStop(0.5, "#c99a3c"); fg.addColorStop(1, "#7a5518");
      g.fillStyle = "#2a1a0c"; g.fillRect(28, 10, w - 56, h - 10); g.fillStyle = fg; g.fillRect(32, 12, w - 64, h - 12);
      g.fillStyle = "#1a0a06"; g.fillRect(160, 16, 64, 18); g.fillStyle = "#ff9a3d"; g.font = "bold 14px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("\u25B2 7", 192, 25.5);
      const ix = 52, iw = w - 104, iy = 40;
      const ig = g.createLinearGradient(0, iy, 0, h); ig.addColorStop(0, "#fff8e0"); ig.addColorStop(1, "#d1a14a");
      g.fillStyle = ig; g.fillRect(ix, iy, iw, h - iy);
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(ix + 30, iy + 8, iw - 60, 34); g.fillStyle = "#a07a34"; g.fillRect(ix, iy + 52, iw, 5);
      g.fillStyle = "#7a1d3f"; g.fillRect(ix, h - 10, iw, 10);
      const half = (iw / 2) * (1 - o * 0.95);
      const dgr = g.createLinearGradient(0, 0, 60, 0); dgr.addColorStop(0, "#b8913e"); dgr.addColorStop(0.5, "#f2d27e"); dgr.addColorStop(1, "#a17a2e");
      g.fillStyle = dgr;
      g.save(); g.fillRect(ix, iy, half, h - iy); g.fillRect(ix + iw - half, iy, half, h - iy);
      g.fillStyle = "rgba(90,60,20,.18)"; for (let x = ix; x < ix + half; x += 3) g.fillRect(x, iy, 1, h - iy); for (let x = ix + iw - half; x < ix + iw; x += 3) g.fillRect(x, iy, 1, h - iy);
      g.fillStyle = "#5a4214"; g.fillRect(ix + half - 2, iy, 2, h - iy); g.fillRect(ix + iw - half, iy, 2, h - iy);
      g.restore();
      g.fillStyle = "#1a0a06"; g.fillRect(w - 46, 70, 10, 22); g.fillStyle = "#7dff9a"; g.beginPath(); g.arc(w - 41, 77, 2.6, 0, 7); g.fill();
    }, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(161, 17, 62, 16); g.fillRect(w - 44, 74, 6, 6); if (o > 0.05) { const iw = w - 104, half = (iw / 2) * (1 - o * 0.95); g.fillRect(52 + half, 40, iw - half * 2, 52); } }));
  }
  function texCarpet() {
    return makeTex(TEX, TEX, (g, w, h) => {
      g.fillStyle = "#6c1531"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 4) { g.fillStyle = "rgba(0,0,0,.07)"; g.fillRect(0, y, w, 2); }
      const c = w / 2, dia = (x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); };
      g.strokeStyle = "#d4a54a"; g.lineWidth = 4; dia(c, c, c - 5); g.stroke();
      g.strokeStyle = "#8e2447"; g.lineWidth = 2; dia(c, c, c - 13); g.stroke();
      g.fillStyle = "#1f3557"; dia(c, c, 26); g.fill(); g.strokeStyle = "#d4a54a"; g.lineWidth = 2; dia(c, c, 26); g.stroke();
      g.fillStyle = "#e9be5c"; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(c + Math.cos(i * Math.PI / 2) * 9, c + Math.sin(i * Math.PI / 2) * 9, 5, 5, 0, 0, 7); g.fill(); }
      g.fillStyle = "#b0203f"; g.beginPath(); g.arc(c, c, 4.5, 0, 7); g.fill();
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(([x, y]) => { g.fillStyle = "#1f3557"; dia(x, y, 16); g.fill(); g.fillStyle = "#d4a54a"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); });
      g.fillStyle = "rgba(233,190,92,.75)"; [[c, 13], [c, h - 13], [13, c], [w - 13, c]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); });
      noiseFx(g, w, h, 22);
    });
  }
  function texCeil(light) {
    return makeTex(64, 64, (g, w, h) => {
      g.fillStyle = "#efe2c8"; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(120,90,50,.18)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
      if (light) { g.fillStyle = "#b8a27a"; g.beginPath(); g.arc(32, 32, 12, 0, 7); g.fill(); g.fillStyle = "#fffbe8"; g.beginPath(); g.arc(32, 32, 9, 0, 7); g.fill(); }
      noiseFx(g, w, h, 10);
    }, light ? (g) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(32, 32, 9, 0, 7); g.fill(); } : null);
  }

  /* ---- sprites (pre-rendered, outlined) ---- */
  const SPR = 1.5;
  function outlined(w, h, draw, ow) {
    const a = mkC(w * SPR, h * SPR), ag = a.getContext("2d"); ag.scale(SPR, SPR); ag.lineJoin = "round"; ag.lineCap = "round"; draw(ag);
    const sil = mkC(a.width, a.height), sg = sil.getContext("2d"); sg.drawImage(a, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#140a0e"; sg.fillRect(0, 0, sil.width, sil.height);
    const out = mkC(a.width, a.height), og = out.getContext("2d"); const o = (ow || 2.2) * SPR;
    for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; og.drawImage(sil, Math.cos(an) * o, Math.sin(an) * o); }
    og.drawImage(a, 0, 0); return out;
  }
  function limb(g, x0, y0, x1, y1, x2, y2, col, w) {
    g.strokeStyle = INK; g.lineWidth = w + 4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
  }
  function drawEscortFront(g, type, skin, ph, mode) {
    const tp = TYPES[type], long = type === "diva", sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 2.2;
    g.translate(0, 8);
    g.fillStyle = "rgba(0,0,0,0)";
    const leg = (lx, lift) => {
      const fx = lx + lift * 0.25, fy = 170 - lift;
      limb(g, lx, 118, lx + lift * 0.1, 146 - lift * 0.5, fx, fy - 4, "#3a2440", 6);
      if (type === "skater") {
        g.fillStyle = "#fff"; rr(g, fx - 8, fy - 12, 16, 13, 4); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = "#ff5d8f"; [-5, 0, 5].forEach((d) => { g.beginPath(); g.arc(fx + d, fy + 3, 3, 0, 7); g.fill(); g.lineWidth = 1.5; g.stroke(); });
        g.fillStyle = "#ffe28a"; rr(g, fx - 6, fy - 30, 12, 7, 3); g.fill(); g.stroke();
      } else {
        g.fillStyle = type === "diva" ? "#ffd23f" : "#e0243f"; g.beginPath(); g.ellipse(fx, fy, 7.5, 4.5, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
        g.lineWidth = 2.5; g.beginPath(); g.moveTo(fx + 5, fy + 1); g.lineTo(fx + 6, fy + 7); g.stroke();
      }
    };
    const lift = mode === "walk" ? sw * 8 : 0;
    if (!long) { leg(51, Math.max(0, lift)); leg(69, Math.max(0, -lift)); }
    g.save(); g.translate(0, -bob);
    // hair back volume
    g.fillStyle = tp.hair; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.ellipse(60, 36, 30, 29, 0, 0, 7); g.fill(); g.stroke();
    if (type !== "skater") { g.beginPath(); g.ellipse(36, 58, 10, 14, 0.3, 0, 7); g.ellipse(84, 58, 10, 14, -0.3, 0, 7); g.fill(); g.stroke(); }
    else { g.beginPath(); g.ellipse(88 + sw * 4, 40, 9, 22, -0.5 + sw * 0.2, 0, 7); g.fill(); g.stroke(); }
    // neck
    g.fillStyle = skin; rr(g, 54, 46, 12, 18, 5); g.fill(); g.stroke();
    // dress
    const hem = long ? 172 : 128;
    const dress = () => { g.beginPath(); g.moveTo(43, 64); g.quadraticCurveTo(60, 57, 77, 64); g.quadraticCurveTo(81, 84, 74, 96); g.quadraticCurveTo(89, 114, long ? 94 : 91, hem); g.quadraticCurveTo(60, hem + 9, long ? 26 : 29, hem); g.quadraticCurveTo(31, 114, 46, 96); g.quadraticCurveTo(39, 84, 43, 64); g.closePath(); };
    dress(); const dg = g.createLinearGradient(30, 60, 90, hem); dg.addColorStop(0, tp.dress2); dg.addColorStop(0.35, tp.dress); dg.addColorStop(1, mix(tp.dress, "#000000", 0.25));
    g.fillStyle = dg; g.fill();
    g.save(); dress(); g.clip();
    for (let i = 0; i < 46; i++) { const sx = 28 + ((i * 37) % 66), sy = 62 + ((i * 53) % (hem - 58)); const on = (i + Math.round(ph * 1.3)) % 5 === 0; g.fillStyle = on ? "#ffffff" : "rgba(255,255,255,.32)"; g.beginPath(); g.arc(sx, sy, on ? 2 : 1.2, 0, 7); g.fill(); }
    g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.ellipse(50, 80, 5, 16, 0.2, 0, 7); g.fill();
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(40, 94, 40, 4);
    g.restore();
    dress(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.strokeStyle = tp.dress2; g.lineWidth = 2; g.beginPath(); g.moveTo(48, 64); g.quadraticCurveTo(60, 70, 72, 64); g.stroke();
    if (type === "diva") { g.strokeStyle = "#ff3d7f"; g.lineWidth = 6; g.beginPath(); g.moveTo(46, 66); g.lineTo(76, 110); g.stroke(); g.fillStyle = "#fff"; g.font = "bold 7px Arial"; g.save(); g.translate(61, 88); g.rotate(0.98); g.textAlign = "center"; g.fillText("DIVA", 0, 2.5); g.restore(); }
    // arms
    const hand = type === "diva" ? "#ffd23f" : skin;
    const arm = (sx, ex, ey, hx, hy) => {
      limb(g, sx, 68, ex, ey, hx, hy, skin, 6.5);
      g.fillStyle = tp.dress; g.beginPath(); g.arc(sx, 68, 8.5, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = hand; g.beginPath(); g.arc(hx, hy, 6.5, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      if (mode === "walk") { g.lineWidth = 2; g.beginPath(); g.moveTo(hx - 4, hy - 4); g.lineTo(hx - 6, hy - 9); g.moveTo(hx, hy - 6); g.lineTo(hx, hy - 11); g.moveTo(hx + 4, hy - 4); g.lineTo(hx + 6, hy - 9); g.stroke(); }
    };
    if (mode === "walk") { arm(44, 24, 66 - sw * 5, 14, 46 - sw * 7); arm(76, 96, 66 + sw * 5, 106, 46 + sw * 7); }
    else if (mode === "grab") { arm(44, 30, 92, 54, 94); arm(76, 90, 92, 66, 94); }
    else { arm(44, 26, 90, 42, 102); arm(76, 94, 90, 78, 102); }
    if (type === "clinger") {
      g.fillStyle = "#ff9de2"; g.strokeStyle = "#c2479a"; g.lineWidth = 1;
      for (let i = 0; i < 13; i++) { const a = Math.PI * (0.02 + i * 0.077); g.beginPath(); g.arc(60 + Math.cos(a) * 19, 62 + Math.sin(a) * 6, 5, 0, 7); g.fill(); }
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(40 - i * 1.5, 70 + i * 6, 4.5, 0, 7); g.arc(80 + i * 1.5, 70 + i * 6, 4.5, 0, 7); g.fill(); }
    }
    // face
    g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(60, 38, 17, 19, 0, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = "#e3b341"; g.lineWidth = 2; g.beginPath(); g.arc(42.5, 46, 3.5, 0, 7); g.arc(77.5, 46, 3.5, 0, 7); g.stroke();
    g.fillStyle = tp.hair; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(42, 34); g.quadraticCurveTo(46, 14, 62, 15); g.quadraticCurveTo(80, 15, 79, 36); g.quadraticCurveTo(70, 24, 58, 27); g.quadraticCurveTo(50, 28, 42, 34); g.closePath(); g.fill(); g.stroke();
    if (type === "skater") { g.strokeStyle = tp.dress2; g.lineWidth = 5; g.beginPath(); g.arc(60, 36, 22, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    if (mode === "shoo") {
      g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(49, 39); g.quadraticCurveTo(53, 42, 57, 39); g.moveTo(63, 39); g.quadraticCurveTo(67, 42, 71, 39); g.stroke();
      g.beginPath(); g.moveTo(48, 31); g.lineTo(56, 34); g.moveTo(72, 31); g.lineTo(64, 34); g.stroke();
      g.fillStyle = "#d1003a"; g.beginPath(); g.ellipse(60, 49, 3, 2.5, 0, 0, 7); g.fill();
    } else {
      g.fillStyle = mix(tp.dress, "#ffffff", 0.3); g.globalAlpha = 0.6; g.beginPath(); g.ellipse(53, 34, 5.5, 3, 0, Math.PI, 0); g.ellipse(67, 34, 5.5, 3, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1;
      [53, 67].forEach((ex) => {
        g.fillStyle = "#fff"; g.beginPath(); g.ellipse(ex, 38, 4.6, 5.6, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke();
        g.fillStyle = "#2a1a40"; g.beginPath(); g.arc(ex, 39, 3.1, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(ex + 1.2, 37.6, 1.1, 0, 7); g.fill();
        g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); const sd = ex < 60 ? -1 : 1; g.moveTo(ex + sd * 3.5, 33.5); g.lineTo(ex + sd * 6.5, 31); g.moveTo(ex + sd * 1, 32.6); g.lineTo(ex + sd * 2.5, 29.5); g.stroke();
      });
      g.fillStyle = "#d1003a"; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath();
      if (mode === "grab") { g.ellipse(60, 48, 6, 4.5, 0, 0, 7); } else { g.moveTo(53, 46); g.quadraticCurveTo(60, 53, 67, 46); g.quadraticCurveTo(60, 49, 53, 46); }
      g.fill(); g.stroke();
    }
    g.fillStyle = "rgba(255,80,120,.4)"; g.beginPath(); g.arc(48, 45, 3.5, 0, 7); g.arc(72, 45, 3.5, 0, 7); g.fill();
    g.strokeStyle = mix(skin, "#000000", 0.35); g.lineWidth = 1.5; g.beginPath(); g.moveTo(60, 40); g.quadraticCurveTo(62, 43, 59, 44); g.stroke();
    if (type === "diva") {
      g.fillStyle = "#ffd23f"; g.strokeStyle = INK; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(46, 14); g.lineTo(44, 0); g.lineTo(52, 8); g.lineTo(60, -4); g.lineTo(68, 8); g.lineTo(76, 0); g.lineTo(74, 14); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#ff3d7f"; g.beginPath(); g.arc(60, 6, 2.5, 0, 7); g.fill(); g.fillStyle = "#7fd8ff"; g.beginPath(); g.arc(50, 10, 1.8, 0, 7); g.arc(70, 10, 1.8, 0, 7); g.fill();
    }
    g.restore();
  }
  function propSprite(kind) {
    if (kind === "cart") return outlined(100, 80, (g) => {
      g.fillStyle = "#3a3f46"; [16, 84].forEach((x) => { g.beginPath(); g.arc(x, 74, 4, 0, 7); g.fill(); });
      const tg = g.createLinearGradient(0, 34, 0, 72); tg.addColorStop(0, "#ffffff"); tg.addColorStop(1, "#d9d2c4");
      g.fillStyle = tg; g.beginPath(); g.moveTo(8, 36); g.lineTo(92, 36); g.lineTo(96, 70); g.quadraticCurveTo(80, 74, 70, 70); g.quadraticCurveTo(58, 75, 48, 70); g.quadraticCurveTo(36, 75, 26, 70); g.quadraticCurveTo(14, 74, 4, 70); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; [26, 48, 70].forEach((x) => { g.beginPath(); g.moveTo(x, 40); g.lineTo(x - 1, 70); g.stroke(); });
      const cg = g.createRadialGradient(44, 18, 2, 50, 26, 26); cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.6, "#c4ccd4"); cg.addColorStop(1, "#7d8893");
      g.fillStyle = cg; g.beginPath(); g.ellipse(50, 34, 24, 20, 0, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = "#aab4be"; g.fillRect(24, 33, 52, 4); g.strokeRect(24, 33, 52, 4);
      g.fillStyle = "#dfe5ea"; g.beginPath(); g.arc(50, 13, 3.5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#2f6b3a"; rr(g, 80, 8, 7, 26, 3); g.fill(); g.stroke(); g.fillStyle = "#e3b341"; g.fillRect(80, 18, 7, 6);
      g.fillStyle = "#d7263d"; g.beginPath(); g.arc(16, 22, 5, 0, 7); g.fill(); g.strokeStyle = "#2f8f46"; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 27); g.lineTo(16, 35); g.stroke();
    });
    if (kind === "plant") return outlined(80, 110, (g) => {
      const pg = g.createLinearGradient(24, 0, 56, 0); pg.addColorStop(0, "#8a5a1e"); pg.addColorStop(0.5, "#e3b341"); pg.addColorStop(1, "#7a4e18");
      g.fillStyle = pg; g.beginPath(); g.moveTo(22, 76); g.lineTo(58, 76); g.lineTo(52, 106); g.lineTo(28, 106); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.fillRect(19, 72, 42, 7); g.strokeRect(19, 72, 42, 7);
      for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i - 5) * 0.28; const L = 44 + (i % 3) * 8; g.save(); g.translate(40, 74); g.rotate(a + Math.PI / 2); g.fillStyle = i % 2 ? "#2f8f46" : "#3fae58"; g.beginPath(); g.ellipse(0, -L / 2, 7, L / 2, 0, 0, 7); g.fill(); g.strokeStyle = "#173f22"; g.lineWidth = 2; g.stroke(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -L + 6); g.stroke(); g.restore(); }
    });
    if (kind === "ice") return outlined(70, 110, (g) => {
      const sg = g.createLinearGradient(6, 0, 64, 0); sg.addColorStop(0, "#8794a0"); sg.addColorStop(0.45, "#f2f6f9"); sg.addColorStop(1, "#7d8a96");
      g.fillStyle = sg; rr(g, 6, 6, 58, 100, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = "#1c6fb8"; rr(g, 12, 12, 46, 20, 4); g.fill(); g.stroke();
      g.fillStyle = "#e8f6ff"; g.font = "900 14px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ICE", 35, 22.5);
      g.fillStyle = "#2a323a"; rr(g, 14, 44, 42, 28, 4); g.fill(); g.stroke();
      g.fillStyle = "#cdeeff"; [[20, 60], [28, 64], [36, 59], [44, 63], [24, 54]].forEach(([x, y]) => { g.fillRect(x, y, 7, 6); });
      g.fillStyle = "rgba(0,0,0,.25)"; for (let y = 80; y < 100; y += 4) g.fillRect(14, y, 42, 2);
    });
    if (kind === "exit") return outlined(60, 26, (g) => {
      g.fillStyle = "#1f8f3a"; rr(g, 3, 3, 54, 20, 3); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#eaffef"; g.font = "900 13px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EXIT \u25B6", 30, 13.5);
    }, 1.2);
    if (kind === "beer") return outlined(40, 50, (g) => {
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(30, 28, 8, -Math.PI / 2, Math.PI / 2); g.stroke(); g.strokeStyle = "#e9f2f7"; g.lineWidth = 3.5; g.stroke();
      const bg = g.createLinearGradient(8, 0, 30, 0); bg.addColorStop(0, "#d88a12"); bg.addColorStop(0.45, "#ffd35a"); bg.addColorStop(1, "#c97a0e");
      g.fillStyle = bg; rr(g, 7, 14, 24, 32, 4); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(11, 20, 3, 22); g.fillStyle = "rgba(255,255,255,.7)"; [[20, 36], [24, 28], [17, 30]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); });
      g.fillStyle = "#fffbe8"; g.beginPath(); g.arc(11, 14, 6, 0, 7); g.arc(19, 11, 7, 0, 7); g.arc(27, 14, 6, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    });
    if (kind === "pill") return outlined(44, 24, (g) => {
      g.save(); g.translate(22, 12); g.rotate(-0.35);
      rr(g, -17, -7, 34, 14, 7); g.fillStyle = "#cfeeff"; g.fill(); g.save(); rr(g, -17, -7, 34, 14, 7); g.clip(); g.fillStyle = "#1f6fff"; g.fillRect(-17, -7, 17, 14); g.restore();
      rr(g, -17, -7, 34, 14, 7); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); g.fillStyle = "rgba(255,255,255,.8)"; rr(g, -12, -5, 18, 3, 1.5); g.fill(); g.restore();
    });
  }
  function glowSprite(r, g2, b) {
    const c = mkC(64, 64), g = c.getContext("2d"), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, "rgba(" + r + "," + g2 + "," + b + ",0.9)"); rg.addColorStop(0.35, "rgba(" + r + "," + g2 + "," + b + ",0.35)"); rg.addColorStop(1, "rgba(" + r + "," + g2 + "," + b + ",0)");
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return c;
  }

  /* ---- elevator (v3: recessed, unmistakable) ---- */
  const EDY = 1.38; // door plane (tiles) inside the ELEV row: recess depth 0.62 tile
  const elevDoorCache = {}, callCache = {};
  function brassGrad(g, x0, x1, a, b) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, a || "#8a6a2a"); gr.addColorStop(0.3, b || "#f6dc8c"); gr.addColorStop(0.55, "#c9a24a"); gr.addColorStop(0.8, "#fff0b8"); gr.addColorStop(1, a || "#7a5a20"); return gr; }
  function texElevDoor(open, unlocked) {
    const key = Math.round(open * 12) + (unlocked ? 100 : 0);
    if (elevDoorCache[key]) return elevDoorCache[key];
    const o = Math.round(open * 12) / 12, lamp = unlocked ? "#46ff7a" : "#ff3344";
    const ox = 12, ow = 104, oy = 40, oh = 88, half = (ow / 2) * (1 - o * 0.97);
    return (elevDoorCache[key] = makeTex(TEX, TEX, (g, w, h) => {
      g.fillStyle = "#1e1416"; g.fillRect(0, 0, w, h);
      // marble surround
      for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(255,240,220,.07)"; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.quadraticCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h); g.stroke(); }
      // header plate
      g.fillStyle = brassGrad(g, 0, w); g.fillRect(4, 2, w - 8, 34); g.fillStyle = "#1a0e08"; g.fillRect(6, 4, w - 12, 30);
      g.fillStyle = "#9fffc0"; g.font = "bold 11px 'Avenir Next', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ELEVATOR", 52, 11);
      g.fillStyle = "#000"; g.fillRect(36, 18, 34, 14); g.fillStyle = "#ff9a3d"; g.font = "bold 12px monospace"; g.fillText("\u25BC 7", 53, 25.5);
      g.fillStyle = "#000"; g.beginPath(); g.arc(104, 22, 9, 0, 7); g.fill(); g.fillStyle = lamp; g.beginPath(); g.arc(104, 22, 6.5, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(102, 20, 2, 0, 7); g.fill();
      // frame
      g.fillStyle = brassGrad(g, ox - 6, ox + ow + 6); g.fillRect(ox - 6, oy - 4, ow + 12, oh + 4);
      g.fillStyle = "#3a2810"; g.fillRect(ox - 1, oy - 1, ow + 2, oh + 1);
      // interior
      const ig = g.createLinearGradient(0, oy, 0, oy + oh); ig.addColorStop(0, "#fff8dc"); ig.addColorStop(0.6, "#ffd889"); ig.addColorStop(1, "#c88a3a");
      g.fillStyle = ig; g.fillRect(ox, oy, ow, oh); g.fillStyle = "rgba(160,110,40,.6)"; g.fillRect(ox, oy + 50, ow, 4); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(ox + 30, oy + 6, ow - 60, 36);
      // leaves
      const leaf = (x0, x1) => {
        const lg = g.createLinearGradient(x0, 0, x1, 0); lg.addColorStop(0, "#9a7a3a"); lg.addColorStop(0.25, "#f8e3a0"); lg.addColorStop(0.5, "#cfa955"); lg.addColorStop(0.85, "#fff4c8"); lg.addColorStop(1, "#8a6a2a");
        g.fillStyle = lg; g.fillRect(x0, oy, x1 - x0, oh);
        g.fillStyle = "rgba(90,60,20,.16)"; for (let x = x0; x < x1; x += 2) g.fillRect(x, oy, 1, oh);
        g.save(); g.beginPath(); g.rect(x0, oy, x1 - x0, oh); g.clip(); g.fillStyle = "rgba(255,255,255,.38)"; g.beginPath(); g.moveTo(x0 + 4, oy + oh); g.lineTo(x0 + 18, oy + oh); g.lineTo(x0 + 44, oy); g.lineTo(x0 + 30, oy); g.closePath(); g.fill();
        g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.moveTo(x0 + 22, oy + oh); g.lineTo(x0 + 26, oy + oh); g.lineTo(x0 + 52, oy); g.lineTo(x0 + 48, oy); g.closePath(); g.fill(); g.restore();
        g.fillStyle = "rgba(60,40,10,.45)"; g.fillRect(x0, oy + oh - 12, x1 - x0, 12); g.fillStyle = "rgba(255,240,200,.3)"; g.fillRect(x0, oy + oh - 12, x1 - x0, 1);
      };
      leaf(ox, ox + half); leaf(ox + ow - half, ox + ow);
      g.fillStyle = "#1a0e04"; g.fillRect(ox + half - 1.5, oy, 1.5, oh); g.fillRect(ox + ow - half, oy, 1.5, oh);
      if (o < 0.05) { g.fillStyle = "#0e0802"; g.fillRect(63, oy, 2, oh); g.fillStyle = "rgba(255,250,220,.6)"; g.fillRect(65, oy, 1, oh); }
      g.fillStyle = "#2a1a08"; g.fillRect(ox - 6, h - 3, ow + 12, 3);
    }, (g, w, h) => {
      g.fillStyle = "#fff"; g.font = "bold 11px 'Avenir Next', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ELEVATOR", 52, 11);
      g.fillRect(37, 19, 32, 12); g.beginPath(); g.arc(104, 22, 6.5, 0, 7); g.fill();
      if (o > 0.04) g.fillRect(ox + half, oy, ow - half * 2, oh);
    }));
  }
  function texJamb() {
    return makeTex(TEX, TEX, (g, w, h) => {
      g.fillStyle = brassGrad(g, 0, w, "#6a5020", "#e8c878"); g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(60,40,10,.18)"; for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, h);
      g.fillStyle = "#1e1416"; g.fillRect(0, 0, w, 36); g.fillStyle = "#c9a24a"; g.fillRect(0, 34, w, 3);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, h - 10, w, 10);
    });
  }
  function texElevSign() {
    return makeTex(TEX, TEX, (g, w, h) => {
      wpBase(g, w, h);
      g.fillStyle = "#c9a24a"; rr(g, 12, 16, 104, 34, 6); g.fill(); g.fillStyle = "#0c2a18"; rr(g, 15, 19, 98, 28, 4); g.fill();
      g.fillStyle = "#8dffb4"; g.font = "bold 13px 'Avenir Next', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ELEVATOR \u2192", 64, 33.5);
      g.fillStyle = "#b08a58"; rr(g, 34, 56, 60, 14, 3); g.fill(); g.fillStyle = "#2a1a0c"; g.font = "bold 8px sans-serif"; g.fillText("FLOOR 7  \u25BC LOBBY", 64, 63.5);
      noiseFx(g, w, h, 6);
    }, (g) => { g.fillStyle = "#fff"; g.font = "bold 13px 'Avenir Next', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ELEVATOR \u2192", 64, 33.5); });
  }
  function texCallPanel(unlocked) {
    if (callCache[+unlocked]) return callCache[+unlocked];
    return (callCache[+unlocked] = makeTex(TEX, TEX, (g, w, h) => {
      wpBase(g, w, h);
      g.fillStyle = brassGrad(g, 30, 58); rr(g, 30, 22, 28, 54, 5); g.fill(); g.strokeStyle = "#3a2810"; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = "#000"; g.beginPath(); g.arc(44, 30, 5.5, 0, 7); g.fill(); g.fillStyle = unlocked ? "#46ff7a" : "#ff3344"; g.beginPath(); g.arc(44, 30, 4, 0, 7); g.fill();
      [[44, 46, "\u25B2", "#5a4a30"], [44, 62, "\u25BC", "#ffcf5a"]].forEach(([x, y, t, col]) => { g.fillStyle = "#2a1a0c"; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); g.fillStyle = "#2a1a0c"; g.font = "bold 7px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y + 0.5); });
      g.fillStyle = "#1a0e08"; rr(g, 70, 24, 40, 14, 3); g.fill(); g.fillStyle = unlocked ? "#7dff9a" : "#ff6a7a"; g.font = "bold 8px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(unlocked ? "OPEN" : "LOCKED", 90, 31.5);
      noiseFx(g, w, h, 6);
    }, (g) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(44, 30, 4, 0, 7); g.fill(); g.beginPath(); g.arc(44, 62, 5.5, 0, 7); g.fill(); g.fillRect(72, 26, 36, 10); }));
  }
  // floor guide arrows (tile coords -> direction 0=E 1=N 2=W 3=S)
  const ARROWS = [];
  [[4, 23, 0], [7, 23, 0], [10, 23, 0], [13, 23, 0], [16, 23, 0], [20, 20, 1], [20, 17, 1], [20, 14, 2], [17, 13, 2], [14, 13, 2], [11, 13, 2], [8, 13, 2], [5, 13, 2], [2, 11, 1], [2, 8, 1], [2, 5, 1], [4, 3, 0], [7, 3, 0], [10, 3, 0], [13, 3, 0], [16, 3, 0], [19, 3, 1]].forEach((a) => ARROWS.push(a));
  let arrowTile = null, arrowMask = null;
  function buildArrows() {
    arrowTile = new Uint8Array(MW * MH); ARROWS.forEach(([x, y, d]) => (arrowTile[y * MW + x] = d + 1));
    arrowMask = [0, 1, 2, 3].map((d) => {
      const m = new Uint8Array(T * T);
      for (let uy = 0; uy < T; uy++) for (let ux = 0; ux < T; ux++) {
        let ex, ey; if (d === 0) { ex = ux; ey = uy; } else if (d === 1) { ex = T - 1 - uy; ey = ux; } else if (d === 2) { ex = T - 1 - ux; ey = T - 1 - uy; } else { ex = uy; ey = T - 1 - ux; }
        const inS = (pad) => (ex >= 8 - pad && ex <= 27 + pad && Math.abs(ey - 24) <= 4 + pad) || (ex >= 24 - pad && ex <= 41 + pad && Math.abs(ey - 24) <= (41 + pad - ex) * 0.85);
        m[uy * T + ux] = inS(0) ? 1 : inS(2) ? 2 : 0;
      }
      return m;
    });
  }
  /* ================= FIRST-PERSON: WORLD DATA + RENDER ================= */
  const FACE = { E: 0, W: 1, S: 2, N: 3 };
  let faceTex = null, faceDoor = null, LM = null, LMW = 0, LMH = 0, LMN = 0, tileMask = null, border = null, vShade = null;
  let fpLights = [], sconceGlows = [], fpProps = [], mmCanvas = null;
  const MMS = 0.15;
  function fpWorldInit() {
    if (fpS.tex) return;
    const tx = fpS.tex = { wall: texWall(), sconce: texSconce(), art0: texArt(0), art1: texArt(1), carpet: texCarpet(), ceil: texCeil(false), ceilL: texCeil(true), doorOpen: texDoor(0, false, true), jamb: texJamb(), elevSign: texElevSign() };
    buildArrows();
    faceTex = new Array(MW * MH * 4).fill(null); faceDoor = new Array(MW * MH * 4).fill(null);
    doors.forEach((d) => { const k = (d.y * MW + d.x) * 4 + FACE[d.face]; d.tex = texDoor(d.num, d.num % 4 === 0, false); faceTex[k] = d.tex; faceDoor[k] = d; });
    const dirs = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (gAt(x, y) !== W) continue;
      for (const [f, dx, dy] of dirs) {
        if (!floorish(x + dx, y + dy)) continue;
        const k = (y * MW + x) * 4 + FACE[f];
        if (faceTex[k]) continue;
        const along = dy ? x : y;
        if (along % 2 === 1) {
          faceTex[k] = tx.sconce;
          const lx = x * T + T / 2 + dx * (T / 2 + 6), ly = y * T + T / 2 + dy * (T / 2 + 6);
          fpLights.push({ x: lx, y: ly, i: 1.0, r: 140 });
          sconceGlows.push({ x: x * T + T / 2 + dx * (T / 2 + 1.5), y: y * T + T / 2 + dy * (T / 2 + 1.5), z: 54 });
        } else if ((x * 7 + y * 13) % 5 === 0) faceTex[k] = (x + y) % 2 ? tx.art0 : tx.art1;
      }
    }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const v = gAt(x, y);
      if (v === F && (x + y) % 2 === 0) fpLights.push({ x: x * T + T / 2, y: y * T + T / 2, i: 0.42, r: 95 });
      if (v === ICE) { fpProps.push({ kind: "ice", x: x * T + T / 2, y: y * T + T / 2 }); fpLights.push({ x: x * T + T / 2, y: y * T + T / 2, i: 0.35, r: 70 }); }
      if (v === CART) fpProps.push({ kind: "cart", x: x * T + T / 2, y: y * T + T / 2 });
      if (v === PLANT) fpProps.push({ kind: "plant", x: x * T + T / 2, y: y * T + T / 2 });
    }
    [[20.5, 22.15], [20.5, 12.15], [1.5, 13.85], [1.5, 2.15], [10.5, 22.15], [11, 12.15], [10, 2.15]].forEach(([x, y]) => fpProps.push({ kind: "exit", x: x * T, y: y * T }));
    fpLights.push({ x: 19.5 * T, y: 2.3 * T, i: 0.6, r: 120 }); fpLights.push({ x: 19.5 * T, y: 1.75 * T, i: 0.5, r: 60 });
    // tile edge masks for carpet border
    tileMask = new Uint8Array(MW * MH);
    const wallish = (x, y) => { const v = gAt(x, y); return v === W || v === ELEV; };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (!floorish(x, y)) continue;
      tileMask[y * MW + x] = (wallish(x, y - 1) ? 1 : 0) | (wallish(x, y + 1) ? 2 : 0) | (wallish(x - 1, y) ? 4 : 0) | (wallish(x + 1, y) ? 8 : 0);
    }
    const pack = (r, g, b) => 0xff000000 | (b << 16) | (g << 8) | r;
    border = new Uint32Array(12);
    for (let i = 0; i < 12; i++) border[i] = i < 6 ? pack(40 + (i & 1) * 4, 14, 32) : i < 8 ? pack(212, 165, 74) : pack(92, 18, 40);
    vShade = new Uint16Array(TEX);
    for (let v = 0; v < TEX; v++) { let k = 1; if (v < 14) k = 0.62 + 0.38 * (v / 14); if (v > 104) k = 1 - 0.42 * ((v - 104) / 24); vShade[v] = Math.round(k * 256); }
    // baked lightmap with AO
    LMW = MW * T / LMS; LMH = MH * T / LMS; LMN = LMW * LMH; LM = new Uint16Array(LMN);
    for (let j = 0; j < LMH; j++) for (let i = 0; i < LMW; i++) {
      const wx = (i + 0.5) * LMS, wy = (j + 0.5) * LMS, tx0 = Math.floor(wx / T), ty0 = Math.floor(wy / T);
      if (gAt(tx0, ty0) === W) { LM[j * LMW + i] = 120; continue; }
      let L = 74;
      for (const l of fpLights) {
        const dx = wx - l.x, dy = wy - l.y, d2 = dx * dx + dy * dy;
        if (d2 > l.r * l.r) continue;
        if (!lineOfSight(wx, wy, l.x, l.y)) continue;
        const k = 1 - Math.sqrt(d2) / l.r; L += l.i * 200 * k * k;
      }
      let dmin = 99;
      for (let yy = ty0 - 1; yy <= ty0 + 1; yy++) for (let xx = tx0 - 1; xx <= tx0 + 1; xx++) {
        if (!wallish(xx, yy)) continue;
        const nx = clamp(wx, xx * T, xx * T + T), ny = clamp(wy, yy * T, yy * T + T), d = Math.hypot(wx - nx, wy - ny);
        if (d < dmin) dmin = d;
      }
      let ao = Math.min(1, dmin / 22); ao = ao * ao * (3 - 2 * ao);
      LM[j * LMW + i] = Math.min(360, L * (0.55 + 0.45 * ao));
    }
    // sprites
    fpS.spr = {};
    const skins = { glam: [SKIN[0], SKIN[2]], skater: [SKIN[1], SKIN[3]], clinger: [SKIN[4], SKIN[2]], diva: [SKIN[2]] };
    Object.keys(skins).forEach((type) => skins[type].forEach((sk, vi) => {
      const fr = [];
      for (let i = 0; i < 4; i++) fr.push(outlined(120, 186, (g) => drawEscortFront(g, type, sk, i * Math.PI / 2, "walk")));
      fpS.spr[type + vi] = { walk: fr, grab: outlined(120, 186, (g) => drawEscortFront(g, type, sk, 0, "grab")), shoo: outlined(120, 186, (g) => drawEscortFront(g, type, sk, 0, "shoo")) };
    }));
    ["cart", "plant", "ice", "exit", "beer", "pill"].forEach((k) => (fpS.spr[k] = propSprite(k)));
    fpS.glowWarm = glowSprite(255, 196, 110); fpS.glowBlue = glowSprite(110, 200, 255); fpS.glowGreen = glowSprite(90, 255, 140); fpS.glowPink = glowSprite(255, 90, 160); fpS.glowRed = glowSprite(255, 50, 50);
    // minimap
    mmCanvas = mkC(MW * T * MMS * 2, MH * T * MMS * 2);
    const mg = mmCanvas.getContext("2d"); mg.scale(MMS * 2, MMS * 2);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const v = gAt(x, y);
      if (v === W) continue;
      mg.fillStyle = v === ELEV ? "#e3b341" : v === F ? "#7a1d3f" : "#9a5a6a"; mg.fillRect(x * T - 0.5, y * T - 0.5, T + 1, T + 1);
    }
  }
  function fpBuild() {
    fpWorldInit();
    const q = TIERS[clamp(fpS.tier, 0, 2)];
    fpS.IW = Math.max(110, Math.round(Math.min(cssW * q, 440)));
    fpS.IH = Math.max(150, Math.round(fpS.IW * cssH / cssW));
    fpS.cv = mkC(fpS.IW, fpS.IH); fpS.cx = fpS.cv.getContext("2d");
    fpS.img = fpS.cx.createImageData(fpS.IW, fpS.IH); fpS.buf = new Uint32Array(fpS.img.data.buffer); fpS.z = new Float32Array(fpS.IW);
  }
  function fpRenderWorld() {
    const s = state, p = s.p, IW = fpS.IW, IH = fpS.IH, buf = fpS.buf, zb = fpS.z;
    const ca = Math.cos(p.ang), sa = Math.sin(p.ang), plx = -sa * TANF, ply = ca * TANF;
    const proj = (IW / 2) / TANF, hor = Math.round(IH * 0.5 + fpS.bob * IH / cssH);
    fpS.hor = hor; fpS.proj = proj;
    const carpet = fpS.tex.carpet.d, c0 = fpS.tex.ceil.d, c1 = fpS.tex.ceilL.d;
    const arrowCol = s.elevUnlocked ? 0xff7affa0 : 0xff5ad8ff, arrowK = 210 + ((Math.sin(s.t * 4) * 50) | 0);
    const fr = FOGC[0], fgc = FOGC[1], fb = FOGC[2], fogPix = 0xff000000 | (fb << 16) | (fgc << 8) | fr;
    const rx0 = ca - plx, ry0 = sa - ply, rx1 = ca + plx, ry1 = sa + ply, px = p.x, py = p.y;
    const MWT = MW * T, MHT = MH * T;
    for (let y = 0; y < IH; y++) {
      const floor = y > hor;
      if (y === hor) { buf.fill(fogPix, y * IW, y * IW + IW); continue; }
      const rd = floor ? EYE * proj / (y - hor) : (WALL_H - EYE) * proj / (hor - y);
      let f = (rd - FOG0) / (FOG1 - FOG0); f = f < 0 ? 0 : f > 1 ? 1 : f;
      const row = y * IW;
      if (f > 0.985) { buf.fill(fogPix, row, row + IW); continue; }
      const fi = (f * 256) | 0, fo = 256 - fi, fR = fr * fi >> 8, fG = fgc * fi >> 8, fB = fb * fi >> 8;
      const sx = rd * (rx1 - rx0) / IW, sy = rd * (ry1 - ry0) / IW;
      let wx = px + rd * rx0, wy = py + rd * ry0;
      for (let x = 0; x < IW; x++, wx += sx, wy += sy) {
        if (wx < 0 || wy < 0 || wx >= MWT || wy >= MHT) { buf[row + x] = fogPix; continue; }
        const tx = (wx / T) | 0, ty = (wy / T) | 0, ux = wx - tx * T, uy = wy - ty * T;
        let c, k;
        const L = LM[((wy / LMS) | 0) * LMW + ((wx / LMS) | 0)];
        if (floor) {
          const m = tileMask[ty * MW + tx];
          let de = 99;
          if (m) { if (m & 1) de = uy; if ((m & 2) && T - uy < de) de = T - uy; if ((m & 4) && ux < de) de = ux; if ((m & 8) && T - ux < de) de = T - ux; }
          c = de < 12 ? border[de | 0] : carpet[(((uy * TEXK) | 0) & 127) * 128 + (((ux * TEXK) | 0) & 127)];
          k = L * fo >> 8;
          const at = arrowTile[ty * MW + tx];
          if (at) { const mv = arrowMask[at - 1][(uy | 0) * T + (ux | 0)]; if (mv === 1) { c = arrowCol; k = arrowK * fo >> 8; } else if (mv === 2) { c = 0xff140a0a; } }
        } else {
          const t = ((tx + ty) & 1) ? c0 : c1;
          c = t[(((uy * 1.3334) | 0) & 63) * 64 + (((ux * 1.3334) | 0) & 63)];
          k = ((c >>> 24) === 254 ? 330 : (L * 205 >> 8)) * fo >> 8;
        }
        let r = ((c & 255) * k >> 8) + fR, g = (((c >> 8) & 255) * k >> 8) + fG, b = (((c >> 16) & 255) * k >> 8) + fB;
        buf[row + x] = 0xff000000 | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
      }
    }
    const elevT = texElevDoor(elevatorOpen, s.elevUnlocked || s.phase === "win"), callT = texCallPanel(s.elevUnlocked || s.phase === "win"), fx0 = px / T, fy0 = py / T;
    for (let x = 0; x < IW; x++) {
      const cam = 2 * x / IW - 1, rdx = ca + plx * cam, rdy = sa + ply * cam;
      let mx = Math.floor(fx0), my = Math.floor(fy0);
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      let stx, sty, sdx, sdy, side = 0, v = 0, n = 0;
      if (rdx < 0) { stx = -1; sdx = (fx0 - mx) * ddx; } else { stx = 1; sdx = (mx + 1 - fx0) * ddx; }
      if (rdy < 0) { sty = -1; sdy = (fy0 - my) * ddy; } else { sty = 1; sdy = (my + 1 - fy0) * ddy; }
      while (n++ < 80) {
        if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; }
        v = gAt(mx, my); if (v === W || v === ELEV) break;
      }
      let pdt = side === 0 ? sdx - ddx : sdy - ddy, uo = -1, etex = null;
      if (v === ELEV) {
        if (mx === 19 && side === 1 && sty < 0) {
          const tP = (EDY - fy0) / rdy, xp = fx0 + tP * rdx;
          if (xp >= 19 && xp < 20) { pdt = tP; uo = xp - 19; etex = elevT; }
          else { const bx = rdx < 0 ? 19 : 20, tS = (bx - fx0) / rdx; pdt = tS; uo = clamp((fy0 + tS * rdy - EDY) / (2 - EDY), 0, 0.999); side = 0; etex = fpS.tex.jamb; }
        } else etex = mx === 18 ? fpS.tex.elevSign : mx === 20 ? callT : fpS.tex.jamb;
      }
      const pd = Math.max(0.5, pdt * T);
      zb[x] = pd;
      const hx = px + pdt * T * rdx, hy = py + pdt * T * rdy;
      let u = (side === 0 ? hy : hx) / T; u -= Math.floor(u);
      if (side === 0 && rdx < 0) u = 1 - u;
      if (side === 1 && rdy > 0) u = 1 - u;
      const face = side === 0 ? (stx < 0 ? 0 : 1) : (sty < 0 ? 2 : 3);
      const key = (my * MW + mx) * 4 + face;
      let tex = fpS.tex.wall, toff = 0;
      if (v === ELEV) { tex = etex; if (uo >= 0) u = uo; }
      else { const d = faceDoor[key]; if (d && d.open > 0.25) tex = fpS.tex.doorOpen; else if (faceTex[key]) tex = faceTex[key]; }
      const tw = tex.w, td = tex.d, tcol = toff + ((u * 128) | 0);
      const li = ((((hy - rdy * 4) / LMS) | 0) * LMW + (((hx - rdx * 4) / LMS) | 0));
      const L0 = ((li >= 0 && li < LMN) ? LM[li] : 120) * (side === 0 ? 226 : 256) >> 8;
      let f = (pd - FOG0) / (FOG1 - FOG0); f = f < 0 ? 0 : f > 1 ? 1 : f;
      const fi = (f * 256) | 0, fo = 256 - fi, fR = fr * fi >> 8, fG = fgc * fi >> 8, fB = fb * fi >> 8;
      const lh = WALL_H * proj / pd, top = hor - (WALL_H - EYE) * proj / pd;
      const y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(IH, Math.ceil(top + lh));
      const vstep = 128 / lh; let tv = (y0 - top) * vstep;
      for (let y = y0; y < y1; y++, tv += vstep) {
        const vi = tv < 0 ? 0 : tv > 127 ? 127 : tv | 0;
        const c = td[vi * tw + tcol];
        const k = ((c >>> 24) === 254 ? 300 : (L0 * vShade[vi] >> 8)) * fo >> 8;
        let r = ((c & 255) * k >> 8) + fR, g = (((c >> 8) & 255) * k >> 8) + fG, b = (((c >> 16) & 255) * k >> 8) + fB;
        buf[y * IW + x] = 0xff000000 | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
      }
    }
    fpS.cx.putImageData(fpS.img, 0, 0);
  }
  /* ================= FIRST-PERSON: SPRITES, HAND, HUD ================= */
  const fogAt = (d) => clamp((d - FOG0) / (FOG1 - FOG0), 0, 1);
  function fpProj(x, y) {
    const p = state.p, rx = x - p.x, ry = y - p.y, c = Math.cos(p.ang), s = Math.sin(p.ang);
    const fw = rx * c + ry * s, sd = -rx * s + ry * c;
    const pc = fpS.proj * cssW / fpS.IW;
    return { fw, sc: pc / Math.max(fw, 0.001), sx: cssW / 2 + sd * pc / Math.max(fw, 0.001), hc: fpS.hor * cssW / fpS.IW };
  }
  function zVisible(sx, fw) { const c = Math.floor(sx * fpS.IW / cssW); return c >= 0 && c < fpS.IW && fpS.z[c] > fw; }
  function fpBlit(img, pr, zb, wW, wH, alpha, mode) {
    const w = wW * pr.sc, h = wH * pr.sc, left = pr.sx - w / 2, bottom = pr.hc + (EYE - zb) * pr.sc;
    if (left > cssW || left + w < 0 || w < 0.5) return null;
    const k = fpS.IW / cssW, c0 = Math.max(0, Math.floor(left * k)), c1 = Math.min(fpS.IW - 1, Math.floor((left + w) * k));
    ctx.globalAlpha = alpha; if (mode) ctx.globalCompositeOperation = mode;
    let rs = -1;
    for (let c = c0; c <= c1 + 1; c++) {
      const vis = c <= c1 && fpS.z[c] > pr.fw;
      if (vis && rs < 0) rs = c;
      else if (!vis && rs >= 0) {
        const xa = Math.max(left, rs / k), xb = Math.min(left + w, c / k), sa = (xa - left) / w * img.width, sb = (xb - left) / w * img.width;
        if (sb - sa > 0.1) ctx.drawImage(img, sa, 0, sb - sa, img.height, xa, bottom - h, xb - xa, h);
        rs = -1;
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    return { x: pr.sx, top: bottom - h, bottom, w, h };
  }
  function fpGlow(img, x, y, z, size, alpha) {
    const pr = fpProj(x, y); if (pr.fw < 4 || !zVisible(pr.sx, pr.fw - 3)) return;
    const s = size * pr.sc, cy = pr.hc + (EYE - z) * pr.sc;
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = alpha * (1 - fogAt(pr.fw));
    ctx.drawImage(img, pr.sx - s / 2, cy - s / 2, s, s);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  function fpRender(now) {
    const s = state, p = s.p;
    fpRenderWorld();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(fpS.cv, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hi = fpS.tier < 2;
    // collect sprites
    const list = [];
    for (const pr of fpProps) list.push({ x: pr.x, y: pr.y, t: "prop", o: pr });
    for (const k of s.pickups) list.push({ x: k.x, y: k.y, t: "pick", o: k });
    for (const e of s.escorts) if (e.state !== "grab") list.push({ x: e.x, y: e.y, t: "esc", o: e });
    for (const b of s.sausages) list.push({ x: b.x, y: b.y, t: "saus", o: b });
    for (const k of s.kisses) list.push({ x: k.x, y: k.y, t: "kiss", o: k });
    list.forEach((it) => (it.pr = fpProj(it.x, it.y)));
    list.sort((a, b) => b.pr.fw - a.pr.fw);
    if (hi) for (const g of sconceGlows) fpGlow(fpS.glowWarm, g.x, g.y, g.z, 46, 0.55);
    { const un = s.elevUnlocked || s.phase === "win";
      if (elevatorOpen > 0.04) { fpGlow(fpS.glowWarm, 19.5 * T, EDY * T + 6, 34, 150 * elevatorOpen, 0.85 * elevatorOpen); fpGlow(fpS.glowWarm, 19.5 * T, EDY * T + 30, 2, 110 * elevatorOpen, 0.6 * elevatorOpen); }
      if (hi) { fpGlow(un ? fpS.glowGreen : fpS.glowRed, 19.8125 * T, EDY * T + 1, 84 - 22 * 84 / 128, 26 + Math.sin(s.t * 5) * 4, 0.95); fpGlow(fpS.glowGreen, 18.5 * T, 2 * T + 1, 84 - 33 * 84 / 128, 70, 0.4); fpGlow(un ? fpS.glowGreen : fpS.glowRed, 20.34 * T, 2 * T + 1, 84 - 30 * 84 / 128, 18, 0.9); }
    }
    for (const it of list) {
      const pr = it.pr; if (pr.fw < 7) continue;
      const fa = 1 - fogAt(pr.fw) * 0.92, o = it.o;
      if (it.t === "prop") {
        const sp = fpS.spr[o.kind];
        const dims = { cart: [50, 40, 0], plant: [40, 55, 0], ice: [40, 63, 0], exit: [26, 11, 66] }[o.kind];
        if (o.kind !== "exit" && zVisible(pr.sx, pr.fw)) { ctx.globalAlpha = 0.35 * fa; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(pr.sx, pr.hc + EYE * pr.sc, dims[0] * 0.55 * pr.sc, 6 * pr.sc, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        fpBlit(sp, pr, dims[2], dims[0], dims[1], fa);
        if (hi && o.kind === "ice") fpGlow(fpS.glowBlue, o.x, o.y, 50, 70, 0.6);
        if (hi && o.kind === "exit") fpGlow(fpS.glowGreen, o.x, o.y, 71, 50, 0.7);
      } else if (it.t === "pick") {
        const bob = Math.sin(o.bob) * 3, beer = o.type === "beer";
        if (hi) fpGlow(beer ? fpS.glowWarm : fpS.glowBlue, o.x, o.y, 10 + bob, 46, 0.8);
        fpBlit(fpS.spr[o.type], pr, 3 + bob, beer ? 16 : 18, beer ? 20 : 10, fa);
      } else if (it.t === "esc") {
        const tp = TYPES[o.type], set = fpS.spr[o.type + (o.vi || 0)] || fpS.spr[o.type + "0"];
        const img = o.state === "shoo" ? set.shoo : set.walk[Math.floor(Math.abs(o.walk) / (Math.PI / 2)) % 4];
        const hh = 62 * tp.scale, ww = hh * 120 / 186;
        if (zVisible(pr.sx, pr.fw)) { ctx.globalAlpha = 0.38 * fa * o.alpha; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(pr.sx, pr.hc + EYE * pr.sc, ww * 0.42 * pr.sc, 5 * pr.sc, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        const shake = o.flash > 0 ? Math.sin(now * 90) * 3 : 0; pr.sx += shake;
        const r = fpBlit(img, pr, 0, ww, hh, fa * o.alpha);
        if (r && o.flash > 0) fpBlit(img, pr, 0, ww, hh, 0.6, "lighter");
        if (r && o.state !== "shoo" && zVisible(pr.sx, pr.fw)) {
          if (o.hp < o.maxHp) { const bw = Math.max(24, r.w * 0.6); ctx.fillStyle = "rgba(0,0,0,.55)"; rr(ctx, r.x - bw / 2, r.top - 10, bw, 6, 3); ctx.fill(); ctx.fillStyle = "#ff5d8f"; rr(ctx, r.x - bw / 2, r.top - 10, bw * clamp(o.hp / o.maxHp, 0, 1), 6, 3); ctx.fill(); }
          if (o.say && o.sayT > 0 && pr.fw < 420) bubble(ctx, r.x, r.top - 14, o.say, fa);
        } else if (r && o.say && o.sayT > 0 && pr.fw < 420) bubble(ctx, r.x, r.top - 6, o.say, fa * o.alpha);
      } else if (it.t === "saus") {
        if (!zVisible(pr.sx, pr.fw)) continue;
        const zz = EYE - 8 - o.t * 10, cy = pr.hc + (EYE - zz) * pr.sc;
        if (o.sup && o.trail && hi) {
          ctx.globalCompositeOperation = "lighter";
          o.trail.forEach((tp, i) => { const q = fpProj(tp.x, tp.y); if (q.fw < 6) return; const sz = (8 + i * 2.2) * q.sc; ctx.globalAlpha = 0.07 * i; ctx.drawImage(fpS.glowBlue, q.sx - sz, q.hc + (EYE - zz) * q.sc - sz, sz * 2, sz * 2); });
          ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
        }
        if (o.sup) { ctx.globalCompositeOperation = "lighter"; const sz = 40 * pr.sc; ctx.drawImage(fpS.glowBlue, pr.sx - sz, cy - sz, sz * 2, sz * 2); ctx.globalCompositeOperation = "source-over"; }
        ctx.globalAlpha = fa; drawSausage(ctx, pr.sx, cy, o.sup ? -0.15 : o.t * 14 * (o.spin > 0 ? 1 : -1), o.sup, o.t, pr.sc * (o.sup ? 1.25 : 1)); ctx.globalAlpha = 1;
      } else if (it.t === "kiss") {
        if (!zVisible(pr.sx, pr.fw)) continue;
        const cy = pr.hc + (EYE - 34) * pr.sc;
        if (hi) { ctx.globalCompositeOperation = "lighter"; const sz = 22 * pr.sc; ctx.drawImage(fpS.glowPink, pr.sx - sz, cy - sz, sz * 2, sz * 2); ctx.globalCompositeOperation = "source-over"; }
        ctx.fillStyle = "#ff3d7f"; heart(ctx, pr.sx, cy, 7 * pr.sc); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    // world particles
    for (const q of s.parts) {
      if (q.screen) continue;
      const pr = fpProj(q.x, q.y); if (pr.fw < 6 || !zVisible(pr.sx, pr.fw)) continue;
      const cy = pr.hc + (EYE - (q.z || 30)) * pr.sc, sz = q.size * pr.sc * 0.9;
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.color;
      if (q.kind === "feather") { ctx.save(); ctx.translate(pr.sx, cy); ctx.rotate(q.rot); ctx.beginPath(); ctx.ellipse(0, 0, sz * 1.7, sz * 0.6, 0, 0, 7); ctx.fill(); ctx.restore(); }
      else if (q.kind === "heart") heart(ctx, pr.sx, cy, sz * 1.3);
      else if (q.kind === "glitter" || q.kind === "star" || q.kind === "spark") { ctx.save(); ctx.translate(pr.sx, cy); ctx.rotate(q.rot); ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.lineTo(0, -sz * 1.5); ctx.rotate(Math.PI / 4); ctx.lineTo(0, -sz * 0.4); ctx.rotate(Math.PI / 4); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(pr.sx, cy, sz, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // pops
    for (const q of s.pops) {
      const a = clamp(q.life / q.max * 1.5, 0, 1); let x, y, size = q.size;
      const d = Math.hypot(q.x - p.x, q.y + 60 - p.y);
      if (d < 70) { x = cssW / 2; y = cssH * 0.36 - (1 - q.life / q.max) * 30; size *= 1.5; }
      else { const pr = fpProj(q.x, q.y + 30); if (pr.fw < 10 || !zVisible(pr.sx, pr.fw)) continue; x = pr.sx; y = pr.hc + (EYE - 70) * pr.sc - (1 - q.life / q.max) * 20; size = clamp(size * pr.sc * 1.6, 10, 34); }
      ctx.globalAlpha = a; ctx.font = "900 " + Math.round(size) + "px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText(q.text, x, y); ctx.fillStyle = q.color; ctx.fillText(q.text, x, y);
    }
    ctx.globalAlpha = 1;
    if (vignette) ctx.drawImage(vignette, 0, 0, cssW, cssH);
    const inElev = s.phase === "win" && s.win.t >= 1.0;
    if (inElev) {
      const prog = clamp((s.win.t - 1.15) / 0.8, 0, 1), half = (cssW / 2) * prog;
      const dg = ctx.createLinearGradient(0, 0, cssW / 2, 0); dg.addColorStop(0, "#9c7a2e"); dg.addColorStop(0.5, "#f2d27e"); dg.addColorStop(1, "#b8913e");
      ctx.fillStyle = dg; ctx.fillRect(0, 0, half, cssH); ctx.fillRect(cssW - half, 0, half, cssH);
      ctx.fillStyle = "#5a4214"; ctx.fillRect(half - 3, 0, 3, cssH); ctx.fillRect(cssW - half, 0, 3, cssH);
      ctx.fillStyle = "#3a2a0c"; ctx.fillRect(0, 0, cssW, 26);
    } else if (s.phase !== "win") drawHand(now);
    if (p.grabbedBy) drawHugArms(now, p.grabbedBy);
    if (p.superT > 0) { ctx.strokeStyle = "rgba(110,200,255," + (0.35 + Math.sin(now * 10) * 0.15) + ")"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, cssW - 8, cssH - 8); }
    if (p.hurtT > 0 || p.grabbedBy) { const g = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.3, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.7); g.addColorStop(0, "rgba(255,30,80,0)"); g.addColorStop(1, "rgba(255,30,80," + (p.grabbedBy ? 0.35 + Math.sin(now * 12) * 0.1 : 0.5) + ")"); ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH); }
    if (s.superFlash > 0) { ctx.fillStyle = "rgba(160,225,255," + s.superFlash + ")"; ctx.fillRect(0, 0, cssW, cssH); }
    if (!inElev) { drawCrosshair(now); drawHud(now); fpHudExtras(now); }
    if (s.phase === "caught") {
      ctx.fillStyle = "rgba(28,8,18,.6)"; ctx.fillRect(0, 0, cssW, cssH);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 40px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText("CAUGHT!", cssW / 2, cssH * 0.42); ctx.fillStyle = "#ff5d8f"; ctx.fillText("CAUGHT!", cssW / 2, cssH * 0.42);
      ctx.font = "700 15px 'Avenir Next', 'Segoe UI', sans-serif"; ctx.fillStyle = "#fff";
      ctx.fillText("Dave got hugged into submission.", cssW / 2, cssH * 0.42 + 38);
      ctx.fillText(easy ? "Easy mode is on. Try again!" : "Back to the last corner…", cssW / 2, cssH * 0.42 + 60);
    }
  }
  function drawBigSausage(c, len, th, wob, sup, now) {
    c.lineCap = "round";
    if (sup) {
      c.globalCompositeOperation = "lighter"; c.drawImage(fpS.glowBlue, -len * 0.9, -len * 0.75, len * 1.8, len * 1.5); c.globalCompositeOperation = "source-over";
      rr(c, -len / 2, -th / 2, len, th, th / 2); const g = c.createLinearGradient(0, -th / 2, 0, th / 2); g.addColorStop(0, "#f08a5a"); g.addColorStop(0.5, "#c2502a"); g.addColorStop(1, "#7a2a12");
      c.fillStyle = g; c.fill(); c.lineWidth = 5; c.strokeStyle = "#2a7fff"; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = "#ffe0c8"; c.lineWidth = th * 0.18; c.beginPath(); c.moveTo(-len * 0.38, -th * 0.22); c.lineTo(len * 0.38, -th * 0.22); c.stroke();
      c.strokeStyle = "#dff6ff"; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const a = now * 8 + i * 2.1; c.beginPath(); c.moveTo(Math.cos(a) * len * 0.5, Math.sin(a) * th); c.lineTo(Math.cos(a) * len * 0.62, Math.sin(a) * th * 1.4); c.stroke(); }
    } else {
      const seg = () => { c.beginPath(); c.moveTo(-len / 2, 0); c.quadraticCurveTo(0, wob, len / 2, 0); };
      c.strokeStyle = INK; c.lineWidth = th + 5; seg(); c.stroke();
      c.strokeStyle = "#c9663a"; c.lineWidth = th; seg(); c.stroke();
      c.strokeStyle = "#e88a58"; c.lineWidth = th * 0.55; c.beginPath(); c.moveTo(-len * 0.45, -th * 0.12); c.quadraticCurveTo(0, wob - th * 0.12, len * 0.45, -th * 0.12); c.stroke();
      c.strokeStyle = "#ffd2b0"; c.lineWidth = th * 0.16; c.beginPath(); c.moveTo(-len * 0.32, -th * 0.26); c.quadraticCurveTo(0, wob - th * 0.3, len * 0.3, -th * 0.26); c.stroke();
      c.strokeStyle = "rgba(90,30,10,.6)"; c.lineWidth = 2; for (const t of [-0.2, 0.05, 0.3]) { c.beginPath(); c.moveTo(len * t, wob * (1 - 4 * t * t) * 0.9 + th * 0.2); c.lineTo(len * t + 6, wob * (1 - 4 * t * t) * 0.9 - th * 0.1); c.stroke(); }
    }
  }
  function drawHand(now) {
    const p = state.p, c = ctx, S = Math.min(cssW / 390, cssH / 700) * 1.05;
    const mv = p.moving ? 1 : 0.25, bx0 = Math.sin(p.walk * 0.5) * 8 * mv, by0 = Math.abs(Math.cos(p.walk * 0.5)) * 8 * mv;
    const tp = fpS.throwT > 0 ? 1 - fpS.throwT / 0.22 : 1, thr = Math.sin(tp * Math.PI);
    const rt = easy ? 0.6 : 1.15, dip = p.reload > 0 ? Math.sin(clamp(1 - p.reload / rt, 0, 1) * Math.PI) : 0;
    const x = cssW * 0.68 + bx0 - thr * 40 * S, y = cssH + 10 * S + by0 + dip * 190 * S - thr * 70 * S;
    c.save(); c.translate(x, y); c.scale(S, S); c.rotate(-0.42 - thr * 0.25);
    const sg = c.createLinearGradient(-40, 0, 40, 0); sg.addColorStop(0, "#d9dde2"); sg.addColorStop(0.5, "#ffffff"); sg.addColorStop(1, "#c9ced4");
    rr(c, -38, -40, 76, 220, 34); c.fillStyle = sg; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = "#d7263d"; c.beginPath(); c.moveTo(-38, 40); c.lineTo(-10, -12); c.lineTo(16, -12); c.lineTo(-38, 86); c.closePath(); c.fill();
    rr(c, -40, -52, 80, 22, 10); c.fillStyle = "#f4f6f8"; c.fill(); c.stroke();
    c.fillStyle = "#f2c29b"; c.beginPath(); c.ellipse(0, -84, 40, 36, 0, 0, 7); c.fill(); c.stroke();
    const holding = p.superT > 0 || (p.ammo > 0 && p.reload <= 0 && tp > 0.55);
    if (holding) {
      c.save(); c.translate(-4, -112); c.rotate(0.3);
      const sup = p.superT > 0;
      drawBigSausage(c, sup ? 150 : 128, sup ? 34 : 28, sup ? 0 : Math.sin(now * 7) * 10 + (p.moving ? Math.sin(p.walk) * 8 : 0), sup, now);
      c.restore();
    }
    c.fillStyle = "#f2c29b"; c.lineWidth = 4.5; c.strokeStyle = INK;
    [[-30, -104], [-12, -112], [8, -114], [26, -106]].forEach(([fx, fy]) => { c.beginPath(); c.ellipse(fx, fy, 11, 14, 0.2, 0, 7); c.fill(); c.stroke(); });
    c.beginPath(); c.ellipse(34, -78, 12, 20, -0.6, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,120,120,.25)"; c.beginPath(); c.ellipse(-4, -80, 22, 12, 0, 0, 7); c.fill();
    c.restore();
  }
  function drawHugArms(now, e) {
    const tp = TYPES[e.type], c = ctx, w = Math.sin(now * 9) * 8, S = cssW / 390;
    [-1, 1].forEach((sd) => {
      c.save(); c.translate(sd < 0 ? -20 * S : cssW + 20 * S, cssH * 0.62 + w * sd); c.scale(sd * S, S);
      c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 46; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(110, -30, 170 + w, 20); c.stroke();
      c.strokeStyle = e.skin || "#f1c27d"; c.lineWidth = 38; c.stroke();
      c.strokeStyle = tp.dress; c.lineWidth = 42; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(50, -18, 80, -18); c.stroke();
      c.fillStyle = e.skin || "#f1c27d"; c.beginPath(); c.arc(176 + w, 22, 24, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.restore();
    });
    ctx.font = "900 20px 'Avenir Next', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText("SHE'S GOT YOU! THROW!", cssW / 2, cssH * 0.3); ctx.fillStyle = "#ff9de2"; ctx.fillText("SHE'S GOT YOU! THROW!", cssW / 2, cssH * 0.3);
  }
  function drawCrosshair(now) {
    const p = state.p, t = state.phase === "play" ? nearestEnemy(420, { x: Math.cos(p.ang), y: Math.sin(p.ang) }, 0.985) : null;
    const cx = cssW / 2, cy = fpS.hor * cssW / fpS.IW + 6, r = t ? 13 : 10;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,6,14,.7)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = t ? "#ff5d8f" : "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    ctx.fillStyle = t ? "#ff5d8f" : "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, 7); ctx.fill();
  }
  function fpHudExtras(now) {
    if (state.daveSayT > 0 && state.daveSay) {
      const c = ctx, a = clamp(state.daveSayT * 3, 0, 1), y = cssH * 0.66;
      c.save(); c.globalAlpha = a; c.font = "italic 900 19px 'Avenir Next', 'Segoe UI', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      const t = "Dave: “" + state.daveSay + "”", w = Math.min(cssW - 24, c.measureText(t).width + 26);
      c.fillStyle = "rgba(20,6,14,.72)"; rr(c, cssW / 2 - w / 2, y - 17, w, 34, 17); c.fill(); c.strokeStyle = "#e3b341"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#ffe28a"; c.fillText(t, cssW / 2, y + 1, cssW - 40); c.restore();
    }
    const s = state, p = s.p, c = ctx, R = 44, mx = cssW - R - 12, my = 160;
    c.save(); c.beginPath(); c.arc(mx, my, R, 0, 7); c.fillStyle = "rgba(20,6,14,.72)"; c.fill(); c.clip();
    c.drawImage(mmCanvas, mx - p.x * MMS, my - p.y * MMS, MW * T * MMS, MH * T * MMS);
    for (const k of s.pickups) { c.fillStyle = k.type === "beer" ? "#ffcf3d" : "#5cc8ff"; c.beginPath(); c.arc(mx + (k.x - p.x) * MMS, my + (k.y - p.y) * MMS, 2.2, 0, 7); c.fill(); }
    for (const e of s.escorts) { if (e.state === "shoo") continue; c.fillStyle = e.type === "diva" ? "#ffd23f" : "#ff5d8f"; c.beginPath(); c.arc(mx + (e.x - p.x) * MMS, my + (e.y - p.y) * MMS, e.type === "diva" ? 4 : 2.8, 0, 7); c.fill(); }
    const wp = WAYPOINTS[Math.min(s.stage, 4)];
    c.restore();
    const wa = Math.atan2(wp.y * T - p.y, wp.x * T - p.x), wd = Math.hypot(wp.y * T - p.y, wp.x * T - p.x) * MMS, wr = Math.min(R - 6, wd);
    c.fillStyle = "#7dff9a"; c.save(); c.translate(mx + Math.cos(wa) * wr, my + Math.sin(wa) * wr); c.rotate(wa); c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -5); c.lineTo(-4, 5); c.closePath(); c.fill(); c.restore();
    { const ex = (19.5 * T - p.x) * MMS, ey = (1.6 * T - p.y) * MMS, ed = Math.hypot(ex, ey), k2 = ed > R - 9 ? (R - 9) / ed : 1, qx = mx + ex * k2, qy = my + ey * k2, pu = 1 + 0.2 * Math.sin(now * 6);
      c.fillStyle = s.elevUnlocked ? "#46ff7a" : "#e3b341"; c.strokeStyle = INK; c.lineWidth = 1.5; rr(c, qx - 7 * pu, qy - 7 * pu, 14 * pu, 14 * pu, 3); c.fill(); c.stroke();
      c.fillStyle = INK; c.font = "900 10px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("\u21C5", qx, qy + 0.5); }
    c.save(); c.translate(mx, my); c.rotate(p.ang); c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -5.5); c.lineTo(-2, 0); c.lineTo(-5, 5.5); c.closePath(); c.fill(); c.stroke();
    c.globalAlpha = 0.18; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -FOVH / 2, FOVH / 2); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = "#e3b341"; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, R, 0, 7); c.stroke();
    if (isTouch) {
      const fx = cssW - 74, fy = cssH - 132, on = !!fpS.fire;
      c.globalAlpha = on ? 0.95 : 0.7; c.fillStyle = on ? "#ff5d8f" : "rgba(20,6,14,.6)"; c.beginPath(); c.arc(fx, fy, 46, 0, 7); c.fill();
      c.lineWidth = 3; c.strokeStyle = "#ffe28a"; c.stroke();
      c.save(); c.translate(fx, fy); c.rotate(-0.6); c.scale(0.42, 0.42); drawBigSausage(c, 110, 26, 6, p.superT > 0, now); c.restore();
      c.globalAlpha = 1; c.fillStyle = "#fff"; c.font = "900 10px 'Avenir Next', sans-serif"; c.textAlign = "center"; c.fillText("THROW", fx, fy + 34);
    }
  }
  function fpPointerDown(e, pt) {
    if (e.pointerType === "mouse") {
      mouse.down = true; mouse.active = true; mouse.lx = pt.x;
      if (canvas.requestPointerLock && document.pointerLockElement !== canvas && !navigator.webdriver) { try { canvas.requestPointerLock(); } catch (_) {} }
      return true;
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const fx = cssW - 74, fy = cssH - 132;
    if (!fpS.fire && Math.hypot(pt.x - fx, pt.y - fy) < 58) { fpS.fire = { id: e.pointerId, lx: pt.x }; return true; }
    if (pt.x < cssW * 0.45 && !sticks.move) { sticks.move = { id: e.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y }; return true; }
    if (!fpS.look) fpS.look = { id: e.pointerId, lx: pt.x };
    return true;
  }
  function fpPointerMove(e, pt) {
    if (!state) return true;
    if (e.pointerType === "mouse") {
      if (document.pointerLockElement === canvas) state.p.ang += (e.movementX || 0) * 0.0032;
      else if (mouse.down) { state.p.ang += (pt.x - (mouse.lx || pt.x)) * 0.007; }
      mouse.lx = pt.x; return true;
    }
    for (const k of ["fire", "look"]) { const l = fpS[k]; if (l && l.id === e.pointerId) { state.p.ang += (pt.x - l.lx) * 0.0095; l.lx = pt.x; } }
    const s = sticks.move;
    if (s && s.id === e.pointerId) { s.x = pt.x; s.y = pt.y; const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 56) { s.ox = s.x - dx / d * 56; s.oy = s.y - dy / d * 56; } }
    return true;
  }
  function fpPointerUp(e) {
    if (e.pointerType === "mouse") { mouse.down = false; return true; }
    if (fpS.fire && fpS.fire.id === e.pointerId) fpS.fire = null;
    if (fpS.look && fpS.look.id === e.pointerId) fpS.look = null;
    if (sticks.move && sticks.move.id === e.pointerId) sticks.move = null;
    return true;
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
    if (FPV) fpBuild(); else renderMap(zoom * dpr);
    vignette = document.createElement("canvas"); vignette.width = Math.round(cssW); vignette.height = Math.round(cssH);
    const v = vignette.getContext("2d"); const g = v.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.35, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
    g.addColorStop(0, "rgba(20,4,12,0)"); g.addColorStop(1, "rgba(20,4,12,.55)"); v.fillStyle = g; v.fillRect(0, 0, cssW, cssH);
    if (state) updateCamera(0, true);
  }
  window.addEventListener("resize", () => { if (!screens.game.hidden) resize(); });
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000; let dt = t - last; last = t;
    if (FPV && state && state.phase === "play" && !state.paused && !fpS.lockTier && dt > 0 && dt < 0.25) {
      fpS.ft += dt; fpS.fn++;
      if (fpS.fn >= 90) { const avg = fpS.ft / fpS.fn; if (avg > 0.0205 && fpS.tier < 2) { fpS.tier++; fpBuild(); } fpS.ft = 0; fpS.fn = 0; }
    }
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
    if ($("landing-subline")) $("landing-subline").textContent = config.landingSubline || "";
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
  $("btn-begin").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("game"); });
  $("btn-start").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("game"); });
  $("btn-skip").addEventListener("click", () => { unlockAudio(); sfx.tap(); stopLoop(); wipeToReveal(); });
  $("btn-replay").addEventListener("click", () => { unlockAudio(); sfx.tap(); showScreen("game"); });
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
      const s = state; s.p.x = 9 * T; s.p.y = 23.5 * T; s.p.ang = 0.05; s.p.aimX = 1; s.p.aimY = -0.1; s.p.face = 1; s.p.ammo = 6; s.hintT = 0; s.p.hp = 72; s.p.beers = 1;
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
    setTier: (t) => { fpS.tier = t; fpS.lockTier = true; if (FPV) fpBuild(); },
    tier: () => fpS.tier, fp: () => FPV,
  };

  function boot() {
    Promise.resolve(loadConfig()).then(() => { showScreen("landing"); if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {}); });
  }
  boot();
})();
