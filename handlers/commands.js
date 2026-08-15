const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

function loadCommands() {
  const commands = new Map();
  const dir = path.join(__dirname, '..', 'commands');
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const cmd = require(path.join(dir, f));
    commands.set(cmd.data.name, cmd);
  }
  return commands;
}

async function initCommands(client) {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = [...loadCommands().values()].map((c) => c.data.toJSON());
  try {
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    console.log('Cleared global commands (guild-only mode).');
  } catch (err) {
    console.error('Failed to clear global commands:', err.message);
  }
  for (const guild of client.guilds.cache.values()) {
    await registerGuildCommands(client, guild.id);
  }
  return loadCommands();
}

async function registerGuildCommands(client, guildId) {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = [...loadCommands().values()].map((c) => c.data.toJSON());
  try {
    await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body });
    console.log(`Registered ${body.length} commands in guild: ${guildId}`);
    return true;
  } catch (err) {
    console.error(`Failed to register commands in guild ${guildId}:`, err.message);
    return false;
  }
}

module.exports = { loadCommands, initCommands, registerGuildCommands };
