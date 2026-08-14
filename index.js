const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./handlers/config');
const { loadCommands, initCommands } = require('./handlers/commands');
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildEmojisAndStickers
  ]
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

client.on('debug', (m) => console.log('[dbg]', m));
client.on(Events.Error, (e) => console.error('[client error]', e.message));

client.once(Events.ClientReady, () => {
  console.log('=====================================');
  console.log(`  Hantakyro is ONLINE!`);
  console.log(`  Logged in as: ${client.user.tag}`);
  console.log(`  Protecting: ${client.guilds.cache.size} server(s)`);
  console.log('=====================================');

  client.user.setActivity('🛡️ Protecting your server', { type: 3 });

  initCommands(client)
    .then((n) => console.log(`Registered ${n} slash commands globally.`))
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
    console.error('Message:', err.message);
    console.error('Retrying in 15 seconds...');
    setTimeout(tryLogin, 15000);
  }
}

tryLogin();
