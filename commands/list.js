const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('🛡️ إضافة عضو لقائمة الأمان (لا يتعاقب أبداً)')
    .addUserOption((o) => o.setName('user').setDescription('العضو المراد حمايته').setRequired(true)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const cfg = getGuild(interaction.guild.id);
    if (cfg.whitelist.includes(user.id)) {
      return interaction.reply({ content: `ℹ️ **${user.tag}** is already on the whitelist.`, ephemeral: true });
    }
    cfg.whitelist.push(user.id);
    saveGuild(interaction.guild.id, cfg);
    return interaction.reply({
      content: `✅ **${user.tag}** is now on the **protection whitelist**. They are 100% safe from Hantakyro punishments.`,
      ephemeral: true
    });
  }
};
