const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./handlers/config');
const { initProtection } = require('./handlers/protection');
const { initCommands } = require('./handlers/commands');
const { startDashboard } = require('./dashboard/server');

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

client.once(Events.ClientReady, async () => {
  console.log('=====================================');
  console.log(`  Hantakyro is ONLINE!`);
  console.log(`  Logged in as: ${client.user.tag}`);
  console.log(`  Protecting: ${client.guilds.cache.size} server(s)`);
  console.log('=====================================');

  client.user.setActivity('🛡️ Protecting your server', { type: 3 });

  client.commands = await initCommands(client);
  initProtection(client);

  if (config.dashboard && config.dashboard.enabled) {
    startDashboard(client);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: '⚠️ Something went wrong while running this command.',
      ephemeral: true
    }).catch(() => {});
  }
});

client.login(config.token).catch((err) => {
  console.error('Failed to login. Check your token in config.json');
  console.error(err);
});
