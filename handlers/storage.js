const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const guildsFile = path.join(dataDir, 'guilds.json');
const logsFile = path.join(dataDir, 'logs.json');
const snapsFile = path.join(dataDir, 'snapshots.json');

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(guildsFile)) fs.writeFileSync(guildsFile, '{}');
  if (!fs.existsSync(logsFile)) fs.writeFileSync(logsFile, '{}');
}

function read(file) {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function write(file, data) {
  ensure();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function defaultConfig() {
  return {
    protection: {
      enabled: false,
      antiBan: true,
      antiKick: true,
      antiBotAdd: true,
      antiChannelCreate: true,
      antiChannelDelete: true,
      antiChannelUpdate: true,
      antiRoleCreate: true,
      antiRoleDelete: true,
      antiRoleUpdate: true,
      antiWebhook: true,
      antiGuildUpdate: true,
      antiEmoji: true,
      antiRaid: true,
      antiSpam: true,
      antiEveryone: true
    },
    punish: 'ban',
    whitelist: [],
    whitelistRoles: [],
    raidMode: false,
    raidThreshold: 5,
    raidWindow: 10000,
    spamThreshold: 5,
    spamWindow: 4000,
    logChannel: null,
    previousVerification: 0
  };
}

function getGuild(guildId) {
  const all = read(guildsFile);
  if (!all[guildId]) {
    all[guildId] = defaultConfig();
    write(guildsFile, all);
  }
  return all[guildId];
}

function saveGuild(guildId, cfg) {
  const all = read(guildsFile);
  all[guildId] = cfg;
  write(guildsFile, all);
}

function addLog(guildId, entry) {
  const all = read(logsFile);
  if (!all[guildId]) all[guildId] = [];
  all[guildId].unshift({ time: Date.now(), ...entry });
  all[guildId] = all[guildId].slice(0, 200);
  write(logsFile, all);
}

function getLogs(guildId) {
  const all = read(logsFile);
  return all[guildId] || [];
}

function getSnapshots(guildId) {
  const all = read(snapsFile);
  return all[guildId] || {};
}

function saveSnapshot(guildId, kind, id, data) {
  const all = read(snapsFile);
  if (!all[guildId]) all[guildId] = {};
  all[guildId][`${kind}:${id}`] = data;
  write(snapsFile, all);
}

function getSnapshot(guildId, kind, id) {
  const all = read(snapsFile);
  return (all[guildId] || {})[`${kind}:${id}`] || null;
}

function deleteSnapshot(guildId, kind, id) {
  const all = read(snapsFile);
  if (all[guildId]) {
    delete all[guildId][`${kind}:${id}`];
    write(snapsFile, all);
  }
}

module.exports = {
  getGuild,
  saveGuild,
  addLog,
  getLogs,
  defaultConfig,
  saveSnapshot,
  getSnapshot,
  deleteSnapshot
};
