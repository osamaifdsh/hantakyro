const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 فحص اتصال البوت (بنج)'),

  async execute(interaction, client) {
    return interaction.reply({ content: `🏓 Pong! Latency: ${client.ws.ping}ms`, ephemeral: true });
  }
};
