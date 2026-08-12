const express = require('express');
const path = require('path');
const config = require('../handlers/config');
const { getGuild, saveGuild, getLogs } = require('../handlers/storage');
const { punishUser } = require('../handlers/punish');

function startDashboard(client) {
  const app = express();
  const dash = config.dashboard || {};
  const port = dash.port || 3000;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, bot: client.isReady() ? 'online' : 'offline' });
  });

  const auth = (req, res, next) => {
    if (req.get('x-dash-key') === dash.password) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  };

  app.get('/api/guilds', auth, (req, res) => {
    const list = client.guilds.cache.map((g) => {
      const cfg = getGuild(g.id);
      return {
        id: g.id,
        name: g.name,
        icon: g.iconURL({ size: 128 }),
        members: g.memberCount,
        enabled: cfg.protection.enabled,
        punish: cfg.punish
      };
    });
    res.json(list);
  });

  app.get('/api/guild/:id', auth, (req, res) => {
    const cfg = getGuild(req.params.id);
    res.json({ ...cfg, logs: getLogs(req.params.id).slice(0, 50) });
  });

  app.post('/api/guild/:id/config', auth, (req, res) => {
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

  app.post('/api/guild/:id/lockdown', auth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const cfg = getGuild(guild.id);
    const state = !!req.body.state;
    if (state) {
      cfg.raidMode = true;
      cfg.previousVerification = guild.verificationLevel;
      await guild.setVerificationLevel(2).catch(() => {});
      await guild.roles.everyone
        .setPermissions(guild.roles.everyone.permissions.remove(1024))
        .catch(() => {});
    } else {
      cfg.raidMode = false;
      await guild.setVerificationLevel(cfg.previousVerification || 0).catch(() => {});
      await guild.roles.everyone
        .setPermissions(guild.roles.everyone.permissions.add(1024))
        .catch(() => {});
    }
    saveGuild(guild.id, cfg);
    res.json({ ok: true, raidMode: cfg.raidMode });
  });

  app.post('/api/guild/:id/whitelistroles', auth, (req, res) => {
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

  app.post('/api/guild/:id/whitelist', auth, (req, res) => {
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

  app.post('/api/guild/:id/punish', auth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const { userId, reason } = req.body;
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await punishUser(client, guild, user, reason || 'Punished from dashboard');
    res.json({ ok: true, ...result });
  });

  app.listen(port, () => {
    console.log(`🌐 Hantakyro Dashboard: http://localhost:${port}`);
  });
}

module.exports = { startDashboard };
