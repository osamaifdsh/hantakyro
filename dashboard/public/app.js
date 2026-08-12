const KEY = 'hantakyro_key';
const API = '/api';

const state = {
  key: localStorage.getItem(KEY) || '',
  guilds: [],
  current: null,
  data: null
};

const $ = (id) => document.getElementById(id);

function toast(msg, type) {
  const el = $('toast');
  el.textContent = msg;
  el.className = type || 'ok';
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 2600);
}

function hx(headers = {}) {
  return { 'Content-Type': 'application/json', 'X-Dash-Key': state.key, ...headers };
}

async function req(url, opts = {}) {
  const res = await fetch(API + url, { ...opts, headers: hx(opts.headers) });
  if (res.status === 401) {
    state.key = '';
    localStorage.removeItem(KEY);
    showLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Request failed');
  }
  return res.json();
}

function showLogin() {
  $('login-screen').classList.remove('hidden');
  $('app').classList.add('hidden');
}

function showApp() {
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
}

const MODULES = [
  ['antiBan', 'Anti Ban'], ['antiKick', 'Anti Kick'], ['antiBotAdd', 'Anti Bot Add'],
  ['antiChannelCreate', 'Anti Ch. Create'], ['antiChannelDelete', 'Anti Ch. Delete'], ['antiChannelUpdate', 'Anti Ch. Update'],
  ['antiRoleCreate', 'Anti Role Create'], ['antiRoleDelete', 'Anti Role Delete'], ['antiRoleUpdate', 'Anti Role Update'],
  ['antiWebhook', 'Anti Webhook'], ['antiGuildUpdate', 'Anti Guild Update'], ['antiEmoji', 'Anti Emoji'],
  ['antiRaid', 'Anti Raid'], ['antiSpam', 'Anti Spam'], ['antiEveryone', 'Anti Everyone']
];

async function refreshStatus() {
  try {
    const info = await fetch('/api/guilds', { headers: hx() }).then((r) => r.json());
    $('status-dot').classList.add('online');
    $('status-text').textContent = 'Online';
  } catch {
    $('status-dot').classList.remove('online');
    $('status-text').textContent = 'Offline';
  }
}

async function loadGuilds() {
  state.guilds = await req('/guilds');
  renderGuilds();
}

function renderGuilds() {
  const box = $('guild-list');
  box.innerHTML = '';
  if (!state.guilds.length) {
    box.innerHTML = '<p class="empty" style="text-align:left;color:var(--muted);font-size:13px;">No servers found. Add Hantakyro to a server.</p>';
    return;
  }
  state.guilds.forEach((g) => {
    const item = document.createElement('div');
    item.className = 'guild-item' + (state.current === g.id ? ' active' : '');
    const avatar = g.icon ? `<img src="${g.icon}" />` : `<div class="guild-avatar">${(g.name || '?')[0].toUpperCase()}</div>`;
    item.innerHTML = `
      ${avatar}
      <div class="g-info">
        <div class="g-name">${g.name}</div>
        <div class="g-sub">${g.members} members</div>
      </div>
      <span class="g-item-state">${g.enabled ? '🟢' : '🔴'}</span>`;
    item.onclick = () => selectGuild(g.id);
    box.appendChild(item);
  });
}

async function selectGuild(id) {
  state.current = id;
  renderGuilds();
  state.data = await req('/guild/' + id);
  $('no-guild').classList.add('hidden');
  $('guild-panel').classList.remove('hidden');

  const g = state.guilds.find((x) => x.id === id);
  $('guild-icon').src = g.icon || '';
  $('guild-icon').style.display = g.icon ? '' : 'none';
  $('guild-name').textContent = g.name;
  $('guild-meta').textContent = `${g.members} members • punishment: ${g.punish}`;

  const badge = $('guild-state');
  badge.className = 'head-badge ' + (state.data.protection.enabled ? 'on' : 'off');
  badge.textContent = state.data.protection.enabled ? '🟢 PROTECTED' : '🔴 DISABLED';

  $('stat-modules').textContent = Object.entries(state.data.protection).filter(([k, v]) => k !== 'enabled' && v).length;
  $('stat-whitelist').textContent = state.data.whitelist.length;
  $('stat-punish').textContent = state.data.punish;
  $('stat-raid').textContent = state.data.raidMode ? 'LOCKED' : 'Off';

  $('master-toggle').checked = state.data.protection.enabled;
  $('punish-mode').value = state.data.punish;
  $('raid-threshold').value = state.data.raidThreshold;
  $('raid-window').value = Math.round(state.data.raidWindow / 1000);
  $('log-channel').value = state.data.logChannel || '';
  $('lockdown-toggle').checked = !!state.data.raidMode;

  renderModules();
  renderWhitelist();
  renderWhitelistRoles();
  renderLogs();
}

function renderModules() {
  const box = $('modules');
  box.innerHTML = '';
  MODULES.forEach(([key, label]) => {
    const on = state.data.protection[key] !== false && state.data.protection.enabled;
    const el = document.createElement('div');
    el.className = 'module' + (on ? '' : ' off');
    el.innerHTML = `
      <span class="m-label">${label}</span>
      <label class="switch"><input type="checkbox" ${on ? 'checked' : ''} data-key="${key}" /><span class="slider"></span></label>`;
    el.querySelector('input').onchange = async (e) => {
      await req('/guild/' + state.current + '/config', {
        method: 'POST',
        body: JSON.stringify({ key: 'protection.' + key, value: e.target.checked })
      });
      toast(`${label} ${e.target.checked ? 'enabled' : 'disabled'}`);
      state.data.protection[key] = e.target.checked;
      el.classList.toggle('off', !e.target.checked);
      refreshStats();
    };
    box.appendChild(el);
  });
}

function renderWhitelist() {
  const box = $('whitelist');
  box.innerHTML = '';
  if (!state.data.whitelist.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:13px;">No whitelisted users yet. Use /list or add an ID below.</p>';
    return;
  }
  state.data.whitelist.forEach((id) => {
    const row = document.createElement('div');
    row.className = 'wl-row';
    row.innerHTML = `<span>${id}</span><button>Remove</button>`;
    row.querySelector('button').onclick = async () => {
      await req('/guild/' + state.current + '/whitelist', {
        method: 'POST',
        body: JSON.stringify({ userId: id, action: 'remove' })
      });
      toast('Removed from whitelist');
      state.data.whitelist = state.data.whitelist.filter((x) => x !== id);
      renderWhitelist();
      refreshStats();
    };
    box.appendChild(row);
  });
}

function renderWhitelistRoles() {
  const box = $('whitelist-roles');
  box.innerHTML = '';
  if (!state.data.whitelistRoles || !state.data.whitelistRoles.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:13px;">No role whitelist yet. Members with these roles are also safe.</p>';
    return;
  }
  state.data.whitelistRoles.forEach((id) => {
    const row = document.createElement('div');
    row.className = 'wl-row';
    row.innerHTML = `<span>${id}</span><button>Remove</button>`;
    row.querySelector('button').onclick = async () => {
      await req('/guild/' + state.current + '/whitelistroles', {
        method: 'POST',
        body: JSON.stringify({ roleId: id, action: 'remove' })
      });
      toast('Role removed from whitelist');
      state.data.whitelistRoles = state.data.whitelistRoles.filter((x) => x !== id);
      renderWhitelistRoles();
    };
    box.appendChild(row);
  });
}

function renderLogs() {
  const body = $('logs').querySelector('tbody');
  body.innerHTML = '';
  if (!state.data.logs || !state.data.logs.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--muted);">No protection events yet.</td></tr>';
    return;
  }
  state.data.logs.forEach((l) => {
    const d = new Date(l.time);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.toLocaleTimeString()}</td><td>${l.action}</td><td>${l.target || ''}</td><td>${l.by || ''}</td>`;
    body.appendChild(tr);
  });
}

function refreshStats() {
  $('stat-modules').textContent = Object.entries(state.data.protection).filter(([k, v]) => k !== 'enabled' && v).length;
  $('stat-whitelist').textContent = state.data.whitelist.length;
}

$('login-btn').onclick = async () => {
  const v = $('login-key').value.trim();
  if (!v) return;
  try {
    const res = await fetch('/api/guilds', { headers: hx({ 'X-Dash-Key': v }) });
    if (res.status === 401) return toast('Wrong password', 'err');
    state.key = v;
    localStorage.setItem(KEY, v);
    showApp();
    await init();
  } catch (e) {
    toast(e.message, 'err');
  }
};

$('logout-btn').onclick = () => {
  state.key = '';
  localStorage.removeItem(KEY);
  showLogin();
};

$('master-toggle').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'protection.enabled', value: e.target.checked })
  });
  state.data.protection.enabled = e.target.checked;
  toast('Protection ' + (e.target.checked ? 'ENABLED' : 'DISABLED'));
  renderModules();
  const badge = $('guild-state');
  badge.className = 'head-badge ' + (e.target.checked ? 'on' : 'off');
  badge.textContent = e.target.checked ? '🟢 PROTECTED' : '🔴 DISABLED';
  refreshStats();
};

$('punish-mode').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'punish', value: e.target.value })
  });
  state.data.punish = e.target.value;
  $('stat-punish').textContent = e.target.value;
  toast('Punishment mode: ' + e.target.value);
};

$('raid-threshold').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'raidThreshold', value: Number(e.target.value) })
  });
  toast('Raid threshold updated');
};

$('raid-window').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'raidWindow', value: Number(e.target.value) * 1000 })
  });
  toast('Raid window updated');
};

$('log-channel').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'logChannel', value: e.target.value.trim() })
  });
  state.data.logChannel = e.target.value.trim();
  toast('Log channel updated');
};

$('lockdown-toggle').onchange = async (e) => {
  const r = await req('/guild/' + state.current + '/lockdown', {
    method: 'POST',
    body: JSON.stringify({ state: e.target.checked })
  });
  state.data.raidMode = r.raidMode;
  $('stat-raid').textContent = r.raidMode ? 'LOCKED' : 'Off';
  toast('Lockdown ' + (r.raidMode ? 'ENABLED 🔴' : 'disabled 🟢'));
};

$('wl-role-add').onclick = async () => {
  const id = $('wl-role-id').value.trim();
  if (!id || !/^\d+$/.test(id)) return toast('Enter a valid role ID', 'err');
  await req('/guild/' + state.current + '/whitelistroles', {
    method: 'POST',
    body: JSON.stringify({ roleId: id, action: 'add' })
  });
  toast('Role added to whitelist');
  $('wl-role-id').value = '';
  state.data.whitelistRoles.push(id);
  renderWhitelistRoles();
};

$('wl-add').onclick = async () => {
  const id = $('wl-id').value.trim();
  if (!id || !/^\d+$/.test(id)) return toast('Enter a valid user ID', 'err');
  await req('/guild/' + state.current + '/whitelist', {
    method: 'POST',
    body: JSON.stringify({ userId: id, action: 'add' })
  });
  toast('Added to whitelist');
  $('wl-id').value = '';
  state.data.whitelist.push(id);
  renderWhitelist();
  refreshStats();
};

$('pu-run').onclick = async () => {
  const id = $('pu-id').value.trim();
  if (!id || !/^\d+$/.test(id)) return toast('Enter a valid user ID', 'err');
  const reason = $('pu-reason').value.trim() || 'Punished from dashboard';
  const r = await req('/guild/' + state.current + '/punish', {
    method: 'POST',
    body: JSON.stringify({ userId: id, reason })
  });
  toast(`Done — ${r.mode} (${r.target})`);
  $('pu-id').value = '';
  $('pu-reason').value = '';
};

async function init() {
  await refreshStatus();
  await loadGuilds();
}

if (state.key) {
  fetch('/api/guilds', { headers: hx() })
    .then((r) => {
      if (r.status === 401) {
        showLogin();
        return Promise.reject();
      }
      showApp();
      return init();
    })
    .catch(() => {});
} else {
  showLogin();
}
