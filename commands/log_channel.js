const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log_channel')
    .setDescription('🛡️ تحديد قناة سجلات الحماية')
    .addChannelOption((o) =>
      o.setName('channel').setDescription('قناة النصوص للسجلات').setRequired(true).addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const ch = interaction.options.getChannel('channel');
    const cfg = getGuild(interaction.guild.id);
    cfg.logChannel = ch.id;
    saveGuild(interaction.guild.id, cfg);
    return interaction.reply({
      content: `✅ Protection logs will now be sent to **${ch}**.`,
      ephemeral: true
    });
  }
};
