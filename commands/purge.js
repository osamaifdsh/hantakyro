const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 حذف رسائل بالجملة')
    .addIntegerOption((o) => o.setName('amount').setDescription('1 - 100').setRequired(true).setMinValue(1).setMaxValue(100)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount');
    await interaction.channel.bulkDelete(amount).catch(() => {});
    return interaction.reply({
      content: `🧹 Deleted **${amount}** messages.`,
      ephemeral: true
    });
  }
};
