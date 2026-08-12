const { SlashCommandBuilder } = require('discord.js');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 فك الحظر عن عضو')
    .addUserOption((o) => o.setName('user').setDescription('العضو المراد فك حظره').setRequired(true)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const bans = await interaction.guild.bans.fetch().catch(() => null);
    if (!bans || !bans.has(user.id)) {
      return interaction.reply({ content: `ℹ️ **${user.tag}** is not banned here.`, ephemeral: true });
    }
    await interaction.guild.bans.remove(user.id, 'Unbanned by admin').catch(() => {});
    return interaction.reply({ content: `🔓 **${user.tag}** has been unbanned.`, ephemeral: true });
  }
};
