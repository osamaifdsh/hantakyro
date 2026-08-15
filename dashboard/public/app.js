const API = '/api';

const state = {
  me: null,
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

async function req(url, opts = {}) {
  const res = await fetch(API + url, { ...opts, headers: { 'Content-Type': 'application/json' } });
  if (res.status === 401) {
    window.location.href = '/auth/login';
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
  ['antiRaid', 'Anti Raid'], ['antiSpam', 'Anti Spam'], ['antiEveryone', 'Anti Everyone'],
  ['antiLink', 'Anti Link'], ['antiMention', 'Anti Mass Mention']
];

async function boot() {
  try {
    const me = await fetch('/api/me').then((r) => r.json());
    if (!me || me.error) return showLogin();
    state.me = me;
    showApp();
    renderHeader();
    $('status-dot').classList.add('online');
    $('status-text').textContent = 'Online';
    await loadGuilds();
  } catch {
    showLogin();
  }
}

function renderHeader() {
  $('user-name').textContent = state.me.global_name || state.me.username;
  const u = state.me;
  $('user-avatar').src = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${Number(u.id) % 5}.png`;
}

async function loadGuilds() {
  state.guilds = await req('/me/guilds');
  renderGuilds();
}

function renderGuilds() {
  const box = $('guild-list');
  box.innerHTML = '';
  if (!state.guilds.length) {
    box.innerHTML = '<p class="empty" style="text-align:left;color:var(--muted);font-size:13px;">لا يوجد سيرفرات. أضف Hantakyro لسيرفرك ثم أعد فتح الصفحة.</p>';
    return;
  }
  state.guilds.forEach((g) => {
    const item = document.createElement('div');
    item.className = 'guild-item' + (state.current === g.id ? ' active' : '');
    const avatar = g.icon
      ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64" />`
      : `<div class="guild-avatar">${(g.name || '?')[0].toUpperCase()}</div>`;
    item.innerHTML = `
      ${avatar}
      <div class="g-info">
        <div class="g-name">${g.name}</div>
        <div class="g-sub">${g.members || '-'} members</div>
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
  if (g.icon) {
    $('guild-icon').src = `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`;
    $('guild-icon').style.display = '';
  } else {
    $('guild-icon').src = '';
    $('guild-icon').style.display = 'none';
  }
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
  $('spam-threshold').value = state.data.spamThreshold;
  $('spam-window').value = Math.round(state.data.spamWindow / 1000);
  $('mention-threshold').value = state.data.mentionThreshold;
  $('lockdown-toggle').checked = !!state.data.raidMode;

  $('welcome-toggle').checked = !!(state.data.welcome && state.data.welcome.enabled);
  $('welcome-channel').value = (state.data.welcome && state.data.welcome.channelId) || '';
  $('welcome-message').value = (state.data.welcome && state.data.welcome.message) || 'Welcome {user} to {server}!';
  $('goodbye-toggle').checked = !!(state.data.goodbye && state.data.goodbye.enabled);
  $('goodbye-channel').value = (state.data.goodbye && state.data.goodbye.channelId) || '';
  $('goodbye-message').value = (state.data.goodbye && state.data.goodbye.message) || 'Goodbye {user}!';

  renderModules();
  renderWhitelist();
  renderWhitelistRoles();
  renderAutoRole();
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
    box.innerHTML = '<p style="color:var(--muted);font-size:13px;">لا يوجد أعضاء محميون بعد. أضف ID أدناه.</p>';
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
    box.innerHTML = '<p style="color:var(--muted);font-size:13px;">لا يوجد رتب محمية حالياً.</p>';
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

function renderAutoRole() {
  const box = $('autorole');
  box.innerHTML = '';
  const roles = (state.data.autorole && state.data.autorole.roleIds) || [];
  if (!roles.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:13px;">لا توجد رتب تلقائية. أضف Role ID أدناه.</p>';
    return;
  }
  roles.forEach((id) => {
    const row = document.createElement('div');
    row.className = 'wl-row';
    row.innerHTML = `<span>${id}</span><button>Remove</button>`;
    row.querySelector('button').onclick = async () => {
      await req('/guild/' + state.current + '/config', {
        method: 'POST',
        body: JSON.stringify({ key: 'autorole.remove', value: id })
      });
      toast('Role removed from auto-role');
      state.data.autorole.roleIds = state.data.autorole.roleIds.filter((x) => x !== id);
      renderAutoRole();
    };
    box.appendChild(row);
  });
}

function renderLogs() {
  const body = $('logs').querySelector('tbody');
  body.innerHTML = '';
  if (!state.data.logs || !state.data.logs.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--muted);">لا أحداث حماية بعد.</td></tr>';
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
  toast('Lockdown ' + (r.raidMode ? 'ENABLED' : 'disabled'));
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

$('spam-threshold').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'spamThreshold', value: Number(e.target.value) })
  });
  toast('Spam threshold updated');
};

$('spam-window').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'spamWindow', value: Number(e.target.value) * 1000 })
  });
  toast('Spam window updated');
};

$('mention-threshold').onchange = async (e) => {
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'mentionThreshold', value: Number(e.target.value) })
  });
  toast('Mention threshold updated');
};

function bindWelcomeGoodbye(prefix, label) {
  $('' + prefix + '-toggle').onchange = async (e) => {
    await req('/guild/' + state.current + '/config', {
      method: 'POST',
      body: JSON.stringify({ key: prefix + '.enabled', value: e.target.checked })
    });
    state.data[prefix].enabled = e.target.checked;
    toast(`${label} ${e.target.checked ? 'ENABLED' : 'disabled'}`);
  };
  $('' + prefix + '-channel').onchange = async (e) => {
    await req('/guild/' + state.current + '/config', {
      method: 'POST',
      body: JSON.stringify({ key: prefix + '.channelId', value: e.target.value.trim() })
    });
    state.data[prefix].channelId = e.target.value.trim();
    toast(`${label} channel updated`);
  };
  $('' + prefix + '-message').onchange = async (e) => {
    await req('/guild/' + state.current + '/config', {
      method: 'POST',
      body: JSON.stringify({ key: prefix + '.message', value: e.target.value.trim() })
    });
    state.data[prefix].message = e.target.value.trim();
    toast(`${label} message updated`);
  };
}
bindWelcomeGoodbye('welcome', 'Welcome');
bindWelcomeGoodbye('goodbye', 'Goodbye');

$('ar-add').onclick = async () => {
  const id = $('ar-role-id').value.trim();
  if (!id || !/^\d+$/.test(id)) return toast('Enter a valid role ID', 'err');
  await req('/guild/' + state.current + '/config', {
    method: 'POST',
    body: JSON.stringify({ key: 'autorole.add', value: id })
  });
  toast('Role added to auto-role');
  $('ar-role-id').value = '';
  if (!state.data.autorole) state.data.autorole = { enabled: false, roleIds: [] };
  state.data.autorole.roleIds.push(id);
  state.data.autorole.enabled = true;
  renderAutoRole();
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

boot();