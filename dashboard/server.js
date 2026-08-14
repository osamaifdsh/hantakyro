const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../handlers/config');
const { getGuild, saveGuild, getLogs } = require('../handlers/storage');
const { punishUser } = require('../handlers/punish');

const CLIENT_ID = config.clientId;
const CLIENT_SECRET = config.oauth.clientSecret || '';

const sessionsFile = path.join(__dirname, '..', 'data', 'sessions.json');

function loadSessions() {
  try {
    return JSON.parse(fs.readFileSync(sessionsFile, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}

function saveSessions(s) {
  fs.mkdirSync(path.dirname(sessionsFile), { recursive: true });
  fs.writeFileSync(sessionsFile, JSON.stringify(s, null, 2));
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (raw) {
    raw.split(';').forEach((p) => {
      const i = p.indexOf('=');
      if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
  }
  return out;
}

function getSession(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  return loadSessions()[sid] || null;
}

function baseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
}

async function discordFetch(endpoint, accessToken) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = new Error(`discord api ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function canManageGuild(accessToken, guildId) {
  try {
    const guilds = await discordFetch('/users/@me/guilds', accessToken);
    const g = guilds.find((x) => x.id === guildId);
    if (!g) return false;
    const perms = BigInt(g.permissions);
    return (perms & 0x8n) > 0n || (perms & 0x20n) > 0n;
  } catch {
    return false;
  }
}

function startDashboard(client) {
  const app = express();
  const port = config.dashboard.port;

  app.set('trust proxy', true);
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, bot: client.isReady() ? 'online' : 'offline', oauth: CLIENT_SECRET ? 'ready' : 'missing-secret' });
  });

  app.get('/auth/login', (req, res) => {
    if (!CLIENT_SECRET || !CLIENT_ID || CLIENT_ID.includes('PUT_YOUR')) {
      return res.status(500).send('OAuth is not configured. Add your Client Secret in config.json (or DISCORD_CLIENT_SECRET env).');
    }
    const uri =
      'https://discord.com/api/v10/oauth2/authorize' +
      `?client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(baseUrl(req) + '/auth/callback')}` +
      '&response_type=code' +
      '&scope=identify%20guilds';
    res.redirect(uri);
  });

  app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/');
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: baseUrl(req) + '/auth/callback'
    });
    try {
      const tokRes = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const tok = await tokRes.json();
      if (tok.error) throw new Error(tok.error_description || tok.error);
      const user = await discordFetch('/users/@me', tok.access_token);
      const sid = crypto.randomBytes(24).toString('hex');
      const sessions = loadSessions();
      sessions[sid] = {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token || null,
        user,
        created: Date.now()
      };
      saveSessions(sessions);
      res.cookie('sid', sid, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
      res.redirect('/');
    } catch (e) {
      res.status(500).send('Login failed: ' + e.message);
    }
  });

  app.get('/auth/logout', (req, res) => {
    const sid = parseCookies(req).sid;
    if (sid) {
      const sessions = loadSessions();
      delete sessions[sid];
      saveSessions(sessions);
    }
    res.clearCookie('sid');
    res.redirect('/');
  });

  async function requireUser(req, res, next) {
    const s = getSession(req);
    if (!s) return res.status(401).json({ error: 'Not logged in' });
    try {
      const me = await discordFetch('/users/@me', s.access_token);
      s.user = me;
      req.sessionD = s;
      next();
    } catch {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
  }

  async function requireGuildAccess(req, res, next) {
    const s = getSession(req);
    if (!s) return res.status(401).json({ error: 'Not logged in' });
    const ok = await canManageGuild(s.access_token, req.params.id);
    if (!ok) return res.status(403).json({ error: 'You need Manage Server permission in that server.' });
    req.sessionD = s;
    next();
  }

  app.get('/api/me', requireUser, (req, res) => {
    res.json({
      id: req.sessionD.user.id,
      username: req.sessionD.user.username,
      avatar: req.sessionD.user.avatar,
      global_name: req.sessionD.user.global_name || req.sessionD.user.username
    });
  });

  app.get('/api/me/guilds', requireUser, async (req, res) => {
    try {
      const userGuilds = await discordFetch('/users/@me/guilds', req.sessionD.access_token);
      const botGuildIds = new Set([...client.guilds.cache.keys()]);
      const list = userGuilds
        .filter((g) => {
          const perms = BigInt(g.permissions);
          return (perms & 0x8n) > 0n || (perms & 0x20n) > 0n;
        })
        .filter((g) => botGuildIds.has(g.id))
        .map((g) => {
          const bg = client.guilds.cache.get(g.id);
          const cfg = getGuild(g.id);
          return {
            id: g.id,
            name: g.name,
            icon: g.icon,
            members: bg ? bg.memberCount : null,
            enabled: cfg.protection.enabled,
            punish: cfg.punish
          };
        });
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/guild/:id', requireGuildAccess, (req, res) => {
    const cfg = getGuild(req.params.id);
    res.json({ ...cfg, logs: getLogs(req.params.id).slice(0, 50) });
  });

  app.post('/api/guild/:id/config', requireGuildAccess, (req, res) => {
    const cfg = getGuild(req.params.id);
    const { key, value } = req.body;
    if (key.startsWith('protection.')) {
      const k = key.split('.')[1];
      if (k in cfg.protection) cfg.protection[k] = value;
    } else if (key === 'punish') {
      if (['ban', 'kick', 'strip'].includes(value)) cfg.punish = value;
    } else if (key === 'raidThreshold') {
      cfg.raidThreshold = Math.max(2, Math.min(50, Number(value)));
    } else if (key === 'raidWindow') {
      cfg.raidWindow = Math.max(3000, Math.min(60000, Number(value)));
    } else if (key === 'logChannel') {
      cfg.logChannel = value;
    }
    saveGuild(req.params.id, cfg);
    res.json({ ok: true });
  });

  app.post('/api/guild/:id/lockdown', requireGuildAccess, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const cfg = getGuild(guild.id);
    const state = !!req.body.state;
    if (state) {
      cfg.raidMode = true;
      cfg.previousVerification = guild.verificationLevel;
      await guild.setVerificationLevel(2).catch(() => {});
      await guild.roles.everyone.setPermissions(guild.roles.everyone.permissions.remove(1024)).catch(() => {});
    } else {
      cfg.raidMode = false;
      await guild.setVerificationLevel(cfg.previousVerification || 0).catch(() => {});
      await guild.roles.everyone.setPermissions(guild.roles.everyone.permissions.add(1024)).catch(() => {});
    }
    saveGuild(guild.id, cfg);
    res.json({ ok: true, raidMode: cfg.raidMode });
  });

  app.post('/api/guild/:id/whitelist', requireGuildAccess, (req, res) => {
    const cfg = getGuild(req.params.id);
    const { userId, action } = req.body;
    if (action === 'add') {
      if (!cfg.whitelist.includes(userId)) cfg.whitelist.push(userId);
    } else if (action === 'remove') {
      cfg.whitelist = cfg.whitelist.filter((id) => id !== userId);
    }
    saveGuild(req.params.id, cfg);
    res.json({ ok: true, whitelist: cfg.whitelist });
  });

  app.post('/api/guild/:id/whitelistroles', requireGuildAccess, (req, res) => {
    const cfg = getGuild(req.params.id);
    const { roleId, action } = req.body;
    if (action === 'add') {
      if (!cfg.whitelistRoles.includes(roleId)) cfg.whitelistRoles.push(roleId);
    } else if (action === 'remove') {
      cfg.whitelistRoles = cfg.whitelistRoles.filter((id) => id !== roleId);
    }
    saveGuild(req.params.id, cfg);
    res.json({ ok: true, whitelistRoles: cfg.whitelistRoles });
  });

  app.post('/api/guild/:id/punish', requireGuildAccess, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const { userId, reason } = req.body;
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await punishUser(client, guild, user, reason || 'Punished from dashboard');
    res.json({ ok: true, ...result });
  });

  const server = app.listen(port, () => {
    console.log(`🌐 Hantakyro Dashboard: http://localhost:${port}`);
  });
  server.on('error', (e) => {
    console.error('Dashboard port error:', e.message);
  });
}

module.exports = { startDashboard };