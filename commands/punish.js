const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('punish')
    .setDescription('🛡️ طريقة معاقبة المخالفين')
    .addStringOption((o) =>
      o
        .setName('mode')
        .setDescription('طريقة العقاب')
        .setRequired(true)
        .addChoices(
          { name: 'Ban (strongest)', value: 'ban' },
          { name: 'Kick', value: 'kick' },
          { name: 'Strip all roles', value: 'strip' }
        )
    ),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const mode = interaction.options.getString('mode');
    const cfg = getGuild(interaction.guild.id);
    cfg.punish = mode;
    saveGuild(interaction.guild.id, cfg);
    const label = mode === 'ban' ? '🚫 Ban' : mode === 'kick' ? '👢 Kick' : '🎭 Strip roles';
    return interaction.reply({
      content: `${label} mode is now active. Rule-breakers will be **${mode}**.`,
      ephemeral: true
    });
  }
};
