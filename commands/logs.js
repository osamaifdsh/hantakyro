const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLogs } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('📋 عرض آخر أحداث الحماية')
    .addIntegerOption((o) => o.setName('amount').setDescription('عدد الأحداث (1 - 50)').setMinValue(1).setMaxValue(50)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount') || 15;
    const logs = getLogs(interaction.guild.id).slice(0, amount);
    if (!logs.length) {
      return interaction.reply({ content: 'ℹ️ No protection events yet.', ephemeral: true });
    }
    const lines = logs
      .map((l) => {
        const t = l.time ? `<t:${Math.floor(l.time / 1000)}:R>` : '?';
        return `${t} • \`${l.action}\` • ${l.target}${l.by ? ` • by ${l.by}` : ''}`;
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
