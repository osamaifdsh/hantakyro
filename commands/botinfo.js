const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('🤖 حالة البوت: السيرفرات، البنج، الجهوزية'),

  async execute(interaction, client) {
    const mem = process.memoryUsage();
    const embed = new EmbedBuilder()
      .setTitle('🤖 Hantakyro — Bot Info')
      .setColor(0x5865f2)
      .setDescription(
        `**Status:** 🟢 Online\n` +
          `**Servers:** ${client.guilds.cache.size}\n` +
          `**Ping:** ${client.ws.ping}ms\n` +
          `**Uptime:** ${fmtUptime(client.uptime)}\n` +
          `**Commands:** ${client.commands ? client.commands.size : 0}\n` +
          `**Memory:** ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
          `**Node:** ${process.version}\n` +
          `**Shards:** ${client.ws.shards.size}`
      )
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
