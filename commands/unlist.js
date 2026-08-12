const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlist')
    .setDescription('🛡️ إزالة عضو من قائمة الأمان')
    .addUserOption((o) => o.setName('user').setDescription('العضو المراد إزالته').setRequired(true)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const cfg = getGuild(interaction.guild.id);
    if (!cfg.whitelist.includes(user.id)) {
      return interaction.reply({ content: `ℹ️ **${user.tag}** is not on the whitelist.`, ephemeral: true });
    }
    cfg.whitelist = cfg.whitelist.filter((id) => id !== user.id);
    saveGuild(interaction.guild.id, cfg);
    return interaction.reply({
      content: `❌ **${user.tag}** removed from the whitelist.`,
      ephemeral: true
    });
  }
};
