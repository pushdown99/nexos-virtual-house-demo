// horizon 실데이터 라이브 레이어.
// house.nexoscare.com과 동일 소스(wss://horizon.nexoscare.com/sensors4/ws)·동일 판정 로직
// (신선도 180s · OR 확증 재실 · 움직임 게이트). 크로스오리진 WS 직결(REST 불필요).
const WS_URL = 'wss://horizon.nexoscare.com/sensors4/ws';
const FRESH = 180000; // 3분 넘게 '새로' 안 온 센서는 stale

// 중간집 방 ↔ 어르신 UUID(앞 8자리). house-web 시드와 동일.
export const ROOMS = {
  room1: { label: '중간집 1', beds: ['19B3C0EB', '27C6189B'] },
  room2: { label: '중간집 2', beds: ['4177B98A', '7EF1AEB8'] },
  room3: { label: '중간집 3', beds: ['CB17DEB2', 'E3A83703'] },
  room4: { label: '중간집 4', beds: ['A8438325', '238AA74A'] },
};
export const BATHS = { 'B14BA3BB': '화장실-1', 'C73500D5': '화장실-2' };

const shortOf = (u) => String(u || '').slice(0, 8).toUpperCase();

// slot(원시 센서 캐시) → 파생 상태. house applySt와 동일 규칙.
function derive(s, now) {
  const v = s.vital, p = s.presence, rx = s.rx || {};
  const fresh = (t) => rx[t] && now - rx[t] < FRESH;
  const vFresh = fresh('vital'), pFresh = fresh('presence'), thFresh = fresh('thermal');
  const anyFresh = ['vital', 'presence', 'thermal', 'track', 'env', 'sound'].some(fresh);
  const offline = s.online === false || !anyFresh;
  const hasSensor = !!(v || p || s.thermalPerson != null || s.track);
  // OR 확증: A121 재실 1순위. 놓쳐도 신선 C1001 실측 심박 / 사람 체온대(≥30℃) 열영상이면 재실.
  const vitalLive = vFresh && !s.vitalCached && v && v.presence === 1 && typeof v.hr === 'number' && v.hr > 0;
  const thermalBody = thFresh && s.thermalPerson === true && (s.thermalMax || 0) >= 30;
  const present = (pFresh && p && p.present === true) || vitalLive || thermalBody;
  const stage = present && vFresh && v && v.sleep ? v.sleep.stage : null;
  let distM = null;
  if (pFresh && p && typeof p.distance === 'number' && p.distance > 0) distM = p.distance;
  else if (fresh('track') && s.track && s.track.targets && s.track.targets[0] && typeof s.track.targets[0].d === 'number') distM = s.track.targets[0].d / 1000;
  let st;
  if (offline) st = hasSensor ? 'offline' : 'nodata';
  else if (!present) st = 'away';
  else if ((stage === 1 || stage === 2) && (v.movement || 0) === 0) st = 'sleep'; // 움직임 게이트
  else st = distM != null && distM >= 1.5 ? 'move' : 'bed';
  const env = s.env || {};
  return {
    st, present, offline,
    hr: vFresh && v && typeof v.hr === 'number' ? Math.round(v.hr) : 0,
    rr: vFresh && v && typeof v.rr === 'number' ? Math.round(v.rr) : 0,
    apnea: !!(present && vFresh && v && v.sleep && v.sleep.abnormal === 2),
    temp: typeof s.thermalMin === 'number' ? s.thermalMin : (typeof env.temp === 'number' ? env.temp : null),
    humid: typeof env.humid === 'number' ? env.humid : null,
    lux: typeof env.lux === 'number' ? env.lux : null,
    light: typeof env.lux === 'number' ? env.lux >= 10 : null,
    // 화장실 재실 = A121 재실 또는 사람 체온대 열영상 (house bathCell occ와 동일)
    occ: present || (thFresh && s.thermalPerson === true),
  };
}

// onUpdate(stateByShort, meta) — stateByShort: {UUID8: derived}. 300ms 디바운스.
export function connectLive(onUpdate) {
  const slots = {};
  const get = (sh) => slots[sh] || (slots[sh] = { rx: {} });
  let pending = null;
  const flush = () => {
    pending = null;
    const now = Date.now();
    const out = {};
    for (const [sh, s] of Object.entries(slots)) out[sh] = derive(s, now);
    try { onUpdate(out, { now, connected: true }); } catch (e) { /* no-op */ }
  };
  const schedule = () => { if (!pending) pending = setTimeout(flush, 300); };

  function onMsg(m) {
    if (m.type === 'devices') {
      (m.devices || []).forEach((d) => { const s = get(shortOf(d.uuid || d.short)); s.online = !!d.live; });
      return schedule();
    }
    if (!m.uuid) return;
    const s = get(shortOf(m.uuid));
    if (!m.cached && m.type) s.rx[m.type] = Date.now(); // 신선도: non-cached만 기록
    if (m.type === 'thermal') { s.thermalPerson = m.person; s.thermalMin = m.min; s.thermalMax = typeof m.max === 'number' ? m.max : 0; }
    else if (m.type === 'presence') s.presence = m;
    else if (m.type === 'track') s.track = m;
    else if (m.type === 'env') s.env = m;
    else if (m.type === 'vital') { s.vital = m; s.vitalCached = !!m.cached; }
    else return;
    schedule();
  }

  let ws = null, closed = false;
  function conn() {
    try { ws = new WebSocket(WS_URL); } catch (e) { return; }
    ws.onopen = () => { try { ws.send(JSON.stringify({ cmd: 'select', uuid: '*' })); } catch (e) {} };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onMsg(m); };
    ws.onclose = () => { if (!closed) setTimeout(conn, 2000); };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }
  conn();
  return () => { closed = true; try { ws && ws.close(); } catch (e) {} };
}
