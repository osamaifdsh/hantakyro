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
  try {
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: [...commands.values()].map((c) => c.data.toJSON())
    });
    console.log(`Registered ${commands.size} slash commands globally.`);
  } catch (err) {
    console.error('Failed to register slash commands:', err.message);
  }
  return commands;
}

module.exports = { loadCommands, initCommands };
