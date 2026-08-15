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
  const commands = loadCommands();
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = [...commands.values()].map((c) => c.data.toJSON());
  try {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    console.log(`Registered ${commands.size} slash commands globally.`);
  } catch (err) {
    console.error('Failed to register slash commands globally:', err.message);
  }
  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), { body });
      console.log(`Registered ${commands.size} commands instantly in guild: ${guild.name}`);
    } catch (err) {
      console.error(`Failed to register guild commands in ${guild.name}:`, err.message);
    }
  }
  return commands;
}

module.exports = { loadCommands, initCommands };
