const fs = require('fs');
const path = require('path');

let fileCfg = {};
try {
  let txt = fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8');
  txt = txt.replace(/^\uFEFF/, '');
  fileCfg = JSON.parse(txt);
} catch {}

const dash = fileCfg.dashboard || {};
const oauth = fileCfg.oauth || {};

const config = {
  token: process.env.TOKEN || fileCfg.token,
  clientId: process.env.CLIENT_ID || fileCfg.clientId,
  owners: process.env.OWNERS ? process.env.OWNERS.split(',').map((s) => s.trim()) : fileCfg.owners || [],
  oauth: {
    clientSecret: process.env.DISCORD_CLIENT_SECRET || oauth.clientSecret || ''
  },
  dashboard: {
    enabled: process.env.DASHBOARD_ENABLED !== 'false' && dash.enabled !== false,
    port: Number(process.env.PORT || dash.port || 3000),
    password: process.env.DASH_PASSWORD || dash.password || 'Hantakyro2024'
  }
};

module.exports = config;