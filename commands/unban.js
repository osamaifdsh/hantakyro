const { SlashCommandBuilder } = require('discord.js');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 فك الحظر عن عضو')
    .addUserOption((o) => o.setName('user').setDescription('العضو المراد فك حظره').setRequired(false))
    .addStringOption((o) => o.setName('user_id').setDescription('ID العضو (بديل عن @)').setRequired(false)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const userOpt = interaction.options.getUser('user');
    const id = userOpt ? userOpt.id : interaction.options.getString('user_id');
    if (!id || !/^\d+$/.test(id)) {
      return interaction.reply({ content: '❌ حدد العضو بـ **@user** أو اكتب **user_id**.', ephemeral: true });
    }
    const bans = await interaction.guild.bans.fetch().catch(() => null);
    const ban = bans && bans.get(id);
    if (!ban) {
      return interaction.reply({ content: 'ℹ️ هذا العضو غير محظور في السيرفر.', ephemeral: true });
    }
    await interaction.guild.bans.remove(id, 'Unbanned by admin').catch(() => {});
    return interaction.reply({
      content: `🔓 **${ban.user.tag || id}** has been unbanned.`,
      ephemeral: true
    });
  }
};
