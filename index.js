const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./handlers/config');
const { loadCommands, initCommands, registerGuildCommands } = require('./handlers/commands');
const { initProtection } = require('./handlers/protection');
const { startDashboard } = require('./dashboard/server');

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

if (!config.token || config.token.includes('PUT_YOUR')) {
  console.error('ERROR: You must put your bot token in config.json first.');
  process.exit(1);
}

console.log('Hantakyro booting...');
console.log('Token set:', config.token && !config.token.includes('PUT_YOUR') ? 'yes' : 'no');
console.log('ClientID set:', config.clientId && !config.clientId.includes('PUT_YOUR') ? 'yes' : 'no');
console.log('ClientSecret set:', config.oauth.clientSecret ? 'yes' : 'no');
console.log('Dashboard port:', config.dashboard.port);
console.log('Node version:', process.version);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildEmojisAndStickers
  ],
  ws: { timeout: 10000 }
});

try {
  client.commands = loadCommands();
  console.log(`Loaded ${client.commands.size} commands.`);
} catch (e) {
  console.error('Failed to load commands:', e.message);
  client.commands = new Map();
}

if (config.dashboard && config.dashboard.enabled) {
  try {
    startDashboard(client);
  } catch (e) {
    console.error('Dashboard failed to start:', e.message);
  }
}

initProtection(client);

client.on(Events.GuildCreate, (guild) => registerGuildCommands(client, guild.id));

client.on('debug', (m) => console.log('[dbg]', m));

client.on('shardReady', (id) => console.log(`[SHARD ${id}] READY`));
client.on('shardError', (e, id) => console.error(`[SHARD ${id}] ERROR:`, e.message));
client.on('shardDisconnect', (event, id) => console.log(`[SHARD ${id}] DISCONNECT`, event ? event.code : ''));
client.on('shardReconnecting', (id) => console.log(`[SHARD ${id}] RECONNECTING`));
client.on('shardResume', (id, replayed) => console.log(`[SHARD ${id}] RESUMED (${replayed} events)`));
client.on('invalidated', () => console.log('SESSION INVALIDATED'));

setInterval(() => {
  try {
    const states = client.ws.shards.map((s) => `#${s.id}=${s.status}`);
    console.log('[STATUS]', states.join(' ') || 'no shards');
  } catch (e) {
    console.log('[STATUS] error:', e.message);
  }
}, 15000);

setTimeout(async () => {
  console.log('[PROBE] Testing REST connectivity to Discord...');
  try {
    const res = await fetch('https://discord.com/api/v10/gateway');
    const j = await res.json();
    console.log('[PROBE] REST OK. Status:', res.status, '| Gateway url:', j.url);
    console.log('[PROBE] Connecting raw WebSocket to gateway to test reachability...');
    const WebSocket = require('ws');
    const ws = new WebSocket(j.url);
    const done = (msg) => { console.log('[PROBE]', msg); try { ws.close(); } catch {} };
    ws.on('open', () => done('WS OPEN - gateway reachable'));
    ws.on('error', (e) => done('WS ERROR: ' + e.message));
    ws.on('close', (code, reason) => done('WS CLOSE: code=' + code + ' ' + reason.toString()));
    ws.on('message', (d) => done('WS MSG: ' + d.toString().slice(0, 150)));
    setTimeout(() => done('WS 15s timeout - no open, gateway NOT reachable'), 15000);
  } catch (e) {
    console.log('[PROBE] REST FAIL:', e.message);
  }
}, 8000);

client.once(Events.ClientReady, () => {
  console.log('=====================================');
  console.log(`  Hantakyro is ONLINE!`);
  console.log(`  Logged in as: ${client.user.tag}`);
  console.log(`  Protecting: ${client.guilds.cache.size} server(s)`);
  console.log('=====================================');

  const updateActivity = () => {
    try {
      client.user.setActivity(`🛡️ Protecting ${client.guilds.cache.size} server(s)`, { type: 3 });
    } catch {}
  };
  updateActivity();
  setInterval(updateActivity, 5 * 60 * 1000);

  initCommands(client)
    .then((n) => console.log(`Registered ${n.size} slash commands globally.`))
    .catch((e) => console.error('Command registration failed:', e.message));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isRepliable()) return;

  if (!interaction.isChatInputCommand()) {
    return interaction.reply({ content: 'Unsupported interaction type.', ephemeral: true }).catch(() => {});
  }

  const cmd = client.commands && client.commands.get(interaction.commandName);
  if (!cmd) {
    return interaction.reply({
      content: '⚠️ This command is not loaded yet. Try again in a few seconds.',
      ephemeral: true
    }).catch(() => {});
  }

  try {
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error('Command error:', err);
    const msg = { content: '⚠️ ' + (err.message || 'Something went wrong.'), ephemeral: true };
    try {
      if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
      else await interaction.reply(msg);
    } catch {}
  }
});

async function tryLogin() {
  try {
    await client.login(config.token);
    console.log('Login accepted, waiting for gateway...');
  } catch (err) {
    console.error('=== LOGIN FAILED ===');
    console.error('Status:', err.status || 'n/a');
    console.error('Code:', err.code || 'n/a');
    console.error('Message:', err.message);
    console.error('Retrying in 15 seconds...');
    setTimeout(tryLogin, 15000);
  }
}

tryLogin();
