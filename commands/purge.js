const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 حذف رسائل بالجملة')
    .addIntegerOption((o) => o.setName('amount').setDescription('1 - 100').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('حذف رسائل هذا العضو فقط (اختياري)')),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    let deleted = 0;
    if (user) {
      const messages = await interaction.channel.messages.fetch({ limit: Math.min(amount, 100) }).catch(() => null);
      if (messages) {
        const targets = messages.filter(
          (m) => m.author.id === user.id && Date.now() - m.createdTimestamp < 1209600000
        );
        if (targets.size) {
          const res = await interaction.channel.bulkDelete(targets, true).catch(() => null);
          deleted = res ? res.size : targets.size;
        }
      }
    } else {
      const res = await interaction.channel.bulkDelete(amount, true).catch(() => null);
      deleted = res ? res.size : amount;
    }

    return interaction.reply({
      content: `🧹 Deleted **${deleted || 0}** message(s)${user ? ` from **${user.tag}**` : ''}.`,
      ephemeral: true
    });
  }
};
