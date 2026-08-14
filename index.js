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

console.log('Hantakyro booting...');
console.log('Token set:', config.token && !config.token.includes('PUT_YOUR') ? 'yes' : 'no');
console.log('ClientID set:', config.clientId && !config.clientId.includes('PUT_YOUR') ? 'yes' : 'no');
console.log('ClientSecret set:', config.oauth.clientSecret ? 'yes' : 'no');
console.log('Dashboard port:', config.dashboard.port);

client.on('debug', (m) => console.log('[dbg]', m));

client.once(Events.ClientReady, () => {
  console.log('=====================================');
  console.log(`  Hantakyro is ONLINE!`);
  console.log(`  Logged in as: ${client.user.tag}`);
  console.log(`  Protecting: ${client.guilds.cache.size} server(s)`);
  console.log('=====================================');

  client.user.setActivity('🛡️ Protecting your server', { type: 3 });

  client.commands = loadCommands();
  console.log(`Loaded ${client.commands.size} commands.`);

  initProtection(client);

  if (config.dashboard && config.dashboard.enabled) {
    try {
      startDashboard(client);
    } catch (e) {
      console.error('Dashboard failed to start:', e.message);
    }
  }

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

client.on(Events.Error, (e) => console.error('[client error]', e.message));

client.login(config.token).then(() => {
  console.log('Login request accepted, waiting for gateway...');
}).catch((err) => {
  console.error('=== LOGIN FAILED ===');
  console.error('Status:', err.status || 'n/a');
  console.error('Message:', err.message);
  console.error('Is the TOKEN env var on Render wrong or expired?');
});
