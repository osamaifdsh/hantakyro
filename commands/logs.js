const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLogs } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('📋 عرض آخر أحداث الحماية'),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const logs = getLogs(interaction.guild.id).slice(0, 15);
    if (!logs.length) {
      return interaction.reply({ content: 'ℹ️ No protection events yet.', ephemeral: true });
    }
    const lines = logs
      .map((l) => {
        const d = new Date(l.time);
        return `**${d.toLocaleTimeString()}** • ${l.action} • ${l.target}${l.by ? ` • by ${l.by}` : ''}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('📋 Hantakyro Protection Logs')
      .setDescription(lines)
      .setColor(0x5865f2)
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
